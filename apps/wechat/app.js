const stage = document.querySelector('#exportStage');
const scaler = document.querySelector('#stageScaler');
const viewport = document.querySelector('#previewViewport');
const status = document.querySelector('#appStatus');
const exportButton = document.querySelector('#exportButton');
const PAPER_WIDTH = 1080;
const PAPER_HEIGHT = 2400;
const FIELD_WIDTH = 360;
const FIELD_HEIGHT = 800;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const saved = JSON.parse(localStorage.getItem('wechat-asset-factory') || '{}');

const backgroundPresets = {
  signalGhost: { paperColor: '#030611', noiseAmount: 22, grainSize: 1, washAmount: 68, scanlineAmount: 28, rgbSplit: 8, bloomAmount: 48, vignetteAmount: 34, tearAmount: 5, safeCenter: false },
  liquidChrome: { paperColor: '#f5f4ef', noiseAmount: 13, grainSize: 1, washAmount: 82, scanlineAmount: 8, rgbSplit: 10, bloomAmount: 28, vignetteAmount: 3, tearAmount: 1, safeCenter: false },
  tubeBloom: { paperColor: '#141217', noiseAmount: 9, grainSize: 2, washAmount: 58, scanlineAmount: 25, rgbSplit: 8, bloomAmount: 58, vignetteAmount: 40, tearAmount: 2, safeCenter: false },
  tvStatic: { paperColor: '#808080', noiseAmount: 50, grainSize: 1, washAmount: 0, scanlineAmount: 0, rgbSplit: 0, bloomAmount: 0, vignetteAmount: 0, tearAmount: 0, safeCenter: false },
};
const backgroundPresetSlugs = { signalGhost: 'signal-ghost-seamless', liquidChrome: 'liquid-chrome-seamless', tubeBloom: 'tube-bloom-seamless', tvStatic: 'tv-static-seamless' };
const noteLayoutDefaults = {
  editorial: {
    title: 'untitled.txt - Notepad',
    width: 900,
    content: '透明酚酞 / TRANSPARENT PHENOLPHTHALEIN\n\n声音经过身体，留下没有名字的颜色。\n我们把它们收集在这里。',
  },
  dialog: {
    title: 'System message',
    width: 720,
  },
  painter: {
    title: 'untitled - Paint',
    width: 920,
  },
};
const noteLayoutSlugs = { editorial: 'notepad-98', dialog: 'dialog-98', painter: 'paint-98' };
const hasValidSavedBackground = Boolean(backgroundPresets[saved.backgroundPreset]);
const initialBackgroundPreset = hasValidSavedBackground ? saved.backgroundPreset : 'signalGhost';
const initialBackground = backgroundPresets[initialBackgroundPreset];
const initialNoteLayout = noteLayoutDefaults[saved.noteLayout] ? saved.noteLayout : 'editorial';
const initialNoteDefaults = noteLayoutDefaults[initialNoteLayout];

