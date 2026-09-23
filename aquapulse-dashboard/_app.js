
/* =========================================================
   AquaPulse AI — 智慧城市水管預測性維護與風險管理平台
   v3.0: ALL 18 HK districts
   Real open data + simulated sensor animation, single-file ECharts WebGIS
   ========================================================= */
'use strict';

/* ---------- i18n ---------- */
var I18N = {
  'zh-HK': {
    'nav.sub':'智慧城市水管預測性維護與風險管理平台',
    'nav.district':'全港 18 區',
    'nav.search':'搜尋街道（如「葵盛圍」「大涌橋路」「觀塘道」）',
    'nav.tilt':'3D 視角',
    'aside.layers':'圖層','aside.kpi':'監測 KPI','aside.metrics':'真實統計數據','aside.sensors':'水壓感測器（模擬）',
    'aside.filter':'風險篩選','aside.priority':'高危優先維修清單','aside.legend':'風險等級','aside.formula':'管段風險指數（Pipe Risk Index）',
    'layer.water':'食水管網','layer.water.sub':'沿真實道路中心線模擬生成（WSD 不公開管網幾何）',
    'layer.sewer':'污水管網','layer.sewer.sub':'沿真實道路中心線模擬生成（DSD 不公開管網幾何）',
    'layer.sensors':'水壓感測器','layer.sensors.sub':'模擬 IoT 感測器即時讀數',
    'layer.buildings':'建築物','layer.buildings.sub':'OSM 真實樓宇輪廓 · 全港視圖顯示城市密度網格',
    'layer.roads':'道路中心線','layer.roads.sub':'運輸署開放數據（data.gov.hk，全港）',
    'layer.bursts':'爆管新聞熱點','layer.bursts.sub':'2021–2026 真實報導事件',
    'layer.boundaries':'區份邊界','layer.boundaries.sub':'OSM 行政邊界（18 區）',
    'kpi.total':'模擬管網總長度','kpi.highrisk':'高危管線（PRI>75）','kpi.bursts':'真實爆管紀錄','kpi.leak':'全港食水管滲漏率',
    'kpi.highrisk.sub':'段 · 高危優先維修','kpi.bursts.sub':'2021–2026 報導','kpi.leak.sub':'2024 年（2000 年 >25%）',
    'sensor.normal':'正常','sensor.caution':'注意','sensor.alarm':'警報',
    'sensor.note':'感測器讀數為模擬生成（壓力按風險模型推導），非真實儀表數據。',
    'sensor.clock':'最近更新：','sensor.m':'m 水頭','sensor.alerting':'低壓預警：',
    'filter.all':'全部','filter.high':'高危','filter.medium':'中危','filter.low':'低危',
    'legend.high':'高危 — 6 個月內檢測或更換','legend.med':'中危 — 列入定期監測','legend.low':'低危 — 正常營運維護',
    'legend.high.b':'PRI > 75','legend.med.b':'50–75','legend.low.b':'< 50',
    'f.age':'管齡/50','f.load':'負荷','f.elev':'高程','f.burst':'爆管距離',
    'map.title':'全港 18 區地下管網風險地圖','map.sub':'深色模式 WebGIS · 紅／黃／綠三級風險 · 點擊管線或感測器查看詳情',
    'map.live':'即時風險評估模型 v3.0','map.scale':'全港 18 區聯網','district.all':'全部 18 區',
    'alerts.title':'真實爆管事件',
    'metric.pop':'人口（2021 人口普查）','metric.pop.sum':'全港 18 區合計人口（2021 普查）','metric.consumption':'全港食水用量 2024','metric.daily':'每日平均用量 2024','metric.burstcases':'全港爆管宗數 2000 → 2024','metric.leak_history':'食水管滲漏率 2022 → 2024','metric.dmz':'「智管網」監測區（2024-05）','metric.replaced':'更換老化水管計劃（2000–2015）',
    'empty.priority':'暫無符合篩選條件的管線','empty.search':'未找到符合「{q}」的街道，請嘗試其他關鍵字',
    'info.default':'點擊地圖上的管線、感測器或爆管熱點，查看風險詳情與維護建議。',
    'info.street':'街道','info.type':'管網類型','info.len':'長度','info.age':'估算管齡','info.load':'負荷權重','info.elev':'高程權重','info.burst':'爆管鄰近度','info.pri':'風險指數 PRI','info.risk':'風險等級','info.water':'食水管','info.sewer':'污水管',
    'info.suggest':'AI 維護建議','info.proxy':'代理變數說明：管齡以周邊樓宇密度估算（Proxy 1）；負荷以緩衝區建築面積標定（Proxy 2）；高程取道路線實際起伏（Proxy 3）；爆管鄰近度按真實報導事件距離反比（Proxy 4）。',
    'info.src':'資料來源','info.district':'區份','info.sensor':'感測器','info.pressure':'壓力','info.flow':'流量','info.sensor_id':'感測器編號','info.sensor_note':'模擬感測器 — 壓力按所在管段風險模型推導',
    'suggest.high':'風險極高：建議 6 個月內安排預防性檢測或更換管段，優先納入修復排程。',
    'suggest.medium':'風險中等：列入定期監測清單，每 12 個月覆檢一次壓力與滲漏。',
    'suggest.low':'風險較低：維持正常營運與例行維護。',
    'foot.sources':'數據來源（真實開放數據）','foot.method':'方法與代理變數（Proxy）','foot.links':'延伸參考','foot.toggle':'顯示數據來源與方法論','foot.hide':'隱藏數據來源與方法論',
    'src.roads':'運輸署「道路網絡（第二代）」— 道路中心線 KML（data.gov.hk，2026-09，全港 29,388 段）',
    'src.buildings':'OpenStreetMap 建築物輪廓（ODbL，2026-09 提取，全港 18 區）',
    'src.pop':'政府統計處 2021 人口普查 — 全港 7,413,070（18 區分區統計便覽）',
    'src.wsd':'水務署年報及水資源數據 — 滲漏率 13.4%（2024）、用量 1,059.6 百萬立方米',
    'src.cs':'政府統計處表 990-92072 食水供應及用量（2025）',
    'src.bursts':'發展局新聞公報／新聞媒體／區議會文件 — 全港 14 個區份 25 宗真實爆管紀錄（2021–2026）',
    'method.1':'管網幾何：水務署/渠務署基於保安考量不公開地下管網，故沿真實道路中心線模擬生成（本項目核心假設之一）。',
    'method.2':'Proxy 1 管齡：以 50 米緩衝區內樓宇密度估算發展年期，密度愈高代表地區發展愈久、管齡愈高（10–55 年）。',
    'method.3':'Proxy 2 負荷：以緩衝區內建築面積作為用水需求代理，並以各區真實人口（2021 普查）標定。',
    'method.4':'Proxy 3 高程：取道路中心線實際座標起伏（緯向跨度）代表地形壓力變化。',
    'method.5':'Proxy 4 爆管歷史：以 25 宗真實報導事件作校準集，管段與最近事件距離愈近、風險愈高。',
    'method.6':'區份歸屬：以 OpenStreetMap 18 區行政邊界（射線法）判定道路所屬區份；個別邊界地帶為近似結果。',
    'method.7':'水壓感測器：為模擬 IoT 裝置，壓力值由所在管段 PRI 反推（高風險→低壓力），每 2 秒更新一次，僅供演示。',
    'method.8':'城市密度網格：以 150 米格網匯總建築面積，全港視圖下以亮度表示發展密度，選擇區份後切換為樓宇輪廓。',
    'link.1':'HK-TAG 2025 參考數據集：閱讀及使用開放數據的實用指南',
    'link.2':'DATA.GOV.HK 香港政府資料一線通',
    'link.3':'空間數據共享平台 CSDI',
    'link.4':'WSD 水務署官方統計',
    'footnote':'免責聲明：本平台為學術（FYP）原型示範。地圖上的管網為沿真實道路生成的模擬數據，風險指數與感測器讀數均為代理／模擬模型的估算結果，僅供教學演示，不構成任何工程決策依據。',
    'lastupdate':'數據更新：道路網絡 2026-09 · 建築物 2026-09（全港 18 區）· 統計數據 2024/25'
  },
  'zh-CN': {
    'nav.sub':'智慧城市水管预测性维护与风险管理平台',
    'nav.district':'全港 18 区',
    'nav.search':'搜索街道（如「葵盛围」「大涌桥路」「观塘道」）',
    'nav.tilt':'3D 视角',
    'aside.layers':'图层','aside.kpi':'监测 KPI','aside.metrics':'真实统计数据','aside.sensors':'水压传感器（模拟）',
    'aside.filter':'风险筛选','aside.priority':'高危优先维修清单','aside.legend':'风险等级','aside.formula':'管段风险指数（Pipe Risk Index）',
    'layer.water':'食水管网','layer.water.sub':'沿真实道路中心线模拟生成（WSD 不公开管网几何）',
    'layer.sewer':'污水管网','layer.sewer.sub':'沿真实道路中心线模拟生成（DSD 不公开管网几何）',
    'layer.sensors':'水压传感器','layer.sensors.sub':'模拟 IoT 传感器实时读数',
    'layer.buildings':'建筑物','layer.buildings.sub':'OSM 真实楼宇轮廓 · 全港视图显示城市密度网格',
    'layer.roads':'道路中心线','layer.roads.sub':'运输署开放数据（data.gov.hk，全港）',
    'layer.bursts':'爆管新闻热点','layer.bursts.sub':'2021–2026 真实报道事件',
    'layer.boundaries':'区份边界','layer.boundaries.sub':'OSM 行政边界（18 区）',
    'kpi.total':'模拟管网总长度','kpi.highrisk':'高危管线（PRI>75）','kpi.bursts':'真实爆管记录','kpi.leak':'全港食水管渗漏率',
    'kpi.highrisk.sub':'段 · 高危优先维修','kpi.bursts.sub':'2021–2026 报道','kpi.leak.sub':'2024 年（2000 年 >25%）',
    'sensor.normal':'正常','sensor.caution':'注意','sensor.alarm':'警报',
    'sensor.note':'传感器读数为模拟生成（压力按风险模型推导），非真实仪表数据。',
    'sensor.clock':'最近更新：','sensor.m':'m 水头','sensor.alerting':'低压预警：',
    'filter.all':'全部','filter.high':'高危','filter.medium':'中危','filter.low':'低危',
    'legend.high':'高危 — 6 个月内检测或更换','legend.med':'中危 — 列入定期监测','legend.low':'低危 — 正常运营维护',
    'legend.high.b':'PRI > 75','legend.med.b':'50–75','legend.low.b':'< 50',
    'f.age':'管龄/50','f.load':'负荷','f.elev':'高程','f.burst':'爆管距离',
    'map.title':'全港 18 区地下管网风险地图','map.sub':'深色模式 WebGIS · 红／黄／绿三级风险 · 点击管线或传感器查看详情',
    'map.live':'实时风险评估模型 v3.0','map.scale':'全港 18 区联网','district.all':'全部 18 区',
    'alerts.title':'真实爆管事件',
    'metric.pop':'人口（2021 人口普查）','metric.pop.sum':'全港 18 区合计人口（2021 普查）','metric.consumption':'全港食水用量 2024','metric.daily':'每日平均用量 2024','metric.burstcases':'全港爆管宗数 2000 → 2024','metric.leak_history':'食水管渗漏率 2022 → 2024','metric.dmz':'「智管网」监测区（2024-05）','metric.replaced':'更换老化水管计划（2000–2015）',
    'empty.priority':'暂无符合筛选条件的管线','empty.search':'未找到符合「{q}」的街道，请尝试其他关键字',
    'info.default':'点击地图上的管线、传感器或爆管热点，查看风险详情与维护建议。',
    'info.street':'街道','info.type':'管网类型','info.len':'长度','info.age':'估算管龄','info.load':'负荷权重','info.elev':'高程权重','info.burst':'爆管邻近度','info.pri':'风险指数 PRI','info.risk':'风险等级','info.water':'食水管','info.sewer':'污水管',
    'info.suggest':'AI 维护建议','info.proxy':'代理变量说明：管龄以周边楼宇密度估算（Proxy 1）；负荷以缓冲区建筑面积标定（Proxy 2）；高程取道路线实际起伏（Proxy 3）；爆管邻近度按真实报道事件距离反比（Proxy 4）。',
    'info.src':'资料来源','info.district':'区份','info.sensor':'传感器','info.pressure':'压力','info.flow':'流量','info.sensor_id':'传感器编号','info.sensor_note':'模拟传感器 — 压力按所在管段风险模型推导',
    'suggest.high':'风险极高：建议 6 个月内安排预防性检测或更换管段，优先纳入修复排程。',
    'suggest.medium':'风险中等：列入定期监测清单，每 12 个月覆检一次压力与渗漏。',
    'suggest.low':'风险较低：维持正常运营与例行维护。',
    'foot.sources':'数据来源（真实开放数据）','foot.method':'方法与代理变量（Proxy）','foot.links':'延伸参考','foot.toggle':'显示数据来源与方法论','foot.hide':'隐藏数据来源与方法论',
    'src.roads':'运输署「道路网络（第二代）」— 道路中心线 KML（data.gov.hk，2026-09，全港 29,388 段）',
    'src.buildings':'OpenStreetMap 建筑物轮廓（ODbL，2026-09 提取，全港 18 区）',
    'src.pop':'政府统计处 2021 人口普查 — 全港 7,413,070（18 区分区统计便览）',
    'src.wsd':'水务署年报及水资源数据 — 渗漏率 13.4%（2024）、用量 1,059.6 百万立方米',
    'src.cs':'政府统计处表 990-92072 食水供应及用量（2025）',
    'src.bursts':'发展局新闻公报／新闻媒体／区议会文件 — 全港 14 个区份 25 宗真实爆管记录（2021–2026）',
    'method.1':'管网几何：水务署/渠务署基于安保考量不公开地下管网，故沿真实道路中心线模拟生成（本项目核心假设之一）。',
    'method.2':'Proxy 1 管龄：以 50 米缓冲区内楼宇密度估算发展年期，密度愈高代表地区发展愈久、管龄愈高（10–55 年）。',
    'method.3':'Proxy 2 负荷：以缓冲区内建筑面积作为用水需求代理，并以各区真实人口（2021 普查）标定。',
    'method.4':'Proxy 3 高程：取道路中心线实际坐标起伏（纬向跨度）代表地形压力变化。',
    'method.5':'Proxy 4 爆管历史：以 25 宗真实报道事件作校准集，管段与最近事件距离愈近、风险愈高。',
    'method.6':'区份归属：以 OpenStreetMap 18 区行政边界（射线法）判定道路所属区份；个别边界地带为近似结果。',
    'method.7':'水压传感器：为模拟 IoT 装置，压力值由所在管段 PRI 反推（高风险→低压力），每 2 秒更新一次，仅供演示。',
    'method.8':'城市密度网格：以 150 米格网汇总建筑面积，全港视图下以亮度表示发展密度，选择区份后切换为楼宇轮廓。',
    'link.1':'HK-TAG 2025 参考数据集：阅读及使用开放数据的实用指南',
    'link.2':'DATA.GOV.HK 香港政府资料一线通',
    'link.3':'空间数据共享平台 CSDI',
    'link.4':'WSD 水务署官方统计',
    'footnote':'免责声明：本平台为学术（FYP）原型示范。地图上的管网为沿真实道路生成的模拟数据，风险指数与传感器读数均为代理／模拟模型的估算结果，仅供教学演示，不构成任何工程决策依据。',
    'lastupdate':'数据更新：道路网络 2026-09 · 建筑物 2026-09（全港 18 区）· 统计数据 2024/25'
  },
  'en': {
    'nav.sub':'Smart City Water Pipe Predictive Maintenance & Risk Management Platform',
    'nav.district':'All 18 districts',
    'nav.search':'Search street (e.g. "Kwai Shing Circuit", "Tai Chung Kiu Road", "Kwun Tong Road")',
    'nav.tilt':'3D view',
    'aside.layers':'Layers','aside.kpi':'Monitoring KPIs','aside.metrics':'Verified statistics','aside.sensors':'Pressure sensors (simulated)',
    'aside.filter':'Risk filter','aside.priority':'High-risk maintenance priority list','aside.legend':'Risk levels','aside.formula':'Pipe Risk Index',
    'layer.water':'Water mains','layer.water.sub':'Simulated along real road centrelines (WSD does not publish network geometry)',
    'layer.sewer':'Sewer network','layer.sewer.sub':'Simulated along real road centrelines (DSD does not publish network geometry)',
    'layer.sensors':'Pressure sensors','layer.sensors.sub':'Simulated IoT sensors, live readings',
    'layer.buildings':'Buildings','layer.buildings.sub':'Real footprints from OSM · density grid in full-HK view',
    'layer.roads':'Road centrelines','layer.roads.sub':'Transport Department open data (data.gov.hk, all HK)',
    'layer.bursts':'Burst hotspots','layer.bursts.sub':'Real reported incidents 2021–2026',
    'layer.boundaries':'District boundaries','layer.boundaries.sub':'OSM administrative boundaries (18 districts)',
    'kpi.total':'Simulated network length','kpi.highrisk':'High-risk segments (PRI>75)','kpi.bursts':'Real burst records','kpi.leak':'HK fresh water mains leakage',
    'kpi.highrisk.sub':'segments · priority repair','kpi.bursts.sub':'reported 2021–2026','kpi.leak.sub':'2024 (2000: >25%)',
    'sensor.normal':'Normal','sensor.caution':'Caution','sensor.alarm':'Alarm',
    'sensor.note':'Sensor readings are simulated (pressure derived from the risk model), not real instrumentation.',
    'sensor.clock':'Last update: ','sensor.m':'m head','sensor.alerting':'Low-pressure alert:',
    'filter.all':'All','filter.high':'High','filter.medium':'Medium','filter.low':'Low',
    'legend.high':'High — inspect or replace within 6 months','legend.med':'Medium — add to regular monitoring','legend.low':'Low — routine maintenance',
    'legend.high.b':'PRI > 75','legend.med.b':'50–75','legend.low.b':'< 50',
    'f.age':'age/50','f.load':'load','f.elev':'elevation','f.burst':'burst proximity',
    'map.title':'18-district underground pipe network risk map','map.sub':'Dark-mode WebGIS · red/yellow/green risk · click a pipe or sensor for details',
    'map.live':'Live risk model v3.0','map.scale':'18 districts linked','district.all':'All 18 districts',
    'alerts.title':'Real burst events',
    'metric.pop':'Population (2021 Census)','metric.pop.sum':'HK 18-district total population (2021 Census)','metric.consumption':'HK fresh water consumption 2024','metric.daily':'Daily average 2024','metric.burstcases':'HK burst cases 2000 → 2024','metric.leak_history':'Mains leakage rate 2022 → 2024','metric.dmz':'"Smart Water Grid" monitoring zones (May 2024)','metric.replaced':'Replacement of aged mains (2000–2015)',
    'empty.priority':'No segments match the current filter','empty.search':'No street matches "{q}". Try another keyword.',
    'info.default':'Click a pipe, sensor or burst hotspot on the map to view details and advice.',
    'info.street':'Street','info.type':'Network','info.len':'Length','info.age':'Est. age','info.load':'Load weight','info.elev':'Elevation weight','info.burst':'Burst proximity','info.pri':'Risk Index (PRI)','info.risk':'Risk level','info.water':'Water main','info.sewer':'Sewer',
    'info.suggest':'AI maintenance advice','info.proxy':'Proxy model: pipe age from building density (Proxy 1); load from building volume (Proxy 2); terrain from real road geometry (Proxy 3); burst proximity inversely weighted to real reported events (Proxy 4).',
    'info.src':'Source','info.district':'District','info.sensor':'Sensor','info.pressure':'Pressure','info.flow':'Flow','info.sensor_id':'Sensor ID','info.sensor_note':'Simulated sensor — pressure derived from the segment risk model',
    'suggest.high':'Critical: arrange preventive inspection or replacement within 6 months; prioritise in the repair schedule.',
    'suggest.medium':'Moderate: add to regular monitoring; re-check pressure and leakage every 12 months.',
    'suggest.low':'Low: continue routine operation and maintenance.',
    'foot.sources':'Data sources (real open data)','foot.method':'Method & proxy variables','foot.links':'Further references','foot.toggle':'Show data sources & methodology','foot.hide':'Hide data sources & methodology',
    'src.roads':'Transport Department "Road Network (2nd Gen)" — Road Centreline KML (data.gov.hk, 2026-09, 29,388 segments)',
    'src.buildings':'OpenStreetMap building footprints (ODbL, extracted 2026-09, all 18 districts)',
    'src.pop':'C&SD 2021 Population Census — HK total 7,413,070 (18 district fact sheets)',
    'src.wsd':'WSD Annual Report & Water Resource Data — leakage rate 13.4% (2024), consumption 1,059.6 Mm³',
    'src.cs':'C&SD Table 990-92072: Fresh Water Supply and Consumption (2025)',
    'src.bursts':'DEVB press releases / news media / District Council documents — 25 real burst records across 14 districts (2021–2026)',
    'method.1':'Network geometry: WSD/DSD do not publish underground pipe geometry for security reasons, so the network is simulated along real road centrelines (a core assumption of this project).',
    'method.2':'Proxy 1 Pipe age: estimated from building density within a 50 m buffer — denser fabric implies older districts and older pipes (10–55 yr).',
    'method.3':'Proxy 2 Flow load: building footprint volume inside the buffer as a demand proxy, calibrated by each district\'s real population (2021 Census).',
    'method.4':'Proxy 3 Terrain: vertical undulation of the real road centreline represents pressure variation.',
    'method.5':'Proxy 4 Burst history: 25 real reported events form the calibration set; the closer a segment is to a recent event, the higher the risk.',
    'method.6':'District attribution: roads are assigned to the 18 districts by ray-casting against OSM administrative boundaries; edge areas are approximate.',
    'method.7':'Pressure sensors are simulated IoT devices; pressure is derived inversely from the segment PRI (high risk → low pressure), refreshed every 2 s for demonstration.',
    'method.8':'City density grid: building area aggregated into 150 m cells; the full-HK view shows development density as brightness, switching to footprints when a district is selected.',
    'link.1':'HK-TAG 2025 reference dataset: practical guide to reading and using open data',
    'link.2':'DATA.GOV.HK Hong Kong government open data portal',
    'link.3':'Common Spatial Data Infrastructure (CSDI)',
    'link.4':'WSD official statistics',
    'footnote':'Disclaimer: this platform is an academic (FYP) prototype. Pipe networks on the map are simulated along real roads; risk indices and sensor readings are estimates from proxy/simulation models for teaching purposes only and do not constitute engineering decisions.',
    'lastupdate':'Data updated: road network 2026-09 · buildings 2026-09 (all 18 districts) · statistics 2024/25'
  }
};

