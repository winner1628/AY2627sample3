# -*- coding: utf-8 -*-
"""
AquaPulse AI - data pipeline v3 (ALL 18 HK districts)
Real open data -> compact app_data.json with pipe risk model.
Inputs:
  roads_hk.json               (TD road centrelines, real, all HK, named segments)
  buildings_*_raw.json        (OSM building footprints per district, real)
  districts18.json            (OSM admin boundaries for 18 districts, real)
  base_coast.json / base_water.json  (OSM coastline + water/rivers, real)
Output:
  app_data.json  (meta/roads/water/sewer/buildings/grid/bursts/base)
"""
import json, math, os, bisect, time
from collections import Counter, defaultdict

t0 = time.time()
BASE = os.path.dirname(os.path.abspath(__file__))

def load(name):
    with open(os.path.join(BASE, name), encoding='utf-8') as f:
        return json.load(f)

def r5(v):
    return round(v, 5)

def haversine_m(a, b):
    R = 6371000.0
    la1, lo1, la2, lo2 = map(math.radians, [a[1], a[0], b[1], b[0]])
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))

def line_len(coords):
    return sum(haversine_m(coords[i], coords[i+1]) for i in range(len(coords)-1))

def simplify_rdp(coords, eps=0.0001):
    if len(coords) < 3:
        return coords
    def rdp(pts):
        if len(pts) < 3:
            return pts
        x0, y0 = pts[0]; x1, y1 = pts[-1]
        dx, dy = x1-x0, y1-y0
        d2 = dx*dx+dy*dy
        best, besti = -1, 0
        for i in range(1, len(pts)-1):
            px, py = pts[i]
            t = ((px-x0)*dx+(py-y0)*dy)/d2 if d2 > 0 else 0
            t = max(0, min(1, t))
            dist = math.hypot(px-(x0+t*dx), py-(y0+t*dy))
            if dist > best:
                best, besti = dist, i
        if best <= eps:
            return [pts[0], pts[-1]]
        left = rdp(pts[:besti+1])
        right = rdp(pts[besti:])
        return left[:-1] + right
    return [(r5(x), r5(y)) for x, y in rdp(coords)]

# ---------------- 18 district metadata (2021 Census, C&SD) ----------------
DISTRICT_META = [
    {'d':'cw','zh':'中西區','zh_cn':'中西区','en':'Central & Western','pop':235953,'region':'hk'},
    {'d':'wc','zh':'灣仔區','zh_cn':'湾仔区','en':'Wan Chai','pop':166695,'region':'hk'},
    {'d':'east','zh':'東區','zh_cn':'东区','en':'Eastern','pop':529603,'region':'hk'},
    {'d':'south','zh':'南區','zh_cn':'南区','en':'Southern','pop':263278,'region':'hk'},
    {'d':'ytm','zh':'油尖旺區','zh_cn':'油尖旺区','en':'Yau Tsim Mong','pop':310647,'region':'kowloon'},
    {'d':'ssp','zh':'深水埗區','zh_cn':'深水埗区','en':'Sham Shui Po','pop':431090,'region':'kowloon'},
    {'d':'kc','zh':'九龍城區','zh_cn':'九龙城区','en':'Kowloon City','pop':410634,'region':'kowloon'},
    {'d':'wts','zh':'黃大仙區','zh_cn':'黄大仙区','en':'Wong Tai Sin','pop':406802,'region':'kowloon'},
    {'d':'kt','zh':'觀塘區','zh_cn':'观塘区','en':'Kwun Tong','pop':673166,'region':'kowloon'},
    {'d':'tw','zh':'荃灣區','zh_cn':'荃湾区','en':'Tsuen Wan','pop':320094,'region':'nt'},
    {'d':'tm','zh':'屯門區','zh_cn':'屯门区','en':'Tuen Mun','pop':506879,'region':'nt'},
    {'d':'yl','zh':'元朗區','zh_cn':'元朗区','en':'Yuen Long','pop':668080,'region':'nt'},
    {'d':'north','zh':'北區','zh_cn':'北区','en':'North','pop':309631,'region':'nt'},
    {'d':'tp','zh':'大埔區','zh_cn':'大埔区','en':'Tai Po','pop':316470,'region':'nt'},
    {'d':'sk','zh':'西貢區','zh_cn':'西贡区','en':'Sai Kung','pop':489037,'region':'nt'},
    {'d':'st','zh':'沙田區','zh_cn':'沙田区','en':'Sha Tin','pop':692806,'region':'nt'},
    {'d':'kts','zh':'葵青區','zh_cn':'葵青区','en':'Kwai Tsing','pop':495798,'region':'nt'},
    {'d':'iso','zh':'離島區','zh_cn':'离岛区','en':'Islands','pop':185282,'region':'nt'},
]
DISTRICT_META = sorted(DISTRICT_META, key=lambda m: m['d'])
NAME_TO_CODE = {m['zh']: m['d'] for m in DISTRICT_META}
print('total pop:', sum(m['pop'] for m in DISTRICT_META), flush=True)

