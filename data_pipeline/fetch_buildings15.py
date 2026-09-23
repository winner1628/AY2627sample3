# -*- coding: utf-8 -*-
"""Fetch OSM buildings for the 15 districts we don't have yet.
bbox per district computed from admin boundary rings (area-based selection).
Output: buildings_{code}_raw.json (Overpass geom, retried)
"""
import json, time, urllib.request, urllib.parse, os, math

HERE = os.path.dirname(os.path.abspath(__file__))
ENDPOINTS = ['https://overpass-api.de/api/interpreter',
             'https://overpass.kumi.systems/api/interpreter',
             'https://overpass.private.coffee/api/interpreter']

# district code -> census area km2 (approx, for ring selection sanity)
AREA = {'cw':12.55,'wc':9.83,'east':18.9,'south':39.4,'ytm':7.0,'ssp':9.35,
        'kc':10.02,'wts':9.3,'kt':11.27,'tw':62.6,'tm':85.9,'yl':138.4,
        'north':137.3,'tp':148.2,'sk':129.6,'st':68.7,'kts':23.3,'iso':188.2}

# districts we already have buildings for
HAVE = {'tw', 'st', 'kts'}

def fetch(query, name, timeout=900):
    data = 'data=' + urllib.parse.quote(query)
    for attempt in range(6):
        ep = ENDPOINTS[attempt % len(ENDPOINTS)]
        req = urllib.request.Request(ep, data=data.encode('utf-8'),
                                     headers={'User-Agent': 'FYP-AquaPulse/3.0'})
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
            obj = json.loads(raw)
            if 'elements' in obj:
                print(f'  {name}: {len(obj["elements"])} elements in {time.time()-t0:.0f}s', flush=True)
                with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f:
                    json.dump(obj, f, ensure_ascii=False)
                return True
        except Exception as e:
            print(f'  {name} attempt {attempt}: {e}', flush=True)
            time.sleep(30)
    print(f'  {name}: FAILED', flush=True)
    return False

# ---------- ring assembly (same logic as pipeline) ----------
def _close(a, b, eps=1e-6):
    return abs(a[0]-b[0]) < eps and abs(a[1]-b[1]) < eps

def assemble_rings(polylines, eps=1e-6):
    segs = [list(pl) for pl in polylines if len(pl) >= 2]
    rings = []
    while segs:
        ring = segs.pop(0)
        extended = True
        while extended:
            extended = False
            for i in range(len(segs)-1, -1, -1):
                s = segs[i]
                a1, a2 = ring[0], ring[-1]
                b1, b2 = s[0], s[-1]
                if _close(a2, b1, eps):
                    ring += s[1:]; del segs[i]; extended = True
                elif _close(a2, b2, eps):
                    ring += list(reversed(s))[1:]; del segs[i]; extended = True
                elif _close(a1, b1, eps):
                    ring = list(reversed(s))[:-1] + ring; del segs[i]; extended = True
                elif _close(a1, b2, eps):
                    ring = s[:-1] + ring; del segs[i]; extended = True
                if extended:
                    break
        rings.append(ring)
    return rings

def ring_area(ring):
    s = 0.0
    j = len(ring) - 1
    for i in range(len(ring)):
        x1, y1 = ring[i]; x2, y2 = ring[j]
        s += (x1 * y2 - x2 * y1)
        j = i
    return abs(s) / 2.0 * (111000 ** 2)  # approx m2

NAME_TO_CODE = {'中西區':'cw','灣仔區':'wc','東區':'east','南區':'south','油尖旺區':'ytm',
                '深水埗區':'ssp','九龍城區':'kc','黃大仙區':'wts','觀塘區':'kt','荃灣區':'tw',
                '屯門區':'tm','元朗區':'yl','北區':'north','大埔區':'tp','西貢區':'sk',
                '沙田區':'st','葵青區':'kts','離島區':'iso'}

def district_rings():
    obj = json.load(open(os.path.join(HERE, 'districts18.json'), encoding='utf-8'))
    from collections import defaultdict
    groups = defaultdict(list)
    # sanitize: only HK bbox coords (some relation members carry junk far-away geometry)
    MINX, MINY, MAXX, MAXY = 113.75, 22.05, 114.50, 22.65
    for e in obj.get('elements', []):
        if e.get('type') != 'relation':
            continue
        zh = e.get('tags', {}).get('name:zh') or e.get('tags', {}).get('name')
        code = NAME_TO_CODE.get(zh)
        if not code:
            continue
        for m in e.get('members', []):
            geo = m.get('geometry')
            if not geo:
                continue
            if isinstance(geo, list):
                coords = [(float(p['lon']), float(p['lat'])) for p in geo if MINX <= float(p['lon']) <= MAXX and MINY <= float(p['lat']) <= MAXY]
            elif geo.get('type') == 'LineString':
                coords = [(float(x), float(y)) for x, y in geo['coordinates'] if MINX <= float(x) <= MAXX and MINY <= float(y) <= MAXY]
            elif geo.get('type') == 'Polygon':
                coords = [(float(x), float(y)) for x, y in geo['coordinates'][0] if MINX <= float(x) <= MAXX and MINY <= float(y) <= MAXY]
            else:
                continue
            if len(coords) >= 2:
                groups[code].append(coords)
    out = {}
    for code, segs in groups.items():
        rings = assemble_rings(segs)
        big = [r for r in rings if ring_area(r) > 1_500_000]  # >1.5 km2
        if not big:
            big = [max(rings, key=ring_area)] if rings else []
        out[code] = big
    return out

def split_bbox(minx, miny, maxx, maxy):
    if (maxx - minx) <= 0.18 and (maxy - miny) <= 0.13:
        return [(minx, miny, maxx, maxy)]
    if (maxx - minx) >= (maxy - miny):
        mid = (minx + maxx) / 2
        return [(minx, miny, mid, maxy), (mid, miny, maxx, maxy)]
    mid = (miny + maxy) / 2
    return [(minx, miny, maxx, mid), (minx, mid, maxx, maxy)]

if __name__ == '__main__':
    rings = district_rings()
    print('districts with rings:', sorted(rings.keys()), flush=True)
    for code in sorted(rings.keys()):
        if code in HAVE:
            continue
        r0 = rings[code][0]
        xs = [p[0] for r in rings[code] for p in r]
        ys = [p[1] for r in rings[code] for p in r]
        pad = 0.008
        bboxes = split_bbox(min(xs)-pad, min(ys)-pad, max(xs)+pad, max(ys)+pad)
        for i, (bx0, by0, bx1, by1) in enumerate(bboxes):
            name = f'buildings_{code}{"_"+str(i+1) if len(bboxes)>1 else ""}_raw.json'
            if os.path.exists(os.path.join(HERE, name)):
                print('  skip existing', name, flush=True)
                continue
            q = f'''[out:json][timeout:900];
way["building"]({by0:.5f},{bx0:.5f},{by1:.5f},{bx1:.5f});
out geom;'''
            print('fetch', name, flush=True)
            fetch(q, name)
            time.sleep(30)
    print('ALL DONE', flush=True)