/* ---------- data ---------- */
var APP = JSON.parse(document.getElementById('appdata').textContent);
var DATA = APP;

/* ---------- state ---------- */
var LANG = 'zh-HK';
var layers = { water:true, sewer:true, sensors:true, buildings:false, roads:true, bursts:true, boundaries:true };
var riskFilter = 'all';
var activeDistrict = 'all';
var selected = null;
var chart = null;
var sensorTimer = null;

var RISK_COLOR = { high:'#E5484D', medium:'#F5A524', low:'#2FBF71' };
var SENSOR_COLOR = { ok:'#3FD0F2', warn:'#F5A524', alert:'#E5484D' };

function t(key){
  var d = I18N[LANG] || I18N['zh-HK'];
  return d[key] !== undefined ? d[key] : key;
}
function num(n){ return n.toLocaleString('en-US'); }
function streetName(p){
  var en = p.n, cn = p.nc;
  if (LANG === 'en') return en || cn;
  return cn || en;
}
function districtName(d){
  var m = DATA.meta.districts.filter(function(x){ return x.d === d; })[0];
  if (!m) return d;
  if (LANG === 'en') return m.en;
  if (LANG === 'zh-CN') return m.zh_cn;
  return m.zh;
}
var SHORT_EN = { cw:'C&W', wc:'Wan Chai', east:'Eastern', south:'Southern', ytm:'YTM', ssp:'SSP',
  kc:'Kowloon City', wts:'WTS', kt:'Kwun Tong', tw:'Tsuen Wan', tm:'Tuen Mun', yl:'Yuen Long',
  north:'North', tp:'Tai Po', sk:'Sai Kung', st:'Sha Tin', kts:'Kwai Tsing', iso:'Islands' };
