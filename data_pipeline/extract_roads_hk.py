# -*- coding: utf-8 -*-
"""Stream-parse TD Road Network CENTERLINE KML for ALL of Hong Kong.
Keeps EVERY named road segment (no street-level dedup - segments share codes),
RDP-simplifies, filters out unnamed/junk segments.
Output: roads_hk.json  [{n, nc, g:[[lon,lat],...]}]
"""
import os, re, json, time, math
from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
KML = os.path.join(HERE, 'CENTERLINE.kml')
OUT = os.path.join(HERE, 'roads_hk.json')

MINX, MINY, MAXX, MAXY = 113.78, 22.12, 114.48, 22.60
NS = {'kml': 'http://www.opengis.net/kml/2.2'}
street_re = re.compile(r'<td>STREET_ENAME</td>\s*<td>([^<]*)</td>', re.S)
street_c_re = re.compile(r'<td>STREET_CNAME</td>\s*<td>([^<]*)</td>', re.S)

def parse_coords(s):
    pts = []
    for part in s.replace('\n', ' ').strip().split(' '):
        part = part.strip()
        if not part:
            continue
        try:
            x, y, *_ = part.split(',')
            pts.append((float(x), float(y)))
        except Exception:
            continue
    return pts

def in_bbox(pts):
    return any(MINX <= x <= MAXX and MINY <= y <= MAXY for x, y in pts)

def rdp(points, eps):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i0, i1 = stack.pop()
        x0, y0 = points[i0]
        x1, y1 = points[i1]
        dx, dy = x1 - x0, y1 - y0
        denom = math.hypot(dx, dy) or 1e-12
        maxd = 0.0
        idx = -1
        for i in range(i0 + 1, i1):
            x, y = points[i]
            d = abs(dy * x - dx * y + x1 * y0 - y1 * x0) / denom
            if d > maxd:
                maxd, idx = d, i
        if maxd > eps and idx != -1:
            keep[idx] = True
            stack.append((i0, idx))
            stack.append((idx, i1))
    return [p for i, p in enumerate(points) if keep[i]]

def junk_name(n):
    n2 = n.strip()
    if not n2:
        return True
    if n2 in ('-99', '-98', '&lt;Null&gt;', 'Null', 'UNNAMED'):
        return True
    if len(n2) <= 2:
        return True
    return False

features = []
count = 0
kept = 0
t0 = time.time()
RDP_EPS = 0.0001

with open(KML, 'rb') as f:
    context = etree.iterparse(f, events=('end',), tag='{http://www.opengis.net/kml/2.2}Placemark')
    for event, elem in context:
        count += 1
        name_el = elem.find('kml:name', NS)
        name = (name_el.text or '').strip() if name_el is not None else ''
        desc_el = elem.find('kml:description', NS)
        desc = desc_el.text or '' if desc_el is not None else ''
        m_en = street_re.search(desc)
        m_cn = street_c_re.search(desc)
        street_en = (m_en.group(1).strip() if m_en else '') or name
        street_cn = m_cn.group(1).strip() if m_cn else ''
        if junk_name(street_en):
            elem.clear()
            while elem.getprevious() is not None:
                del elem.getparent()[0]
            continue
        geoms = elem.iter('{http://www.opengis.net/kml/2.2}coordinates')
        for c in geoms:
            pts = parse_coords(c.text or '')
            if len(pts) >= 2 and in_bbox(pts):
                simp = rdp(pts, RDP_EPS)
                if len(simp) < 2:
                    break
                features.append({
                    'n': street_en, 'nc': street_cn,
                    'g': [(round(x, 5), round(y, 5)) for x, y in simp]
                })
                kept += 1
                break
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]
        if count % 300000 == 0:
            print(f'  parsed {count}, kept {kept}, {time.time()-t0:.0f}s', flush=True)

print(f'Done. parsed={count} kept={kept} time={time.time()-t0:.0f}s', flush=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(features, f, ensure_ascii=False)
print('Wrote', OUT, os.path.getsize(OUT), 'bytes', flush=True)
