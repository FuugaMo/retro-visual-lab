const stage = document.querySelector('#posterStage');
const scaler = document.querySelector('#stageScaler');
const viewport = document.querySelector('#stageViewport');
const backgroundInput = document.querySelector('#backgroundInput');
const logoInput = document.querySelector('#logoInput');
const emptyCanvasMessage = document.querySelector('#emptyCanvasMessage');
const canvasStatus = document.querySelector('#canvasStatus');
const selectionStatus = document.querySelector('#selectionStatus');

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
  venueSizeControl: document.querySelector('#venueSizeControl'),
  venueFontSize: document.querySelector('#venueFontSizeInput'),
  venueFontSizeValue: document.querySelector('#venueFontSizeValue'),
  fontSizeChoices: document.querySelector('#fontSizeChoices'),
};

const dimensions = {
  '3:4': [900, 1200],
  '4:3': [1200, 900],
  '9:16': [720, 1280],
  '1:1': [1000, 1000],
};

const presets = {
  lineup: { title: 'LINE-UP.EXE', content: '夜间疾走\nRunning in the 00s\nTouch Grass', w: 430, h: 198, fontSize: 27, theme: 'blue', startX: 40, startY: 100 },
  time: { title: 'DATE-TIME-VENUE', content: '2026 / 10 / 31\n星期六\n20:00\n@浴室Live · 免费入场', w: 500, h: 250, fontSize: 33, venueFontSize: 25, theme: 'blue', variant: 'segmented', startX: 390, startY: 620 },
  address: { title: 'ADDRESS.LOCATION', content: '中国广东省珠海市金湾区\n敏德巷1号', w: 470, h: 164, fontSize: 24, theme: 'blue', startX: 420, startY: 980 },
  organizer: { title: 'ORGANIZER', content: '主办方名称', w: 360, h: 210, fontSize: 24, theme: 'pink', logoUrl: '' },
};

const variantSets = {};

const fontSizeSets = {
  time: [22, 33],
  default: [14, 18, 22, 26, 32, 40, 48, 56, 64, 72],
};

const WIN98_FONT = '"Pixelated MS Sans Serif", "MS Sans Serif", sans-serif';