function shortDistrict(d){
  var m = DATA.meta.districts.filter(function(x){ return x.d === d; })[0];
  if (!m) return d;
  if (LANG === 'en') return SHORT_EN[d] || m.en;
  var n = LANG === 'zh-CN' ? m.zh_cn : m.zh;
  return n.replace(/區$|区$/, '');
}

/* ---------- derived data ---------- */
var W = DATA.water, S = DATA.sewer;
var allPipes = W.map(function(p){ p.kind='water'; return p; }).concat(S.map(function(p){ p.kind='sewer'; return p; }));
allPipes.forEach(function(p,i){ p._i = i; });

function pipesFor(kind){
  var src = kind === 'water' ? W : S;
  return src.filter(function(p){
    return (activeDistrict === 'all' || p.d === activeDistrict) &&
           (riskFilter === 'all' || p.risk === riskFilter);
  });
}
function burstsFor(){
  return DATA.bursts.filter(function(b){ return activeDistrict === 'all' || b.d === activeDistrict; });
}
function viewPopulation(){
  if (activeDistrict === 'all') return DATA.meta.districts.reduce(function(a,m){ return a + m.pop; }, 0);
  var m = DATA.meta.districts.filter(function(x){ return x.d === activeDistrict; })[0];
  return m ? m.pop : 0;
}

