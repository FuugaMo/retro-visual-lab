const stage = document.querySelector('#exportStage');
const scaler = document.querySelector('#stageScaler');
const viewport = document.querySelector('#previewViewport');
const status = document.querySelector('#appStatus');
const exportButton = document.querySelector('#exportButton');

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const saved = JSON.parse(localStorage.getItem('wechat-asset-factory') || '{}');

const backgroundPresets = {
  bleached: { paperColor: '#f4f2ea', noiseAmount: 13, grainSize: 2, washAmount: 25, scanlineAmount: 10, rgbSplit: 2, bloomAmount: 12, vignetteAmount: 7, tearAmount: 1, safeCenter: true },
  pearl: { paperColor: '#edf2f1', noiseAmount: 7, grainSize: 2, washAmount: 44, scanlineAmount: 4, rgbSplit: 3, bloomAmount: 30, vignetteAmount: 5, tearAmount: 0, safeCenter: true },
  badSignal: { paperColor: '#dfe2da', noiseAmount: 28, grainSize: 2, washAmount: 17, scanlineAmount: 24, rgbSplit: 8, bloomAmount: 8, vignetteAmount: 22, tearAmount: 5, safeCenter: false },
};
const backgroundPresetSlugs = { bleached: 'bleached-crt', pearl: 'y2k-pearl', badSignal: 'bad-signal' };
const initialBackgroundPreset = backgroundPresets[saved.backgroundPreset] ? saved.backgroundPreset : 'bleached';
const initialBackground = backgroundPresets[initialBackgroundPreset];

const state = {
  asset: saved.asset || 'background',
  backgroundPreset: initialBackgroundPreset,
  paperColor: saved.backgroundPreset ? (saved.paperColor || initialBackground.paperColor) : initialBackground.paperColor,
  noiseAmount: saved.backgroundPreset ? (saved.noiseAmount ?? initialBackground.noiseAmount) : initialBackground.noiseAmount,
  grainSize: saved.backgroundPreset ? (saved.grainSize ?? initialBackground.grainSize) : initialBackground.grainSize,
  washAmount: saved.backgroundPreset ? (saved.washAmount ?? initialBackground.washAmount) : initialBackground.washAmount,
  scanlineAmount: saved.backgroundPreset ? (saved.scanlineAmount ?? initialBackground.scanlineAmount) : initialBackground.scanlineAmount,
  rgbSplit: saved.backgroundPreset ? (saved.rgbSplit ?? initialBackground.rgbSplit) : initialBackground.rgbSplit,
  bloomAmount: saved.backgroundPreset ? (saved.bloomAmount ?? initialBackground.bloomAmount) : initialBackground.bloomAmount,
  vignetteAmount: saved.backgroundPreset ? (saved.vignetteAmount ?? initialBackground.vignetteAmount) : initialBackground.vignetteAmount,
  tearAmount: saved.backgroundPreset ? (saved.tearAmount ?? initialBackground.tearAmount) : initialBackground.tearAmount,
  safeCenter: saved.backgroundPreset ? (saved.safeCenter ?? initialBackground.safeCenter) : initialBackground.safeCenter,
  noiseSeed: saved.noiseSeed || Math.floor(Math.random() * 1000000),
  washSeed: saved.washSeed || Math.floor(Math.random() * 1000000),
  noteTitle: saved.noteTitle || 'untitled.txt - Notepad',
  noteContent: saved.noteContent || '透明酚酞 / TRANSPARENT PHENOLPHTHALEIN\n\n声音经过身体，留下没有名字的颜色。\n我们把它们收集在这里。',
  noteCjkFont: saved.noteCjkFont || ({ pixel: 'fusion10', sans: 'pingfang', serif: 'songti', mono: 'fusion12mono' }[saved.noteFont] || 'fusion10'),
  noteLatinFont: saved.noteLatinFont || ({ pixel: 'pixelms', sans: 'helvetica', serif: 'georgia', mono: 'monaco' }[saved.noteFont] || 'pixelms'),
  noteSize: saved.noteSize ?? 34,
  noteWeight: saved.noteWeight || '400',
  noteAlign: saved.noteAlign || 'left',
  noteLineHeight: saved.noteLineHeight ?? 1.45,
  noteLetterSpacing: saved.noteLetterSpacing ?? 0,
  noteColor: saved.noteColor || '#111111',
  titlebarColor: saved.titlebarColor || '#000080',
  noteBold: saved.noteBold || false,
  noteItalic: saved.noteItalic || false,
  noteUnderline: saved.noteUnderline || false,
  noteWidth: saved.noteWidth ?? 900,
  notePadding: saved.notePadding ?? 48,
  noteShadow: saved.noteShadow ?? true,
  dividerStyle: saved.dividerStyle || 'signal',
  dividerLabel: saved.dividerLabel ?? 'TRANSPARENT PHENOLPHTHALEIN',
  dividerColor: saved.dividerColor || '#1d4f86',
  dividerAccent: saved.dividerAccent || '#ec6f91',
  dividerThickness: saved.dividerThickness ?? 4,
};

