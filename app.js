(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const APP_LOCALES = ['zh-CN', 'en'];
  const catalogs = window.CLARITY_LOCALES || {};
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : '';
  let locale = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'zh-CN';
  if (!catalogs[locale]) locale = 'zh-CN';
  const t = (key, values = {}) => {
    const template = catalogs[locale]?.[key] ?? catalogs['zh-CN']?.[key] ?? key;
    if (template && typeof template === 'object') return template;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
  };
  const formatCount = (value) => new Intl.NumberFormat(locale).format(value);
  const formatDate = (date) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  const formatMonth = (value) => {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(new Date(year, month - 1, 1));
  };
  const formatAxisMonth = (value) => {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(year, month - 1, 1));
  };
  function applyLocale() {
    if (document.documentElement) document.documentElement.lang = locale;
    if (document.title !== undefined) document.title = t('documentTitle');
    const description = $('meta[name="description"]');
    if (description) description.content = t('metaDescription');
    if (document.querySelectorAll) {
      document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
      document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
      document.querySelectorAll('[data-i18n-content]').forEach((node) => { node.setAttribute('content', t(node.dataset.i18nContent)); });
      document.querySelectorAll('[data-i18n-href]').forEach((node) => { node.setAttribute('href', t(node.dataset.i18nHref)); });
    }
    const selector = $('#language-switch');
    if (selector) selector.value = locale;
  }
  const fields = [
    ['date', 'fieldDate', 'aliasDate'],
    ['orderId', 'fieldOrderId', 'aliasOrderId'],
    ['product', 'fieldProduct', 'aliasProduct'],
    ['customer', 'fieldCustomer', 'aliasCustomer'],
    ['quantity', 'fieldQuantity', 'aliasQuantity'],
    ['revenue', 'fieldRevenue', 'aliasRevenue'],
    ['cost', 'fieldCost', 'aliasCost'],
    ['profit', 'fieldProfit', 'aliasProfit']
  ];
  const demoRows = [
    ['2025-01-04','CB-250104-01','手冲咖啡豆','林女士',2,196,92],
    ['2025-01-12','CB-250112-02','陶瓷滤杯','周先生',1,128,54],
    ['2025-01-21','CB-250121-03','手冲咖啡豆','陈女士',3,294,138],
    ['2025-02-03','CB-250203-04','分享壶','林女士',1,168,76],
    ['2025-02-14','CB-250214-05','手冲咖啡豆','赵先生',2,196,92],
    ['2025-02-26','CB-250226-06','陶瓷滤杯','陈女士',2,256,108],
    ['2025-03-05','CB-250305-07','手冲咖啡豆','周先生',4,392,184],
    ['2025-03-19','CB-250319-08','分享壶','孙女士',1,168,76],
    ['2025-03-27','CB-250327-09','手冲咖啡豆','林女士',2,196,92],
    ['2025-04-02','CB-250402-10','滤纸套装','赵先生',3,75,33],
    ['2025-04-18','CB-250418-11','手冲咖啡豆','陈女士',3,294,138],
    ['2025-04-29','CB-250429-12','陶瓷滤杯','周先生',1,128,54],
    ['2025-05-08','CB-250508-13','手冲咖啡豆','孙女士',5,490,230],
    ['2025-05-17','CB-250517-14','分享壶','林女士',1,168,76],
    ['2025-05-25','CB-250525-15','滤纸套装','陈女士',4,100,44],
    ['2025-06-06','CB-250606-16','手冲咖啡豆','赵先生',3,294,138],
    ['2025-06-17','CB-250617-17','陶瓷滤杯','孙女士',2,256,108],
    ['2025-06-24','CB-250624-18','分享壶','周先生',2,336,152],
    ['2025-06-27','CB-250627-19','手冲咖啡豆','林女士',8,784,368],
    ['2025-06-29','CB-250629-20','陶瓷滤杯','陈女士',1,128,54]
  ];
  const state = { headers: [], rawRows: [], mapping: {}, records: [], sourceName: '', pendingName: '', skipped: 0, isDemo: true };

  const money = (value, digits = 0) => value == null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  const compactMoney = (value) => {
    if (value == null || !Number.isFinite(value)) return '—';
    const unit = locale === 'zh-CN' ? 10000 : 1000;
    if (Math.abs(value) >= 10000) return `${money(value / unit, 1)}${t('compactUnit')}`;
    return money(value);
  };
  const percent = (value) => value == null || !Number.isFinite(value) ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const normalized = (value) => String(value ?? '').trim().toLocaleLowerCase().replace(/[\s_\-（）()]/g, '');
  const safeCSV = (value) => {
    const s = String(value ?? '');
    const protectedValue = /^[\s]*[=+@\-]/.test(s) ? `'${s}` : s;
    return `"${protectedValue.replace(/"/g, '""')}"`;
  };

  function showMessage(message, isError = true) {
    const box = $('#status-message');
    box.textContent = message;
    box.hidden = false;
    box.style.background = isError ? '#fff5f3' : '#f0faf5';
    box.style.borderColor = isError ? '#fae3df' : '#dcefe5';
    box.style.color = isError ? '#a65e58' : '#4c8d6f';
  }
  function clearMessage() { $('#status-message').hidden = true; }
  function toast(message) {
    const box = $('#toast'); box.textContent = message; box.classList.add('show');
    window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => box.classList.remove('show'), 2400);
  }
  function parseCSV(text) {
    const source = text.replace(/^\uFEFF/, '');
    const firstLine = source.split(/\r?\n/, 1)[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t' : ',';
    const rows = []; let row = []; let cell = ''; let quoted = false;
    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      if (quoted) {
        if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"' && cell.length === 0) quoted = true;
      else if (char === delimiter) { row.push(cell); cell = ''; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && source[i + 1] === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some((part) => part.trim() !== '')) rows.push(row);
        row = [];
      } else cell += char;
    }
    row.push(cell); if (row.some((part) => part.trim() !== '')) rows.push(row);
    return rows;
  }
  function rowsFromMatrix(matrix) {
    const clean = matrix.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''));
    if (clean.length < 2) throw new Error(t('errorNeedHeaderAndRow'));
    const headers = clean[0].map((value, i) => String(value ?? '').trim() || `${t('unnamedColumn')} ${i + 1}`);
    const rawRows = clean.slice(1).map((row) => headers.map((_, i) => row?.[i] ?? ''));
    if (rawRows.length > 200000) throw new Error(t('errorTooManyRows'));
    return { headers, rawRows };
  }
  function suggestMapping(headers) {
    const result = {};
    fields.forEach(([key, , aliasesKey]) => {
      const aliases = t(aliasesKey);
      const index = headers.findIndex((header) => {
        const h = normalized(header);
        return aliases.some((alias) => h === normalized(alias) || (normalized(alias).length >= 3 && h.includes(normalized(alias))));
      });
      result[key] = index >= 0 ? String(index) : '';
    });
    return result;
  }
  function renderMapping() {
    const grid = $('#mapping-grid'); grid.replaceChildren();
    fields.forEach(([key, labelKey]) => {
      const wrap = document.createElement('div'); wrap.className = 'mapping-field';
      const lab = document.createElement('label'); lab.htmlFor = `map-${key}`; lab.textContent = t(labelKey);
      const select = document.createElement('select'); select.id = `map-${key}`;
      const none = document.createElement('option'); none.value = ''; none.textContent = t('mappingNone'); select.append(none);
      state.headers.forEach((header, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = header; select.append(option); });
      select.value = state.mapping[key] ?? ''; select.addEventListener('change', () => { state.mapping[key] = select.value; });
      wrap.append(lab, select); grid.append(wrap);
    });
    $('#mapping-summary').textContent = t('mappingSummary', { count: formatCount(state.rawRows.length) });
    $('#mapping-panel').hidden = false; $('#mapping-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function parseNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    let s = String(value ?? '').trim(); if (!s) return null;
    const negative = /^\(.*\)$/.test(s); s = s.replace(/[()]/g, '').replace(/[¥￥$€£,，\s]/g, '').replace(/元$/, '');
    const n = Number(s); return Number.isFinite(n) ? (negative ? -Math.abs(n) : n) : null;
  }
  function parseDate(value) {
    if (value instanceof Date && !Number.isNaN(value.valueOf())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (typeof value === 'number' && value > 10000 && value < 100000) {
      const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
    const s = String(value ?? '').trim(); if (!s) return null;
    const normalizedDate = s.replace(/[年./]/g, '-').replace(/月/g, '-').replace(/日/g, '').replace(/\s.*/, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const match = normalizedDate.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    let date;
    if (match) date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] || 1));
    else date = new Date(s);
    return Number.isNaN(date.valueOf()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function indexFor(key) { return state.mapping[key] === '' || state.mapping[key] == null ? -1 : Number(state.mapping[key]); }
  function buildRecords() {
    const dateIndex = indexFor('date'); const revenueIndex = indexFor('revenue');
    if (dateIndex < 0 || revenueIndex < 0) throw new Error(t('errorNeedDateRevenue'));
    const rows = []; let skipped = 0;
    state.rawRows.forEach((source, index) => {
      const date = parseDate(source[dateIndex]); const revenue = parseNumber(source[revenueIndex]);
      if (!date || revenue == null) { skipped += 1; return; }
      const get = (key) => { const i = indexFor(key); return i < 0 ? null : source[i]; };
      const qty = parseNumber(get('quantity'));
      const cost = parseNumber(get('cost')); const explicitProfit = parseNumber(get('profit'));
      const product = String(get('product') ?? '').trim(); const customer = String(get('customer') ?? '').trim();
      const orderId = String(get('orderId') ?? '').trim();
      rows.push({ date, month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, orderId, product, customer, quantity: qty ?? 1, revenue, cost, profit: explicitProfit ?? (cost == null ? null : revenue - cost), sourceIndex: index });
    });
    if (!rows.length) throw new Error(t('errorNoValidRows'));
    state.records = rows; state.skipped = skipped;
  }
  function aggregate() {
    const rows = state.records; const sales = rows.reduce((sum, row) => sum + row.revenue, 0);
    const profitComplete = rows.every((row) => row.profit != null); const profit = profitComplete ? rows.reduce((sum, row) => sum + row.profit, 0) : null;
    const orderSet = new Set(); rows.forEach((row, i) => orderSet.add(row.orderId || `row-${i}`));
    const customers = new Set(rows.map((row) => row.customer).filter(Boolean));
    const months = new Map(); rows.forEach((row) => {
      const current = months.get(row.month) || { month: row.month, revenue: 0, profit: 0, profitCount: 0, rows: 0 };
      current.revenue += row.revenue; current.rows += 1;
      if (row.profit != null) { current.profit += row.profit; current.profitCount += 1; }
      months.set(row.month, current);
    });
    const monthly = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
    const byEntity = (key) => {
      const map = new Map(); rows.filter((row) => row[key]).forEach((row) => {
        const item = map.get(row[key]) || { name: row[key], revenue: 0, quantity: 0, orders: new Set() };
        item.revenue += row.revenue; item.quantity += row.quantity; item.orders.add(row.orderId || `row-${row.sourceIndex}`); map.set(row[key], item);
      });
      return [...map.values()].map((item) => ({ ...item, orders: item.orders.size })).sort((a, b) => b.revenue - a.revenue);
    };
    const sortedRevenue = rows.map((row) => row.revenue).filter((n) => n >= 0).sort((a, b) => a - b);
    const quantile = (q) => sortedRevenue.length ? sortedRevenue[Math.min(sortedRevenue.length - 1, Math.floor((sortedRevenue.length - 1) * q))] : 0;
    const q1 = quantile(.25); const q3 = quantile(.75); const highThreshold = q3 + 1.5 * (q3 - q1);
    const outliers = rows.filter((row) => row.revenue > highThreshold && row.revenue > 0);
    const refunds = rows.filter((row) => row.revenue < 0);
    const topProducts = byEntity('product'); const topCustomers = byEntity('customer');
    const latestPair = monthly.length > 1 ? [monthly[monthly.length - 2], monthly[monthly.length - 1]] : null;
    const monthChange = latestPair && latestPair[0].revenue !== 0 ? (latestPair[1].revenue - latestPair[0].revenue) / Math.abs(latestPair[0].revenue) * 100 : null;
    return { rows, sales, profit, profitComplete, margin: profitComplete && sales !== 0 ? profit / sales * 100 : null, orderCount: orderSet.size, customerCount: customers.size, averageOrder: orderSet.size ? sales / orderSet.size : null, monthly, products: topProducts, customers: topCustomers, outliers, refunds, highThreshold, latestPair, monthChange };
  }
  function addKpi({ label, value, sub, icon, accent, className = '' }) {
    const card = document.createElement('article'); card.className = 'kpi-card';
    card.innerHTML = `<div class="kpi-label"><span class="kpi-icon">${icon}</span>${escapeHTML(label)}</div><div class="kpi-value ${className}">${escapeHTML(value)}</div><div class="kpi-sub">${escapeHTML(sub)}</div><svg class="kpi-accent" viewBox="0 0 70 50" aria-hidden="true"><path d="${accent}" fill="none" stroke="#7657c4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    $('#kpi-grid').append(card);
  }
  function renderKpis(data) {
    const grid = $('#kpi-grid'); grid.replaceChildren();
    const latest = data.latestPair;
    const monthText = latest ? t('kpiCompare', { month: formatMonth(latest[1].month), change: percent(data.monthChange) }) : t('kpiCoverage');
    addKpi({ label: t('kpiSales'), value: compactMoney(data.sales), sub: monthText, icon: '↗', accent: 'M2 40 C12 32 15 36 24 25 S37 31 46 17 S57 22 67 5', className: data.monthChange < 0 ? 'trend-down' : data.monthChange > 0 ? 'trend-up' : '' });
    addKpi({ label: t('kpiProfit'), value: data.profitComplete ? compactMoney(data.profit) : t('kpiProfitUnavailable'), sub: data.profitComplete ? t('kpiProfitRule', { margin: data.margin == null ? '—' : `${data.margin.toFixed(1)}%` }) : t('kpiProfitMissing'), icon: '◈', accent: 'M2 38 C11 39 18 27 27 31 S40 16 48 22 S60 12 67 4', className: data.profitComplete && data.profit < 0 ? 'trend-down' : '' });
    addKpi({ label: t('kpiOrders'), value: formatCount(data.orderCount), sub: t('kpiRows', { count: formatCount(data.rows.length) }), icon: '▤', accent: 'M2 36 C13 33 18 19 27 26 S39 33 47 16 S59 18 67 7' });
    addKpi({ label: t('kpiAverage'), value: compactMoney(data.averageOrder), sub: t('kpiCustomers', { count: formatCount(data.customerCount) }), icon: '◎', accent: 'M2 39 C10 28 16 31 25 23 S38 29 47 13 S58 17 67 5' });
    const months = data.monthly;
    $('#date-range').innerHTML = `${months.length ? t('recentMonths', { count: formatCount(months.length) }) : t('selectedPeriod')} <span>⌄</span>`;
    $('#trend-summary').innerHTML = `<strong>${escapeHTML(compactMoney(data.sales))}</strong>${escapeHTML(t('trendSummary'))}${data.profitComplete ? ` <span>·</span> ${escapeHTML(t('trendProfit'))} ${escapeHTML(compactMoney(data.profit))}` : ''}`;
    $('#dataset-meta').textContent = t('recordsMonths', { records: formatCount(data.rows.length), skipped: state.skipped ? ` · ${t('rowSkipped', { count: formatCount(state.skipped) })}` : '', start: formatMonth(months[0]?.month || '2025-01'), end: formatMonth(months.at(-1)?.month || '2025-01') });
  }
  function renderChart(data) {
    const wrap = $('#trend-chart'); const months = data.monthly; $('#profit-legend').hidden = !data.profitComplete;
    if (!months.length) { wrap.innerHTML = `<div class="empty-state">${escapeHTML(t('chartEmpty'))}</div>`; return; }
    const width = 650; const height = 155; const left = 42; const right = 12; const top = 12; const bottom = 28;
    const plotW = width - left - right; const plotH = height - top - bottom; const maxValue = Math.max(1, ...months.map((item) => Math.max(item.revenue, item.profit || 0))) * 1.15;
    const x = (i) => left + (months.length === 1 ? plotW / 2 : i * plotW / (months.length - 1)); const y = (v) => top + plotH - (v / maxValue) * plotH;
    let svg = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8264ca" stop-opacity=".16"/><stop offset="1" stop-color="#8264ca" stop-opacity="0"/></linearGradient></defs>`;
    [0,.5,1].forEach((ratio) => { const yy = top + plotH * ratio; const val = maxValue * (1 - ratio); svg += `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="#f0edf3" stroke-dasharray="3 4"/><text x="${left-7}" y="${yy+3}" text-anchor="end" fill="#aaa5b0" font-size="9">${escapeHTML(compactMoney(val))}</text>`; });
    const salesPoints = months.map((m, i) => `${x(i)},${y(m.revenue)}`).join(' '); const areaPath = `M ${x(0)} ${top+plotH} L ${months.map((m, i) => `${x(i)} ${y(m.revenue)}`).join(' L ')} L ${x(months.length-1)} ${top+plotH} Z`;
    svg += `<path d="${areaPath}" fill="url(#area)"/><polyline points="${salesPoints}" fill="none" stroke="#8061c8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    months.forEach((m, i) => { svg += `<circle cx="${x(i)}" cy="${y(m.revenue)}" r="3.3" fill="#fff" stroke="#8061c8" stroke-width="2"/><text x="${x(i)}" y="${height-7}" text-anchor="middle" fill="#a39eaa" font-size="9">${escapeHTML(formatAxisMonth(m.month))}</text>`; });
    if (data.profitComplete) { const profitPoints = months.map((m, i) => `${x(i)},${y(m.profit)}`).join(' '); svg += `<polyline points="${profitPoints}" fill="none" stroke="#b8a5dd" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round"/>`; months.forEach((m, i) => { svg += `<circle cx="${x(i)}" cy="${y(m.profit)}" r="2.5" fill="#c6b6e5"/>`; }); }
    svg += '</svg>'; wrap.innerHTML = svg;
    $('#trend-note').textContent = data.profitComplete ? t('trendNoteProfit') : t('trendNoteRevenue');
  }
  function renderMix(data) {
    const host = $('#mix-content'); const products = data.products.slice(0, 4);
    if (!products.length || data.sales <= 0) { host.innerHTML = `<div class="empty-state">${escapeHTML(t('mixEmpty'))}</div>`; return; }
    const totalPositive = data.rows.reduce((sum, row) => sum + Math.max(0, row.revenue), 0);
    host.innerHTML = `<div class="mix-total">${escapeHTML(compactMoney(data.sales))}</div><div class="mix-caption">${data.products.length ? escapeHTML(t('mixCaption', { product: displayEntityName(products[0].name) })) : escapeHTML(t('mixTotalCaption'))}</div><div class="mix-stack">${products.map((p) => `<span style="width:${Math.max(3, Math.max(0,p.revenue)/Math.max(1,totalPositive)*100)}%"></span>`).join('')}</div><div class="mix-legend">${products.map((p, i) => `<div class="mix-row"><span class="mix-label"><i class="mix-dot ${i ? `c${Math.min(i+1,4)}` : ''}"></i>${escapeHTML(displayEntityName(p.name))}</span><span class="mix-val">${escapeHTML(totalPositive ? `${(Math.max(0,p.revenue)/totalPositive*100).toFixed(1)}%` : '—')}</span></div>`).join('')}</div>`;
  }
  function renderRanking(target, records, emptyKey) {
    const host = $(target); host.replaceChildren();
    if (!records.length) { host.innerHTML = `<div class="empty-state">${escapeHTML(t(emptyKey))}</div>`; return; }
    const list = document.createElement('div'); list.className = 'rank-list'; const max = Math.max(1, records[0].revenue);
    records.slice(0, 5).forEach((item, i) => {
      const row = document.createElement('div'); row.className = 'rank-item';
      const name = displayEntityName(item.name);
      row.innerHTML = `<span class="rank-num ${i < 3 ? 'top' : ''}">${String(i+1).padStart(2,'0')}</span><span class="rank-title" title="${escapeHTML(name)}">${escapeHTML(name)}</span><span class="rank-track"><span class="rank-fill" style="display:block;width:${Math.max(4,item.revenue/max*100)}%"></span></span><span class="rank-value">${escapeHTML(compactMoney(item.revenue))}</span>`;
      list.append(row);
    }); host.append(list);
  }
  function renderInsights(data) {
    const list = $('#insights-list'); list.replaceChildren(); const items = [];
    if (data.outliers.length) items.push({ warning: true, icon: '↗', title: t('insightHighTitle', { count: formatCount(data.outliers.length) }), copy: t('insightHighCopy', { amount: money(data.highThreshold) }) });
    if (data.refunds.length) items.push({ warning: true, icon: '↙', title: t('insightRefundTitle', { count: formatCount(data.refunds.length) }), copy: t('insightRefundCopy') });
    if (data.monthChange != null && data.monthChange < -20) items.push({ warning: true, icon: '⌁', title: t('insightDeclineTitle'), copy: t('insightDeclineCopy', { percent: Math.abs(data.monthChange).toFixed(1) }) });
    if (!data.profitComplete) items.push({ warning: false, icon: '＋', title: t('insightProfitTitle'), copy: t('insightProfitCopy') });
    if (state.skipped) items.push({ warning: true, icon: '!', title: t('insightSkippedTitle', { count: formatCount(state.skipped) }), copy: t('insightSkippedCopy') });
    if (data.rows.length < 5) items.push({ warning: false, icon: 'i', title: t('insightFewTitle'), copy: t('insightFewCopy', { count: formatCount(data.rows.length) }) });
    if (!items.length) items.push({ warning: false, icon: '✓', title: t('insightClearTitle'), copy: t('insightClearCopy') });
    items.slice(0, 3).forEach((item) => { const card = document.createElement('article'); card.className = `insight-card ${item.warning ? 'warning' : ''}`; card.innerHTML = `<div><span class="insight-icon">${item.icon}</span><span class="insight-title">${escapeHTML(item.title)}</span></div><p class="insight-copy">${escapeHTML(item.copy)}</p>`; list.append(card); });
  }
  function updateHeader() {
    const months = aggregate().monthly;
    $('#dataset-name').textContent = state.pendingName || (state.isDemo ? t('sampleName') : state.sourceName);
    $('#dataset-state').textContent = state.pendingName ? t('waitingConfirm') : state.isDemo ? t('demoMode') : t('localRead');
    $('#dataset-meta').textContent = t('recordsMonths', { records: formatCount(state.records.length), skipped: state.skipped ? ` · ${t('rowSkipped', { count: formatCount(state.skipped) })}` : '', start: formatMonth(months[0]?.month || '2025-01'), end: formatMonth(months.at(-1)?.month || '2025-01') });
  }
  function renderAll() {
    const data = aggregate(); renderKpis(data); renderChart(data); renderMix(data);
    renderRanking('#product-ranking', data.products, 'rankingProductEmpty'); renderRanking('#customer-ranking', data.customers, 'rankingCustomerEmpty'); renderInsights(data); updateHeader();
  }
  function useDemo() {
    state.sourceName = ''; state.pendingName = ''; state.isDemo = true; state.skipped = 0;
    state.records = demoRows.map((r, i) => { const date = parseDate(r[0]); return { date, month: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`, orderId: r[1], product: r[2], customer: r[3], quantity: r[4], revenue: r[5], cost: null, profit: r[6], sourceIndex: i }; });
    $('#mapping-panel').hidden = true; clearMessage(); renderAll();
  }
  function displayEntityName(name) {
    if (!state.isDemo) return name;
    const products = t('demoProducts'); const customers = t('demoCustomers');
    return products[name] ?? customers[name] ?? name;
  }
  async function loadSheetJS() {
    if (window.XLSX) return window.XLSX;
    if (loadSheetJS.promise) return loadSheetJS.promise;
    loadSheetJS.promise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; script.async = true;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error(t('errorExcelLoad')));
      script.onerror = () => reject(new Error(t('errorExcelNetwork')));
      document.head.append(script);
    });
    return loadSheetJS.promise;
  }
  async function handleFile(file) {
    clearMessage(); if (!file) return;
    if (file.size > 25 * 1024 * 1024) { showMessage(t('errorFileTooLarge')); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      let matrix;
      if (ext === 'csv') matrix = parseCSV(await file.text());
      else if (['xlsx', 'xls', 'xlsm'].includes(ext)) {
        const XLSX = await loadSheetJS(); const buffer = await file.arrayBuffer(); const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        if (!workbook.SheetNames.length) throw new Error(t('errorNoWorksheet'));
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
      } else throw new Error(t('errorUnsupportedFile'));
      const parsed = rowsFromMatrix(matrix); state.headers = parsed.headers; state.rawRows = parsed.rawRows; state.mapping = suggestMapping(state.headers); state.pendingName = file.name;
      renderMapping(); $('#dataset-name').textContent = file.name; $('#dataset-state').textContent = t('waitingConfirm');
    } catch (error) { showMessage(error.message || t('errorReadFile')); }
  }
  function csvReport() {
    const d = aggregate(); const rows = [[t('csvMetric'),t('csvValue')],[t('csvRecords'),d.rows.length],[t('csvOrders'),d.orderCount],[t('csvCustomers'),d.customerCount],[t('csvSales'),d.sales],[t('csvProfit'),d.profit ?? t('csvIncomplete')],[t('csvMargin'),d.margin == null ? t('csvIncomplete') : `${d.margin.toFixed(1)}%`],[t('csvAverage'),d.averageOrder ?? '']];
    rows.push([],[t('csvMonth'),t('csvSales'),t('csvProfit')]); d.monthly.forEach((m) => rows.push([m.month,m.revenue,d.profitComplete ? m.profit : '']));
    rows.push([],[t('csvProducts'),t('csvSales'),t('csvQuantity')]); d.products.slice(0,10).forEach((p) => rows.push([displayEntityName(p.name),p.revenue,p.quantity]));
    rows.push([],[t('csvTopCustomers'),t('csvSales'),t('csvOrders')]); d.customers.slice(0,10).forEach((c) => rows.push([displayEntityName(c.name),c.revenue,c.orders]));
    return '\uFEFF' + rows.map((row) => row.map((v) => typeof v === 'number' ? String(v) : safeCSV(v)).join(',')).join('\r\n');
  }
  function htmlReport() {
    const d = aggregate(); const date = formatDate(new Date());
    const rows = d.monthly.map((m) => `<tr><td>${escapeHTML(formatMonth(m.month))}</td><td>${escapeHTML(money(m.revenue))}</td><td>${d.profitComplete ? escapeHTML(money(m.profit)) : '—'}</td></tr>`).join('');
    const products = d.products.slice(0,10).map((p) => `<tr><td>${escapeHTML(displayEntityName(p.name))}</td><td>${escapeHTML(money(p.revenue))}</td><td>${escapeHTML(p.quantity)}</td></tr>`).join('');
    const customers = d.customers.slice(0,10).map((c) => `<tr><td>${escapeHTML(displayEntityName(c.name))}</td><td>${escapeHTML(money(c.revenue))}</td><td>${c.orders}</td></tr>`).join('');
    const observations = [...d.outliers.map((r) => t('reportHighObservation', { date: formatDate(r.date), amount: money(r.revenue) })), ...d.refunds.map((r) => t('reportRefundObservation', { date: formatDate(r.date), amount: money(r.revenue) }))];
    const source = state.isDemo ? t('sampleName') : state.sourceName;
    return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHTML(t('reportHtmlTitle'))}</title><style>body{font:15px/1.7 system-ui,'Noto Sans SC',sans-serif;color:#302b3b;max-width:900px;margin:44px auto;padding:0 22px}header{border-bottom:2px solid #7555c8;padding-bottom:20px}small,.muted{color:#898391}.brand{color:#7555c8;font-weight:700;letter-spacing:1px}h1{font-size:28px;margin:9px 0}h2{font-size:18px;margin:30px 0 10px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.card{border:1px solid #eeeaf3;border-radius:10px;padding:15px}.card small{display:block}.card strong{font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;padding:9px;border-bottom:1px solid #eeeaf3}th{color:#777180}.notice{background:#f6f3fb;padding:13px;border-radius:8px;color:#625b70}@media(max-width:600px){.grid{grid-template-columns:repeat(2,1fr)}}</style><body><header><div class="brand">CLARITY BUSINESS</div><h1>${escapeHTML(t('reportTitle'))}</h1><small>${escapeHTML(t('reportSource', { source, date, count: formatCount(d.rows.length) }))}</small></header><div class="grid"><div class="card"><small>${escapeHTML(t('reportSales'))}</small><strong>${escapeHTML(money(d.sales))}</strong></div><div class="card"><small>${escapeHTML(t('reportProfit'))}</small><strong>${d.profitComplete ? escapeHTML(money(d.profit)) : '—'}</strong></div><div class="card"><small>${escapeHTML(t('reportOrders'))}</small><strong>${formatCount(d.orderCount)}</strong></div><div class="card"><small>${escapeHTML(t('reportAverage'))}</small><strong>${escapeHTML(money(d.averageOrder))}</strong></div></div><h2>${escapeHTML(t('reportMonthly'))}</h2><table><thead><tr><th>${escapeHTML(t('reportMonth'))}</th><th>${escapeHTML(t('csvSales'))}</th><th>${escapeHTML(t('reportProfit'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="3">${escapeHTML(t('reportEmpty'))}</td></tr>`}</tbody></table><h2>${escapeHTML(t('reportProducts'))}</h2><table><thead><tr><th>${escapeHTML(t('reportProduct'))}</th><th>${escapeHTML(t('csvSales'))}</th><th>${escapeHTML(t('reportQuantity'))}</th></tr></thead><tbody>${products || `<tr><td colspan="3">${escapeHTML(t('reportEmpty'))}</td></tr>`}</tbody></table><h2>${escapeHTML(t('reportCustomers'))}</h2><table><thead><tr><th>${escapeHTML(t('reportCustomer'))}</th><th>${escapeHTML(t('csvSales'))}</th><th>${escapeHTML(t('reportOrders'))}</th></tr></thead><tbody>${customers || `<tr><td colspan="3">${escapeHTML(t('reportEmpty'))}</td></tr>`}</tbody></table><h2>${escapeHTML(t('reportObservations'))}</h2><p>${observations.length ? observations.map(escapeHTML).join('<br>') : escapeHTML(t('reportNoAlerts'))}</p><p class="notice">${escapeHTML(t('reportNotice'))}</p><p class="muted">${escapeHTML(t('reportLocal'))}</p></body></html>`;
  }
  function download(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('#upload-trigger').addEventListener('click', () => $('#file-input').click());
  $('#change-data').addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', async (event) => { await handleFile(event.target.files?.[0]); event.target.value = ''; });
  $('#load-sample').addEventListener('click', () => { useDemo(); toast(t('toastSample')); });
  $('#language-switch').addEventListener('change', (event) => {
    if (!APP_LOCALES.includes(event.target.value)) return;
    locale = event.target.value;
    applyLocale();
    renderAll();
    if (!$('#mapping-panel').hidden) renderMapping();
  });
  $('#cancel-mapping').addEventListener('click', () => { $('#mapping-panel').hidden = true; state.pendingName = ''; updateHeader(); });
  $('#analyze-button').addEventListener('click', () => {
    try { buildRecords(); if (state.pendingName) { state.sourceName = state.pendingName; state.pendingName = ''; state.isDemo = false; } $('#mapping-panel').hidden = true; clearMessage(); renderAll(); toast(t('toastAnalyzed', { count: formatCount(state.records.length) })); }
    catch (error) { showMessage(error.message); }
  });
  $('#export-csv').addEventListener('click', () => download(csvReport(), 'clarity-business-summary.csv', 'text/csv;charset=utf-8'));
  $('#download-report').addEventListener('click', () => download(htmlReport(), 'clarity-business-report.html', 'text/html;charset=utf-8'));
  applyLocale();
  useDemo();
})();