const state = {
  asset: saved.asset || 'background',
  backgroundPreset: initialBackgroundPreset,
  paperColor: hasValidSavedBackground ? (saved.paperColor || initialBackground.paperColor) : initialBackground.paperColor,
  noiseAmount: hasValidSavedBackground ? (saved.noiseAmount ?? initialBackground.noiseAmount) : initialBackground.noiseAmount,
  grainSize: hasValidSavedBackground ? (saved.grainSize ?? initialBackground.grainSize) : initialBackground.grainSize,
  washAmount: hasValidSavedBackground ? (saved.washAmount ?? initialBackground.washAmount) : initialBackground.washAmount,
  scanlineAmount: hasValidSavedBackground ? (saved.scanlineAmount ?? initialBackground.scanlineAmount) : initialBackground.scanlineAmount,
  rgbSplit: hasValidSavedBackground ? (saved.rgbSplit ?? initialBackground.rgbSplit) : initialBackground.rgbSplit,
  bloomAmount: hasValidSavedBackground ? (saved.bloomAmount ?? initialBackground.bloomAmount) : initialBackground.bloomAmount,
  vignetteAmount: hasValidSavedBackground ? (saved.vignetteAmount ?? initialBackground.vignetteAmount) : initialBackground.vignetteAmount,
  tearAmount: hasValidSavedBackground ? (saved.tearAmount ?? initialBackground.tearAmount) : initialBackground.tearAmount,
  safeCenter: hasValidSavedBackground ? (saved.safeCenter ?? initialBackground.safeCenter) : initialBackground.safeCenter,
  noiseSeed: saved.noiseSeed || Math.floor(Math.random() * 1000000),
  washSeed: saved.washSeed || Math.floor(Math.random() * 1000000),
  noteLayout: initialNoteLayout,
  noteTitle: saved.noteTitle || initialNoteDefaults.title,
  noteContent: saved.noteContent || noteLayoutDefaults.editorial.content,
  dialogPrimary: saved.dialogPrimary || 'Ok',
  dialogSecondary: saved.dialogSecondary || 'Cancel',
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
  noteWidth: saved.noteWidth ?? initialNoteDefaults.width,
  notePadding: saved.notePadding ?? 48,
  noteShadow: saved.noteShadow ?? true,
  dividerStyle: 'progress98',
  dividerLabel: saved.dividerStyle === 'progress98' ? (saved.dividerLabel ?? '') : '',
  dividerColor: saved.dividerStyle === 'progress98' ? (saved.dividerColor || '#000080') : '#000080',
  dividerAccent: saved.dividerStyle === 'progress98' ? (saved.dividerAccent || '#c0c0c0') : '#c0c0c0',
  dividerProgress: saved.dividerProgress ?? 64,
  dividerSegments: saved.dividerSegments ?? 16,
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

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hsvToRgb(hue, saturation, value) {
  const h = ((hue % 360) + 360) % 360 / 60;
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(h % 2 - 1));
  const match = value - chroma;
  const table = h < 1 ? [chroma,x,0] : h < 2 ? [x,chroma,0] : h < 3 ? [0,chroma,x] : h < 4 ? [0,x,chroma] : h < 5 ? [x,0,chroma] : [chroma,0,x];
  return table.map((channel) => (channel + match) * 255);
}

function gaussian(value, center, spread) {
  return Math.exp(-((value - center) ** 2) / (2 * spread * spread));
}

function periodicGaussian(value, center, spread, period = 2) {
  const wrapped = ((value - center + period / 2) % period + period) % period - period / 2;
  return Math.exp(-(wrapped ** 2) / (2 * spread * spread));
}

function paintField(context, renderer, smoothing = true) {
  const field = document.createElement('canvas');
  field.width = FIELD_WIDTH;
  field.height = FIELD_HEIGHT;
  const fieldContext = field.getContext('2d');
  const image = fieldContext.createImageData(field.width, field.height);
  const random = seededRandom(state.washSeed);
  const phase = random() * Math.PI * 2;
  for (let py = 0; py < field.height; py += 1) {
    const y = py / (field.height - 1) * 2 - 1;
    for (let px = 0; px < field.width; px += 1) {
      const x = px / (field.width - 1) * 2 - 1;
      const color = renderer(x, y, phase, random);
      const offset = (py * field.width + px) * 4;
      image.data[offset] = clamp(color[0]);
      image.data[offset + 1] = clamp(color[1]);
      image.data[offset + 2] = clamp(color[2]);
      image.data[offset + 3] = 255;
    }
  }
  fieldContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = smoothing;
  if (smoothing) context.imageSmoothingQuality = 'high';
  context.drawImage(field, 0, 0, context.canvas.width, context.canvas.height);
}

function drawSignalGhost(context) {
  const strength = Number(state.washAmount) / 100;
  const base = hexToRgb(state.paperColor);
  const bands = [
    [-.82, .13, 38, .95, -.10], [-.60, .08, 320, .78, .08], [-.34, .18, 184, .72, -.04],
    [-.03, .22, 42, .98, .02], [.30, .16, 196, .68, -.12], [.60, .11, 28, .80, .14], [.87, .14, 350, .92, 0],
  ];
  paintField(context, (x, y, phase, random) => {
    let r = base[0] + 2;
    let g = base[1] + 5;
    let b = base[2] + 15;
    const loop = Math.PI * (y + 1);
    const column = gaussian(x, 0, .43) * (.35 + .22 * Math.cos(loop * 4 + phase));
    r += 14 * column; g += 42 * column; b += 78 * column;
    for (const [cy, sy, hue, power, skew] of bands) {
      const shiftedX = x - skew * Math.sin((y - cy) * Math.PI * 4 + phase);
      const glow = periodicGaussian(y, cy, sy) * gaussian(shiftedX, 0, .52 + sy) * power * strength;
      const spectral = hsvToRgb(hue + x * 95 + Math.sin(loop) * 24, .78, 1);
      r += spectral[0] * glow;
      g += spectral[1] * glow;
      b += spectral[2] * glow;
      const whiteCore = Math.max(0, glow - .44) * 280;
      r += whiteCore; g += whiteCore; b += whiteCore;
    }
    const granular = (random() - .5) * 14;
    const edge = Math.max(0, Math.abs(x) - .62) * 150;
    return [r + granular - edge, g + granular - edge, b + granular - edge * .7];
  });
}