const fontFamilies = {
  fusion8: '"Fusion Pixel 8", "PingFang SC", sans-serif',
  fusion10: '"Fusion Pixel 10", "PingFang SC", sans-serif',
  fusion12: '"Fusion Pixel 12", "PingFang SC", sans-serif',
  fusion12mono: '"Fusion Pixel 12 Mono", monospace',
  pixelms: '"Pixelated MS Sans Serif", Arial, sans-serif',
  pingfang: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  heiti: '"Heiti SC", "STHeiti", sans-serif',
  songti: '"Songti SC", "STSong", serif',
  kaiti: '"Kaiti SC", "STKaiti", serif',
  fangsong: 'FangSong, STFangsong, serif',
  monaco: 'Monaco, Menlo, monospace',
  courier: '"Courier New", Courier, monospace',
  helvetica: 'Helvetica, Arial, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  impact: 'Impact, Haettenschweiler, sans-serif',
};

if (!fontFamilies[state.noteCjkFont]) state.noteCjkFont = 'fusion10';
if (!fontFamilies[state.noteLatinFont]) state.noteLatinFont = 'pixelms';
let paperDataUrl = '';

function persist() {
  localStorage.setItem('wechat-asset-factory', JSON.stringify(state));
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawPearlSurface(context, width, height, random) {
  context.save();
  context.globalCompositeOperation = 'screen';
  const sheen = context.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, 'rgba(108,220,222,.05)');
  sheen.addColorStop(.32, 'rgba(255,255,255,.42)');
  sheen.addColorStop(.58, 'rgba(205,152,255,.12)');
  sheen.addColorStop(.82, 'rgba(255,172,204,.18)');
  sheen.addColorStop(1, 'rgba(113,210,220,.08)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, width, height);
  for (let index = 0; index < 7; index += 1) {
    const x = random() < .5 ? random() * 230 : width - random() * 230;
    const y = 80 + random() * (height - 160);
    const radius = 45 + random() * 120;
    const bubble = context.createRadialGradient(x - radius * .28, y - radius * .28, 4, x, y, radius);
    bubble.addColorStop(0, 'rgba(255,255,255,.32)');
    bubble.addColorStop(.45, 'rgba(116,224,218,.07)');
    bubble.addColorStop(.78, 'rgba(232,126,203,.10)');
    bubble.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = bubble;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,.26)';
    context.lineWidth = 2;
    context.stroke();
  }
  context.restore();

  const chrome = context.createLinearGradient(width - 105, 0, width, 0);
  chrome.addColorStop(0, 'rgba(255,255,255,0)');
  chrome.addColorStop(.28, 'rgba(116,168,174,.10)');
  chrome.addColorStop(.48, 'rgba(255,255,255,.72)');
  chrome.addColorStop(.62, 'rgba(91,103,121,.18)');
  chrome.addColorStop(.78, 'rgba(255,255,255,.52)');
  chrome.addColorStop(1, 'rgba(158,112,192,.12)');
  context.fillStyle = chrome;
  context.fillRect(width - 105, 0, 105, height);
}

