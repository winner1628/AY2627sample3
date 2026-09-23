# -*- coding: utf-8 -*-
"""Fetch all 18 HK District Council district boundaries + HK coastline + water
from OSM Overpass with retries. Output: districts18.json, base_coast.json, base_water.json
"""
import json, time, urllib.request, urllib.parse, os

HERE = os.path.dirname(os.path.abspath(__file__))
ENDPOINTS = ['https://overpass-api.de/api/interpreter',
             'https://overpass.kumi.systems/api/interpreter',
             'https://overpass.private.coffee/api/interpreter']

def fetch(query, name, timeout=900):
    data = 'data=' + urllib.parse.quote(query)
    for attempt in range(5):
        ep = ENDPOINTS[attempt % len(ENDPOINTS)]
        req = urllib.request.Request(ep, data=data.encode('utf-8'),
                                     headers={'User-Agent': 'FYP-AquaPulse/2.0'})
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

DISTRICT_NAMES = ['中西區','灣仔區','東區','南區','油尖旺區','深水埗區','九龍城區',
                  '黃大仙區','觀塘區','荃灣區','屯門區','元朗區','北區','大埔區',
                  '西貢區','沙田區','葵青區','離島區']

if __name__ == '__main__':
    # ---- 18 district boundaries in one query ----
    rels = '\n'.join(f'rel["boundary"="administrative"]["name:zh"="{n}"];' for n in DISTRICT_NAMES)
    q_dist = f'[out:json][timeout:900];(\n{rels}\n);out geom;'
    print('fetch districts18', flush=True)
    fetch(q_dist, 'districts18.json')
    time.sleep(30)

    # ---- HK coastline (whole territory bbox) ----
    q_coast = '''[out:json][timeout:600];
way["natural"="coastline"](22.08,113.72,22.65,114.52);
out geom;'''
    print('fetch base_coast', flush=True)
    fetch(q_coast, 'base_coast.json')
    time.sleep(30)

    # ---- water polygons + rivers ----
    q_water = '''[out:json][timeout:900];
(
  way["natural"="water"](22.08,113.72,22.65,114.52);
  way["waterway"="river"](22.08,113.72,22.65,114.52);
);
out geom;'''
    print('fetch base_water', flush=True)
    fetch(q_water, 'base_water.json')

    print('ALL DONE', flush=True)
