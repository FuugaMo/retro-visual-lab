const stage = document.querySelector('#posterStage');
const scaler = document.querySelector('#stageScaler');
const viewport = document.querySelector('#stageViewport');
const backgroundInput = document.querySelector('#backgroundInput');
const imageInput = document.querySelector('#imageInput');
const emptyCanvasMessage = document.querySelector('#emptyCanvasMessage');
const canvasStatus = document.querySelector('#canvasStatus');
const selectionStatus = document.querySelector('#selectionStatus');
const appStatus = document.querySelector('#appStatus');
const latinFontSelect = document.querySelector('#latinFontSelect');
const cjkFontSelect = document.querySelector('#cjkFontSelect');

const controls = {
  empty: document.querySelector('#emptySelection'),
  fields: document.querySelector('#editorFields'),
  title: document.querySelector('#titleInput'),
  content: document.querySelector('#contentInput'),
  theme: document.querySelector('#themeInput'),
  fontSize: document.querySelector('#fontSizeInput'),
  shadow: document.querySelector('#shadowInput'),
  variantControl: document.querySelector('#variantControl'),
  variantLabel: document.querySelector('#variantLabel'),
  variantChoices: document.querySelector('#variantChoices'),
  titleControl: document.querySelector('#titleControl'),
  contentControl: document.querySelector('#contentControl'),
  styleControls: document.querySelector('#styleControls'),
  shadowControl: document.querySelector('#shadowControl'),
  themeControl: document.querySelector('#themeControl'),
  fontSizeControl: document.querySelector('#fontSizeControl'),
  textColorControl: document.querySelector('#textColorControl'),
  textColor: document.querySelector('#textColorInput'),
  typographyControl: document.querySelector('#typographyControl'),
  typographyPart: document.querySelector('#typographyPartSelect'),
  partFontFamily: document.querySelector('#partFontFamily'),
  partFontSize: document.querySelector('#partFontSize'),
  partFontWeight: document.querySelector('#partFontWeight'),
  resetTypography: document.querySelector('#resetTypographyButton'),
};

const dimensions = {
  '3:4': [900, 1200],
  '4:3': [1200, 900],
  '9:16': [720, 1280],
  '1:1': [1000, 1000],
};

const presets = {
  lineup: { title: 'LINE-UP.EXE', content: '夜间疾走\nRunning in the 00s\nTouch Grass', w: 430, h: 198, fontSize: 27, theme: 'blue', startX: 40, startY: 100 },
  time: { title: 'TIME.VENUE', content: '2026 / 10 / 31\n星期六\n20:00\n@浴室Live · 免费入场', w: 500, h: 250, fontSize: 33, theme: 'blue', variant: 'segmented', startX: 390, startY: 620 },
  calendar: { title: 'DATE.VENUE', content: '2026 / 10 / 31\n星期六\n20:00\n@浴室Live · 免票入场', w: 300, h: 286, fontSize: 22, theme: 'gray', startXPct: .126, startYPct: .753 },
  address: { title: 'ADDRESS.LOCATION', content: '中国广东省珠海市金湾区\n敏德巷1号', w: 470, h: 164, fontSize: 24, theme: 'blue', startX: 420, startY: 980 },
  image: { title: 'IMAGE', content: '', w: 320, h: 220, fontSize: 22, theme: 'blue', imageUrl: '' },
  text: { title: 'TEXT', content: 'Before the Moon Falls', w: 820, h: 150, fontSize: 72, textColor: '#ffe744', theme: 'blue', startX: 40, startY: 24 },
};

const variantSets = {};

const WIN98_FONT = '"Pixelated MS Sans Serif", "MS Sans Serif", sans-serif';
const posterFontFamilies = {
  pingfang: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  'fusion-8-prop': '"Fusion Pixel 8px Proportional", sans-serif',
  'fusion-10-prop': '"Fusion Pixel 10px Proportional", sans-serif',
  'fusion-pixel': '"Fusion Pixel 12px Proportional", sans-serif',
  'fusion-12-mono': '"Fusion Pixel 12px Monospaced", monospace',
  pixel: '"Pixelated MS Sans Serif", "MS Sans Serif", "SimSun", sans-serif',
};

const posterLatinFontFamilies = {
  pingfang: '"Latin PingFang SC"',
  'fusion-8-prop': '"Latin Fusion Pixel 8px Proportional"',
  'fusion-10-prop': '"Latin Fusion Pixel 10px Proportional"',
  'fusion-pixel': '"Latin Fusion Pixel 12px Proportional"',
  'fusion-12-mono': '"Latin Fusion Pixel 12px Monospaced"',
  pixel: '"Latin Pixelated MS Sans Serif"',
};

const posterCjkFontFamilies = {
  pingfang: '"CJK PingFang SC"',
  'fusion-8-prop': '"CJK Fusion Pixel 8px Proportional"',
  'fusion-10-prop': '"CJK Fusion Pixel 10px Proportional"',
  'fusion-pixel': '"CJK Fusion Pixel 12px Proportional"',
  'fusion-12-mono': '"CJK Fusion Pixel 12px Monospaced"',
};

const typographyPartsByType = {
  lineup: [
    { key: 'title', label: '标题栏', selector: '.widget-titlebar', defaultSize: 18, defaultWeight: 700 },
    { key: 'content', label: '阵容文字', selector: '.widget-lines', defaultWeight: 700, usesWidgetSize: true },
  ],
  time: [
    { key: 'title', label: '标题栏', selector: '.widget-titlebar', defaultSize: 18, defaultWeight: 700 },
    { key: 'date', label: '日期', selector: '.date-chip', defaultSize: 33, defaultWeight: 700 },
    { key: 'time', label: '时间', selector: '.big-time', defaultSize: 33, defaultWeight: 700 },
    { key: 'weekday', label: '星期', selector: '.weekday-label', defaultSize: 22, defaultWeight: 700 },
    { key: 'venue', label: '场地信息', selector: '.venue-status', defaultSize: 22, defaultWeight: 700 },
  ],
  calendar: [
    { key: 'title', label: '标题栏', selector: '.widget-titlebar', defaultSize: 18, defaultWeight: 700 },
    { key: 'date', label: '日期与星期', selector: '.month-selectors', defaultSize: 18, defaultWeight: 700 },
    { key: 'weekdays', label: '星期缩写', selector: '.calendar-weekdays', defaultSize: 14, defaultWeight: 700 },
    { key: 'days', label: '日期数字', selector: '.calendar-days', defaultSize: 16, defaultWeight: 700 },
    { key: 'time', label: '时间', selector: '.calendar-digital-time', defaultSize: 18, defaultWeight: 400 },
    { key: 'venue', label: '场地名', selector: '.calendar-venue-name', defaultSize: 27, defaultWeight: 700 },
    { key: 'ticket', label: '票务', selector: '.calendar-ticket-badge', defaultSize: 18, defaultWeight: 700 },
  ],
  address: [
    { key: 'title', label: '标题栏', selector: '.widget-titlebar', defaultSize: 18, defaultWeight: 700 },
    { key: 'content', label: '地址文字', selector: '.address-copy', defaultWeight: 700, usesWidgetSize: true },
  ],
  text: [
    { key: 'content', label: '大标题', selector: '.widget-lines', defaultWeight: 700, usesWidgetSize: true },
  ],
};
const LAYOUT_DB = 'retro-visual-lab';
const LAYOUT_STORE = 'saved-layouts';
const LAYOUT_KEY = 'current-layout';