/* ---------- i18n re-render ---------- */
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.querySelectorAll('.lang-switch button').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-lang') === LANG);
  });
  document.documentElement.lang = LANG === 'en' ? 'en' : (LANG === 'zh-CN' ? 'zh-CN' : 'zh-HK');
}

/* ---------- map: base geojson (whole HK) ---------- */
var LAND_BBOX = [113.79, 22.13, 114.47, 22.59];
var DEFAULT_CENTER = [114.13, 22.36];
function buildBaseGeoJson(){
  var feats = [{
    type:'Feature', properties:{name:'land'},
    geometry:{ type:'Polygon', coordinates:[[
      [LAND_BBOX[0],LAND_BBOX[1]],[LAND_BBOX[2],LAND_BBOX[1]],
      [LAND_BBOX[2],LAND_BBOX[3]],[LAND_BBOX[0],LAND_BBOX[3]],[LAND_BBOX[0],LAND_BBOX[1]]
    ]]}
  }];
  DATA.base.coast.forEach(function(ring,i){
    var r = ring.slice();
    if(r[0][0]!==r[r.length-1][0] || r[0][1]!==r[r.length-1][1]) r.push(r[0]);
    if(r.length < 4) return;
    feats.push({ type:'Feature', properties:{name:'c'+i}, geometry:{ type:'Polygon', coordinates:[r] } });
  });
  DATA.base.water.forEach(function(w,i){
    var r = w.g.slice();
    if(r[0][0]!==r[r.length-1][0] || r[0][1]!==r[r.length-1][1]) r.push(r[0]);
    if(r.length < 4) return;
    feats.push({ type:'Feature', properties:{name:'w'+i}, geometry:{ type:'Polygon', coordinates:[r] } });
  });
  return { type:'FeatureCollection', features:feats };
}

/* ---------- chart init ---------- */
echarts.registerMap('hkg', buildBaseGeoJson());
chart = echarts.init(document.getElementById('map'), null, { renderer:'canvas' });

var geoRegions = [{ name:'land', itemStyle:{ areaColor:'#0C1422' } }];
DATA.base.coast.forEach(function(ring,i){
  geoRegions.push({ name:'c'+i, itemStyle:{ areaColor:'#0C1422' } });
});
DATA.base.water.forEach(function(w,i){
  geoRegions.push({ name:'w'+i, itemStyle:{ areaColor:'#0D2133' } });
});

