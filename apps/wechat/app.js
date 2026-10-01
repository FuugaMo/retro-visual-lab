const stage = document.querySelector('#exportStage');
const scaler = document.querySelector('#stageScaler');
const viewport = document.querySelector('#previewViewport');
const status = document.querySelector('#appStatus');
const exportButton = document.querySelector('#exportButton');

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const saved = JSON.parse(localStorage.getItem('wechat-asset-factory') || '{}');

const state = {
  asset: saved.asset || 'background',
  paperColor: saved.paperColor || '#f7f4ed',
  noiseAmount: saved.noiseAmount ?? 18,
  grainSize: saved.grainSize ?? 2,
  washAmount: saved.washAmount ?? 28,
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

function makePaperDataUrl() {
  const width = 1080;
  const height = 1440;
  const size = Math.max(1, Number(state.grainSize));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = state.paperColor;
  context.fillRect(0, 0, width, height);

  const washRandom = seededRandom(state.washSeed);
  const washPalette = [[255, 178, 198], [80, 202, 194], [135, 119, 220], [238, 205, 88]];
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
  const random = seededRandom(state.noiseSeed);
  const palette = [[236,111,145],[75,213,198],[103,100,206],[232,200,77],[64,90,113]];
  const cells = Math.ceil(width / size) * Math.ceil(height / size);
  const count = Math.round(cells * Number(state.noiseAmount) / 100 * .42);
  for (let index = 0; index < count; index += 1) {
    const color = palette[Math.floor(random() * palette.length)];
    const x = Math.floor(random() * width / size) * size;
    const y = Math.floor(random() * height / size) * size;
    context.fillStyle = `rgba(${color.join(',')},${.1 + random() * .18})`;
    context.fillRect(x, y, size, size);
  }
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
    $('#exportName').textContent = 'NOISE-PAPER.PNG';
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

['paperColor','noteTitle','noteContent','noteCjkFont','noteLatinFont','noteWeight','noteAlign','noteColor','titlebarColor','dividerLabel','dividerColor','dividerAccent'].forEach((id) => bindValue(id, id));
['noiseAmount','grainSize','washAmount','noteSize','noteLineHeight','noteLetterSpacing','noteWidth','notePadding','dividerThickness'].forEach((id) => bindValue(id, id, 'input', Number));
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
    const slug = state.asset === 'divider' ? `divider-${state.dividerStyle}` : state.asset === 'notepad' ? 'notepad-98' : 'noise-paper';
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