# ---------------- district rings (area-based selection) ----------------
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

def ring_area_m2(ring):
    s = 0.0
    j = len(ring) - 1
    for i in range(len(ring)):
        x1, y1 = ring[i]; x2, y2 = ring[j]
        s += (x1 * y2 - x2 * y1)
        j = i
    return abs(s) / 2.0 * (111000 ** 2)

def point_in_ring(p, ring):
    x, y = p
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj-xi)*(y-yi)/(yj-yi)+xi):
            inside = not inside
        j = i
    return inside

d18 = load('districts18.json')
grouped = defaultdict(list)
MINX, MINY, MAXX, MAXY = 113.75, 22.05, 114.50, 22.65   # HK bbox sanitizer
for e in d18.get('elements', []):
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
            grouped[code].append(coords)

district_rings = {}
district_bbox = {}
district_lines_raw = {}
for code, segs in grouped.items():
    rings = assemble_rings(segs, eps=1e-4)
    big = [r for r in rings if ring_area_m2(r) > 1_500_000]
    if not big and rings:
        big = [max(rings, key=ring_area_m2)]
    simp = [simplify_rdp(r, 0.0002) for r in big]
    simp = [r for r in simp if len(r) >= 3]
    if simp[0] != simp[-1]:
        simp[0] = simp[0] + [simp[0][0]]
    district_rings[code] = simp
    xs = [p[0] for r in simp for p in r]
    ys = [p[1] for r in simp for p in r]
    district_bbox[code] = (min(xs), min(ys), max(xs), max(ys))
    # display lines: raw boundary segments (land & maritime), simplified
    lines = []
    for s in segs:
        ls = simplify_rdp(s, 0.0002)
        if len(ls) >= 2:
            lines.append(ls)
    district_lines_raw[code] = lines
    print(f'  rings {code}: {len(simp)} rings, area {sum(ring_area_m2(r) for r in simp)/1e6:.1f} km2, lines {len(lines)}', flush=True)
assert set(district_rings) == set(NAME_TO_CODE.values()), 'missing district rings'

# ---------------- roads (all HK, named) ----------------
roads = load('roads_hk.json')
print('roads raw:', len(roads), flush=True)

ring_cache = []
for code, rings in district_rings.items():
    for r in rings:
        xs = [p[0] for p in r]
        ys = [p[1] for p in r]
        ring_cache.append((code, r, (min(xs), min(ys), max(xs), max(ys))))

def district_of(x, y):
    hits = []
    for code, r, (bx0, by0, bx1, by1) in ring_cache:
        if not (bx0 <= x <= bx1 and by0 <= y <= by1):
            continue
        if point_in_ring((x, y), r):
            hits.append(code)
            break
    if hits:
        return hits[0]
    best, bd = None, 1e18
    for code, (bx0, by0, bx1, by1) in district_bbox.items():
        d = math.hypot(x - (bx0+bx1)/2, y - (by0+by1)/2)
        if d < bd:
            bd, best = d, code
    return best