function drawLiquidChrome(context) {
  const strength = Number(state.washAmount) / 100;
  const base = hexToRgb(state.paperColor);
  paintField(context, (x, y, phase, random) => {
    const loop = Math.PI * (y + 1);
    const loopSin = Math.sin(loop);
    const loopCos = Math.cos(loop);
    const warpX = x + (.20 + strength * .17) * Math.sin(loop * 2 + Math.sin(x * 2.1 + phase)) + .07 * Math.sin(loop * 5 - phase);
    const warpY = loopSin * .78 + loopCos * .26 + (.14 + strength * .12) * Math.sin(x * 2.7 - loopCos * 1.4 - phase) + .06 * Math.cos(x * 8 + phase);
    const field = Math.sin(warpX * 3.35 + 2.35 * Math.sin(warpY * 2.25 + phase))
      + .66 * Math.sin(warpY * 4.1 - 1.9 * Math.cos(warpX * 2.5 - phase));
    const dark = smoothstep(.18, .72, field);
    const boundary = Math.exp(-Math.abs(field - .12) * 2.75);
    const innerBand = Math.exp(-Math.abs(field - .54) * 8.5);
    const stripe = (.45 + .55 * Math.sin(field * 42 + x * 6 - loopSin * 4 + phase)) * boundary;
    const contour = (.5 + .5 * Math.cos((field - .12) * 34)) * Math.exp(-Math.abs(field - .28) * 1.45);
    const spectral = hsvToRgb(190 + (field - .12) * 520 + loopSin * 85 + phase * 18, .88, 1);
    const shadow = [15, 20, 42];
    const iridescence = clamp(boundary * .52 + innerBand * .86 + stripe * .34 + contour * .48, 0, 1);
    const paper = 1 - dark;
    const dither = (random() - .5) * (9 + Number(state.noiseAmount) * .45);
    return [
      base[0] * paper + shadow[0] * dark + spectral[0] * iridescence + dither,
      base[1] * paper + shadow[1] * dark + spectral[1] * iridescence + dither,
      base[2] * paper + shadow[2] * dark + spectral[2] * iridescence + dither,
    ];
  });
}

function drawTubeBloom(context) {
  const strength = Number(state.washAmount) / 100;
  const base = hexToRgb(state.paperColor);
  const bands = [[-.78,24,.15],[-.52,170,.13],[-.27,320,.11],[-.02,48,.18],[.26,195,.15],[.51,310,.12],[.76,32,.17]];
  paintField(context, (x, y, phase, random) => {
    const loop = Math.PI * (y + 1);
    const curveY = y + .19 * x * x + .025 * Math.sin(x * 7 + phase);
    const tube = Math.max(0, 1 - Math.abs(x) ** 2.2);
    let r = base[0] * .45 + 10;
    let g = base[1] * .45 + 8;
    let b = base[2] * .45 + 12;
    for (const [cy, hue, spread] of bands) {
      const glow = periodicGaussian(curveY, cy, spread) * (.58 + .42 * tube) * strength;
      const spectral = hsvToRgb(hue + x * 72, .55, 1);
      r += spectral[0] * glow;
      g += spectral[1] * glow;
      b += spectral[2] * glow;
      const core = Math.max(0, glow - .35) * 185;
      r += core; g += core; b += core;
    }
    const centralBloom = gaussian(x, 0, .48) * (.20 + .18 * Math.cos(loop * 3 + x * x * 2 + phase));
    r += 155 * centralBloom; g += 170 * centralBloom; b += 145 * centralBloom;
    const sideFalloff = Math.pow(Math.abs(x), 2.2) * 190;
    const grain = (random() - .5) * 11;
    return [r - sideFalloff + grain, g - sideFalloff + grain, b - sideFalloff + grain];
  });
}