function drawSignalMarkers(context, width, height) {
  context.save();
  context.font = '18px Monaco, monospace';
  context.textBaseline = 'top';
  if (state.backgroundPreset === 'badSignal') {
    context.fillStyle = 'rgba(16,30,28,.55)';
    context.fillText('PLAY  ▶    SP', 48, 42);
    context.fillText('00:12:48', width - 164, 42);
    context.fillText('TRACKING // CH-03', 48, height - 74);
    context.fillRect(48, height - 42, width - 96, 3);
  } else if (state.backgroundPreset === 'pearl') {
    context.fillStyle = 'rgba(54,86,95,.22)';
    context.fillText('LIQUID DATA / 2000', 48, 42);
    context.fillText('OPTICAL MEMORY', width - 206, height - 68);
  } else {
    context.fillStyle = 'rgba(27,67,75,.24)';
    context.fillText('RGB SIGNAL / CH-01', 48, 42);
    context.fillText('PHOSPHOR MEMORY', width - 210, height - 68);
    context.strokeStyle = 'rgba(32,90,96,.18)';
    context.lineWidth = 2;
    [[32,32],[width-32,32],[32,height-32],[width-32,height-32]].forEach(([x,y]) => {
      context.beginPath(); context.moveTo(x - 12, y); context.lineTo(x + 12, y); context.moveTo(x, y - 12); context.lineTo(x, y + 12); context.stroke();
    });
  }
  context.restore();
}

