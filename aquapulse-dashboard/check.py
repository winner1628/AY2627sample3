# -*- coding: utf-8 -*-
"""Static self-checks on the built index.html (no browser involved)."""
import io, re, subprocess, os

html = io.open('index.html', encoding='utf-8').read()

# 1) extract inline scripts
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
print('inline scripts:', len(scripts))
io.open('_app.js', 'w', encoding='utf-8').write(scripts[-1])

# node syntax check if available
try:
    r = subprocess.run(['node', '--check', '_app.js'], capture_output=True, text=True, timeout=60)
    print('node --check:', 'OK' if r.returncode == 0 else 'FAIL\n' + r.stderr[:1200])
except FileNotFoundError:
    print('node not installed - skip JS syntax check')

# 2) whitelist CDN / SRI
print('echarts cdn ok:', 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js' in html)
print('sri ok:', 'sha384-pPi0zxBAoDu6+JXW/C68UZLvBUUtU+7zonhif43rqj7pxsGyqyqzcian2Rj37Rss' in html)
print('no google fonts:', 'fonts.googleapis.com' not in html)
print('no local file refs:', all(x not in html for x in ['C:\\', 'file://', 'src="./', 'href="./']))

# 3) emoji scan
emoji = re.findall(r'[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F]', html)
print('emoji found:', len(emoji))

# 4) mobile / a11y guards
print('viewport ok:', 'width=device-width, initial-scale=1' in html)
print('media 900 ok:', '@media(max-width:900px)' in html)
print('resize observer ok:', 'ResizeObserver' in html)
print('script tags total:', html.count('<script'))
print('langs present:', all(x in html for x in ['"zh-HK"', '"zh-CN"', 'data-lang="en"']))
