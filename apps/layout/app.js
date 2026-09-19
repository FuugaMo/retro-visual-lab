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
  lineup: { title: 'LINE-UP', content: '夜间疾走\nRunning in the 00s\nTouch Grass', w: 360, h: 250, fontSize: 26, theme: 'blue' },
  time: { title: 'DATE / TIME / VENUE', content: '2026 / 10 / 31\n星期六\n20:00\n珠海浴室', w: 460, h: 250, fontSize: 32, venueFontSize: 20, theme: 'blue', variant: 'segmented' },
  address: { title: 'ADDRESS', content: '中国广东省珠海市金湾区敏德巷 1 号', w: 410, h: 220, fontSize: 25, theme: 'gray' },
  organizer: { title: 'ORGANIZER', content: '主办方名称', w: 360, h: 210, fontSize: 24, theme: 'pink', logoUrl: '' },
};

const variantSets = {
  time: [
    { value: 'segmented', label: '六  20:00\n2026│10│31', name: 'A 分段字段' },
    { value: 'compact', label: '六  20:00\n▣ 2026/10/31', name: 'B 紧凑左对齐' },
    { value: 'datefirst', label: '2026/10/31\n六 │ 20:00', name: 'C 日期优先' },
  ],
};

const fontSizeSets = {
  time: [28, 30, 32, 34],
  default: [14, 18, 22, 26, 32, 40, 48, 56, 64, 72],
};

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
  const specialFontSize = widget.type === 'time' ? clamp(widget.fontSize, 28, 34) : widget.fontSize;
  specialRoot.style.fontSize = `${specialFontSize}px`;
  specialRoot.hidden = widget.type !== 'time';
  logo.hidden = widget.type !== 'organizer' || !widget.logoUrl;
  el.classList.toggle('no-logo', widget.type === 'organizer' && !widget.logoUrl);
  if (!logo.hidden) logo.src = widget.logoUrl;
  lineRoot.hidden = widget.type === 'time';
  if (widget.type === 'lineup') {
    lineRoot.replaceChildren(...widget.content.split('\n').map((line) => {
      const span = document.createElement('span');
      span.textContent = line || ' ';
      return span;
    }));
  } else if (widget.type === 'time') {
    renderDateTime(specialRoot, widget);
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
  const parts = date.match(/\d+/g) || [];
  const [year = 'YYYY', month = 'MM', day = 'DD'] = parts;
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
  const weekdayLabel = document.createElement('span'); weekdayLabel.className = 'weekday-label'; weekdayLabel.textContent = weekday;
  const dateLabel = document.createElement('span'); dateLabel.className = 'date-chip'; dateLabel.textContent = date;
  if (widget.variant === 'compact') {
    main.classList.add('compact-main');
    const primaryRow = document.createElement('div'); primaryRow.className = 'compact-primary'; primaryRow.append(weekdayLabel, timeLabel);
    const dateRow = document.createElement('div'); dateRow.className = 'compact-date';
    const dateIcon = document.createElement('span'); dateIcon.className = 'date-mini-icon';
    dateRow.append(dateIcon, dateLabel);
    readout.append(primaryRow, dateRow);
  } else if (widget.variant === 'datefirst') {
    main.classList.add('datefirst-main');
    const secondaryRow = document.createElement('div'); secondaryRow.className = 'datefirst-secondary'; secondaryRow.append(weekdayLabel, timeLabel);
    readout.append(dateLabel, secondaryRow);
  } else {
    main.classList.add('segmented-main');
    const primaryRow = document.createElement('div'); primaryRow.className = 'segmented-primary'; primaryRow.append(weekdayLabel, timeLabel);
    const dateRow = document.createElement('div'); dateRow.className = 'segmented-date';
    [year, month, day].forEach((value) => { const cell = document.createElement('span'); cell.textContent = value; dateRow.append(cell); });
    readout.append(primaryRow, dateRow);
  }
  main.append(clock, readout);
  const venueBar = document.createElement('div'); venueBar.className = 'venue-status';
  const venueIcon = document.createElement('span'); venueIcon.className = 'venue-mini-icon';
  const venueText = document.createElement('span'); venueText.textContent = venue;
  venueBar.append(venueIcon, venueText);
  wrap.append(main, venueBar);
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
  const widget = {
    ...preset,
    id: state.nextId++,
    type,
    x: snap(clamp(70 + offset, 0, state.width - preset.w)),
    y: snap(clamp(90 + offset, 0, state.height - preset.h)),
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
  controls.fontSize.min = widget.type === 'time' ? 28 : 12;
  controls.fontSize.max = widget.type === 'time' ? 34 : 72;
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
  ctx.fillStyle = titleColor; ctx.fillRect(widget.x + 4, widget.y + 4, widget.w - 8, 32);
  ctx.fillStyle = '#fff'; ctx.font = '16px Tahoma, sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText(widget.title, widget.x + 13, widget.y + 20, widget.w - 115);
  ['_', '□', '×'].forEach((label, index) => {
    const bx = widget.x + widget.w - 81 + index * 25;
    drawBevel(ctx, bx, widget.y + 9, 22, 21);
    ctx.fillStyle = '#111'; ctx.font = '17px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, bx + 11, widget.y + 19);
  });
  ctx.textAlign = 'left';
  const bx = widget.x + 12, by = widget.y + 45, bw = widget.w - 24, bh = widget.h - 58;
  ctx.fillStyle = '#f7f7f1'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#101010'; ctx.textBaseline = 'top';
  const family = widget.type === 'time' || widget.type === 'lineup' ? 'monospace' : 'serif';
  ctx.font = `${widget.type === 'lineup' ? 'bold ' : ''}${widget.fontSize}px ${family}`;
  if (widget.type === 'time') {
    const [date = '', weekday = '星期六', time = '', venue = 'VENUE'] = widget.content.split('\n');
    const [year = 'YYYY', month = 'MM', day = 'DD'] = date.match(/\d+/g) || [];
    const [hour = '00', minute = '00'] = time.match(/\d+/g) || [];
    const timeBase = clamp(widget.fontSize, 28, 34);
    const venueSize = clamp(widget.venueFontSize || 20, 14, 32);
    ctx.textAlign = 'center';
    const statusH = Math.max(33, Math.round(venueSize * 1.35 + 8));
    const mainX = bx + 10;
    const mainY = by + 10;
    const mainW = bw - 20;
    const mainH = bh - statusH - 27;
    const clockX = mainX + 26;
    const clockY = mainY + mainH / 2;
    const rightX = mainX + 60;
    const rightW = mainW - 68;
    const contentTop = mainY + Math.max(6, (mainH - 70) / 2);
    const drawInsetField = (x, y, w, h, fill = '#fff') => {
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
      ctx.lineWidth = 2; ctx.strokeStyle = '#777';
      ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
    };

    drawBevel(ctx, mainX, mainY, mainW, mainH, false);
    drawAnalogClock(ctx, clockX, clockY, 22, hour, minute);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(rightX - 8, mainY + 6); ctx.lineTo(rightX - 8, mainY + mainH - 6); ctx.stroke();
    ctx.textBaseline = 'middle';

    if (widget.variant === 'compact') {
      ctx.textAlign = 'left'; ctx.fillStyle = '#111';
      ctx.font = 'bold 18px serif'; ctx.fillText(weekday, rightX, contentTop + 15, 86);
      ctx.font = `bold ${timeBase}px monospace`; ctx.fillText(`${hour}:${minute}`, rightX + 100, contentTop + 15, rightW - 100);
      const fieldY = contentTop + 37;
      drawInsetField(rightX, fieldY, rightW, 31);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(rightX + 8, fieldY + 8, 15, 15);
      ctx.fillStyle = titleColor; ctx.fillRect(rightX + 10, fieldY + 10, 11, 4);
      ctx.fillStyle = '#111'; ctx.font = '22px monospace'; ctx.fillText(date, rightX + 31, fieldY + 16, rightW - 39);
    } else if (widget.variant === 'datefirst') {
      drawInsetField(rightX, contentTop, rightW, 34, '#c0c0c0');
      ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.font = 'bold 22px monospace'; ctx.fillText(date, rightX + 9, contentTop + 17, rightW - 18);
      const rowY = contentTop + 39;
      const weekdayW = Math.min(84, rightW * .34);
      drawInsetField(rightX, rowY, weekdayW, 29, '#c0c0c0');
      ctx.textAlign = 'center'; ctx.font = 'bold 18px serif'; ctx.fillText(weekday, rightX + weekdayW / 2, rowY + 15, weekdayW - 8);
      ctx.textAlign = 'left'; ctx.font = `bold ${Math.max(28, timeBase - 2)}px monospace`; ctx.fillText(`${hour}:${minute}`, rightX + weekdayW + 13, rowY + 15, rightW - weekdayW - 16);
    } else {
      const weekdayW = Math.min(78, rightW * .32);
      drawInsetField(rightX, contentTop, weekdayW, 31, '#c0c0c0');
      ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.font = 'bold 18px serif'; ctx.fillText(weekday, rightX + weekdayW / 2, contentTop + 16, weekdayW - 8);
      ctx.textAlign = 'left'; ctx.font = `bold ${timeBase}px monospace`; ctx.fillText(`${hour}:${minute}`, rightX + weekdayW + 14, contentTop + 16, rightW - weekdayW - 16);
      const fieldY = contentTop + 37;
      const gap = 3;
      const yearW = Math.round((rightW - gap * 2) * .5);
      const shortW = Math.round((rightW - gap * 2 - yearW) / 2);
      const fields = [[year, yearW], [month, shortW], [day, rightW - yearW - shortW - gap * 2]];
      let fieldX = rightX;
      fields.forEach(([value, width]) => {
        drawInsetField(fieldX, fieldY, width, 31);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.font = '22px monospace'; ctx.fillText(value, fieldX + width / 2, fieldY + 16, width - 6);
        fieldX += width + gap;
      });
    }
    const statusY = by + bh - statusH - 10;
    drawBevel(ctx, bx + 10, statusY, bw - 20, statusH, false);
    const venueIconW = venueSize * .8;
    const venueIconH = venueSize * .7;
    const venueIconX = bx + 18;
    const venueIconY = statusY + statusH / 2 - venueIconH / 2;
    ctx.fillStyle = '#111'; ctx.fillRect(venueIconX, venueIconY, venueIconW, venueIconH);
    ctx.fillStyle = titleColor; ctx.fillRect(venueIconX + venueIconW * .18, venueIconY + venueIconH * .2, venueIconW * .18, venueIconH * .65);
    ctx.fillStyle = '#fff'; ctx.fillRect(venueIconX + venueIconW * .55, venueIconY + venueIconH * .2, venueIconW * .18, venueIconH * .65);
    ctx.font = `bold ${venueSize}px serif`; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.fillText(venue, venueIconX + venueIconW + 10, statusY + statusH / 2, bw - 62);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  } else if (widget.type === 'lineup') {
    let y = by + 14;
    widget.content.split('\n').forEach((line) => { ctx.fillStyle = titleColor; ctx.fillText('■', bx + 13, y); ctx.fillStyle = '#111'; ctx.fillText(line, bx + 42, y); y += widget.fontSize * 1.35; });
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
    const iconW = widget.fontSize * .88;
    const iconH = widget.fontSize * 1.16;
    const iconX = bx + 12;
    const iconY = by + 16;
    ctx.fillStyle = titleColor; ctx.fillRect(iconX + 4, iconY + 4, iconW, iconH);
    ctx.fillStyle = '#fff'; ctx.fillRect(iconX, iconY, iconW, iconH);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(iconX, iconY, iconW, iconH);
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
    for (let lineY = iconY + 6; lineY < iconY + iconH - 3; lineY += 5) {
      ctx.beginPath(); ctx.moveTo(iconX + 4, lineY); ctx.lineTo(iconX + iconW - 4, lineY); ctx.stroke();
    }
    const inset = iconW + 28;
    ctx.fillStyle = '#111'; ctx.font = `${widget.fontSize}px serif`;
    drawWrappedText(ctx, widget.content, bx + inset, by + 16, bw - inset - 12, widget.fontSize * 1.35);
  } else {
    drawWrappedText(ctx, widget.content, bx + 18, by + 16, bw - 30, widget.fontSize * 1.35);
  }
}

async function exportPoster() {
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
controls.fontSize.addEventListener('input', (event) => updateSelected('fontSize', clamp(Number(event.target.value) || 12, 12, 72)));
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