function makePaperDataUrl() {
  const width = 1080;
  const height = 1440;
  const size = Math.max(1, Number(state.grainSize));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const baseRgb = hexToRgb(state.paperColor);
  const washRandom = seededRandom(state.washSeed);
  const noiseRandom = seededRandom(state.noiseSeed);
  context.fillStyle = state.paperColor;
  context.fillRect(0, 0, width, height);

  if (state.backgroundPreset === 'pearl') drawPearlSurface(context, width, height, washRandom);
  if (state.backgroundPreset === 'badSignal') {
    const cast = context.createLinearGradient(0, 0, width, height);
    cast.addColorStop(0, 'rgba(63,202,190,.12)');
    cast.addColorStop(.52, 'rgba(255,255,255,0)');
    cast.addColorStop(1, 'rgba(223,70,146,.13)');
    context.fillStyle = cast;
    context.fillRect(0, 0, width, height);
  }

  const washPalette = [[255,178,198],[80,202,194],[135,119,220],[238,205,88]];
  const washOpacity = Number(state.washAmount) / 100 * .38;
  context.globalCompositeOperation = 'multiply';
  washPalette.forEach((color) => {
    const x = width * (.08 + washRandom() * .84);
    const y = height * (.04 + washRandom() * .92);
    const radius = 260 + washRandom() * 310;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${color.join(',')},${washOpacity})`);
    gradient.addColorStop(.55, `rgba(${color.join(',')},${washOpacity * .36})`);
    gradient.addColorStop(1, `rgba(${color.join(',')},0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });

  context.globalCompositeOperation = 'source-over';
  const palette = state.backgroundPreset === 'badSignal'
    ? [[236,64,139],[44,216,203],[36,45,48],[255,255,255],[103,100,206]]
    : [[236,111,145],[75,213,198],[103,100,206],[232,200,77],[64,90,113]];
  const cells = Math.ceil(width / size) * Math.ceil(height / size);
  const count = Math.round(cells * Number(state.noiseAmount) / 100 * .42);
  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(noiseRandom() * width / size) * size;
    const y = Math.floor(noiseRandom() * height / size) * size;
    const inSafeArea = x > width * .16 && x < width * .84 && y > height * .1 && y < height * .9;
    if (state.safeCenter && inSafeArea && noiseRandom() < .68) continue;
    const color = palette[Math.floor(noiseRandom() * palette.length)];
    context.fillStyle = `rgba(${color.join(',')},${.1 + noiseRandom() * .2})`;
    context.fillRect(x, y, size, size);
  }

  if (state.safeCenter) {
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(1, 1.35);
    const clearing = context.createRadialGradient(0, 0, 30, 0, 0, 410);
    clearing.addColorStop(0, `rgba(${baseRgb.join(',')},.30)`);
    clearing.addColorStop(.68, `rgba(${baseRgb.join(',')},.12)`);
    clearing.addColorStop(1, `rgba(${baseRgb.join(',')},0)`);
    context.fillStyle = clearing;
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
  }

  const bloomOpacity = Number(state.bloomAmount) / 100 * .55;
  if (bloomOpacity > 0) {
    context.save();
    context.globalCompositeOperation = 'screen';
    for (let index = 0; index < 2; index += 1) {
      const x = width * (.12 + washRandom() * .76);
      const y = height * (.08 + washRandom() * .84);
      const radius = 180 + washRandom() * 240;
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(255,255,255,${bloomOpacity})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }
    context.restore();
  }

  const tearCount = Number(state.tearAmount);
  if (tearCount > 0) {
    const source = document.createElement('canvas');
    source.width = width; source.height = height;
    source.getContext('2d').drawImage(canvas, 0, 0);
    const tearRandom = seededRandom(state.washSeed + 887);
    for (let index = 0; index < tearCount; index += 1) {
      let y = Math.floor(tearRandom() * (height - 30));
      if (state.safeCenter && y > height * .15 && y < height * .85) y = tearRandom() < .5 ? 70 + tearRandom() * 120 : height - 190 + tearRandom() * 100;
      const bandHeight = 3 + Math.floor(tearRandom() * (state.backgroundPreset === 'badSignal' ? 24 : 9));
      const offset = Math.round((tearRandom() - .5) * (28 + Number(state.rgbSplit) * 9));
      context.drawImage(source, 0, y, width, bandHeight, offset, y, width, bandHeight);
      context.fillStyle = `rgba(28,207,199,${.08 + Number(state.rgbSplit) / 120})`;
      context.fillRect(Math.max(0, offset), y - 1, width - Math.abs(offset), 1);
      context.fillStyle = `rgba(235,55,139,${.08 + Number(state.rgbSplit) / 120})`;
      context.fillRect(Math.max(0, -offset), y + bandHeight, width - Math.abs(offset), 1);
    }
  }

  const split = Number(state.rgbSplit);
  if (split > 0) {
    const edgeAlpha = .018 + split / 360;
    const leftGhost = context.createLinearGradient(0, 0, 160 + split * 8, 0);
    leftGhost.addColorStop(0, `rgba(0,211,205,${edgeAlpha * 2.4})`);
    leftGhost.addColorStop(1, 'rgba(0,211,205,0)');
    context.fillStyle = leftGhost; context.fillRect(0, 0, 180 + split * 8, height);
    const rightGhost = context.createLinearGradient(width, 0, width - 180 - split * 8, 0);
    rightGhost.addColorStop(0, `rgba(240,43,137,${edgeAlpha * 2.4})`);
    rightGhost.addColorStop(1, 'rgba(240,43,137,0)');
    context.fillStyle = rightGhost; context.fillRect(width - 180 - split * 8, 0, 180 + split * 8, height);
    context.fillStyle = `rgba(230,30,105,${edgeAlpha})`;
    for (let x = 0; x < width; x += 6) context.fillRect(x, 0, 1, height);
    context.fillStyle = `rgba(20,190,205,${edgeAlpha})`;
    for (let x = 2; x < width; x += 6) context.fillRect(x, 0, 1, height);
  }

  const scanAlpha = Number(state.scanlineAmount) / 100 * .34;
  if (scanAlpha > 0) {
    context.fillStyle = `rgba(8,20,18,${scanAlpha})`;
    const spacing = state.backgroundPreset === 'badSignal' ? 3 : 4;
    for (let y = 0; y < height; y += spacing) context.fillRect(0, y, width, 1);
  }

  const vignetteAlpha = Number(state.vignetteAmount) / 100 * .78;
  if (vignetteAlpha > 0) {
    const vignette = context.createRadialGradient(width / 2, height / 2, height * .25, width / 2, height / 2, height * .76);
    vignette.addColorStop(0, 'rgba(8,17,16,0)');
    vignette.addColorStop(.72, `rgba(8,17,16,${vignetteAlpha * .22})`);
    vignette.addColorStop(1, `rgba(8,17,16,${vignetteAlpha})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  drawSignalMarkers(context, width, height);
  return canvas.toDataURL('image/png');
}

function renderMixedText(element, text) {
  element.replaceChildren();
  let currentType = null;
  let currentText = '';
  const flush = () => {
    if (!currentText) return;
    const span = document.createElement('span');
    span.className = currentType === 'latin' ? 'latin-run' : 'cjk-run';
    span.style.fontFamily = fontFamilies[currentType === 'latin' ? state.noteLatinFont : state.noteCjkFont];
    span.textContent = currentText;
    element.append(span);
    currentText = '';
  };
  for (const character of text) {
    const type = /[\u0000-\u024f\u1e00-\u1eff]/u.test(character) ? 'latin' : 'cjk';
    if (currentType && type !== currentType) flush();
    currentType = type;
    currentText += character;
  }
  flush();
}

function notepadMarkup() {
  return `<div class="notepad-window">
    <div class="notepad-titlebar"><span class="notepad-icon"></span><span class="titlebar-title"></span><span class="window-buttons"><i class="window-button">_</i><i class="window-button">□</i><i class="window-button">×</i></span></div>
    <div class="notepad-menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>S</u>earch</span><span><u>H</u>elp</span></div>
    <div class="notepad-body"></div>
  </div>`;
}

function dividerMarkup() {
  return `<div class="divider-wrap ${state.dividerStyle}"><span class="divider-line"></span><span class="divider-label"></span><span class="divider-line"></span></div>`;
}

function render() {
  $$('.asset-tab').forEach((button) => button.classList.toggle('active', button.dataset.asset === state.asset));
  $$('.preset').forEach((button) => button.classList.toggle('active', button.dataset.divider === state.dividerStyle));
  $$('.background-preset').forEach((button) => button.classList.toggle('active', button.dataset.backgroundPreset === state.backgroundPreset));
  $$('[data-controls]').forEach((section) => { section.hidden = section.dataset.controls !== state.asset; });
  stage.className = 'asset-artboard';
  stage.removeAttribute('style');

  if (state.asset === 'background') {
    stage.classList.add('paper-artboard');
    paperDataUrl = makePaperDataUrl();
    const paperImage = document.createElement('img');
    paperImage.className = 'paper-render';
    paperImage.src = paperDataUrl;
    paperImage.alt = '';
    stage.replaceChildren(paperImage);
    $('#previewDimensions').textContent = '1080 × 1440';
    $('#exportName').textContent = `${backgroundPresetSlugs[state.backgroundPreset].toUpperCase()}.PNG`;
    $('#exportHint').textContent = '1080 × 1440 · 不透明背景';
  } else if (state.asset === 'notepad') {
    stage.classList.add('note-artboard');
    stage.innerHTML = notepadMarkup();
    const windowElement = stage.querySelector('.notepad-window');
    const titlebar = stage.querySelector('.notepad-titlebar');
    const body = stage.querySelector('.notepad-body');
    stage.querySelector('.titlebar-title').textContent = state.noteTitle;
    renderMixedText(body, state.noteContent);
    windowElement.style.width = `${state.noteWidth}px`;
    windowElement.style.boxShadow = state.noteShadow ? '14px 14px 0 rgba(10,17,13,.25), inset 3px 3px #fff, inset -3px -3px #111' : 'inset 3px 3px #fff, inset -3px -3px #111';
    titlebar.style.background = state.titlebarColor;
    Object.assign(body.style, { fontFamily: fontFamilies[state.noteCjkFont], fontSize: `${state.noteSize}px`, fontWeight: state.noteBold ? '700' : state.noteWeight, textAlign: state.noteAlign, lineHeight: state.noteLineHeight, letterSpacing: `${state.noteLetterSpacing}px`, color: state.noteColor, fontStyle: state.noteItalic ? 'italic' : 'normal', textDecoration: state.noteUnderline ? 'underline' : 'none', padding: `${state.notePadding}px` });
    const bodyHeight = Math.max(280, state.noteContent.split('\n').length * state.noteSize * state.noteLineHeight + state.notePadding * 2);
    body.style.minHeight = `${bodyHeight}px`;
    stage.style.height = `${Math.max(500, windowElement.offsetHeight + 152)}px`;
    $('#previewDimensions').textContent = `1080 × ${Math.round(parseFloat(stage.style.height))}`;
    $('#exportName').textContent = 'NOTEPAD-98.PNG';
    $('#exportHint').textContent = '1080px 宽 · 透明底';
  } else {
    stage.classList.add('divider-artboard');
    stage.innerHTML = dividerMarkup();
    const divider = stage.querySelector('.divider-wrap');
    divider.style.color = state.dividerColor;
    divider.style.setProperty('--accent', state.dividerAccent);
    divider.style.setProperty('--thickness', `${state.dividerThickness}px`);
    stage.querySelector('.divider-label').textContent = state.dividerLabel;
    $('#previewDimensions').textContent = '1080 × 180';
    $('#exportName').textContent = `DIVIDER-${state.dividerStyle.toUpperCase()}.PNG`;
    $('#exportHint').textContent = '1080 × 180 · 透明底';
  }
  updateOutputs();
  requestAnimationFrame(fitStage);
  persist();
}

function fitStage() {
  const width = stage.offsetWidth || 1080;
  const height = stage.offsetHeight || 540;
  const availableWidth = Math.max(100, viewport.clientWidth - 60);
  const availableHeight = Math.max(100, viewport.clientHeight - 60);
  const scale = Math.min(1, availableWidth / width, availableHeight / height);
  scaler.style.width = `${width * scale}px`;
  scaler.style.height = `${height * scale}px`;
  stage.style.transform = `scale(${scale})`;
  stage.style.transformOrigin = 'top left';
}

function updateOutputs() {
  $('#noiseValue').textContent = `${state.noiseAmount}%`;
  $('#grainValue').textContent = `${state.grainSize}px`;
  $('#washValue').textContent = `${state.washAmount}%`;
  $('#scanlineValue').textContent = `${state.scanlineAmount}%`;
  $('#rgbSplitValue').textContent = `${state.rgbSplit}px`;
  $('#bloomValue').textContent = `${state.bloomAmount}%`;
  $('#vignetteValue').textContent = `${state.vignetteAmount}%`;
  $('#tearValue').textContent = state.tearAmount;
  ['paperColor','noiseAmount','grainSize','washAmount','scanlineAmount','rgbSplit','bloomAmount','vignetteAmount','tearAmount'].forEach((id) => {
    if ($(`#${id}`).value !== String(state[id])) $(`#${id}`).value = state[id];
  });
  $('#safeCenter').checked = state.safeCenter;
  $('#noteWidthValue').textContent = `${state.noteWidth}px`;
  $('#notePaddingValue').textContent = `${state.notePadding}px`;
  $('#dividerThicknessValue').textContent = `${state.dividerThickness}px`;
  $('#fontPreview .cjk-sample').style.fontFamily = fontFamilies[state.noteCjkFont];
  $('#fontPreview .latin-sample').style.fontFamily = fontFamilies[state.noteLatinFont];
  [['boldToggle','noteBold'],['italicToggle','noteItalic'],['underlineToggle','noteUnderline']].forEach(([id,key]) => {
    $(`#${id}`).classList.toggle('pressed', state[key]);
    $(`#${id}`).setAttribute('aria-pressed', String(state[key]));
  });
}