var roadData = DATA.roads.map(function(r){ return { coords:r.g }; });
var burstData = DATA.bursts.map(function(b){ return { value:[b.lon,b.lat], b:b }; });
var boundaryData = [];
DATA.meta.districts.forEach(function(dm){
  dm.lines.forEach(function(l){ boundaryData.push({ coords:l, d:dm.d }); });
});
var districtLabelData = DATA.meta.districts.map(function(dm){
  return { value:[dm.center[0], dm.center[1]], d:dm.d };
});
/* grid density bins (all view) */
var GRID_STOPS = ['#13233B','#1E3A5F','#2A5AA0','#3D7BD9','#5FA8FF'];
var gridMaxA = 1;
DATA.grid.forEach(function(g){ if(g.a > gridMaxA) gridMaxA = g.a; });
function gridColor(a){
  var q = Math.pow(a / gridMaxA, 0.5);
  var pos = q * (GRID_STOPS.length - 1);
  var i = Math.min(GRID_STOPS.length - 2, Math.floor(pos));
  var f = pos - i;
  function mix(c1,c2){
    var r = Math.round(parseInt(c1.slice(1,3),16)*(1-f) + parseInt(c2.slice(1,3),16)*f);
    var g = Math.round(parseInt(c1.slice(3,5),16)*(1-f) + parseInt(c2.slice(3,5),16)*f);
    var b = Math.round(parseInt(c1.slice(5,7),16)*(1-f) + parseInt(c2.slice(5,7),16)*f);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  return mix(GRID_STOPS[i], GRID_STOPS[i+1]);
}
var gridData = DATA.grid.map(function(g){
  return { value:[g.x, g.y], symbolSize: Math.max(2, Math.min(13, Math.sqrt(g.a)/26)), itemStyle:{ color: gridColor(g.a), opacity:0.6 } };
});
var bldData = DATA.buildings.map(function(b){ return { value: b.g, d: b.d }; });
var selData = [];

/* district view (center + zoom) computed from pipes */
var districtView = {};
DATA.meta.districts.forEach(function(dm){
  var dd = dm.d, xs=[], ys=[];
  allPipes.forEach(function(p){ if(p.d!==dd) return; p.g.forEach(function(c){ xs.push(c[0]); ys.push(c[1]); }); });
  if(!xs.length) return;
  var cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
  var cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;
  var spanKm = Math.max((Math.max.apply(null,xs)-Math.min.apply(null,xs))*100000,
                        (Math.max.apply(null,ys)-Math.min.apply(null,ys))*111000);
  var zoom = spanKm < 7000 ? 2.9 : (spanKm < 11000 ? 2.5 : (spanKm < 16000 ? 2.1 : 1.8));
  districtView[dd] = { center:[cx,cy], zoom:zoom };
});

function pipeSeriesData(kind){
  return pipesFor(kind).map(function(p){
    return { coords:p.g, lineStyle:{ color:RISK_COLOR[p.risk] }, p:p };
  });
}
var waterData = pipeSeriesData('water');
var sewerData = pipeSeriesData('sewer');

/* ---------- tooltips ---------- */
function pipeTip(p){
  var hl = '<div style="font-weight:700;margin-bottom:4px">' + streetName(p) + '</div>';
  var rows = [];
  rows.push([t('info.district'), districtName(p.d)]);
  rows.push([t('info.type'), p.kind==='water'? t('info.water') : t('info.sewer')]);
  rows.push([t('info.len'), num(p.len) + ' m']);
  rows.push([t('info.age'), '~' + p.age + ' yr']);
  rows.push([t('info.load'), p.load]);
  rows.push([t('info.elev'), p.elev]);
  rows.push([t('info.burst'), p.burst]);
  rows.push([t('info.pri'), p.pri]);
  var riskL = p.risk==='high'? t('filter.high') : (p.risk==='medium'? t('filter.medium') : t('filter.low'));
  rows.push(['<b style="color:' + RISK_COLOR[p.risk] + '">' + t('info.risk') + '</b>', '<b style="color:' + RISK_COLOR[p.risk] + '">' + riskL + '</b>']);
  var html = rows.map(function(r){
    return '<div style="display:flex;justify-content:space-between;gap:16px;font-size:12px;line-height:1.7">' +
           '<span style="color:#8FA0B8">' + r[0] + '</span><span style="font-family:var(--mono)">' + r[1] + '</span></div>';
  }).join('');
  return hl + html;
}
function burstTip(b){
  var hl = '<div style="font-weight:700;margin-bottom:4px">' + (LANG==='en'? b.name_en : b.name) + ' · ' + b.date + '</div>';
  var desc = LANG==='en' ? (b.desc_en||b.desc) : b.desc;
  return hl + '<div style="font-size:12px;color:#8FA0B8;max-width:300px;line-height:1.6">' + desc + '</div>';
}
function sensorTip(s){
  var hl = '<div style="font-weight:700;margin-bottom:4px">' + t('info.sensor') + ' ' + s.id + ' · ' + streetName(s) + '</div>';
  var rows = [
    [t('info.district'), districtName(s.d)],
    [t('info.pressure'), s.v.toFixed(1) + ' m'],
    [t('info.flow'), s.flow.toFixed(0) + ' L/s'],
    [t('info.risk'), '<b style="color:' + SENSOR_COLOR[s.status] + '">' + sensorStatusLabel(s.status) + '</b>']
  ];
  return hl + rows.map(function(r){
    return '<div style="display:flex;justify-content:space-between;gap:16px;font-size:12px;line-height:1.7">' +
           '<span style="color:#8FA0B8">' + r[0] + '</span><span>' + r[1] + '</span></div>';
  }).join('') + '<div style="font-size:10.5px;color:#5F7190;margin-top:4px">' + t('info.sensor_note') + '</div>';
}

/* ---------- sensors (simulated, per district) ---------- */
var sensors = [];
var SENSOR_TARGET = { cw:4, wc:3, east:9, south:4, ytm:5, ssp:7, kc:7, wts:7, kt:11,
                      tw:5, tm:8, yl:11, north:5, tp:5, sk:8, st:12, kts:8, iso:3 };
(function genSensors(){
  var seed = 20260907;
  function rnd(){ seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  Object.keys(SENSOR_TARGET).forEach(function(dd){
    var pool = W.filter(function(p){ return p.d === dd && p.len > 80; });
    var n = SENSOR_TARGET[dd];
    for(var i=0; i<n && pool.length; i++){
      var p = pool[Math.floor(rnd()*pool.length)];
      var g = p.g, mid = g[Math.floor(g.length/2)] || g[0];
      sensors.push({
        id: 'S-' + String(sensors.length + 1).padStart(2,'0'),
        d: dd, n: p.n, nc: p.nc,
        lon: mid[0], lat: mid[1], pri: p.pri,
        phase: rnd()*6.28, base: 58 - 22*(p.pri/100),
        v: 0, flow: 0, status: 'ok'
      });
    }
  });
})();

/* ---------- series ---------- */
function buildingsFor(){
  if(activeDistrict === 'all') return [];
  var list = bldData.filter(function(b){ return b.d === activeDistrict; });
  return list.slice(0, 6000);
}
function seriesOption(){
  var showBoundary = layers.boundaries;
  var labelData = showBoundary ? (activeDistrict === 'all' ? districtLabelData : districtLabelData.filter(function(d){ return d.d === activeDistrict; })) : [];
  return [
    { name:'boundaries', type:'lines', coordinateSystem:'geo', silent:true, polyline:true, z:1,
      lineStyle:{ color:'#3A4E6E', width: activeDistrict==='all' ? 1.1 : 0.6, opacity: activeDistrict==='all' ? 0.9 : 0.35 },
      data: showBoundary ? boundaryData : [] },
    { name:'dlabels', type:'scatter', coordinateSystem:'geo', silent:true, z:3,
      symbol:'circle', symbolSize: activeDistrict==='all' ? 5 : 8,
      itemStyle:{ color:'#5F7190', opacity:0.9 },
      label:{ show:true, position:'top', distance:4, color:'#8FA4C8', fontSize:12, fontWeight:700,
              formatter:function(p){ return districtName(p.data.d); } },
      labelLayout:{ hideOverlap:true },
      data: labelData },
    { name:'roads', type:'lines', coordinateSystem:'geo', silent:true, polyline:true, z:1, animation:false,
      lineStyle:{ color:'#2A3A5C', width:1, opacity:0.85 },
      data: layers.roads ? roadData : [] },
    { name:'grid', type:'scatter', coordinateSystem:'geo', silent:true, z:2, animation:false,
      data: (layers.buildings && activeDistrict === 'all') ? gridData : [] },
    { name:'buildings', type:'custom', coordinateSystem:'geo', silent:true, z:2,
      data: (layers.buildings && activeDistrict !== 'all') ? buildingsFor() : [],
      renderItem: function(params, api){
        var ring = api.value(0); if(!ring) return null;
        var d='';
        for(var i=0;i<ring.length;i++){
          var pt = api.coord([ring[i][0], ring[i][1]]);
          d += (i===0?'M':'L') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1);
        }
        d += 'Z';
        return { type:'path', shape:{ pathData:d }, style:{ fill:'#182740', stroke:'#1E3050', lineWidth:0.35 }, silent:true };
      } },
    { name:'water', type:'lines', coordinateSystem:'geo', polyline:true, z:6, cursor:'pointer', animation:false,
      lineStyle:{ width:3.2, opacity:0.95, cap:'round', join:'round' },
      emphasis:{ lineStyle:{ width:7, opacity:1 } },
      data: layers.water ? waterData : [],
      tooltip:{ formatter:function(params){ return params.data && params.data.p ? pipeTip(params.data.p) : ''; } } },
    { name:'sewer', type:'lines', coordinateSystem:'geo', polyline:true, z:5, cursor:'pointer', animation:false,
      lineStyle:{ width:2, opacity:0.75, type:'dashed' },
      emphasis:{ lineStyle:{ width:4.5, opacity:1 } },
      data: layers.sewer ? sewerData : [],
      tooltip:{ formatter:function(params){ return params.data && params.data.p ? pipeTip(params.data.p) : ''; } } },
    { name:'sensors', type:'scatter', coordinateSystem:'geo', z:9, cursor:'pointer',
      symbolSize:8, symbol:'circle',
      data: layers.sensors ? sensorScatterData() : [],
      tooltip:{ formatter:function(params){ return params.data && params.data.s ? sensorTip(params.data.s) : ''; } } },
    { name:'sensorAlarm', type:'effectScatter', coordinateSystem:'geo', z:11, cursor:'pointer',
      symbolSize:13, rippleEffect:{ brushType:'stroke', scale:2.8, period:2.4 },
      data: layers.sensors ? sensorAlarmData() : [],
      tooltip:{ show:false } },
    { name:'bursts', type:'effectScatter', coordinateSystem:'geo', z:10, cursor:'pointer',
      symbolSize:11, rippleEffect:{ brushType:'stroke', scale:3, period:3.2 },
      itemStyle:{ color:'#E5484D' },
      label:{ show:false },
      emphasis:{ scale:1.5 },
      data: layers.bursts ? burstData : [],
      tooltip:{ formatter:function(params){ return params.data && params.data.b ? burstTip(params.data.b) : ''; } } },
    { name:'sel', type:'lines', coordinateSystem:'geo', polyline:true, z:12, silent:true,
      lineStyle:{ color:'#FFFFFF', width:5, opacity:0.9, cap:'round' },
      data: selData }
  ];
}

chart.setOption({
  backgroundColor:'transparent',
  animationDuration: 300,
  tooltip:{ trigger:'item', confine:true, backgroundColor:'#0E1626', borderColor:'#2A3A5C',
            borderWidth:1, padding:10, textStyle:{ color:'#E6EDF7', fontSize:12 } },
  geo:{ map:'hkg', roam:true, layoutCenter:['50%','52%'], layoutSize:'97%',
        itemStyle:{ areaColor:'#0B1A2A', borderColor:'#16233C', borderWidth:0.6 },
        emphasis:{ itemStyle:{ areaColor:'#0D1526' }, label:{ show:false } },
        label:{ show:false },
        regions: geoRegions,
        scaleLimit:{ min:0.4, max:18 } },
  series: seriesOption()
});
new ResizeObserver(function(){ chart.resize(); }).observe(document.getElementById('map'));

function sensorStatusLabel(st){
  return st==='alert' ? t('sensor.alarm') : (st==='warn' ? t('sensor.caution') : t('sensor.normal'));
}
function sensorScatterData(){
  return sensors.map(function(s){
    return { value:[s.lon, s.lat], s:s,
             itemStyle:{ color: SENSOR_COLOR[s.status] } };
  });
}
function sensorAlarmData(){
  return sensors.filter(function(s){ return s.status === 'alert'; })
                .map(function(s){ return { value:[s.lon, s.lat], s:s, itemStyle:{ color:'#E5484D' } }; });
}
function tickSensors(){
  var ts = Date.now() / 1000;
  sensors.forEach(function(s){
    var wave = 3.2 * Math.sin(ts / 7 + s.phase) + 1.6 * Math.sin(ts / 23 + s.phase * 2);
    var noise = (Math.sin(ts * 3.7 + s.phase * 11) * 0.8);
    s.v = Math.max(24, Math.min(64, s.base + wave + noise));
    s.flow = Math.max(12, Math.min(120, 45 + 38 * (s.pri/100) + 8 * Math.sin(ts/11 + s.phase)));
    s.status = s.v < 42 ? 'alert' : (s.v < 46.5 ? 'warn' : 'ok');
  });
  chart.setOption({ series:[
    { name:'sensors', data: layers.sensors ? sensorScatterData() : [] },
    { name:'sensorAlarm', data: layers.sensors ? sensorAlarmData() : [] }
  ]});
  renderSensorPanel();
}
function renderSensorPanel(){
  var ok=0, warn=0, alert=0;
  sensors.forEach(function(s){ if(s.status==='ok') ok++; else if(s.status==='warn') warn++; else alert++; });
  document.getElementById('sOk').textContent = ok;
  document.getElementById('sWarn').textContent = warn;
  document.getElementById('sAlarm').textContent = alert;
  var sorted = sensors.slice().sort(function(a,b){ return (a.status==='alert'?-2:a.status==='warn'?-1:0) - (b.status==='alert'?-2:b.status==='warn'?-1:0) || a.v - b.v; });
  var top = sorted.slice(0, 6);
  var now = new Date();
  var hh = String(now.getHours()).padStart(2,'0'), mm = String(now.getMinutes()).padStart(2,'0'), ss = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('sClock').textContent = t('sensor.clock') + hh + ':' + mm + ':' + ss;
  var el = document.getElementById('slist');
  el.innerHTML = top.map(function(s){
    var pct = Math.max(6, Math.min(100, (s.v / 64) * 100));
    return '<div class="srow" data-id="' + s.id + '">' +
      '<span class="sid">' + s.id + '</span>' +
      '<span class="sname">' + streetName(s) + '</span>' +
      '<span class="sval" style="color:' + SENSOR_COLOR[s.status] + '">' + s.v.toFixed(1) + ' m</span>' +
      '<span class="sbar"><i style="width:' + pct.toFixed(0) + '%;background:' + SENSOR_COLOR[s.status] + '"></i></span>' +
      '<span class="sstat ' + s.status + '">' + sensorStatusLabel(s.status) + '</span>' +
      '</div>';
  }).join('');
  el.querySelectorAll('.srow').forEach(function(row){
    row.addEventListener('click', function(){
      var s = sensors.filter(function(x){ return x.id === row.getAttribute('data-id'); })[0];
      if(s) zoomToSensor(s);
    });
  });
}

/* ---------- selection overlay + info panel ---------- */
var infoPanel = document.getElementById('infoPanel');
var ipTitle = document.getElementById('ipTitle');
var ipBody = document.getElementById('ipBody');

function setSel(p){
  selData = p ? [{ coords:p.g }] : [];
  chart.setOption({ series:[{ name:'sel', data: selData }] });
}
function hideInfo(){
  selected = null;
  infoPanel.hidden = true;
  setSel(null);
}
function showPipeInfo(p){
  selected = p;
  setSel(p);
  ipTitle.innerHTML = streetName(p) + '<small>' + t('info.district') + '：' + districtName(p.d) + ' · ' + t('info.type') + '：' + (p.kind==='water'? t('info.water') : t('info.sewer')) + ' · ' + num(p.len) + ' m</small>';
  var riskL = p.risk==='high'? t('filter.high') : (p.risk==='medium'? t('filter.medium') : t('filter.low'));
  var badge = '<span class="ip-badge ' + p.risk + '" style="color:' + RISK_COLOR[p.risk] + ';border:1px solid ' + RISK_COLOR[p.risk] + '44">' + riskL + '</span>';
  ipBody.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">' +
      '<div class="ip-grid" style="flex:1">' +
        '<div class="ip-item"><div class="il">' + t('info.street') + '</div><div class="iv">' + (p.nc || p.n || '—') + '</div></div>' +
        '<div class="ip-item"><div class="il">' + t('info.pri') + '</div><div class="iv" style="color:' + RISK_COLOR[p.risk] + '">' + p.pri + '</div></div>' +
        '<div class="ip-item"><div class="il">' + t('info.age') + '</div><div class="iv">~' + p.age + ' yr</div></div>' +
        '<div class="ip-item"><div class="il">' + t('info.load') + '</div><div class="iv">' + p.load + '</div></div>' +
        '<div class="ip-item"><div class="il">' + t('info.elev') + '</div><div class="iv">' + p.elev + '</div></div>' +
        '<div class="ip-item"><div class="il">' + t('info.burst') + '</div><div class="iv">' + p.burst + '</div></div>' +
      '</div>' + badge +
    '</div>' +
    '<div class="ip-suggest"><b>' + t('info.suggest') + '</b><br>' + t('suggest.' + p.risk) + '</div>' +
    '<div class="ip-proxy">' + t('info.proxy') + '</div>';
  infoPanel.hidden = false;
}
function showBurstInfo(b){
  selected = b;
  setSel(null);
  var name = LANG==='en' ? b.name_en : b.name;
  ipTitle.innerHTML = name + '<small>' + t('info.district') + '：' + districtName(b.d) + ' · ' + b.date + '</small>';
  var desc = LANG==='en' ? (b.desc_en||b.desc) : b.desc;
  ipBody.innerHTML =
    '<div style="font-size:12.5px;color:var(--tx2);line-height:1.7;margin-bottom:10px">' + desc + '</div>' +
    '<div class="ip-source"><b style="color:var(--tx3)">' + t('info.src') + '</b><br><a href="' + b.src + '" target="_blank" rel="noopener">' + b.src + '</a></div>';
  infoPanel.hidden = false;
}
function showSensorInfo(s){
  selected = s;
  setSel(null);
  ipTitle.innerHTML = t('info.sensor') + ' ' + s.id + '<small>' + t('info.district') + '：' + districtName(s.d) + ' · ' + streetName(s) + '</small>';
  ipBody.innerHTML =
    '<div class="ip-grid" style="margin-bottom:10px">' +
      '<div class="ip-item"><div class="il">' + t('info.pressure') + '</div><div class="iv" style="color:' + SENSOR_COLOR[s.status] + '">' + s.v.toFixed(1) + ' m</div></div>' +
      '<div class="ip-item"><div class="il">' + t('info.flow') + '</div><div class="iv">' + s.flow.toFixed(0) + ' L/s</div></div>' +
      '<div class="ip-item"><div class="il">' + t('info.pri') + '</div><div class="iv">' + s.pri + '</div></div>' +
      '<div class="ip-item"><div class="il">' + t('info.risk') + '</div><div class="iv" style="color:' + SENSOR_COLOR[s.status] + '">' + sensorStatusLabel(s.status) + '</div></div>' +
    '</div>' +
    '<div class="ip-suggest"><b>' + t('info.sensor') + '</b><br>' + t('info.sensor_note') + '</div>';
  infoPanel.hidden = false;
}
document.getElementById('ipClose').addEventListener('click', hideInfo);
chart.on('click', function(params){
  if(params.componentType === 'geo'){ hideInfo(); return; }
  if(params.seriesName === 'sensors' && params.data && params.data.s) showSensorInfo(params.data.s);
  else if(params.seriesName === 'sensorAlarm' && params.data && params.data.s) showSensorInfo(params.data.s);
  else if(params.seriesType === 'lines' && params.data && params.data.p) showPipeInfo(params.data.p);
  else if(params.seriesType === 'effectScatter' && params.data && params.data.b) showBurstInfo(params.data.b);
});

/* ---------- zoom helpers ---------- */
function zoomTo(lon, lat, zoom){
  chart.setOption({ geo:{ center:[lon, lat], zoom: zoom || 6 } });
}
function zoomToPipe(p){
  var xs=p.g.map(function(c){return c[0];}), ys=p.g.map(function(c){return c[1];});
  zoomTo((Math.min.apply(null,xs)+Math.max.apply(null,xs))/2,
         (Math.min.apply(null,ys)+Math.max.apply(null,ys))/2, 7);
  showPipeInfo(p);
}
function zoomToBurst(b){
  zoomTo(b.lon, b.lat, 8);
  showBurstInfo(b);
}
function zoomToSensor(s){
  zoomTo(s.lon, s.lat, 9);
  showSensorInfo(s);
}
function zoomDistrict(dd){
  if(dd === 'all'){
    chart.setOption({ geo:{ center:DEFAULT_CENTER, zoom:1 } });
  } else if(districtView[dd]){
    chart.setOption({ geo:{ center:districtView[dd].center, zoom:districtView[dd].zoom } });
  }
}
function zoomBy(f){
  var g = chart.getOption().geo[0];
  var z = Math.min(18, Math.max(0.4, (g.zoom || 1) * f));
  chart.setOption({ geo:{ zoom:z } });
}
document.getElementById('zIn').addEventListener('click', function(){ zoomBy(1.45); });
document.getElementById('zOut').addEventListener('click', function(){ zoomBy(1/1.45); });
document.getElementById('zFit').addEventListener('click', function(){ zoomDistrict('all'); });

/* ---------- district chips ---------- */
function renderDistrictChips(){
  var el = document.getElementById('distChips');
  var html = '<div class="dchips">' +
    '<button class="dchip ' + (activeDistrict==='all'?'active':'') + '" data-d="all">' + t('district.all') + '</button>';
  DATA.meta.districts.forEach(function(dm){
    html += '<button class="dchip ' + (activeDistrict===dm.d?'active':'') + '" data-d="' + dm.d + '">' + shortDistrict(dm.d) + '</button>';
  });
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll('.dchip').forEach(function(chip){
    chip.addEventListener('click', function(){
      activeDistrict = chip.getAttribute('data-d');
      refreshView();
    });
  });
  if(activeDistrict !== 'all'){
    var activeChip = el.querySelector('.dchip.active');
    if(activeChip) activeChip.scrollIntoView({ block:'nearest', inline:'center' });
  }
}

/* ---------- view refresh (district / risk filter change) ---------- */
function refreshView(){
  waterData = pipeSeriesData('water');
  sewerData = pipeSeriesData('sewer');
  chart.setOption({ series: seriesOption() });
  renderDistrictChips();
  renderKpis();
  renderMetrics();
  renderPriority();
  renderAlerts();
  zoomDistrict(activeDistrict);
}

/* ---------- UI: KPI / metrics / priority / alerts / footer ---------- */
function renderKpis(){
  var wv = pipesFor('water'), sv = pipesFor('sewer');
  var totalKm = (wv.reduce(function(a,p){return a+p.len;},0) + sv.reduce(function(a,p){return a+p.len;},0)) / 1000;
  var hw = wv.filter(function(p){return p.risk==='high';}).length;
  var hs = sv.filter(function(p){return p.risk==='high';}).length;
  var bv = burstsFor();
  document.getElementById('kpiDistrict').textContent = activeDistrict==='all' ? t('district.all') : districtName(activeDistrict);
  document.getElementById('kTotal').textContent = totalKm.toFixed(1) + ' km';
  document.getElementById('kTotalSub').textContent = t('info.water') + ' ' + (wv.reduce(function(a,p){return a+p.len;},0)/1000).toFixed(1) + ' + ' + t('info.sewer') + ' ' + (sv.reduce(function(a,p){return a+p.len;},0)/1000).toFixed(1) + ' km';
  document.getElementById('kHigh').textContent = num(hw + hs);
  document.getElementById('kHighSub').textContent = t('kpi.highrisk.sub') + '（' + t('info.water') + ' ' + hw + ' · ' + t('info.sewer') + ' ' + hs + '）';
  document.getElementById('kBursts').textContent = bv.length;
  document.getElementById('kBurstsSub').textContent = t('kpi.bursts.sub');
  document.getElementById('kLeak').textContent = '13.4%';
  document.getElementById('kLeakSub').textContent = t('kpi.leak.sub');
}
function renderMetrics(){
  var pop = viewPopulation();
  var en = LANG === 'en';
  var rows;
  if(en){
    rows = [
      [ activeDistrict==='all' ? t('metric.pop.sum') : t('metric.pop') + ' · ' + shortDistrict(activeDistrict), num(pop) ],
      [ t('metric.consumption'), '1,059.6 Mm³' ],
      [ t('metric.daily'), '2.89 Mm³' ],
      [ t('metric.burstcases'), '~2,500 → 27' ],
      [ t('metric.leak_history'), '14.4% → 13.4%' ],
      [ t('metric.dmz'), '~2,400' ],
      [ t('metric.replaced'), '~3,000 km' ]
    ];
  } else {
    var zh = LANG === 'zh-CN';
    rows = [
      [ activeDistrict==='all' ? t('metric.pop.sum') : t('metric.pop') + ' · ' + shortDistrict(activeDistrict), num(pop) ],
      [ t('metric.consumption'), '1,059.6 百萬 m³' ],
      [ t('metric.daily'), '2.89 百萬 m³' ],
      [ t('metric.burstcases'), '~2,500 → 27' ],
      [ t('metric.leak_history'), '14.4% → 13.4%' ],
      [ t('metric.dmz'), zh ? '~2,400 个' : '~2,400 個' ],
      [ t('metric.replaced'), '~3,000 km' ]
    ];
  }
  document.getElementById('metrics').innerHTML = rows.map(function(r){
    return '<div class="mrow"><span class="ml">' + r[0] + '</span><span class="mv">' + r[1] + '</span></div>';
  }).join('');
}
var searchQuery = '';
function matchPipe(p, q){
  q = q.toLowerCase();
  return (p.n && p.n.toLowerCase().indexOf(q) >= 0) || (p.nc && p.nc.indexOf(q) >= 0);
}
function renderPriority(){
  var base = allPipes.filter(function(p){
    return (activeDistrict === 'all' || p.d === activeDistrict) && (riskFilter === 'all' || p.risk === riskFilter);
  });
  if(searchQuery){ base = base.filter(function(p){ return matchPipe(p, searchQuery); }); }
  base.sort(function(a,b){ return b.pri - a.pri; });
  var list = base.slice(0, 12);
  var el = document.getElementById('plist');
  if(!list.length){
    el.innerHTML = '<div class="empty-note">' + (searchQuery ? t('empty.search').replace('{q}', searchQuery) : t('empty.priority')) + '</div>';
    return;
  }
  el.innerHTML = list.map(function(p){
    return '<div class="prow" data-idx="' + p._i + '">' +
      '<span class="dot ' + p.risk + '"></span>' +
      '<span class="pname">' + streetName(p) + '<small>' + shortDistrict(p.d) + ' · ' + (p.kind==='water'? t('info.water') : t('info.sewer')) + ' · ' + num(p.len) + ' m · ~' + p.age + ' yr</small></span>' +
      '<span class="pri ' + p.risk + '">' + p.pri + '</span>' +
      '<span class="pbar"><i style="width:' + p.pri + '%;background:' + RISK_COLOR[p.risk] + '"></i></span>' +
      '</div>';
  }).join('');
  el.querySelectorAll('.prow').forEach(function(row){
    row.addEventListener('click', function(){
      var p = allPipes[+row.getAttribute('data-idx')];
      zoomToPipe(p);
    });
  });
}
function renderAlerts(){
  var el = document.getElementById('alerts');
  var list = DATA.bursts.slice().sort(function(a,b){ return a.date < b.date ? 1 : -1; });
  el.innerHTML = list.map(function(b){
    var show = activeDistrict === 'all' || b.d === activeDistrict;
    return '<span class="aburst" data-name="' + b.name_en + '" style="' + (show?'':'display:none') + '"><span class="ad">' + shortDistrict(b.d) + '</span><b>' + b.date + '</b>' + (LANG==='en'? b.name_en : b.name) + '</span>';
  }).join('');
  el.querySelectorAll('.aburst').forEach(function(chip){
    chip.addEventListener('click', function(){
      var b = DATA.bursts.filter(function(x){ return x.name_en === chip.getAttribute('data-name'); })[0];
      if(!b) return;
      if(activeDistrict !== 'all' && activeDistrict !== b.d){
        activeDistrict = b.d;
        refreshView();
      }
      zoomToBurst(b);
    });
  });
}
function renderFooter(){
  var links = [
    [ 'src.roads', 'https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2' ],
    [ 'src.buildings', 'https://www.openstreetmap.org/' ],
    [ 'src.pop', 'https://www.census2021.gov.hk/en/index.html' ],
    [ 'src.wsd', 'https://data.gov.hk/en-data/dataset/hk-wsd-wsd5-water-consumption' ],
    [ 'src.cs', 'https://www.censtatd.gov.hk/en/web_table.html' ],
    [ 'src.bursts', 'https://www.devb.gov.hk/en/publications_and_press_releases/press/index.html' ]
  ];
  document.getElementById('srcList').innerHTML = links.map(function(l){
    return '<li><b>' + t(l[0]) + '</b><br><a href="' + l[1] + '" target="_blank" rel="noopener">' + l[1].replace('https://','') + '</a></li>';
  }).join('');
  document.getElementById('methodList').innerHTML = [1,2,3,4,5,6,7,8].map(function(i){
    return '<li>' + t('method.' + i) + '</li>';
  }).join('');
  var refs = [
    [ 'link.1', 'https://events.hk-tag.org/reference-dataset-2025tc/' ],
    [ 'link.2', 'https://data.gov.hk/' ],
    [ 'link.3', 'https://portal.csdi.gov.hk/' ],
    [ 'link.4', 'https://www.wsd.gov.hk/' ]
  ];
  document.getElementById('linkList').innerHTML = refs.map(function(l){
    return '<li><a href="' + l[1] + '" target="_blank" rel="noopener">' + t(l[0]) + '</a></li>';
  }).join('');
  document.getElementById('footNote').innerHTML = t('footnote') + '<br><span style="opacity:.7">' + t('lastupdate') + '</span>';
}

/* ---------- interactions ---------- */
document.querySelectorAll('#layers input').forEach(function(cb){
  cb.addEventListener('change', function(){
    layers[cb.getAttribute('data-layer')] = cb.checked;
    chart.setOption({ series: seriesOption() });
  });
});
document.querySelectorAll('#riskChips .chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    document.querySelectorAll('#riskChips .chip').forEach(function(c){ c.classList.remove('active'); });
    chip.classList.add('active');
    riskFilter = chip.getAttribute('data-r');
    waterData = pipeSeriesData('water');
    sewerData = pipeSeriesData('sewer');
    chart.setOption({ series: seriesOption() });
    renderPriority();
  });
});
document.getElementById('search').addEventListener('input', function(){
  searchQuery = this.value.trim();
  renderPriority();
  if(searchQuery){
    var pool = activeDistrict === 'all' ? allPipes : allPipes.filter(function(p){ return p.d === activeDistrict; });
    var hits = pool.filter(function(p){ return matchPipe(p, searchQuery); })
                   .sort(function(a,b){ return b.pri - a.pri; });
    if(hits.length) zoomToPipe(hits[0]);
  }
});
document.querySelectorAll('.lang-switch button').forEach(function(btn){
  btn.addEventListener('click', function(){
    LANG = btn.getAttribute('data-lang');
    applyI18n();
    renderKpis(); renderMetrics(); renderPriority(); renderAlerts(); renderFooter(); renderSensorPanel(); renderDistrictChips();
    chart.setOption({ series:[
      { name:'water', tooltip:{ formatter:function(params){ return params.data && params.data.p ? pipeTip(params.data.p) : ''; } } },
      { name:'sewer', tooltip:{ formatter:function(params){ return params.data && params.data.p ? pipeTip(params.data.p) : ''; } } },
      { name:'bursts', tooltip:{ formatter:function(params){ return params.data && params.data.b ? burstTip(params.data.b) : ''; } } },
      { name:'sensors', tooltip:{ formatter:function(params){ return params.data && params.data.s ? sensorTip(params.data.s) : ''; } } },
      { name:'dlabels', label:{ formatter:function(p){ return districtName(p.data.d); } } }
    ]});
    if(selected){
      if(selected.kind) showPipeInfo(selected);
      else if(selected.lon !== undefined && selected.src === undefined) showSensorInfo(selected);
      else if(selected.src) showBurstInfo(selected);
    }
  });
});
document.getElementById('tiltBtn').addEventListener('click', function(){
  var wrap = document.getElementById('mapWrap');
  var on = wrap.classList.toggle('tilt');
  this.classList.toggle('active', on);
  this.setAttribute('aria-pressed', on);
});
var footer = document.getElementById('footer');
var footBtn = document.getElementById('footToggle');
footBtn.addEventListener('click', function(){
  var open = footer.classList.toggle('open');
  footBtn.classList.toggle('open', open);
  footBtn.querySelector('span').textContent = open ? t('foot.hide') : t('foot.toggle');
});

/* ---------- boot ---------- */
renderDistrictChips();
renderKpis(); renderMetrics(); renderPriority(); renderAlerts(); renderFooter();
tickSensors();
sensorTimer = setInterval(tickSensors, 2000);
applyI18n();