let state = {
  width: 900,
  height: 1200,
  backgroundUrl: '',
  backgroundOpacity: 1,
  selectedId: null,
  nextId: 1,
  topZ: 4,
  snap: true,
  widgets: [],
};

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function win98FontSize(value) { return Number(value) < 28 ? 22 : 33; }
function snap(value) { return state.snap ? Math.round(value / 8) * 8 : Math.round(value); }

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
  stage.style.backgroundImage = url ? `url("${url}")` : '';
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
  el.style.setProperty('--venue-font-size', `${widget.venueFontSize || 20}px`);
  el.style.setProperty('--address-font-size', `${widget.fontSize}px`);
  el.classList.toggle('selected', widget.id === state.selectedId);
  el.classList.toggle('no-shadow', !widget.shadow);
  Object.assign(el.style, {
    left: `${widget.x}px`, top: `${widget.y}px`, width: `${widget.w}px`, height: `${widget.h}px`, zIndex: widget.z,
  });
  el.querySelector('.widget-title').textContent = widget.title;
  const lineRoot = el.querySelector('.widget-lines');
  const specialRoot = el.querySelector('.widget-special');
  const logo = el.querySelector('.widget-logo');
  lineRoot.style.fontSize = `${widget.fontSize}px`;
  specialRoot.replaceChildren();
  const specialFontSize = widget.type === 'time' ? win98FontSize(widget.fontSize) : widget.fontSize;
  specialRoot.style.fontSize = `${specialFontSize}px`;
  specialRoot.style.setProperty('--win98-time-size', `${specialFontSize}px`);
  specialRoot.hidden = !['time', 'address'].includes(widget.type);
  logo.hidden = widget.type !== 'organizer' || !widget.logoUrl;
  el.classList.toggle('no-logo', widget.type === 'organizer' && !widget.logoUrl);
  if (!logo.hidden) logo.src = widget.logoUrl;
  lineRoot.hidden = ['time', 'address'].includes(widget.type);
  if (widget.type === 'lineup') {
    lineRoot.replaceChildren(...widget.content.split('\n').map((line) => {
      const span = document.createElement('span');
      span.textContent = line || ' ';
      return span;
    }));
  } else if (widget.type === 'time') {
    renderDateTime(specialRoot, widget);
  } else if (widget.type === 'address') {
    renderAddress(specialRoot, widget);
  } else {
    lineRoot.textContent = widget.content;
  }
  if (widget.type === 'address') {
    const requiredHeight = clamp(Math.ceil(lineRoot.scrollHeight + 74), 110, state.height - widget.y);
    widget.minContentHeight = requiredHeight;
    if (widget.h < requiredHeight) widget.h = requiredHeight;
    el.style.height = `${widget.h}px`;
  }
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
  const useStartPosition = !state.widgets.some((item) => item.type === type) && Number.isFinite(preset.startX);
  const widget = {
    ...preset,
    id: state.nextId++,
    type,
    x: snap(clamp(useStartPosition ? preset.startX : 70 + offset, 0, state.width - preset.w)),
    y: snap(clamp(useStartPosition ? preset.startY : 90 + offset, 0, state.height - preset.h)),
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
    controls.venueSizeControl.hidden = true;
    controls.venueSizeControl.style.display = 'none';
    selectionStatus.textContent = 'NO WIDGET SELECTED';
    return;
  }
  controls.title.value = widget.title;
  controls.content.value = widget.content;
  controls.theme.value = widget.theme;
  controls.fontSize.value = widget.fontSize;
  controls.fontSize.min = widget.type === 'time' ? 22 : 12;
  controls.fontSize.max = widget.type === 'time' ? 33 : 72;
  controls.shadow.checked = widget.shadow;
  const showVenueSize = widget.type === 'time';
  controls.venueSizeControl.hidden = !showVenueSize;
  controls.venueSizeControl.style.display = showVenueSize ? 'grid' : 'none';
  if (showVenueSize) {
    controls.venueFontSize.value = widget.venueFontSize || 20;
    controls.venueFontSizeValue.textContent = `${widget.venueFontSize || 20}px`;
  }
  renderVariantChoices(widget);
  renderFontSizeChoices(widget);
  selectionStatus.textContent = `${widget.type.toUpperCase()} · X ${widget.x} · Y ${widget.y} · ${widget.w} × ${widget.h}`;
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