function drawTvStatic(context) {
  const { width, height } = context.canvas;
  const image = context.createImageData(width, height);
  const random = seededRandom(state.noiseSeed + state.washSeed * 31);
  const grain = Math.max(1, Number(state.grainSize));
  const contrast = .35 + Number(state.noiseAmount) / 50 * .65;
  for (let y = 0; y < height; y += grain) {
    for (let x = 0; x < width; x += grain) {
      const gray = Math.round(127.5 + (random() * 255 - 127.5) * contrast);
      const maxY = Math.min(height, y + grain);
      const maxX = Math.min(width, x + grain);
      for (let fillY = y; fillY < maxY; fillY += 1) {
        for (let fillX = x; fillX < maxX; fillX += 1) {
          const offset = (fillY * width + fillX) * 4;
          image.data[offset] = gray;
          image.data[offset + 1] = gray;
          image.data[offset + 2] = gray;
          image.data[offset + 3] = 255;
        }
      }
    }
  }
  context.putImageData(image, 0, 0);
}

function addNoise(context, width, height) {
  const size = Math.max(1, Number(state.grainSize));
  const random = seededRandom(state.noiseSeed);
  const palette = state.backgroundPreset === 'tvStatic'
    ? [[0,0,0],[38,38,38],[110,110,110],[190,190,190],[255,255,255]]
    : [[242,59,151],[36,225,215],[96,113,255],[255,220,75],[255,255,255],[3,4,12]];
  const count = Math.round(width * height / (size * size) * Number(state.noiseAmount) / 100 * .18);
  for (let index = 0; index < count; index += 1) {
    const color = palette[Math.floor(random() * palette.length)];
    const x = Math.floor(random() * width / size) * size;
    const y = Math.floor(random() * height / size) * size;
    if (state.safeCenter && x > width * .16 && x < width * .84 && y > height * .1 && y < height * .9 && random() < .72) continue;
    const alpha = state.backgroundPreset === 'liquidChrome' ? .08 + random() * .17 : state.backgroundPreset === 'tvStatic' ? .18 + random() * .42 : .06 + random() * .24;
    context.fillStyle = `rgba(${color.join(',')},${alpha})`;
    context.fillRect(x, y, size, size);
  }
}

function addTears(context, width, height) {
  const tearCount = Number(state.tearAmount);
  if (!tearCount) return;
  const source = document.createElement('canvas');
  source.width = width; source.height = height;
  source.getContext('2d').drawImage(context.canvas, 0, 0);
  const random = seededRandom(state.washSeed + 887);
  const margin = Math.min(80, height * .04);
  for (let index = 0; index < tearCount; index += 1) {
    const y = Math.floor(margin + random() * (height - margin * 2 - 45));
    const bandHeight = 3 + Math.floor(random() * 26);
    const offset = Math.round((random() - .5) * (50 + Number(state.rgbSplit) * 12));
    context.drawImage(source, 0, y, width, bandHeight, offset, y, width, bandHeight);
    const isMono = state.backgroundPreset === 'tvStatic';
    context.fillStyle = isMono ? 'rgba(255,255,255,.28)' : `rgba(42,239,220,${.12 + Number(state.rgbSplit) / 95})`;
    context.fillRect(Math.max(0, offset), y - 2, width - Math.abs(offset), 2);
    context.fillStyle = isMono ? 'rgba(0,0,0,.34)' : `rgba(244,38,157,${.12 + Number(state.rgbSplit) / 95})`;
    context.fillRect(Math.max(0, -offset), y + bandHeight, width - Math.abs(offset), 2);
  }
}

