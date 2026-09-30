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
  noteTitle: saved.noteTitle || 'untitled.txt - Notepad',
  noteContent: saved.noteContent || '透明酚酞 / TRANSPARENT PHENOLPHTHALEIN\n\n声音经过身体，留下没有名字的颜色。\n我们把它们收集在这里。',
  noteFont: saved.noteFont || 'pixel',
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

const fonts = {
  pixel: '"Fusion Pixel", "PingFang SC", sans-serif',
  sans: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  serif: '"Songti SC", "STSong", serif',
  mono: 'Monaco, Menlo, "Courier New", monospace',
};

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

function makeNoiseTexture() {
  const size = Math.max(1, Number(state.grainSize));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(1080 / size);
  canvas.height = Math.ceil(540 / size);
  const context = canvas.getContext('2d');
  const image = context.createImageData(canvas.width, canvas.height);
  const random = seededRandom(state.noiseSeed);
  const palette = [[236,111,145],[75,213,198],[103,100,206],[232,200,77],[64,90,113]];
  const density = Number(state.noiseAmount) / 100 * .38;
  for (let index = 0; index < image.data.length; index += 4) {
    if (random() < density) {
      const color = palette[Math.floor(random() * palette.length)];
      image.data[index] = color[0]; image.data[index + 1] = color[1]; image.data[index + 2] = color[2];
      image.data[index + 3] = 26 + Math.floor(random() * 50);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
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
    stage.style.backgroundColor = state.paperColor;
    stage.style.backgroundImage = `url(${makeNoiseTexture()})`;
    stage.style.setProperty('--wash-alpha', String(Number(state.washAmount) / 180));
    stage.innerHTML = '';
    $('#previewDimensions').textContent = '1080 × 540';
    $('#exportName').textContent = 'NOISE-PAPER.PNG';
    $('#exportHint').textContent = '1080 × 540 · 不透明背景';
  } else if (state.asset === 'notepad') {
    stage.classList.add('note-artboard');
    stage.innerHTML = notepadMarkup();
    const windowElement = stage.querySelector('.notepad-window');
    const titlebar = stage.querySelector('.notepad-titlebar');
    const body = stage.querySelector('.notepad-body');
    stage.querySelector('.titlebar-title').textContent = state.noteTitle;
    body.textContent = state.noteContent;
    windowElement.style.width = `${state.noteWidth}px`;
    windowElement.style.boxShadow = state.noteShadow ? '14px 14px 0 rgba(10,17,13,.25), inset 3px 3px #fff, inset -3px -3px #111' : 'inset 3px 3px #fff, inset -3px -3px #111';
    titlebar.style.background = state.titlebarColor;
    Object.assign(body.style, { fontFamily: fonts[state.noteFont], fontSize: `${state.noteSize}px`, fontWeight: state.noteBold ? '700' : state.noteWeight, textAlign: state.noteAlign, lineHeight: state.noteLineHeight, letterSpacing: `${state.noteLetterSpacing}px`, color: state.noteColor, fontStyle: state.noteItalic ? 'italic' : 'normal', textDecoration: state.noteUnderline ? 'underline' : 'none', padding: `${state.notePadding}px` });
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

['paperColor','noteTitle','noteContent','noteFont','noteWeight','noteAlign','noteColor','titlebarColor','dividerLabel','dividerColor','dividerAccent'].forEach((id) => bindValue(id, id));
['noiseAmount','grainSize','washAmount','noteSize','noteLineHeight','noteLetterSpacing','noteWidth','notePadding','dividerThickness'].forEach((id) => bindValue(id, id, 'input', Number));
$('#noteShadow').checked = state.noteShadow;
$('#noteShadow').addEventListener('change', (event) => { state.noteShadow = event.target.checked; render(); });
[['boldToggle','noteBold'],['italicToggle','noteItalic'],['underlineToggle','noteUnderline']].forEach(([id,key]) => $(`#${id}`).addEventListener('click', () => { state[key] = !state[key]; render(); }));
$('#rerollNoise').addEventListener('click', () => { state.noiseSeed = Math.floor(Math.random() * 1000000); render(); });

exportButton.addEventListener('click', async () => {
  if (!window.htmlToImage) { status.textContent = 'EXPORT LIBRARY NOT READY'; return; }
  status.textContent = 'RENDERING PNG...';
  exportButton.disabled = true;
  const previousTransform = stage.style.transform;
  stage.style.transform = 'none';
  try {
    await document.fonts.ready;
    const dataUrl = await window.htmlToImage.toPng(stage, { pixelRatio: 1, cacheBust: true, backgroundColor: state.asset === 'background' ? state.paperColor : null });
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