function bindValue(id, key, event = 'input', transform = (value) => value) {
  const element = $(`#${id}`);
  if (!element) return;
  element.value = state[key];
  element.addEventListener(event, () => { state[key] = transform(element.value); render(); });
}

$$('.asset-tab').forEach((button) => button.addEventListener('click', () => { state.asset = button.dataset.asset; render(); }));
$$('.preset').forEach((button) => button.addEventListener('click', () => { state.dividerStyle = button.dataset.divider; $$('.preset').forEach((item) => item.classList.toggle('active', item === button)); render(); }));
$$('.background-preset').forEach((button) => button.addEventListener('click', () => {
  state.backgroundPreset = button.dataset.backgroundPreset;
  Object.assign(state, backgroundPresets[state.backgroundPreset]);
  state.noiseSeed = Math.floor(Math.random() * 1000000);
  state.washSeed = Math.floor(Math.random() * 1000000);
  render();
}));

['paperColor','noteTitle','noteContent','noteCjkFont','noteLatinFont','noteWeight','noteAlign','noteColor','titlebarColor','dividerLabel','dividerColor','dividerAccent'].forEach((id) => bindValue(id, id));
['noiseAmount','grainSize','washAmount','scanlineAmount','rgbSplit','bloomAmount','vignetteAmount','tearAmount','noteSize','noteLineHeight','noteLetterSpacing','noteWidth','notePadding','dividerThickness'].forEach((id) => bindValue(id, id, 'input', Number));
$('#safeCenter').checked = state.safeCenter;
$('#safeCenter').addEventListener('change', (event) => { state.safeCenter = event.target.checked; render(); });
$('#noteShadow').checked = state.noteShadow;
$('#noteShadow').addEventListener('change', (event) => { state.noteShadow = event.target.checked; render(); });
[['boldToggle','noteBold'],['italicToggle','noteItalic'],['underlineToggle','noteUnderline']].forEach(([id,key]) => $(`#${id}`).addEventListener('click', () => { state[key] = !state[key]; render(); }));
$('#rerollNoise').addEventListener('click', () => {
  state.noiseSeed = Math.floor(Math.random() * 1000000);
  state.washSeed = Math.floor(Math.random() * 1000000);
  render();
});

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadCustomFont(file, kind) {
  if (!file) return;
  const fontStatus = $('#fontUploadStatus');
  fontStatus.textContent = `正在载入 ${file.name}...`;
  try {
    const dataUrl = await readAsDataUrl(file);
    const stamp = Date.now();
    const id = `custom-${kind}-${stamp}`;
    const family = `Uploaded ${kind.toUpperCase()} ${stamp}`;
    const face = new FontFace(family, `url(${dataUrl})`);
    await face.load();
    document.fonts.add(face);
    const style = document.createElement('style');
    style.dataset.uploadedFont = id;
    style.textContent = `@font-face { font-family: "${family}"; src: url("${dataUrl}"); font-display: block; }`;
    document.head.append(style);
    fontFamilies[id] = `"${family}"`;
    const select = $(`#note${kind === 'cjk' ? 'Cjk' : 'Latin'}Font`);
    let group = select.querySelector('optgroup[data-custom]');
    if (!group) {
      group = document.createElement('optgroup');
      group.label = '已上传 / CUSTOM';
      group.dataset.custom = 'true';
      select.append(group);
    }
    const option = document.createElement('option');
    option.value = id;
    option.textContent = file.name.replace(/\.(ttf|otf|woff2?)$/i, '');
    group.append(option);
    select.value = id;
    state[kind === 'cjk' ? 'noteCjkFont' : 'noteLatinFont'] = id;
    fontStatus.textContent = `已载入 ${file.name} · 仅限当前会话`;
    render();
  } catch (error) {
    console.error(error);
    fontStatus.textContent = `无法载入 ${file.name}，请换用 TTF / OTF / WOFF / WOFF2。`;
  }
}