function addRaster(context, width, height) {
  const amount = Number(state.scanlineAmount) / 100;
  if (!amount) return;
  context.save();
  context.lineWidth = state.backgroundPreset === 'signalGhost' ? 2 : 1.4;
  const rasterInk = state.backgroundPreset === 'tvStatic' ? '0,0,0' : '0,0,8';
  context.strokeStyle = `rgba(${rasterInk},${.18 + amount * .72})`;
  if (state.backgroundPreset === 'tubeBloom') {
    for (let y = -40; y < height + 40; y += 5) {
      context.beginPath();
      context.moveTo(0, y + 92);
      context.quadraticCurveTo(width / 2, y, width, y + 92);
      context.stroke();
    }
  } else {
    const spacing = state.backgroundPreset === 'signalGhost' ? 4 : 5;
    for (let y = 0; y < height; y += spacing) {
      context.beginPath(); context.moveTo(0, y + .5); context.lineTo(width, y + .5); context.stroke();
    }
  }
  if (state.backgroundPreset === 'tvStatic') {
    context.restore();
    return;
  }
  const splitAlpha = .012 + Number(state.rgbSplit) / 500;
  context.fillStyle = `rgba(255,20,100,${splitAlpha})`;
  for (let x = 0; x < width; x += 6) context.fillRect(x, 0, 1, height);
  context.fillStyle = `rgba(0,240,220,${splitAlpha})`;
  for (let x = 2; x < width; x += 6) context.fillRect(x, 0, 1, height);
  context.restore();
}