function renderFontSizeChoices(widget) {
  const sizes = widget.type === 'time' ? fontSizeSets.time : fontSizeSets.default;
  controls.fontSizeChoices.replaceChildren();
  sizes.forEach((size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `size-choice${Number(widget.fontSize) === size ? ' active' : ''}`;
    button.textContent = size;
    button.title = `${size}px`;
    button.addEventListener('click', () => {
      widget.fontSize = size;
      controls.fontSize.value = size;
      renderWidget(widget);
      renderFontSizeChoices(widget);
      updateEditor();
    });
    controls.fontSizeChoices.append(button);
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
      const minWidth = widget.type === 'time' ? 360 : 170;
      const minHeight = widget.type === 'time' ? 210 : widget.type === 'address' ? (widget.minContentHeight || 110) : 110;
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
  if (widget.shadow) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(widget.x + 9, widget.y + 10, widget.w, widget.h); }
  drawBevel(ctx, widget.x, widget.y, widget.w, widget.h);
  ctx.fillStyle = titleColor; ctx.fillRect(widget.x + 4, widget.y + 4, widget.w - 8, 34);
  ctx.fillStyle = '#fff'; ctx.font = `700 22px ${WIN98_FONT}`; ctx.textBaseline = 'middle';
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
    const timeBase = win98FontSize(widget.fontSize);
    const venueSize = clamp(widget.venueFontSize || 20, 14, 32);
    const statusH = Math.max(48, Math.round(venueSize * 1.35 + 10));
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
    ctx.font = `700 22px ${WIN98_FONT}`;
    ctx.fillText(date, rightX + 18, mainY + mainH * .25, rightW - 30);
    ctx.font = `700 ${timeBase}px ${WIN98_FONT}`;
    ctx.fillText(`${hour}:${minute}`, rightX + 18, mainY + mainH * .75, rightW * .52);
    ctx.font = `700 22px ${WIN98_FONT}`;
    ctx.fillText(`(${weekdayText})`, rightX + rightW * .56, mainY + mainH * .75, rightW * .4);

    const statusY = mainY + mainH;
    ctx.fillStyle = '#e9f3e8'; ctx.fillRect(mainX, statusY, mainW, statusH);
    ctx.strokeStyle = '#31585f'; ctx.lineWidth = 3; ctx.strokeRect(mainX, statusY, mainW, statusH);
    const pinX = mainX + 25, pinY = statusY + statusH / 2;
    ctx.fillStyle = '#071d35'; ctx.beginPath(); ctx.arc(pinX, pinY - 5, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(pinX - 8, pinY + 1); ctx.lineTo(pinX, pinY + 15); ctx.lineTo(pinX + 8, pinY + 1); ctx.fill();
    ctx.fillStyle = '#e9f3e8'; ctx.beginPath(); ctx.arc(pinX, pinY - 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = `700 ${venueSize}px ${WIN98_FONT}`; ctx.fillStyle = '#071d35'; ctx.fillText(venue, mainX + 53, statusY + statusH / 2, mainW - 64);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  } else if (widget.type === 'lineup') {
    let y = by + 8;
    widget.content.split('\n').forEach((line) => {
      const box = 27;
      ctx.fillStyle = '#0c3654'; ctx.fillRect(bx + 13, y, box, box);
      ctx.strokeStyle = '#061d36'; ctx.lineWidth = 3; ctx.strokeRect(bx + 13, y, box, box);
      ctx.strokeStyle = '#53c468'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx + 18, y + 14); ctx.lineTo(bx + 24, y + 21); ctx.lineTo(bx + 36, y + 6); ctx.stroke();
      ctx.fillStyle = '#071d35'; ctx.font = `bold ${widget.fontSize}px sans-serif`; ctx.textBaseline = 'top'; ctx.fillText(line, bx + 53, y - 1, bw - 62);
      y += Math.max(37, widget.fontSize * 1.12);
    });
  } else if (widget.type === 'venue') {
    ctx.fillStyle = '#ededed'; ctx.fillRect(bx, by, bw * .25, bh);
    ctx.fillStyle = titleColor; ctx.textAlign = 'center'; ctx.font = `bold ${Math.min(54, widget.fontSize * 1.8)}px monospace`;
    const icon = widget.variant === 'folder' ? '▰' : widget.variant === 'building' ? '▦' : '⌖';
    ctx.fillText(icon, bx + bw * .125, by + 22);
    ctx.textAlign = 'left'; ctx.fillStyle = '#111'; ctx.font = `${widget.fontSize}px serif`;
    drawWrappedText(ctx, widget.content, bx + bw * .31, by + 16, bw * .65, widget.fontSize * 1.35);
  } else if (widget.type === 'organizer') {
    let textX = bx + 18;
    if (widget.logoUrl) {
      const logo = await loadImage(widget.logoUrl);
      const boxW = bw * .36, boxH = bh - 28;
      const scale = Math.min(boxW / logo.width, boxH / logo.height);
      const lw = logo.width * scale, lh = logo.height * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(logo, bx + 12 + (boxW - lw) / 2, by + 14 + (boxH - lh) / 2, lw, lh);
      textX = bx + boxW + 24;
    }
    ctx.fillStyle = '#111'; ctx.font = `bold ${widget.fontSize}px monospace`;
    drawWrappedText(ctx, widget.content, textX, by + 18, bx + bw - textX - 12, widget.fontSize * 1.35);
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
    ctx.fillStyle = '#071d35'; ctx.font = `bold ${widget.fontSize}px sans-serif`;
    drawWrappedText(ctx, widget.content, mapX + mapW + 14, mapY + 8, bw - mapW - 30, widget.fontSize * 1.18);
  } else {
    drawWrappedText(ctx, widget.content, bx + 18, by + 16, bw - 30, widget.fontSize * 1.35);
  }
}

async function exportPoster() {
  await Promise.all([
    document.fonts.load(`400 22px ${WIN98_FONT}`),
    document.fonts.load(`700 33px ${WIN98_FONT}`),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = state.width;
  canvas.height = state.height;
  const ctx = canvas.getContext('2d');
  if (state.backgroundUrl) {
    const image = new Image();
    image.src = state.backgroundUrl;
    await image.decode();
    const scale = Math.max(state.width / image.width, state.height / image.height);
    const w = image.width * scale, h = image.height * scale;
    ctx.globalAlpha = state.backgroundOpacity;
    ctx.drawImage(image, (state.width - w) / 2, (state.height - h) / 2, w, h);
    ctx.globalAlpha = 1;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, '#2b5551'); gradient.addColorStop(1, '#090f12');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, state.width, state.height);
  }
  for (const widget of [...state.widgets].sort((a, b) => a.z - b.z)) {
    await drawWidget(ctx, widget);
  }
  const link = document.createElement('a');
  link.download = `win98-layout-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addWidget(button.dataset.add)));
stage.addEventListener('pointerdown', (event) => { if (event.target === stage || event.target === emptyCanvasMessage) { state.selectedId = null; renderAll(); } });
controls.title.addEventListener('input', (event) => updateSelected('title', event.target.value));
controls.content.addEventListener('input', (event) => updateSelected('content', event.target.value));
controls.theme.addEventListener('change', (event) => updateSelected('theme', event.target.value));
controls.fontSize.addEventListener('input', (event) => {
  const widget = selectedWidget();
  const value = Number(event.target.value) || 12;
  updateSelected('fontSize', widget?.type === 'time' ? win98FontSize(value) : clamp(value, 12, 72));
});
controls.shadow.addEventListener('change', (event) => updateSelected('shadow', event.target.checked));
controls.venueFontSize.addEventListener('input', (event) => {
  const value = clamp(Number(event.target.value), 14, 32);
  controls.venueFontSizeValue.textContent = `${value}px`;
  updateSelected('venueFontSize', value);
});

document.querySelector('#deleteButton').addEventListener('click', () => {
  state.widgets = state.widgets.filter((item) => item.id !== state.selectedId);
  state.selectedId = null; renderAll();
});
document.querySelector('#duplicateButton').addEventListener('click', () => {
  const widget = selectedWidget(); if (!widget) return;
  const copy = { ...widget, id: state.nextId++, x: clamp(widget.x + 32, 0, state.width - widget.w), y: clamp(widget.y + 32, 0, state.height - widget.h), z: ++state.topZ };
  state.widgets.push(copy); state.selectedId = copy.id; renderAll();
});
document.querySelector('#frontButton').addEventListener('click', () => { const widget = selectedWidget(); if (widget) { widget.z = ++state.topZ; renderAll(); } });
document.querySelector('#ratioSelect').addEventListener('change', (event) => setRatio(event.target.value));
document.querySelector('#gridToggle').addEventListener('change', (event) => stage.classList.toggle('grid-on', event.target.checked));
document.querySelector('#snapToggle').addEventListener('change', (event) => { state.snap = event.target.checked; });
document.querySelector('#bgOpacity').addEventListener('input', (event) => {
  state.backgroundOpacity = Number(event.target.value) / 100;
  document.querySelector('#bgOpacityValue').textContent = `${event.target.value}%`;
  stage.style.opacity = 1;
  stage.style.setProperty('--bg-opacity', state.backgroundOpacity);
  if (state.backgroundUrl) stage.style.backgroundImage = `linear-gradient(rgba(24,34,33,${1 - state.backgroundOpacity}), rgba(24,34,33,${1 - state.backgroundOpacity})), url("${state.backgroundUrl}")`;
});
backgroundInput.addEventListener('change', (event) => {
  const [file] = event.target.files; if (!file) return;
  const reader = new FileReader(); reader.onload = () => setBackground(reader.result); reader.readAsDataURL(file);
});
logoInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let widget = state.widgets.find((item) => item.type === 'organizer');
    if (!widget) {
      addWidget('organizer');
      widget = selectedWidget();
    }
    widget.logoUrl = reader.result;
    state.selectedId = widget.id;
    renderAll();
  };
  reader.readAsDataURL(file);
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

fitStage();
addWidget('lineup');
addWidget('time');
addWidget('address');