road_feats = []
for i, ft in enumerate(roads):
    coords = [(float(x), float(y)) for x, y in ft['g']]
    if len(coords) < 2:
        continue
    mid = coords[len(coords)//2]
    d = district_of(mid[0], mid[1])
    road_feats.append({
        'n': ft.get('n', ''), 'nc': ft.get('nc', ''),
        'd': d, 'g': [(r5(x), r5(y)) for x, y in coords]
    })
print('roads kept:', len(road_feats), 'by district:', dict(Counter(r['d'] for r in road_feats)), flush=True)

# ---------------- buildings ----------------
BUILDING_FILES = {
    'kts': ['buildings_kwaitsing_raw.json'],
    'tw': ['buildings_tsuenwan_raw.json'],
    'st': ['buildings_shatin_west_raw.json', 'buildings_shatin_east_raw.json'],
    'cw': ['buildings_cw_raw.json'],
    'wc': ['buildings_wc_raw.json'],
    'east': ['buildings_east_raw.json'],
    'south': ['buildings_south_1_raw.json', 'buildings_south_2_raw.json'],
    'ytm': ['buildings_ytm_raw.json'],
    'ssp': ['buildings_ssp_raw.json'],
    'kc': ['buildings_kc_raw.json'],
    'wts': ['buildings_wts_raw.json'],
    'kt': ['buildings_kt_raw.json'],
    'tm': ['buildings_tm_1_raw.json', 'buildings_tm_2_raw.json'],
    'yl': ['buildings_yl_1_raw.json', 'buildings_yl_2_raw.json'],
    'north': ['buildings_north_1_raw.json', 'buildings_north_2_raw.json'],
    'tp': ['buildings_tp_1_raw.json', 'buildings_tp_2_raw.json'],
    'sk': ['buildings_sk_1_raw.json', 'buildings_sk_2_raw.json'],
    'iso': ['buildings_iso_1_raw.json', 'buildings_iso_2_raw.json'],
}

def load_buildings(code, names):
    out = []
    for name in names:
        try:
            els = load(name)['elements']
        except FileNotFoundError:
            print('  ! missing', name, flush=True)
            continue
        for e in els:
            geo = e.get('geometry')
            if isinstance(geo, list):
                ring = [(float(p['lon']), float(p['lat'])) for p in geo]
            elif geo and geo.get('type') == 'Polygon':
                ring = [(float(x), float(y)) for x, y in geo['coordinates'][0]]
            elif geo and geo.get('type') == 'MultiPolygon':
                ring = [(float(x), float(y)) for x, y in geo['coordinates'][0][0]]
            else:
                continue
            if len(ring) < 4:
                continue
            area = 0.0
            for i in range(len(ring)-1):
                x1, y1 = ring[i]; x2, y2 = ring[i+1]
                area += (x1*y2 - x2*y1)
            area = abs(area)/2 * (111320**2) * math.cos(math.radians(22.3))
            if area < 25:
                continue
            out.append({'d': code, 'a': round(area), 'g': ring})
    return out

bld_feats = []
for code in sorted(BUILDING_FILES):
    bf = load_buildings(code, BUILDING_FILES[code])
    print(f'  buildings {code}: {len(bf)}', flush=True)
    bld_feats += bf
print('buildings total:', len(bld_feats), flush=True)

# spatial grid for density/load queries
GRID = 0.0015
bld_grid = defaultdict(list)
for bi, b in enumerate(bld_feats):
    ring = b['g']
    seen_keys = set()
    for x, y in ring:
        k = (round(x/GRID), round(y/GRID))
        if k not in seen_keys:
            seen_keys.add(k)
            bld_grid[k].append(bi)

def buildings_near(line_coords, radius_deg=0.00045):
    seen = set()
    for (x, y) in line_coords:
        for gx in range(int((x-radius_deg)/GRID), int((x+radius_deg)/GRID)+1):
            for gy in range(int((y-radius_deg)/GRID), int((y+radius_deg)/GRID)+1):
                for bi in bld_grid.get((gx, gy), ()):
                    seen.add(bi)
    return seen

# precompute per-road buffer stats once (shared by water & sewer)
print('precomputing road buffer stats...', flush=True)
road_stats = {}
for i, ft in enumerate(road_feats):
    nearby = buildings_near(ft['g'])
    n_bld = len(nearby)
    bld_vol = sum(bld_feats[bi]['a'] * 6 for bi in nearby)
    road_stats[i] = (n_bld, bld_vol)
print('road stats done', flush=True)

# ---------------- base (coast + water) ----------------
def load_base_ways(name):
    try:
        els = load(name)['elements']
    except FileNotFoundError:
        print('  ! missing', name, flush=True)
        return []
    out = []
    for e in els:
        geo = e.get('geometry')
        tags = e.get('tags', {})
        rings = []
        if isinstance(geo, list):
            rings.append([(float(p['lon']), float(p['lat'])) for p in geo])
        elif geo and geo['type'] == 'LineString':
            rings.append([(float(x), float(y)) for x, y in geo['coordinates']])
        elif geo and geo['type'] == 'Polygon':
            rings.append([(float(x), float(y)) for x, y in geo['coordinates'][0]])
        elif geo and geo['type'] == 'MultiPolygon':
            for poly in geo['coordinates']:
                rings.append([(float(x), float(y)) for x, y in poly[0]])
        for r in rings:
            if len(r) >= 2:
                out.append({'tags': tags, 'g': r})
    return out

coast_ways = load_base_ways('base_coast.json')
print('coast ways:', len(coast_ways), flush=True)
coast_rings = []
if coast_ways:
    segs = [w['g'] for w in coast_ways]
    rings = assemble_rings(segs, eps=1e-5)
    coast_rings = [simplify_rdp(r, 0.00015) for r in rings if len(r) >= 10]
    # keep only rings with reasonable size (real islands / landmass)
    coast_rings = [r for r in coast_rings if ring_area_m2(r) > 300_000]
print('coast rings kept:', len(coast_rings), flush=True)

water_polys = []
river_lines = []
for w in load_base_ways('base_water.json'):
    tags = w['tags']
    g = w['g']
    if tags.get('natural') == 'water':
        if len(g) >= 4:
            area = 0.0
            for i in range(len(g)-1):
                x1, y1 = g[i]; x2, y2 = g[i+1]
                area += (x1*y2 - x2*y1)
            area = abs(area)/2 * (111320**2) * math.cos(math.radians(22.3))
            if area > 12000:
                water_polys.append({'a': round(area), 'g': simplify_rdp(g, 0.00012)})
    elif tags.get('waterway') == 'river' and len(g) >= 3:
        river_lines.append(simplify_rdp(g, 0.00012))
print('water polys:', len(water_polys), 'river lines:', len(river_lines), flush=True)

# ---------------- burst events (REAL reported, 25 across 14 districts) ----------------
burst_specs = [
    ('LEI SHU ROAD', '荃灣梨樹路（梨木樹）', 'tw', '2023-03-04',
     '梨樹路食水管爆裂，葵青及荃灣多個屋苑暫停食水近10小時，約30萬人受影響',
     'Fresh water main burst on Lei Shu Road (Lei Muk Shue); water supply suspended for nearly 10 hours across Kwai Tsing & Tsuen Wan estates, ~300,000 residents affected',
     'https://www.devb.gov.hk/sc/publications_and_press_releases/press/index_id_11472.html'),
    ('KWAI SHING CIRCUIT', '葵盛圍', '', '2026-05-28',
     '葵盛西邨停車場對開食水管爆裂，路面水浸及路陷，多座屋邨暫停食水',
     'Fresh water main burst near Kwai Shing West Estate car park; flooding and road subsidence, several estates lost supply',
     'https://www.dotdotnews.com/a/202605/28/AP6a17c6cde4b09ea23316aa3b.html'),
    ('CASTLE PEAK ROAD - KWAI CHUNG', '青山公路（葵涌段）', '', '2026-08-02',
     '青山公路葵涌段附近爆水管，寶星中心等一帶無食水',
     'Water main burst near Castle Peak Road (Kwai Chung); Po Sing Centre area without fresh water',
     'https://thenews.hk/%E8%91%B5%E6%B6%8C%E7%88%86%E6%B0%B4%E7%AE%A1%E5%AF%B6%E6%98%9F%E4%B8%AD%E5%BF%83%E7%84%A1%E9%A3%9F%E6%B0%B4-%E6%B0%B4%E5%8B%99%E7%BD%B2%E7%88%AD%E5%8F%96%E5%87%8C%E6%99%A8%E5%AE%8C%E6%88%90%E6%90%B6/'),
    ('TSING YI HEUNG SZE WUI ROAD', '青衣鄉事會路', '', '2026-05-07',
     '近青衣警署食水管爆裂，青衣多個屋苑食水供應受影響',
     'Fresh water main burst near Tsing Yi Police Station; multiple Tsing Yi estates affected',
     'https://www.dab.org.hk/post/%E9%83%AD%E8%8A%99%E8%93%89%E6%8F%90%E5%8F%A3%E9%A0%AD%E8%B3%AA%E8%A9%A2-%E9%97%9C%E6%B3%A8%E3%80%8C%E8%99%95%E7%90%86%E6%9B%B4%E6%8F%9B%E6%B0%B4%E7%AE%A1%E5%B7%A5%E7%A8%8B%E7%9A%84%E8%B7%A8%E9%83%A8%E9%96%80%E5%B0%88%E8%B2%AC%E5%B0%8F%E7%B5%84%E3%80%8D%E4%BF%83%E6%8F%90%E9%80%9F%E8%A7%A3%E6%B1%BA%E8%8D%83%E8%91%B5%E9%9D%92%E9%A0%BB%E7%88%86%E6%B0%B4%E7%AE%A1%E5%95%8F%E9%A1%8C'),
    ('YEUNG UK ROAD', '荃灣楊屋道', '', '2026-05-25',
     '楊屋道171號對開900毫米鹹水管爆裂，淹浸至少兩條行車線，荃灣及葵涌沖廁水供應受影響',
     '900 mm salt-water main burst near 171 Yeung Uk Road; at least two lanes flooded; flushing water supply for Tsuen Wan & Kwai Chung affected',
     'https://www.dotdotnews.com/a/202605/26/AP6a1564fae4b09ea233167fff.html'),
    ('CHUEN LUNG STREET', '荃灣川龍街', '', '2025-06-13',
     '川龍街123號對開地底6吋鹹水管爆裂，水柱直射至三層樓高，路面水浸',
     '6-inch salt-water main burst near 123 Chuen Lung Street; water jet rose three storeys high and flooded the road',
     'https://www.stheadline.com/zh-hans/breaking-news/3464517/%E8%8D%83%E7%81%A3%E5%B7%9D%E9%BE%8D%E8%A1%97%E7%88%86%E5%92%B8%E6%B0%B4%E7%AE%A1-%E4%B8%89%E5%B1%A4%E6%A8%93%E9%AB%98%E5%96%B7%E6%B3%89%E6%B4%97%E8%A1%97'),
    ('SHAN MEI STREET', '沙田山尾街（火炭）', '', '2026-07-14',
     '火炭山尾街18至24號沙田商業中心對開地下食水管爆裂，封路搶修，水務署派水車供水',
     'Fresh water main burst near Sha Tin Commercial Centre, 18-24 Shan Mei Street, Fo Tan; road closed and WSD sent water trucks',
     'https://www.stheadline.com/zh-hans/breaking-news/3593416/%E7%81%AB%E7%82%AD%E5%B1%B1%E5%B0%BE%E8%A1%97%E7%88%86%E5%9C%B0%E4%B8%8B%E9%A3%9F%E6%B0%B4%E7%AE%A1-%E5%B0%81%E8%B7%AF%E6%8A%A2%E4%BF%AE%E5%B7%B4%E5%A3%AB%E6%94%B9%E9%81%93-%E6%B0%B4%E5%8B%99%E7%BD%B2%E6%B4%BE%E6%B0%B4%E8%BB%8A%E4%BE%9B%E6%B0%B4'),
    ('TAI CHUNG KIU ROAD', '沙田大涌橋路', '', '2026-03-21',
     '大涌橋路近獅子山隧道入口鹹水管爆裂，往馬鞍山方向全線封閉，溱岸8號及車公廟站沖廁水受影響',
     'Salt-water main burst on Tai Chung Kiu Road near Lion Rock Tunnel; full closure towards Ma On Shan; flushing supply affected at Rhine Garden & Che Kung Temple station',
     'https://www.stheadline.com/zh-hans/breaking-news/3555100/%E6%B2%99%E7%94%B0%E5%A4%A7%E6%B6%8C%E6%A1%A5%E8%B7%AF%E7%88%86%E5%92%B8%E6%B0%B4%E7%AE%A1-%E5%BE%80%E9%A6%AC%E9%9E%8D%E5%B1%B1%E6%96%B9%E5%90%91%E5%85%A8%E7%B7%9A%E5%B0%81%E9%96%89-%E6%BA%B1%E5%B2%B88%E8%99%9F%E5%8F%8A%E8%BB%8A%E5%85%AC%E5%BA%99%E7%AB%99%E5%86%B2%E5%BB%81%E6%B0%B4%E5%8F%97%E5%BD%B1%E9%9F%BF'),
    ('SAI SHA ROAD', '沙田西沙路', '', '2021-01-08',
     '西沙路食水管爆裂（水務署回覆沙田區議會紀錄，2021年1月8日）',
     'Fresh water main burst on Sai Sha Road (recorded in WSD reply to Sha Tin District Council, 8 Jan 2021)',
     'https://www.districtcouncils.gov.hk/st/doc/2024_2027/en/committee_meetings_doc/HDPC/26974/ST_HDPC_010_tc.pdf'),
    ('HOI BUN ROAD', '觀塘海濱道（近鴻業街）', 'kt', '2025-06-03',
     '300毫米鹹水管爆裂，海濱道往油塘方向部分行車線封閉',
     '300 mm salt-water main burst near Hung Yip Street, Kwun Tong Waterfront; lanes towards Yau Tong closed',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('TUEN MUN ROAD', '屯門公路（近兆康站）', 'tm', '2025-05-27',
     '900毫米食水管破裂，屯門公路往元朗方向封路，多個屋苑通宵停水，約20萬居民受影響',
     '900 mm fresh water main burst on Tuen Mun Road near Siu Hong; overnight cut for many estates, ~200,000 residents affected',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('KWUN TONG ROAD', '觀塘道（近坪石邨）', 'kt', '2025-05-30',
     '450毫米鹹水管爆裂，多條行車線被水淹沒，觀塘道往九龍灣方向快線封閉',
     '450 mm salt-water main burst on Kwun Tong Road near Ping Shek Estate; several lanes flooded',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('FUNG TAK ROAD', '黃大仙鳳德道', 'wts', '2025-05-17',
     '450毫米主輸水管破裂，鳳德邨及多個屋苑無食水，9條巴士路線改道',
     '450 mm trunk main burst on Fung Tak Road near Fung Tak Estate; 9 bus routes diverted',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('PRINCE EDWARD ROAD WEST', '旺角太子道西', 'ytm', '2025-05-14',
     '近荔枝角道交界淡水管爆裂，部分行車線封閉',
     'Fresh water main burst on Prince Edward Road West near Lai Chi Kok Road; lanes closed',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('CHEUNG SHA WAN ROAD', '長沙灣道（近怡閣苑）', 'ssp', '2025-05-11',
     '鹹水管爆裂，水柱噴約3層樓高，往美孚方向慢線封閉',
     'Salt-water main burst on Cheung Sha Wan Road near Yee Kok Court; jet ~3 storeys high',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('WAN PO ROAD', '將軍澳環保大道', 'sk', '2025-05-20',
     '900毫米鹹水管滲漏，日出康城、調景嶺一帶沖廁水供應受影響',
     '900 mm salt-water main leak on Wan Po Road; flushing supply for Lohas Park & Tiu Keng Leng affected',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('FUK LO TSUN ROAD', '九龍城福佬村道', 'kc', '2025-05-29',
     '發電站附近爆水渠，水柱高度超過十層樓，現場封路處理',
     'Sewer burst near the substation on Fuk Lo Tsun Road; water column over 10 storeys',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('WYLIE ROAD', '油麻地衛理道', 'ytm', '2025-05-30',
     '近伊利沙伯醫院150毫米食水管爆裂，衛理道轉單線雙程行車',
     '150 mm fresh water main burst on Wylie Road near Queen Elizabeth Hospital',
     'https://www.tkww.hk/a/202506/09/AP6846be40e4b0fbda9a205f2e.html'),
    ('WAI WAH STREET', '慈雲山惠華街', 'wts', '2026-06-06',
     '250毫米鹹水管滲漏，慈康邨、慈民邨及附近學校沖廁水受影響，多條巴士改道',
     '250 mm salt-water main leak on Wai Wah Street, Tsz Wan Shan; flushing supply for Tsz Hong/ Tsz Man estates affected',
     'https://www.dotdotnews.com/a/202606/06/AP6a2418d5e4b09ea233178cf3.html'),
    ('TIN LOK LANE', '灣仔天樂里', 'wc', '2026-06-20',
     '10吋食水管爆裂，軒尼詩道嚴重水浸，多條行車線受阻',
     '10-inch fresh water main burst on Tin Lok Lane; Hennessy Road flooded',
     'https://www.dotdotnews.com/a/202606/20/AP6a36690de4b09ea233190708.html'),
    ('SAN WAN ROAD', '上水新運路', 'north', '2025-12-21',
     '近掃管埔路食水管爆裂，逾3,700戶受影響，冬至日停水',
     'Fresh water main burst on San Wan Road near So Kwun Po Road; over 3,700 households affected',
     'https://www.wenweipo.com/a/202512/21/AP694783d6e4b0027ebfaa99a9.html'),
    ('CHEUNG TUNG ROAD', '東涌翔東路', 'iso', '2024-11-03',
     '近小蠔灣濾水廠食水管緊急維修，東涌市區約12萬居民受影響',
     'Fresh water main repair on Cheung Tung Road near Siu Ho Wan WTW; ~120,000 Tung Chung residents affected',
     'https://www.news.gov.hk/eng/2024/11/20241104/20241104_124500_771.html'),
    ('SUN SING STREET', '筲箕灣新成街', 'east', '2026-07-19',
     '18吋水管爆裂，筲箕灣一帶數千居民及商戶受影響，水務署派水車供水',
     '18-inch water main burst on Sun Sing Street, Shau Kei Wan; thousands affected, WSD deployed water trucks',
     'https://storychase.co/news/water-main-burst-in-hong-kongs-shau-kei-wan-disrupts-thousands-of-residents-and-businesses/'),
    ('CASTLE PEAK ROAD - TUEN MUN', '屯門青山公路（近屯利街）', 'tm', '2026-08-25',
     '水管滲漏，4屋苑通宵停水，月內第三次，水務署鋪緊急水管',
     'Main leak on Castle Peak Road near Tuen Lee Street; 4 estates without water overnight (3rd time in a month)',
     'https://www.stheadline.com/zh-hans/breaking-news/3608150/%E5%B1%AF%E9%97%A8%E7%88%86%E6%B0%B4%E7%AE%A14%E5%B1%8B%E8%8B%91%E9%80%9A%E5%AE%B5%E5%81%9C%E6%B0%B4-%E6%9C%88%E5%85%A7%E7%AC%AC%E4%B8%89%E6%AC%A1-%E6%B0%B4%E5%8B%99%E7%BD%B2%E5%B0%87%E9%8B%AA%E7%B7%8A%E6%80%A5%E6%B0%B4%E7%AE%A1%E6%A0%B9%E7%B5%95%E5%95%8F%E9%A1%8C'),
    ('KO CHIU ROAD', '油塘高超道', 'kt', '2026-06-14',
     '油塘公共運輸交匯處對開鹹水管爆裂，行人路現大坑，影響行人路及行車線',
     'Salt-water main burst on Ko Chiu Road near Yau Tong PTI; large pit opened on footpath',
     'https://www.dotdotnews.com/a/202606/14/AP6a2eaf73e4b09ea2331869e1.html'),
]

def norm_name(s):
    return ''.join(c for c in s.upper() if c.isalnum())

def find_road(target, exp_d=None):
    t = norm_name(target)
    tokens = [w for w in target.upper().split() if len(w) >= 3]
    # 1) exact normalized match (prefer expected district; long road split into segments)
    exact = [ft for ft in road_feats if norm_name(ft['n'] or '') == t]
    if exact:
        if exp_d:
            for ft in exact:
                if ft['d'] == exp_d:
                    return ft
        return exact[0]
    # 2) token containment, prefer expected district
    best = []
    bscore = 0.0
    for ft in road_feats:
        name = norm_name(ft['n'] or '')
        if not tokens:
            continue
        hit = sum(1 for w in tokens if w in name)
        if hit == 0:
            continue
        score = hit / len(tokens)
        if score > bscore:
            bscore = score
            best = [ft]
        elif score == bscore:
            best.append(ft)
    if best and bscore >= 0.5:
        if exp_d:
            for ft in best:
                if ft['d'] == exp_d:
                    return ft
        return best[0]
    # 3) chinese substring
    for ft in road_feats:
        if target in (ft['nc'] or ''):
            return ft
    return None

bursts = []
for en, cn, exp_d, date, desc, desc_en, src in burst_specs:
    ft = find_road(en, exp_d)
    if not ft:
        print('  ! road not found:', en, flush=True)
        continue
    g = ft['g']
    mid = g[len(g)//2]
    bursts.append({
        'name': cn, 'name_en': en, 'd': ft['d'], 'date': date,
        'desc': desc, 'desc_en': desc_en, 'src': src,
        'lat': mid[1], 'lon': mid[0]
    })
    if exp_d and ft['d'] != exp_d:
        print(f'  ! district mismatch {en}: expected {exp_d}, got {ft["d"]}', flush=True)
print('bursts located:', len(bursts), 'by district:', dict(Counter(b['d'] for b in bursts)), flush=True)

# ---------------- pipe generation & risk model (global percentiles) ----------------
def build_pipes(roads_list, min_len):
    pipes = []
    for i, ft in enumerate(roads_list):
        g = ft['g']
        length = line_len(g)
        if length < min_len:
            continue
        n_bld, bld_vol = road_stats[i]
        density = n_bld / max(length/1000.0, 0.1)
        load_raw = bld_vol / max(length/1000.0, 0.1)
        spread = (max(p[1] for p in g)-min(p[1] for p in g))*111000 if len(g) >= 2 else 0.0
        mid = g[len(g)//2]
        d_min = min(haversine_m((b['lon'], b['lat']), (mid[0], mid[1])) for b in bursts) if bursts else 5000
        pipes.append({
            'ri': i, 'n': ft['n'], 'nc': ft['nc'], 'd': ft['d'],
            'len': round(length),
            'density': density, 'load_raw': load_raw,
            'spread': spread, 'd_min': d_min, 'g': g
        })
    def norm(key, invert=False, by_district=False):
        groups = defaultdict(list) if by_district else None
        if groups is not None:
            for p in pipes:
                groups[p['d']].append(p[key])
        for p in pipes:
            vals = sorted(groups[p['d']]) if groups is not None else sorted(p[key] for p in pipes)
            n = len(vals)
            v = bisect.bisect_left(vals, p[key]) / max(n - 1, 1)
            if invert:
                v = 1 - v
            p[key + '_n'] = round(v, 3)
    norm('density', by_district=True)
    norm('load_raw', by_district=True)
    norm('spread')
    norm('d_min', invert=True)
    for p in pipes:
        age = round(10 + 45 * p['density_n'])
        raw = 0.35*(age/50) + 0.25*p['load_raw_n'] + 0.15*p['spread_n'] + 0.25*p['d_min_n']
        pri = round(min(100, max(0, raw*100*0.9 + 8)), 1)
        risk = 'high' if pri > 75 else ('medium' if pri >= 50 else 'low')
        p['age'] = age
        p['load'] = p['load_raw_n']
        p['elev'] = p['spread_n']
        p['burst'] = p['d_min_n']
        p['pri'] = pri
        p['risk'] = risk
    pris = sorted(p['pri'] for p in pipes)
    n = len(pris)
    qs = {}
    for pct in (82, 84, 86, 88, 90, 92):
        qs[pct] = pris[min(n-1, int(n * pct / 100))]
    print('  pri quantiles:', qs, flush=True)
    for p in pipes:
        for k in ('density', 'load_raw', 'spread', 'd_min', 'density_n', 'load_raw_n', 'spread_n', 'd_min_n'):
            p.pop(k, None)
    return pipes

# check high% before accepting calibration
water_pipes = build_pipes(road_feats, 50)
sewer_pipes = build_pipes(road_feats, 30)
def risk_report(pipes, label):
    c = Counter(p['risk'] for p in pipes)
    total = len(pipes)
    print(f'  {label}: total={total} high={c["high"]} ({c["high"]/max(total,1)*100:.1f}%) med={c["medium"]} low={c["low"]}', flush=True)
risk_report(water_pipes, 'water')
risk_report(sewer_pipes, 'sewer')
all_risks = Counter(p['risk'] for p in water_pipes + sewer_pipes)
high_pct = all_risks['high'] / max(len(water_pipes)+len(sewer_pipes), 1) * 100
print(f'  combined high% = {high_pct:.1f}', flush=True)
print('  target band: 12% - 18%', flush=True)
if high_pct < 12 or high_pct > 18:
    print('  !! calibration out of band - adjust constants and rerun', flush=True)

# ---------------- grid bins (150 m, building density) ----------------
GCELL = 0.00135  # ~150 m
bins = defaultdict(lambda: {'a': 0, 'n': 0})
for b in bld_feats:
    cx = sum(p[0] for p in b['g']) / len(b['g'])
    cy = sum(p[1] for p in b['g']) / len(b['g'])
    k = (round(cx/GCELL), round(cy/GCELL))
    bins[k]['a'] += b['a']
    bins[k]['n'] += 1
grid = []
for (gx, gy), v in bins.items():
    if v['a'] < 1500:
        continue
    x = gx * GCELL + GCELL/2
    y = gy * GCELL + GCELL/2
    grid.append({'x': r5(x), 'y': r5(y), 'a': v['a'], 'n': v['n']})
grid.sort(key=lambda b: b['a'], reverse=True)
print('grid bins:', len(grid), flush=True)

# ---------------- buildings for map (named/large, capped 40k) ----------------
buildings_map = [b for b in bld_feats if b['a'] > 400]
buildings_map.sort(key=lambda b: b['a'], reverse=True)
buildings_map = buildings_map[:40000]
for b in buildings_map:
    b['g'] = [(r5(x), r5(y)) for x, y in simplify_rdp(b['g'], 0.00012)]
    if b['g'][0] != b['g'][-1]:
        b['g'] = b['g'] + [b['g'][0]]
print('buildings for map:', len(buildings_map), flush=True)

# ---------------- districts output ----------------
districts_out = []
for dm in DISTRICT_META:
    d = dm['d']
    lines = district_lines_raw.get(d, [])
    # label anchor: pipe-midpoint average (where the visible network is)
    rx = [ft for ft in road_feats if ft['d'] == d]
    if rx:
        mxs = [g[len(g)//2][0] for ft in rx for g in [ft['g']]]
        mys = [g[len(g)//2][1] for ft in rx for g in [ft['g']]]
        center = [sum(mxs)/len(mxs), sum(mys)/len(mys)]
    else:
        rings = district_rings.get(d, [])
        xs = [p[0] for r in rings for p in r]
        ys = [p[1] for r in rings for p in r]
        center = [sum(xs)/len(xs), sum(ys)/len(ys)] if xs else [114.15, 22.35]
    districts_out.append({
        'd': d, 'zh': dm['zh'], 'zh_cn': dm['zh_cn'], 'en': dm['en'],
        'pop': dm['pop'], 'region': dm['region'],
        'center': [r5(center[0]), r5(center[1])],
        'lines': lines
    })

# ---------------- output ----------------
out = {
    'meta': {
        'title': 'AquaPulse AI',
        'updated': '2026-09-07',
        'districts': districts_out,
        'official': {
            'hk_pipe_km': 680,
            'dmz_zones': 2400,
            'tsuen_incidents': [827, 497],
            'leak_rate': 13.4,
            'burst_2000': 2500,
            'burst_2023': 40,
            'burst_2024': 27,
            'replaced_km': 3000
        }
    },
    'base': {'coast': coast_rings, 'water': water_polys, 'river': river_lines},
    'roads': road_feats,
    'water': water_pipes,
    'sewer': sewer_pipes,
    'buildings': buildings_map,
    'grid': grid,
    'bursts': bursts,
}
with open(os.path.join(BASE, 'app_data.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print('app_data.json bytes:', os.path.getsize(os.path.join(BASE, 'app_data.json')), flush=True)
print('total time: %.0fs' % (time.time() - t0), flush=True)