let state = {
  width: 900,
  height: 1200,
  backgroundUrl: '',
  backgroundOpacity: 1,
  selectedId: null,
  nextId: 1,
  topZ: 4,
  snap: true,
  latinFontFamily: 'pixel',
  cjkFontFamily: 'pingfang',
  widgets: [],
};

let typographyEditorWidgetId = null;
let activeTypographyPart = null;

function openLayoutDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LAYOUT_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LAYOUT_STORE)) request.result.createObjectStore(LAYOUT_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeSavedLayout() {
  const db = await openLayoutDb();
  const snapshot = {
    ...state,
    schemaVersion: 7,
    selectedId: null,
    grid: document.querySelector('#gridToggle').checked,
    ratio: document.querySelector('#ratioSelect').value,
    savedAt: Date.now(),
  };
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(LAYOUT_STORE, 'readwrite');
    transaction.objectStore(LAYOUT_STORE).put(snapshot, LAYOUT_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function readSavedLayout() {
  const db = await openLayoutDb();
  const snapshot = await new Promise((resolve, reject) => {
    const request = db.transaction(LAYOUT_STORE, 'readonly').objectStore(LAYOUT_STORE).get(LAYOUT_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return snapshot;
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function win98FontSize(value) { return Number(value) < 28 ? 22 : 33; }
function snap(value) { return state.snap ? Math.round(value / 8) * 8 : Math.round(value); }

function applyPosterFont() {
  const latinKey = state.latinFontFamily in posterLatinFontFamilies ? state.latinFontFamily : 'pixel';
  const cjkKey = state.cjkFontFamily in posterCjkFontFamilies ? state.cjkFontFamily : 'pingfang';
  const family = `${posterLatinFontFamilies[latinKey]}, ${posterCjkFontFamilies[cjkKey]}, sans-serif`;
  stage.style.setProperty('--poster-font-family', family);
  latinFontSelect.value = latinKey;
  cjkFontSelect.value = cjkKey;
}

function applyWidgetTypography(el, widget) {
  const parts = typographyPartsByType[widget.type] || [];
  parts.forEach((part) => {
    const setting = widget.typography?.[part.key] || {};
    el.querySelectorAll(part.selector).forEach((target) => {
      if (setting.fontFamily && posterFontFamilies[setting.fontFamily]) target.style.fontFamily = posterFontFamilies[setting.fontFamily];
      else target.style.removeProperty('font-family');
      if (Number.isFinite(setting.fontSize)) target.style.fontSize = `${setting.fontSize}px`;
      else if (!part.usesWidgetSize) target.style.removeProperty('font-size');
      if (Number.isFinite(setting.fontWeight)) target.style.fontWeight = String(setting.fontWeight);
      else target.style.removeProperty('font-weight');
    });
  });
}

function fitStage() {
  const pad = 42;
  const scale = Math.min(
    (viewport.clientWidth - pad) / state.width,
    (viewport.clientHeight - pad) / state.height,
    1,
  );
  scaler.style.width = `${state.width * scale}px`;
  scaler.style.height = `${state.height * scale}px`;
  stage.style.transformOrigin = 'top left';
  stage.style.transform = `scale(${Math.max(.08, scale)})`;
  stage.style.width = `${state.width}px`;
  stage.style.height = `${state.height}px`;
  canvasStatus.textContent = `${state.width} × ${state.height} px · ${Math.round(scale * 100)}%`;
}

function setBackground(url) {
  state.backgroundUrl = url;
  const overlay = 1 - state.backgroundOpacity;
  stage.style.backgroundImage = url ? `linear-gradient(rgba(24,34,33,${overlay}), rgba(24,34,33,${overlay})), url("${url}")` : '';
  stage.classList.toggle('has-background', Boolean(url));
  stage.style.setProperty('--bg-opacity', state.backgroundOpacity);
  const showEmptyMessage = !url && state.widgets.length === 0;
  emptyCanvasMessage.hidden = !showEmptyMessage;
  emptyCanvasMessage.style.display = showEmptyMessage ? 'grid' : 'none';
}

function renderWidget(widget) {
  let el = stage.querySelector(`[data-id="${widget.id}"]`);
  if (!el) {
    el = document.createElement('article');
    el.className = 'widget-window';
    el.dataset.id = widget.id;
    el.innerHTML = `
      <div class="widget-titlebar">
        <span class="title-icon"></span>
        <span class="widget-title"></span>
        <span class="window-actions" aria-hidden="true">
          <span class="caption-button min"></span>
          <span class="caption-button max"></span>
          <span class="caption-button close"></span>
        </span>
      </div>
      <div class="widget-body"><img class="widget-logo" alt="" hidden /><div class="widget-special"></div><p class="widget-lines"></p></div>
      <div class="resize-handle"></div>`;
    stage.appendChild(el);
    bindWidgetEvents(el, widget.id);
  }
  el.dataset.type = widget.type;
  el.dataset.theme = widget.theme;
  el.dataset.variant = widget.variant || '';
  el.style.setProperty('--address-font-size', `${widget.fontSize}px`);
  el.classList.toggle('selected', widget.id === state.selectedId);
  el.classList.toggle('no-shadow', !widget.shadow);
  Object.assign(el.style, {
    left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px`, zIndex: widget.z,
  });
  el.querySelector('.widget-title').textContent = widget.title;
  const lineRoot = el.querySelector('.widget-lines');
  const specialRoot = el.querySelector('.widget-special');
  const image = el.querySelector('.widget-logo');
  lineRoot.style.fontSize = `${widget.fontSize}px`;
  lineRoot.style.color = widget.textColor || '';
  specialRoot.replaceChildren();
  const specialFontSize = widget.type === 'time' ? win98FontSize(widget.fontSize) : widget.fontSize;
  const secondaryFontSize = widget.type === 'time' ? Math.max(22, specialFontSize - 11) : specialFontSize;
  specialRoot.style.fontSize = `${specialFontSize}px`;
  specialRoot.style.setProperty('--win98-base-size', `${secondaryFontSize}px`);
  specialRoot.style.setProperty('--win98-date-size', `${specialFontSize}px`);
  specialRoot.style.setProperty('--win98-time-size', `${specialFontSize}px`);
  specialRoot.hidden = !['time', 'calendar', 'address'].includes(widget.type);
  image.hidden = widget.type !== 'image' || !widget.imageUrl;
  if (!image.hidden) image.src = widget.imageUrl;
  lineRoot.hidden = ['time', 'calendar', 'address', 'image'].includes(widget.type);
  if (widget.type === 'lineup') {
    lineRoot.replaceChildren(...widget.content.split('\n').map((line) => {
      const span = document.createElement('span');
      span.textContent = line || ' ';
      return span;
    }));
  } else if (widget.type === 'time') {
    renderDateTime(specialRoot, widget);
  } else if (widget.type === 'calendar') {
    renderCalendar(specialRoot, widget);
  } else if (widget.type === 'address') {
    renderAddress(specialRoot, widget);
  } else {
    lineRoot.textContent = widget.content;
  }
  applyWidgetTypography(el, widget);
  if (widget.type === 'address') {
    const requiredHeight = clamp(Math.ceil(lineRoot.scrollHeight + 74), 110, state.height - widget.y);
    widget.minContentHeight = requiredHeight;
    if (widget.h < requiredHeight) widget.h = requiredHeight;
    el.style.height = `${widget.h}px`;
  }
}

function renderCalendar(root, widget) {
  const [date = '', weekday = '星期六', time = '20:00', venue = '@浴室Live · 免票入场'] = widget.content.split('\n');
  const [year = 2026, month = 10, day = 31] = (date.match(/\d+/g) || []).map(Number);
  const [hour = '20', minute = '00'] = time.match(/\d+/g) || [];
  const wrap = document.createElement('div');
  wrap.className = 'calendar-layout';
  const main = document.createElement('div');
  main.className = 'calendar-main';
  const calendar = document.createElement('section');
  calendar.className = 'month-calendar';
  const header = document.createElement('div');
  header.className = 'month-selectors';
  header.innerHTML = `<span>${year} / ${String(month).padStart(2, '0')} / ${String(day).padStart(2, '0')}</span><span>${weekday}</span>`;
  const weekdays = document.createElement('div');
  weekdays.className = 'calendar-weekdays';
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((label) => { const cell = document.createElement('span'); cell.textContent = label; weekdays.append(cell); });
  const days = document.createElement('div');
  days.className = 'calendar-days';
  const firstDay = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  days.style.setProperty('--calendar-week-rows', Math.ceil((firstDay + totalDays) / 7));
  for (let index = 0; index < firstDay; index += 1) days.append(document.createElement('span'));
  for (let value = 1; value <= totalDays; value += 1) {
    const cell = document.createElement('span');
    cell.textContent = value;
    cell.classList.toggle('selected-day', value === day);
    days.append(cell);
  }
  calendar.append(header, weekdays, days);
  const timePanel = document.createElement('section');
  timePanel.className = 'calendar-time-panel';
  const clock = document.createElement('div');
  clock.className = 'analog-clock calendar-clock';
  clock.style.setProperty('--hour-angle', `${((Number(hour) % 12) * 30) + Number(minute) * .5}deg`);
  clock.style.setProperty('--minute-angle', `${Number(minute) * 6}deg`);
  clock.innerHTML = '<i class="hour-hand"></i><i class="minute-hand"></i><i class="clock-pin"></i>';
  const digital = document.createElement('div');
  digital.className = 'calendar-digital-time';
  digital.textContent = `${hour}:${minute}`;
  timePanel.append(clock, digital);
  main.append(calendar, timePanel);
  const venueBar = document.createElement('div');
  venueBar.className = 'calendar-venue';
  const [venueName = '', ...ticketParts] = venue.split(/\s*·\s*/);
  const venueText = document.createElement('strong');
  venueText.className = 'calendar-venue-name';
  venueText.textContent = venueName;
  venueBar.append(venueText);
  if (ticketParts.length) {
    const ticket = document.createElement('span');
    ticket.className = 'calendar-ticket-badge';
    ticket.textContent = ticketParts.join(' · ');
    venueBar.append(ticket);
  }
  wrap.append(main, venueBar);
  root.append(wrap);
}

function renderDateTime(root, widget) {
  const [date = '', weekday = '星期六', time = '', venue = 'VENUE'] = widget.content.split('\n');
  const timeParts = time.match(/\d+/g) || [];
  const [hour = '00', minute = '00'] = timeParts;
  const wrap = document.createElement('div');
  wrap.className = `datetime-layout ${widget.variant || 'segmented'}`;
  const clock = document.createElement('div');
  clock.className = 'analog-clock';
  const hourAngle = ((Number(hour) % 12) * 30) + Number(minute) * .5;
  const minuteAngle = Number(minute) * 6;
  clock.style.setProperty('--hour-angle', `${hourAngle}deg`);
  clock.style.setProperty('--minute-angle', `${minuteAngle}deg`);
  clock.innerHTML = '<i class="hour-hand"></i><i class="minute-hand"></i><i class="clock-pin"></i>';
  const main = document.createElement('div');
  main.className = 'datetime-main';
  const readout = document.createElement('div'); readout.className = 'clock-readout';
  const timeLabel = document.createElement('strong'); timeLabel.className = 'big-time'; timeLabel.textContent = `${hour}:${minute}`;
  const weekdayNames = { 星期一: 'MON', 星期二: 'TUE', 星期三: 'WED', 星期四: 'THU', 星期五: 'FRI', 星期六: 'SAT', 星期日: 'SUN', 周一: 'MON', 周二: 'TUE', 周三: 'WED', 周四: 'THU', 周五: 'FRI', 周六: 'SAT', 周日: 'SUN' };
  const weekdayLabel = document.createElement('span'); weekdayLabel.className = 'weekday-label'; weekdayLabel.textContent = `(${weekdayNames[weekday] || weekday.replace(/[()]/g, '')})`;
  const dateLabel = document.createElement('span'); dateLabel.className = 'date-chip'; dateLabel.textContent = date;
  main.classList.add('reference-main');
  const timeRow = document.createElement('div'); timeRow.className = 'reference-time-row'; timeRow.append(timeLabel, weekdayLabel);
  readout.append(dateLabel, timeRow);
  main.append(clock, readout);
  const venueBar = document.createElement('div'); venueBar.className = 'venue-status';
  const venueIcon = document.createElement('span'); venueIcon.className = 'venue-pin-icon';
  const venueText = document.createElement('span'); venueText.textContent = venue;
  venueBar.append(venueIcon, venueText);
  wrap.append(main, venueBar);
  root.append(wrap);
}

function renderAddress(root, widget) {
  const wrap = document.createElement('div');
  wrap.className = 'address-layout';
  const map = document.createElement('div');
  map.className = 'address-map';
  map.innerHTML = '<i class="address-pin"></i>';
  const copy = document.createElement('p');
  copy.className = 'address-copy';
  copy.style.fontSize = `${widget.fontSize}px`;
  copy.textContent = widget.content;
  wrap.append(map, copy);
  root.append(wrap);
}

function renderAll() {
  state.widgets.forEach(renderWidget);
  stage.querySelectorAll('.widget-window').forEach((el) => {
    if (!state.widgets.some((item) => item.id === Number(el.dataset.id))) el.remove();
  });
  const showEmptyMessage = !state.backgroundUrl && state.widgets.length === 0;
  emptyCanvasMessage.hidden = !showEmptyMessage;
  emptyCanvasMessage.style.display = showEmptyMessage ? 'grid' : 'none';
  updateEditor();
}

function addWidget(type) {
  const preset = presets[type];
  const offset = (state.widgets.length * 32) % 180;
  const useStartPosition = !state.widgets.some((item) => item.type === type) && (Number.isFinite(preset.startX) || Number.isFinite(preset.startXPct));
  const startX = Number.isFinite(preset.startXPct) ? Math.round(state.width * preset.startXPct) : preset.startX;
  const startY = Number.isFinite(preset.startYPct) ? Math.round(state.height * preset.startYPct) : preset.startY;
  const widget = {
    ...preset,
    id: state.nextId++,
    type,
    x: Number.isFinite(preset.startXPct) ? clamp(useStartPosition ? startX : 70 + offset, 0, state.width - preset.w) : snap(clamp(useStartPosition ? startX : 70 + offset, 0, state.width - preset.w)),
    y: Number.isFinite(preset.startYPct) ? clamp(useStartPosition ? startY : 90 + offset, 0, state.height - preset.h) : snap(clamp(useStartPosition ? startY : 90 + offset, 0, state.height - preset.h)),
    z: ++state.topZ,
    shadow: true,
  };
  state.widgets.push(widget);
  state.selectedId = widget.id;
  renderAll();
}

function selectedWidget() { return state.widgets.find((item) => item.id === state.selectedId); }

function selectWidget(id) {
  state.selectedId = id;
  const widget = selectedWidget();
  if (widget) widget.z = ++state.topZ;
  renderAll();
}

function updateEditor() {
  const widget = selectedWidget();
  controls.empty.hidden = Boolean(widget);
  controls.fields.hidden = !widget;
  if (!widget) {
    controls.variantControl.hidden = true;
    controls.variantControl.style.display = 'none';
    controls.typographyControl.hidden = true;
    typographyEditorWidgetId = null;
    activeTypographyPart = null;
    selectionStatus.textContent = 'NO WIDGET SELECTED';
    return;
  }
  const isImage = widget.type === 'image';
  const isText = widget.type === 'text';
  [controls.titleControl, controls.contentControl, controls.styleControls, controls.shadowControl]
    .forEach((control) => { control.hidden = isImage; });
  controls.titleControl.hidden = isImage || isText;
  controls.themeControl.hidden = isText;
  controls.fontSizeControl.hidden = false;
  controls.textColorControl.hidden = !isText;
  controls.title.value = widget.title;
  controls.content.value = widget.content;
  controls.theme.value = widget.theme;
  controls.fontSize.value = widget.fontSize;
  controls.fontSize.min = ['time', 'calendar'].includes(widget.type) ? 22 : 12;
  controls.fontSize.max = ['time', 'calendar'].includes(widget.type) ? 33 : widget.type === 'text' ? 120 : 72;
  controls.shadow.checked = widget.shadow;
  controls.textColor.value = widget.textColor || '#ffe744';
  renderVariantChoices(widget);
  renderTypographyEditor(widget);
  selectionStatus.textContent = `${widget.type.toUpperCase()} · X ${widget.x} · Y ${widget.y} · ${widget.w} × ${widget.h}`;
}

function renderTypographyEditor(widget) {
  const parts = typographyPartsByType[widget.type] || [];
  controls.typographyControl.hidden = parts.length === 0;
  if (!parts.length) return;
  if (typographyEditorWidgetId !== widget.id || !parts.some((part) => part.key === activeTypographyPart)) {
    typographyEditorWidgetId = widget.id;
    activeTypographyPart = parts[0].key;
  }
  controls.typographyPart.replaceChildren(...parts.map((part) => {
    const option = document.createElement('option');
    option.value = part.key;
    option.textContent = part.label;
    return option;
  }));
  controls.typographyPart.value = activeTypographyPart;
  const part = parts.find((item) => item.key === activeTypographyPart);
  const setting = widget.typography?.[activeTypographyPart] || {};
  controls.partFontFamily.value = setting.fontFamily || '';
  controls.partFontSize.value = Number.isFinite(setting.fontSize) ? setting.fontSize : '';
  controls.partFontSize.placeholder = `默认 ${part.usesWidgetSize ? widget.fontSize : part.defaultSize}px`;
  controls.partFontWeight.value = Number.isFinite(setting.fontWeight) ? String(setting.fontWeight) : '';
}

function updateTypographySetting(key, value, refreshEditor = true) {
  const widget = selectedWidget();
  if (!widget || !activeTypographyPart) return;
  widget.typography ||= {};
  widget.typography[activeTypographyPart] ||= {};
  if (value === '' || value === null) delete widget.typography[activeTypographyPart][key];
  else widget.typography[activeTypographyPart][key] = value;
  if (Object.keys(widget.typography[activeTypographyPart]).length === 0) delete widget.typography[activeTypographyPart];
  renderWidget(widget);
  if (refreshEditor) renderTypographyEditor(widget);
}

function renderVariantChoices(widget) {
  const variants = variantSets[widget.type];
  controls.variantControl.hidden = !variants;
  controls.variantControl.style.display = variants ? 'grid' : 'none';
  controls.variantChoices.replaceChildren();
  if (!variants) return;
  controls.variantLabel.textContent = '日期 / 时间 / 场地款式（三选一）';
  variants.forEach((variant) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `variant-choice${widget.variant === variant.value ? ' active' : ''}`;
    button.textContent = `${variant.label}\n${variant.name}`;
    button.addEventListener('click', () => {
      widget.variant = variant.value;
      renderWidget(widget);
      renderVariantChoices(widget);
    });
    controls.variantChoices.append(button);
  });
}

function bindWidgetEvents(el, id) {
  el.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    selectWidget(id);
  });

  el.querySelector('.widget-titlebar').addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const widget = state.widgets.find((item) => item.id === id);
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = widget.x;
    const originY = widget.y;
    const move = (moveEvent) => {
      widget.x = snap(clamp(originX + (moveEvent.clientX - startX) * state.width / rect.width, 0, state.width - widget.w));
      widget.y = snap(clamp(originY + (moveEvent.clientY - startY) * state.height / rect.height, 0, state.height - widget.h));
      renderWidget(widget);
      updateEditor();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  el.querySelector('.resize-handle').addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const widget = state.widgets.find((item) => item.id === id);
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originW = widget.w;
    const originH = widget.h;
    const move = (moveEvent) => {
      const isFreeform = ['image', 'text'].includes(widget.type);
      const minWidth = isFreeform ? 40 : widget.type === 'time' ? 360 : widget.type === 'calendar' ? 280 : 170;
      const minHeight = isFreeform ? 40 : widget.type === 'time' ? 210 : widget.type === 'calendar' ? 250 : widget.type === 'address' ? (widget.minContentHeight || 110) : 110;
      widget.w = snap(clamp(originW + (moveEvent.clientX - startX) * state.width / rect.width, minWidth, state.width - widget.x));
      widget.h = snap(clamp(originH + (moveEvent.clientY - startY) * state.height / rect.height, minHeight, state.height - widget.y));
      renderWidget(widget);
      updateEditor();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

function updateSelected(key, value) {
  const widget = selectedWidget();
  if (!widget) return;
  widget[key] = value;
  renderWidget(widget);
  updateEditor();
}

function setRatio(ratio) {
  const [nextW, nextH] = dimensions[ratio];
  const scaleX = nextW / state.width;
  const scaleY = nextH / state.height;
  state.widgets.forEach((widget) => {
    widget.x = snap(widget.x * scaleX);
    widget.y = snap(widget.y * scaleY);
    widget.w = snap(widget.w * scaleX);
    widget.h = snap(widget.h * scaleY);
  });
  state.width = nextW;
  state.height = nextH;
  fitStage();
  renderAll();
}

function drawBevel(ctx, x, y, w, h, outer = true) {
  ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = outer ? '#ffffff' : '#404040';
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.strokeStyle = outer ? '#151515' : '#ffffff';
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const char of text) {
    if (char === '\n') { ctx.fillText(line, x, y); line = ''; y += lineHeight; continue; }
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y); line = char; y += lineHeight; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawAnalogClock(ctx, cx, cy, radius, hour, minute) {
  ctx.save();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6 - Math.PI / 2;
    const inner = radius - (index % 3 === 0 ? 9 : 6);
    ctx.lineWidth = index % 3 === 0 ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * (radius - 2), cy + Math.sin(angle) * (radius - 2));
    ctx.stroke();
  }
  const hourAngle = (((Number(hour) % 12) * 30) + Number(minute) * .5) * Math.PI / 180 - Math.PI / 2;
  const minuteAngle = Number(minute) * 6 * Math.PI / 180 - Math.PI / 2;
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hourAngle) * radius * .5, cy + Math.sin(hourAngle) * radius * .5); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(minuteAngle) * radius * .72, cy + Math.sin(minuteAngle) * radius * .72); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

async function drawWidget(ctx, widget) {
  const themes = { blue: '#000080', teal: '#007c7c', gray: '#555555', pink: '#a53d77' };
  const titleColor = themes[widget.theme];
  if (widget.type === 'image') {
    if (!widget.imageUrl) return;
    const image = await loadImage(widget.imageUrl);
    const scale = Math.min(widget.w / image.width, widget.h / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, widget.x + (widget.w - width) / 2, widget.y + (widget.h - height) / 2, width, height);
    return;
  }
  if (widget.type === 'text') {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `700 ${widget.fontSize}px ${WIN98_FONT}`;
    const underlineY = widget.y + widget.h / 2 + widget.fontSize * .62;
    const underlineX = widget.x + widget.w * .04;
    const underlineW = widget.w * .92;
    const underlineH = Math.max(4, widget.fontSize * .07);
    ctx.fillStyle = 'rgba(3, 23, 35, .82)';
    ctx.fillText(widget.content, widget.x + widget.w / 2 + 3, widget.y + widget.h / 2 + 4, widget.w);
    ctx.fillRect(underlineX + 3, underlineY + 4, underlineW, underlineH);
    ctx.fillStyle = widget.textColor || '#ffe744';
    ctx.fillText(widget.content, widget.x + widget.w / 2, widget.y + widget.h / 2, widget.w);
    ctx.fillRect(underlineX, underlineY, underlineW, underlineH);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    return;
  }
  if (widget.shadow) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(widget.x + 9, widget.y + 10, widget.w, widget.h); }
  drawBevel(ctx, widget.x, widget.y, widget.w, widget.h);
  ctx.fillStyle = titleColor; ctx.fillRect(widget.x + 4, widget.y + 4, widget.w - 8, 34);
  const titleFontSize = widget.type === 'calendar' ? 14 : 22;
  ctx.fillStyle = '#fff'; ctx.font = `700 ${titleFontSize}px ${WIN98_FONT}`; ctx.textBaseline = 'middle';
  ctx.fillText(widget.title, widget.x + 10, widget.y + 21, widget.w - 112);
  ['_', '□', '×'].forEach((label, index) => {
    const bx = widget.x + widget.w - 81 + index * 25;
    drawBevel(ctx, bx, widget.y + 8, 23, 23);
    ctx.fillStyle = '#111'; ctx.font = '17px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, bx + 11, widget.y + 19);
  });
  ctx.textAlign = 'left';
  const bx = widget.x + 10, by = widget.y + 44, bw = widget.w - 20, bh = widget.h - 54;
  ctx.fillStyle = '#e9f3e8'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#101010'; ctx.textBaseline = 'top';
  const family = widget.type === 'time' || widget.type === 'lineup' ? 'monospace' : 'serif';
  ctx.font = `${widget.type === 'lineup' ? 'bold ' : ''}${widget.fontSize}px ${family}`;
  if (widget.type === 'time') {
    const [date = '', weekday = '星期六', time = '', venue = 'VENUE'] = widget.content.split('\n');
    const [hour = '00', minute = '00'] = time.match(/\d+/g) || [];
    const weekdayNames = { 星期一: 'MON', 星期二: 'TUE', 星期三: 'WED', 星期四: 'THU', 星期五: 'FRI', 星期六: 'SAT', 星期日: 'SUN', 周一: 'MON', 周二: 'TUE', 周三: 'WED', 周四: 'THU', 周五: 'FRI', 周六: 'SAT', 周日: 'SUN' };
    const weekdayText = weekdayNames[weekday] || weekday.replace(/[()]/g, '');
    const dateSize = win98FontSize(widget.fontSize);
    const timeSize = dateSize;
    const baseSize = Math.max(22, dateSize - 11);
    const statusH = Math.max(48, Math.round(baseSize * 1.35 + 10));
    const mainX = bx + 7;
    const mainY = by + 7;
    const mainW = bw - 14;
    const mainH = bh - statusH - 14;
    const clockW = 106;
    const clockX = mainX + clockW / 2;
    const clockY = mainY + mainH / 2;
    const rightX = mainX + clockW;
    const rightW = mainW - clockW;
    ctx.fillStyle = '#e9f3e8'; ctx.fillRect(mainX, mainY, mainW, mainH);
    ctx.strokeStyle = '#31585f'; ctx.lineWidth = 3; ctx.strokeRect(mainX, mainY, mainW, mainH);
    ctx.beginPath(); ctx.moveTo(rightX, mainY); ctx.lineTo(rightX, mainY + mainH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rightX, mainY + mainH / 2); ctx.lineTo(mainX + mainW, mainY + mainH / 2); ctx.stroke();
    drawAnalogClock(ctx, clockX, clockY, 33, hour, minute);
    ctx.fillStyle = '#071d35'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const dateX = rightX + Math.round(dateSize * .45);
    const timeX = dateX;
    ctx.font = `700 ${dateSize}px ${WIN98_FONT}`;
    ctx.fillText(date, dateX, mainY + mainH * .25, rightW - dateSize * .9);
    ctx.font = `700 ${timeSize}px ${WIN98_FONT}`;
    const timeText = `${hour}:${minute}`;
    ctx.fillText(timeText, timeX, mainY + mainH * .75, rightW * .58);
    const weekdayX = timeX + ctx.measureText(timeText).width + timeSize * .65;
    ctx.font = `700 ${baseSize}px ${WIN98_FONT}`;
    ctx.fillText(`(${weekdayText})`, weekdayX, mainY + mainH * .75, rightX + rightW - weekdayX - baseSize * .45);

    const statusY = mainY + mainH;
    ctx.fillStyle = '#e9f3e8'; ctx.fillRect(mainX, statusY, mainW, statusH);
    ctx.strokeStyle = '#31585f'; ctx.lineWidth = 3; ctx.strokeRect(mainX, statusY, mainW, statusH);
    const iconScale = baseSize / 22;
    const pinX = mainX + 25 * iconScale, pinY = statusY + statusH / 2;
    ctx.fillStyle = '#071d35'; ctx.beginPath(); ctx.arc(pinX, pinY - 5 * iconScale, 11 * iconScale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pinX - 8 * iconScale, pinY + iconScale); ctx.lineTo(pinX, pinY + 15 * iconScale); ctx.lineTo(pinX + 8 * iconScale, pinY + iconScale); ctx.fill();
    ctx.fillStyle = '#e9f3e8'; ctx.beginPath(); ctx.arc(pinX, pinY - 5 * iconScale, 4 * iconScale, 0, Math.PI * 2); ctx.fill();
    const venueX = mainX + 53 * iconScale;
    ctx.font = `700 ${baseSize}px ${WIN98_FONT}`; ctx.fillStyle = '#071d35'; ctx.fillText(venue, venueX, statusY + statusH / 2, mainX + mainW - venueX - baseSize * .45);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  } else if (widget.type === 'calendar') {
    const [date = '', weekday = '星期六', time = '20:00', venue = '@浴室Live · 免票入场'] = widget.content.split('\n');
    const [year = 2026, month = 10, day = 31] = (date.match(/\d+/g) || []).map(Number);
    const [hour = '20', minute = '00'] = time.match(/\d+/g) || [];
    const pad = 8;
    const venueH = 54;
    const mainX = bx + pad, mainY = by + pad, mainW = bw - pad * 2, mainH = bh - venueH - pad * 2;
    const leftW = Math.round(mainW * .55);
    const rightX = mainX + leftW + 8;
    const rightW = mainW - leftW - 8;
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(mainX, mainY, mainW, mainH + venueH + 4);
    ctx.strokeStyle = '#707070'; ctx.lineWidth = 2; ctx.strokeRect(mainX, mainY, leftW, mainH);
    ctx.strokeRect(rightX, mainY, rightW, mainH);
    ctx.fillStyle = '#fff'; ctx.fillRect(mainX + 7, mainY + 8, leftW - 14, 28);
    ctx.strokeStyle = '#333'; ctx.strokeRect(mainX + 7, mainY + 8, leftW - 14, 28);
    ctx.fillStyle = '#111'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `700 12px ${WIN98_FONT}`;
    ctx.fillText(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`, mainX + 14, mainY + 22);
    ctx.textAlign = 'right'; ctx.fillText(weekday, mainX + leftW - 14, mainY + 22);
    const gridX = mainX + 8, gridY = mainY + 43, gridW = leftW - 16;
    const cellW = gridW / 7, cellH = Math.max(18, (mainH - 49) / 7);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 12px ${WIN98_FONT}`;
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((label, index) => ctx.fillText(label, gridX + cellW * (index + .5), gridY + cellH * .5));
    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    for (let value = 1; value <= totalDays; value += 1) {
      const slot = firstDay + value - 1;
      const col = slot % 7, row = Math.floor(slot / 7) + 1;
      const cx = gridX + cellW * (col + .5), cy = gridY + cellH * (row + .5);
      if (value === day) { ctx.fillStyle = '#000080'; ctx.fillRect(cx - cellW * .34, cy - cellH * .38, cellW * .68, cellH * .76); ctx.fillStyle = '#fff'; }
      else ctx.fillStyle = '#111';
      ctx.fillText(String(value), cx, cy);
    }
    const clockRadius = Math.min(45, rightW * .3, mainH * .29);
    drawAnalogClock(ctx, rightX + rightW / 2, mainY + mainH * .43, clockRadius, hour, minute);
    const digitalW = Math.min(118, rightW - 24), digitalH = 28;
    const digitalX = rightX + (rightW - digitalW) / 2, digitalY = mainY + mainH - 39;
    ctx.fillStyle = '#fff'; ctx.fillRect(digitalX, digitalY, digitalW, digitalH);
    ctx.strokeStyle = '#333'; ctx.strokeRect(digitalX, digitalY, digitalW, digitalH);
    ctx.fillStyle = '#111'; ctx.font = `700 18px ${WIN98_FONT}`; ctx.textAlign = 'center'; ctx.fillText(`${hour}:${minute}`, rightX + rightW / 2, digitalY + digitalH / 2);
    const venueY = mainY + mainH + 8;
    ctx.strokeStyle = '#707070'; ctx.strokeRect(mainX, venueY, mainW, venueH - 8);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(mainX + 10, venueY - 7, 58, 15);
    ctx.fillStyle = '#111'; ctx.font = `700 12px ${WIN98_FONT}`; ctx.textAlign = 'left'; ctx.fillText('VENUE', mainX + 15, venueY);
    ctx.font = `700 18px ${WIN98_FONT}`; ctx.fillText(venue, mainX + 14, venueY + 27, mainW - 28);
    ctx.textBaseline = 'top';
  } else if (widget.type === 'lineup') {
    let y = by + 8;
    widget.content.split('\n').forEach((line) => {
      const box = 27;
      ctx.fillStyle = '#0c3654'; ctx.fillRect(bx + 13, y, box, box);
      ctx.strokeStyle = '#061d36'; ctx.lineWidth = 3; ctx.strokeRect(bx + 13, y, box, box);
      ctx.strokeStyle = '#53c468'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx + 18, y + 14); ctx.lineTo(bx + 24, y + 21); ctx.lineTo(bx + 36, y + 6); ctx.stroke();
      ctx.fillStyle = '#071d35'; ctx.font = `700 ${widget.fontSize}px ${WIN98_FONT}`; ctx.textBaseline = 'top'; ctx.fillText(line, bx + 53, y - 1, bw - 62);
      y += Math.max(37, widget.fontSize * 1.12);
    });
  } else if (widget.type === 'venue') {
    ctx.fillStyle = '#ededed'; ctx.fillRect(bx, by, bw * .25, bh);
    ctx.fillStyle = titleColor; ctx.textAlign = 'center'; ctx.font = `bold ${Math.min(54, widget.fontSize * 1.8)}px monospace`;
    const icon = widget.variant === 'folder' ? '▰' : widget.variant === 'building' ? '▦' : '⌖';
    ctx.fillText(icon, bx + bw * .125, by + 22);
    ctx.textAlign = 'left'; ctx.fillStyle = '#111'; ctx.font = `${widget.fontSize}px serif`;
    drawWrappedText(ctx, widget.content, bx + bw * .31, by + 16, bw * .65, widget.fontSize * 1.35);
  } else if (widget.type === 'address') {
    const pad = 7, mapW = Math.min(132, bw * .32), innerH = bh - pad * 2;
    const mapX = bx + pad, mapY = by + pad;
    ctx.fillStyle = '#075077'; ctx.fillRect(mapX, mapY, mapW, innerH);
    ctx.strokeStyle = '#57bed1'; ctx.lineWidth = 4;
    [[0,.22,1,.75], [.12,1,.72,0], [0,.66,1,.42]].forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(mapX + mapW*x1, mapY + innerH*y1); ctx.lineTo(mapX + mapW*x2, mapY + innerH*y2); ctx.stroke(); });
    const px = mapX + mapW * .58, py = mapY + innerH * .38;
    ctx.fillStyle = '#ffe744'; ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px - 8, py + 5); ctx.lineTo(px, py + 20); ctx.lineTo(px + 8, py + 5); ctx.fill();
    ctx.fillStyle = '#075077'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#31585f'; ctx.lineWidth = 3; ctx.strokeRect(mapX, mapY, mapW, innerH);
    ctx.fillStyle = '#071d35'; ctx.font = `700 ${widget.fontSize}px ${WIN98_FONT}`;
    drawWrappedText(ctx, widget.content, mapX + mapW + 14, mapY + 8, bw - mapW - 30, widget.fontSize * 1.18);
  } else {
    drawWrappedText(ctx, widget.content, bx + 18, by + 16, bw - 30, widget.fontSize * 1.35);
  }
}

async function exportPoster() {
  const button = document.querySelector('#exportButton');
  button.disabled = true;
  appStatus.textContent = 'EXPORTING...';
  stage.classList.add('exporting');
  try {
    await document.fonts.ready;
    const fontEmbedCSS = await htmlToImage.getFontEmbedCSS(stage, { cacheBust: true });
    const dataUrl = await htmlToImage.toPng(stage, {
      width: state.width,
      height: state.height,
      canvasWidth: state.width,
      canvasHeight: state.height,
      pixelRatio: 1,
      cacheBust: true,
      fontEmbedCSS,
      filter: (node) => {
        if (node instanceof HTMLImageElement && node.hidden) return false;
        return !node.classList?.contains('resize-handle') && !node.classList?.contains('empty-canvas-message');
      },
      style: { transform: 'none', transformOrigin: 'top left' },
    });
    const link = document.createElement('a');
    link.download = `win98-layout-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    appStatus.textContent = 'PNG EXPORTED';
  } catch (error) {
    console.error(error);
    appStatus.textContent = 'EXPORT FAILED';
  } finally {
    stage.classList.remove('exporting');
    button.disabled = false;
    setTimeout(() => { if (appStatus.textContent !== 'LAYOUT SAVED') appStatus.textContent = 'READY'; }, 1400);
  }
}

document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addWidget(button.dataset.add)));
stage.addEventListener('pointerdown', (event) => { if (event.target === stage || event.target === emptyCanvasMessage) { state.selectedId = null; renderAll(); } });
controls.title.addEventListener('input', (event) => updateSelected('title', event.target.value));
controls.content.addEventListener('input', (event) => updateSelected('content', event.target.value));
controls.theme.addEventListener('change', (event) => updateSelected('theme', event.target.value));
controls.fontSize.addEventListener('input', (event) => {
  const widget = selectedWidget();
  if (!widget || event.target.value === '') return;
  const value = Number(event.target.value);
  const min = ['time', 'calendar'].includes(widget.type) ? 22 : 12;
  const max = ['time', 'calendar'].includes(widget.type) ? 33 : widget.type === 'text' ? 120 : 72;
  if (!Number.isFinite(value) || value < min || value > max) return;
  widget.fontSize = ['time', 'calendar'].includes(widget.type) ? win98FontSize(value) : value;
  renderWidget(widget);
});
controls.fontSize.addEventListener('change', (event) => {
  const widget = selectedWidget();
  if (!widget) return;
  const min = ['time', 'calendar'].includes(widget.type) ? 22 : 12;
  const max = ['time', 'calendar'].includes(widget.type) ? 33 : widget.type === 'text' ? 120 : 72;
  const entered = Number(event.target.value);
  const value = Number.isFinite(entered) ? clamp(entered, min, max) : widget.fontSize;
  updateSelected('fontSize', ['time', 'calendar'].includes(widget.type) ? win98FontSize(value) : value);
});
controls.textColor.addEventListener('input', (event) => updateSelected('textColor', event.target.value));
controls.shadow.addEventListener('change', (event) => updateSelected('shadow', event.target.checked));
controls.typographyPart.addEventListener('change', (event) => {
  activeTypographyPart = event.target.value;
  const widget = selectedWidget();
  if (widget) renderTypographyEditor(widget);
});
controls.partFontFamily.addEventListener('change', (event) => updateTypographySetting('fontFamily', event.target.value));
controls.partFontSize.addEventListener('input', (event) => {
  if (event.target.value === '') return;
  const value = Number(event.target.value);
  if (!Number.isFinite(value) || value < 8 || value > 120) return;
  updateTypographySetting('fontSize', value, false);
});
controls.partFontSize.addEventListener('change', (event) => {
  if (event.target.value === '') {
    updateTypographySetting('fontSize', '');
    return;
  }
  updateTypographySetting('fontSize', clamp(Number(event.target.value), 8, 120));
});
controls.partFontWeight.addEventListener('change', (event) => {
  updateTypographySetting('fontWeight', event.target.value === '' ? '' : Number(event.target.value));
});
controls.resetTypography.addEventListener('click', () => {
  const widget = selectedWidget();
  if (!widget?.typography || !activeTypographyPart) return;
  delete widget.typography[activeTypographyPart];
  renderWidget(widget);
  renderTypographyEditor(widget);
});
document.querySelector('#deleteButton').addEventListener('click', () => {
  state.widgets = state.widgets.filter((item) => item.id !== state.selectedId);
  state.selectedId = null; renderAll();
});
document.querySelector('#duplicateButton').addEventListener('click', () => {
  const widget = selectedWidget(); if (!widget) return;
  const copy = { ...widget, typography: structuredClone(widget.typography || {}), id: state.nextId++, x: clamp(widget.x + 32, 0, state.width - widget.w), y: clamp(widget.y + 32, 0, state.height - widget.h), z: ++state.topZ };
  state.widgets.push(copy); state.selectedId = copy.id; renderAll();
});
document.querySelector('#frontButton').addEventListener('click', () => { const widget = selectedWidget(); if (widget) { widget.z = ++state.topZ; renderAll(); } });
document.querySelector('#ratioSelect').addEventListener('change', (event) => setRatio(event.target.value));
latinFontSelect.addEventListener('change', (event) => {
  state.latinFontFamily = event.target.value;
  applyPosterFont();
});
cjkFontSelect.addEventListener('change', (event) => {
  state.cjkFontFamily = event.target.value;
  applyPosterFont();
});
document.querySelector('#gridToggle').addEventListener('change', (event) => stage.classList.toggle('grid-on', event.target.checked));
document.querySelector('#snapToggle').addEventListener('change', (event) => { state.snap = event.target.checked; });
document.querySelector('#bgOpacity').addEventListener('input', (event) => {
  state.backgroundOpacity = Number(event.target.value) / 100;
  document.querySelector('#bgOpacityValue').textContent = `${event.target.value}%`;
  stage.style.opacity = 1;
  stage.style.setProperty('--bg-opacity', state.backgroundOpacity);
  if (state.backgroundUrl) setBackground(state.backgroundUrl);
});
backgroundInput.addEventListener('change', (event) => {
  const [file] = event.target.files; if (!file) return;
  const reader = new FileReader(); reader.onload = () => setBackground(reader.result); reader.readAsDataURL(file);
});
imageInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const source = new Image();
    source.onload = () => {
      addWidget('image');
      const widget = selectedWidget();
      const scale = Math.min(360 / source.width, 280 / source.height, 1);
      widget.w = Math.max(40, Math.round(source.width * scale));
      widget.h = Math.max(40, Math.round(source.height * scale));
      widget.imageUrl = reader.result;
      widget.shadow = false;
      renderAll();
      imageInput.value = '';
    };
    source.src = reader.result;
  };
  reader.readAsDataURL(file);
});
document.querySelector('#uploadImageCard').addEventListener('click', () => imageInput.click());
document.querySelector('#saveLayoutButton').addEventListener('click', async () => {
  const button = document.querySelector('#saveLayoutButton');
  button.disabled = true;
  appStatus.textContent = 'SAVING...';
  try {
    await writeSavedLayout();
    appStatus.textContent = 'LAYOUT SAVED';
    button.textContent = '已保存';
    setTimeout(() => { appStatus.textContent = 'READY'; button.textContent = '保存当前布局'; button.disabled = false; }, 1400);
  } catch (error) {
    console.error(error);
    appStatus.textContent = 'SAVE FAILED';
    button.disabled = false;
  }
});
document.querySelector('#clearBackground').addEventListener('click', () => { backgroundInput.value = ''; setBackground(''); });
document.querySelector('#exportButton').addEventListener('click', exportPoster);
window.addEventListener('resize', fitStage);
window.addEventListener('keydown', (event) => {
  const widget = selectedWidget();
  if (!widget || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  const delta = event.shiftKey ? 8 : 1;
  if (event.key === 'Delete' || event.key === 'Backspace') { state.widgets = state.widgets.filter((item) => item.id !== widget.id); state.selectedId = null; renderAll(); }
  if (event.key === 'ArrowLeft') widget.x = clamp(widget.x - delta, 0, state.width - widget.w);
  if (event.key === 'ArrowRight') widget.x = clamp(widget.x + delta, 0, state.width - widget.w);
  if (event.key === 'ArrowUp') widget.y = clamp(widget.y - delta, 0, state.height - widget.h);
  if (event.key === 'ArrowDown') widget.y = clamp(widget.y + delta, 0, state.height - widget.h);
  if (event.key.startsWith('Arrow')) { event.preventDefault(); renderWidget(widget); updateEditor(); }
});

async function initialize() {
  applyPosterFont();
  fitStage();
  try {
    const saved = await readSavedLayout();
    if (saved && Array.isArray(saved.widgets)) {
      const restoredWidgets = saved.widgets.map((widget) => {
        if ((saved.schemaVersion || 0) < 2 && widget.type === 'time') return { ...widget, fontSize: 33 };
        if ((saved.schemaVersion || 0) < 4 && widget.type === 'calendar') return { ...widget, title: 'DATE.VENUE' };
        return widget;
      });
      if ((saved.schemaVersion || 0) < 3 && !restoredWidgets.some((widget) => widget.type === 'calendar')) {
        const width = saved.width || state.width;
        const height = saved.height || state.height;
        const nextCalendarId = Math.max(saved.nextId || 1, ...restoredWidgets.map((widget) => Number(widget.id) + 1));
        restoredWidgets.push({
          ...presets.calendar,
          id: nextCalendarId,
          type: 'calendar',
          x: clamp(Math.round(width * .126), 0, width - presets.calendar.w),
          y: clamp(Math.round(height * .753), 0, height - presets.calendar.h),
          z: Math.max(0, ...restoredWidgets.map((widget) => widget.z || 0)) + 1,
          shadow: true,
        });
      }
      state = {
        ...state,
        ...saved,
        latinFontFamily: saved.latinFontFamily || saved.fontFamily || 'pixel',
        cjkFontFamily: saved.cjkFontFamily || (saved.fontFamily === 'pixel' ? 'pingfang' : saved.fontFamily) || 'pingfang',
        widgets: restoredWidgets,
        selectedId: null,
        nextId: Math.max(saved.nextId || 1, ...restoredWidgets.map((widget) => Number(widget.id) + 1)),
      };
      document.querySelector('#ratioSelect').value = saved.ratio || '3:4';
      applyPosterFont();
      document.querySelector('#gridToggle').checked = saved.grid !== false;
      stage.classList.toggle('grid-on', saved.grid !== false);
      document.querySelector('#snapToggle').checked = saved.snap !== false;
      document.querySelector('#bgOpacity').value = Math.round((saved.backgroundOpacity ?? 1) * 100);
      document.querySelector('#bgOpacityValue').textContent = `${document.querySelector('#bgOpacity').value}%`;
      setBackground(saved.backgroundUrl || '');
      fitStage();
      renderAll();
      appStatus.textContent = 'LAYOUT RESTORED';
      setTimeout(() => { appStatus.textContent = 'READY'; }, 1400);
      return;
    }
  } catch (error) {
    console.error(error);
    appStatus.textContent = 'RESTORE FAILED';
  }
  addWidget('lineup');
  addWidget('time');
  addWidget('address');
  addWidget('calendar');
}

initialize();