function addFinish(context, width, height) {
  const bloom = Number(state.bloomAmount) / 100;
  if (bloom > 0) {
    context.save();
    context.globalCompositeOperation = 'screen';
    const glow = context.createLinearGradient(0, 0, width, 0);
    glow.addColorStop(0, 'rgba(255,255,255,0)');
    const glowTint = state.backgroundPreset === 'tvStatic' ? '255,255,255' : '96,211,225';
    const glowCore = state.backgroundPreset === 'tvStatic' ? '255,255,255' : '255,255,245';
    glow.addColorStop(.3, `rgba(${glowTint},${bloom * .07})`);
    glow.addColorStop(.5, `rgba(${glowCore},${bloom * .22})`);
    glow.addColorStop(.7, `rgba(${glowTint},${bloom * .07})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
    context.restore();
  }
  const vignette = Number(state.vignetteAmount) / 100;
  if (vignette > 0) {
    const vignetteInk = state.backgroundPreset === 'tvStatic' ? '0,0,0' : '0,0,5';
    const shade = context.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, `rgba(${vignetteInk},${vignette * .95})`);
    shade.addColorStop(.22, `rgba(${vignetteInk},${vignette * .18})`);
    shade.addColorStop(.5, `rgba(${vignetteInk},0)`);
    shade.addColorStop(.78, `rgba(${vignetteInk},${vignette * .18})`);
    shade.addColorStop(1, `rgba(${vignetteInk},${vignette * .95})`);
    context.fillStyle = shade; context.fillRect(0, 0, width, height);
  }
}

function rotateToSeamlessVerticalTile(context, width, height) {
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  source.getContext('2d').drawImage(context.canvas, 0, 0);
  const split = Math.floor(height / 2);
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, split, width, height - split, 0, 0, width, height - split);
  context.drawImage(source, 0, 0, width, split, 0, height - split, width, split);
}

function makePaperDataUrl() {
  const width = PAPER_WIDTH;
  const height = PAPER_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (state.backgroundPreset === 'tvStatic') {
    drawTvStatic(context);
    rotateToSeamlessVerticalTile(context, width, height);
    return canvas.toDataURL('image/png');
  }
  if (state.backgroundPreset === 'liquidChrome') drawLiquidChrome(context);
  else if (state.backgroundPreset === 'tubeBloom') drawTubeBloom(context);
  else drawSignalGhost(context);
  addNoise(context, width, height);
  addTears(context, width, height);
  addRaster(context, width, height);
  addFinish(context, width, height);
  rotateToSeamlessVerticalTile(context, width, height);
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
  if (state.noteLayout === 'dialog') {
    return `<div class="notepad-window dialog-window">
      <div class="notepad-titlebar dialog-titlebar"><span class="titlebar-title"></span><span class="window-buttons"><i class="window-button">×</i></span></div>
      <div class="dialog-body"><div class="dialog-blank" aria-hidden="true"></div><div class="dialog-actions"><button class="dialog-button dialog-primary" type="button"></button><button class="dialog-button dialog-secondary" type="button"></button></div></div>
    </div>`;
  }
  if (state.noteLayout === 'painter') {
    const tools = ['✥','▧','▱','◈','⌁','⌕','✎','▥','✦','A','╲','∿','□','⌑','○','▢'];
    const palette = ['#000000','#ffffff','#808080','#c0c0c0','#800000','#ff0000','#808000','#ffff00','#008000','#00ff00','#008080','#00ffff','#000080','#0000ff','#800080','#ff00ff','#804000','#ff8040'];
    return `<div class="notepad-window painter-window">
      <div class="notepad-titlebar painter-titlebar"><span class="paint-app-icon">🎨</span><span class="titlebar-title"></span><span class="window-buttons"><i class="window-button">_</i><i class="window-button">□</i><i class="window-button">×</i></span></div>
      <div class="notepad-menu painter-menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>I</u>mage</span><span><u>O</u>ptions</span><span><u>H</u>elp</span></div>
      <div class="paint-workbench">
        <div class="paint-toolbar"><div class="paint-tools">${tools.map((tool, index) => `<i class="paint-tool${index === 1 ? ' selected' : ''}">${tool}</i>`).join('')}</div><div class="paint-tool-options"></div></div>
        <div class="paint-canvas-shell"><div class="paint-canvas"></div><i class="paint-scroll paint-scroll-v"></i><i class="paint-scroll paint-scroll-h"></i><i class="paint-scroll-corner"></i></div>
      </div>
      <div class="paint-palette"><div class="paint-current-colors"><i></i><b></b></div><div class="paint-swatches">${palette.map((color) => `<i style="--swatch:${color}"></i>`).join('')}</div></div>
      <div class="paint-status"><span>For Help, click Help Topics on the Help Menu.</span><i></i><b></b></div>
    </div>`;
  }
  return `<div class="notepad-window">
    <div class="notepad-titlebar"><span class="notepad-icon"></span><span class="titlebar-title"></span><span class="window-buttons"><i class="window-button">_</i><i class="window-button">□</i><i class="window-button">×</i></span></div>
    <div class="notepad-menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>S</u>earch</span><span><u>H</u>elp</span></div>
    <div class="notepad-body"></div>
  </div>`;
}

function dividerMarkup() {
  const filledSegments = Math.round(state.dividerSegments * state.dividerProgress / 100);
  const segments = Array.from({ length: state.dividerSegments }, (_, index) => `<i class="progress98-segment${index < filledSegments ? ' filled' : ''}"></i>`).join('');
  return `<div class="progress98-wrap"><span class="progress98-bracket">[</span><div class="progress98-frame"><div class="progress98-track">${segments}</div></div><span class="progress98-bracket">]</span><span class="progress98-label"></span></div>`;
}

function render() {
  $$('.asset-tab').forEach((button) => button.classList.toggle('active', button.dataset.asset === state.asset));
  $$('.background-preset').forEach((button) => button.classList.toggle('active', button.dataset.backgroundPreset === state.backgroundPreset));
  $$('.note-layout-preset').forEach((button) => button.classList.toggle('active', button.dataset.noteLayout === state.noteLayout));
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
    $('#previewDimensions').textContent = `${PAPER_WIDTH} × ${PAPER_HEIGHT}`;
    $('#exportName').textContent = `${backgroundPresetSlugs[state.backgroundPreset].toUpperCase()}.PNG`;
    $('#exportHint').textContent = `${PAPER_WIDTH} × ${PAPER_HEIGHT} · 上下无缝`;
  } else if (state.asset === 'notepad') {
    stage.classList.add('note-artboard');
    stage.innerHTML = notepadMarkup();
    const windowElement = stage.querySelector('.notepad-window');
    const titlebar = stage.querySelector('.notepad-titlebar');
    const body = stage.querySelector('.notepad-body');
    stage.querySelector('.titlebar-title').textContent = state.noteTitle;
    windowElement.style.width = `${state.noteWidth}px`;
    windowElement.style.boxShadow = state.noteShadow ? '14px 14px 0 rgba(10,17,13,.25), inset 3px 3px #fff, inset -3px -3px #111' : 'inset 3px 3px #fff, inset -3px -3px #111';
    titlebar.style.background = state.titlebarColor;
    if (state.noteLayout === 'editorial') {
      renderMixedText(body, state.noteContent);
      Object.assign(body.style, { fontFamily: fontFamilies[state.noteCjkFont], fontSize: `${state.noteSize}px`, fontWeight: state.noteBold ? '700' : state.noteWeight, textAlign: state.noteAlign, lineHeight: state.noteLineHeight, letterSpacing: `${state.noteLetterSpacing}px`, color: state.noteColor, fontStyle: state.noteItalic ? 'italic' : 'normal', textDecoration: state.noteUnderline ? 'underline' : 'none', padding: `${state.notePadding}px` });
      const bodyHeight = Math.max(280, state.noteContent.split('\n').length * state.noteSize * state.noteLineHeight + state.notePadding * 2);
      body.style.minHeight = `${bodyHeight}px`;
    } else if (state.noteLayout === 'dialog') {
      stage.querySelector('.dialog-primary').textContent = state.dialogPrimary;
      stage.querySelector('.dialog-secondary').textContent = state.dialogSecondary;
    }
    stage.style.height = `${Math.max(500, windowElement.offsetHeight + 152)}px`;
    $('#previewDimensions').textContent = `1080 × ${Math.round(parseFloat(stage.style.height))}`;
    $('#exportName').textContent = `${noteLayoutSlugs[state.noteLayout].toUpperCase()}.PNG`;
    $('#exportHint').textContent = '1080px 宽 · 透明底';
  } else {
    stage.classList.add('divider-artboard');
    stage.innerHTML = dividerMarkup();
    const divider = stage.querySelector('.progress98-wrap');
    divider.style.setProperty('--progress-color', state.dividerColor);
    divider.style.setProperty('--empty-color', state.dividerAccent);
    stage.querySelector('.progress98-track').style.gridTemplateColumns = `repeat(${state.dividerSegments}, 1fr)`;
    stage.querySelector('.progress98-label').textContent = state.dividerLabel.trim() || `${state.dividerProgress}%`;
    $('#previewDimensions').textContent = '1080 × 180';
    $('#exportName').textContent = 'PROGRESS-98.PNG';
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
  const isUniformStatic = state.backgroundPreset === 'tvStatic';
  ['paperColor','washAmount','scanlineAmount','rgbSplit','bloomAmount','vignetteAmount','tearAmount','safeCenter'].forEach((id) => {
    $(`#${id}`).disabled = isUniformStatic;
  });
  $$('[data-note-editorial]').forEach((element) => { element.hidden = state.noteLayout !== 'editorial'; });
  $$('[data-note-dialog]').forEach((element) => { element.hidden = state.noteLayout !== 'dialog'; });
  ['noteTitle','noteContent','dialogPrimary','dialogSecondary'].forEach((id) => {
    if ($(`#${id}`).value !== String(state[id])) $(`#${id}`).value = state[id];
  });
  $('#noteWidthValue').textContent = `${state.noteWidth}px`;
  $('#notePaddingValue').textContent = `${state.notePadding}px`;
  $('#dividerProgressValue').textContent = `${state.dividerProgress}%`;
  $('#dividerSegmentsValue').textContent = state.dividerSegments;
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
$$('.background-preset').forEach((button) => button.addEventListener('click', () => {
  state.backgroundPreset = button.dataset.backgroundPreset;
  Object.assign(state, backgroundPresets[state.backgroundPreset]);
  state.noiseSeed = Math.floor(Math.random() * 1000000);
  state.washSeed = Math.floor(Math.random() * 1000000);
  render();
}));

$$('.note-layout-preset').forEach((button) => button.addEventListener('click', () => {
  const nextLayout = button.dataset.noteLayout;
  if (nextLayout === state.noteLayout) return;
  const nextDefaults = noteLayoutDefaults[nextLayout];
  state.noteLayout = nextLayout;
  state.noteTitle = nextDefaults.title;
  state.noteWidth = nextDefaults.width;
  render();
}));

['paperColor','noteTitle','noteContent','dialogPrimary','dialogSecondary','noteCjkFont','noteLatinFont','noteWeight','noteAlign','noteColor','titlebarColor','dividerLabel','dividerColor','dividerAccent'].forEach((id) => bindValue(id, id));
['noiseAmount','grainSize','washAmount','scanlineAmount','rgbSplit','bloomAmount','vignetteAmount','tearAmount','noteSize','noteLineHeight','noteLetterSpacing','noteWidth','notePadding','dividerProgress','dividerSegments'].forEach((id) => bindValue(id, id, 'input', Number));
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
    const noteSlug = noteLayoutSlugs[state.noteLayout];
    const slug = state.asset === 'divider' ? 'progress-98' : state.asset === 'notepad' ? noteSlug : backgroundPresetSlugs[state.backgroundPreset];
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