$('#cjkFontUpload').addEventListener('change', (event) => loadCustomFont(event.target.files[0], 'cjk'));
$('#latinFontUpload').addEventListener('change', (event) => loadCustomFont(event.target.files[0], 'latin'));

exportButton.addEventListener('click', async () => {
  if (!window.htmlToImage) { status.textContent = 'EXPORT LIBRARY NOT READY'; return; }
  status.textContent = 'RENDERING PNG...';
  exportButton.disabled = true;
  const previousTransform = stage.style.transform;
  stage.style.transform = 'none';
  try {
    await document.fonts.ready;
    const dataUrl = state.asset === 'background'
      ? paperDataUrl
      : await window.htmlToImage.toPng(stage, { pixelRatio: 1, cacheBust: true, backgroundColor: null });
    const link = document.createElement('a');
    const slug = state.asset === 'divider' ? `divider-${state.dividerStyle}` : state.asset === 'notepad' ? 'notepad-98' : backgroundPresetSlugs[state.backgroundPreset];
    link.download = `${slug}.png`;
    link.href = dataUrl;
    link.click();
    status.textContent = 'PNG EXPORTED';
  } catch (error) {
    console.error(error);
    status.textContent = 'EXPORT FAILED';
  } finally {
    stage.style.transform = previousTransform;
    exportButton.disabled = false;
  }
});

window.addEventListener('resize', fitStage);
render();
