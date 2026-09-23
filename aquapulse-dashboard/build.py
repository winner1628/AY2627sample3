# -*- coding: utf-8 -*-
"""Build final index.html by injecting app_data.json into the template."""
import json, io

tpl = io.open('index.template.html', encoding='utf-8').read()
data = io.open(r'..\data_pipeline\app_data.json', encoding='utf-8').read()
assert tpl.count('/*__APP_DATA__*/') == 1, 'placeholder missing'

parsed = json.loads(data)
print('keys:', sorted(parsed.keys()))
print('water:', len(parsed['water']), 'sewer:', len(parsed['sewer']),
      'roads:', len(parsed['roads']), 'buildings:', len(parsed['buildings']),
      'bursts:', len(parsed['bursts']), 'base keys:', sorted(parsed['base'].keys()))
print('burst sample:', parsed['bursts'][0]['desc_en'], '|', parsed['bursts'][0]['src'])

safe = data.replace('</script>', '<\\/script>')
html = tpl.replace('/*__APP_DATA__*/', safe)
io.open('../index.html', 'w', encoding='utf-8').write(html)
print('index.html bytes:', len(html.encode('utf-8')))
