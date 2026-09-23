const canvas = document.querySelector('#glCanvas');
const viewport = document.querySelector('#previewViewport');
const screenFrame = document.querySelector('#screenFrame');
const fileInput = document.querySelector('#fileInput');
const dropZone = document.querySelector('#dropZone');
const exportButton = document.querySelector('#exportButton');
const compareButton = document.querySelector('#compareButton');
const emptyOverlay = document.querySelector('#emptyOverlay');

const controlSchema = [
  {
    title: 'OPTICS / 镜头畸变',
    controls: [
      ['curvature', '桶形弯曲', 0, 0.34, 0.005, 0, ''],
      ['overscan', '过扫描', 0, 0.16, 0.002, 0, ''],
      ['vignette', '暗角', 0, 1, 0.01, 0.16, ''],
      ['softness', '边缘柔化', 0, 2, 0.01, 0.28, 'px'],
    ],
  },
  {
    title: 'SIGNAL / 模拟信号',
    controls: [
      ['rgbSplit', 'RGB 分离', 0, 12, 0.1, 1.2, 'px'],
      ['jitter', '水平抖动', 0, 8, 0.1, 0.1, 'px'],
      ['noise', '信号噪点', 0, 0.35, 0.005, 0.195, ''],
      ['roll', '滚动干扰', 0, 1, 0.01, 0.16, ''],
    ],
  },
  {
    title: 'DISPLAY / 显示结构',
    controls: [
      ['scanline', '扫描线', 0, 1, 0.01, 0.34, ''],
      ['scanDensity', '扫描密度', 0.35, 1.5, 0.01, 0.86, '×'],
      ['mask', '荧光栅格', 0, 1, 0.01, 0.16, ''],
      ['bloom', '像素辉光', 0, 1.5, 0.01, 0.22, ''],
      ['glowRadius', '辉光半径', 0.5, 8, 0.1, 3.5, 'px'],
      ['glowThreshold', '高光阈值', 0.12, 0.92, 0.01, 0.22, ''],
      ['glowColorTolerance', '颜色容差', 0.01, 0.6, 0.01, 0.34, ''],
      ['edgeGlow', '边缘反光', 0, 1.5, 0.01, 0.34, ''],
    ],
  },
  {
    title: 'COLOR / 色彩',
    controls: [
      ['brightness', '亮度', 0.55, 1.5, 0.01, 1.02, '×'],
      ['contrast', '对比度', 0.5, 1.8, 0.01, 1.01, '×'],
      ['saturation', '饱和度', 0, 2, 0.01, 1.08, '×'],
      ['tint', '冷暖偏色', -1, 1, 0.01, 0.02, ''],
    ],
  },
];

const presets = {
  studio: { curvature: 0, overscan: 0, vignette: .16, softness: .28, rgbSplit: 1.2, jitter: .1, noise: .195, roll: .16, scanline: .34, scanDensity: .86, mask: .16, bloom: .22, glowRadius: 3.5, glowThreshold: .22, glowColorTolerance: .34, edgeGlow: .34, brightness: 1.02, contrast: 1.01, saturation: 1.08, tint: .02, glowColor: [0.9804, 0.8588, 0.0078], glowColorEnabled: 1 },
  consumer: { curvature: .19, overscan: .065, vignette: .62, softness: .75, rgbSplit: 2.8, jitter: .8, noise: .095, roll: .17, scanline: .5, scanDensity: .72, mask: .26, bloom: .42, glowRadius: 3.8, glowThreshold: .42, glowColorTolerance: .14, edgeGlow: .48, brightness: .98, contrast: 1.14, saturation: .94, tint: .16 },
  arcade: { curvature: .135, overscan: .045, vignette: .52, softness: .18, rgbSplit: 1.8, jitter: .22, noise: .035, roll: .04, scanline: .58, scanDensity: 1.18, mask: .52, bloom: .72, glowRadius: 4.6, glowThreshold: .34, glowColorTolerance: .16, edgeGlow: .88, brightness: 1.1, contrast: 1.26, saturation: 1.48, tint: -.1 },
  damaged: { curvature: .23, overscan: .09, vignette: .7, softness: 1.05, rgbSplit: 7.2, jitter: 4.4, noise: .22, roll: .75, scanline: .68, scanDensity: .56, mask: .35, bloom: .54, glowRadius: 6.2, glowThreshold: .38, glowColorTolerance: .2, edgeGlow: .72, brightness: .96, contrast: 1.3, saturation: .76, tint: .3 },
};

const state = {
  ...presets.studio,
};
const CRT_SNAPSHOT_PREFIX = 'retro-visual-lab-crt-snapshot-';
let gl;
let program;
let texture;
let sourceImage;
let imageName = 'demo-signal';
let imageWidth = 1600;
let imageHeight = 1000;
let comparing = false;
let animate = true;
let fitMode = true;
let startTime = performance.now();

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_texCoord;
}`;

const fragmentShaderSource = `
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_curvature;
uniform float u_overscan;
uniform float u_vignette;
uniform float u_softness;
uniform float u_rgbSplit;
uniform float u_jitter;
uniform float u_noise;
uniform float u_roll;
uniform float u_scanline;
uniform float u_scanDensity;
uniform float u_mask;
uniform float u_bloom;
uniform float u_glowRadius;
uniform float u_glowThreshold;
uniform vec3 u_glowColor;
uniform float u_glowColorEnabled;
uniform float u_glowColorTolerance;
uniform float u_edgeGlow;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_tint;
uniform float u_bypass;
varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 warpedUv(vec2 uv) {
  vec2 p = uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  p.x *= aspect;
  float radius = dot(p, p);
  p *= 1.0 + u_curvature * radius * 2.25;
  p.x /= aspect;
  p /= max(0.72, 1.0 - u_overscan);
  return p + 0.5;
}

vec3 sampleSignal(vec2 uv) {
  vec2 pixel = 1.0 / u_resolution;
  float px = pixel.x;
  float line = floor(uv.y * u_resolution.y * 0.32);
  float burst = sin(line * 1.73 + u_time * 7.0) * sin(line * 0.071 - u_time * 2.1);
  float jitter = burst * u_jitter * px;
  float tear = smoothstep(.82, 1.0, sin(uv.y * 35.0 - u_time * 1.4) * .5 + .5) * u_roll * px * 9.0;
  uv.x += jitter + tear;

  float split = u_rgbSplit * px;
  vec2 radial = normalize((uv - .5) + vec2(.0001)) * split;
  float r = texture2D(u_image, uv + radial).r;
  float g = texture2D(u_image, uv).g;
  float b = texture2D(u_image, uv - radial).b;
  vec3 color = vec3(r, g, b);

  if (u_softness > 0.01 || u_bloom > 0.01 || u_edgeGlow > 0.01) {
    // Keep the sampling offsets locked to source pixels so the halo remains blocky.
    vec2 nearStep = pixel * max(1.0, floor(u_glowRadius * .5 + .5));
    vec2 farStep = pixel * max(1.0, floor(u_glowRadius + .5));
    vec3 left = texture2D(u_image, uv - vec2(nearStep.x, 0.0)).rgb;
    vec3 right = texture2D(u_image, uv + vec2(nearStep.x, 0.0)).rgb;
    vec3 up = texture2D(u_image, uv - vec2(0.0, nearStep.y)).rgb;
    vec3 down = texture2D(u_image, uv + vec2(0.0, nearStep.y)).rgb;
    vec3 halo = left + right + up + down;
    halo += texture2D(u_image, uv + vec2(farStep.x, farStep.y)).rgb;
    halo += texture2D(u_image, uv + vec2(-farStep.x, farStep.y)).rgb;
    halo += texture2D(u_image, uv + vec2(farStep.x, -farStep.y)).rgb;
    halo += texture2D(u_image, uv - farStep).rgb;
    halo *= .125;

    float haloLuma = dot(halo, vec3(.299, .587, .114));
    float brightMask = smoothstep(u_glowThreshold, min(1.0, u_glowThreshold + .24), haloLuma);
    float targetDistance = distance(halo, u_glowColor);
    targetDistance = min(targetDistance, distance(left, u_glowColor));
    targetDistance = min(targetDistance, distance(right, u_glowColor));
    targetDistance = min(targetDistance, distance(up, u_glowColor));
    targetDistance = min(targetDistance, distance(down, u_glowColor));
    float targetMask = 1.0 - smoothstep(u_glowColorTolerance, u_glowColorTolerance + .12, targetDistance);
    float emissionMask = mix(brightMask, targetMask, u_glowColorEnabled);
    vec3 naturalHalo = halo * vec3(.92, 1.04, 1.08);
    vec3 targetedHalo = u_glowColor * max(.42, haloLuma);
    vec3 phosphorHalo = mix(naturalHalo, targetedHalo, u_glowColorEnabled);
    color += phosphorHalo * emissionMask * u_bloom * .72;

    float centerLuma = dot(texture2D(u_image, uv).rgb, vec3(.299, .587, .114));
    float horizontalEdge = abs(dot(right - left, vec3(.299, .587, .114)));
    float verticalEdge = abs(dot(down - up, vec3(.299, .587, .114)));
    float edge = smoothstep(.035, .42, horizontalEdge + verticalEdge);
    float luminanceEdge = smoothstep(u_glowThreshold * .72, 1.0, max(centerLuma, haloLuma));
    float highlightEdge = mix(luminanceEdge, targetMask, u_glowColorEnabled);
    vec3 naturalRim = mix(vec3(.08, .62, .68), vec3(1.0, .82, .18), clamp(centerLuma * 1.3, 0.0, 1.0));
    vec3 rimColor = mix(naturalRim, u_glowColor, u_glowColorEnabled);
    color += rimColor * edge * highlightEdge * u_edgeGlow * .42;

    color = mix(color, halo, min(.38, u_softness * .16));
  }
  return color;
}

void main() {
  vec2 uv = u_bypass > .5 ? v_uv : warpedUv(v_uv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(.003, .008, .005, 1.0);
    return;
  }
  vec3 color = texture2D(u_image, uv).rgb;
  if (u_bypass < .5) {
    color = sampleSignal(uv);
    float luma = dot(color, vec3(.299, .587, .114));
    color = mix(vec3(luma), color, u_saturation);
    color = (color - .5) * u_contrast + .5;
    color *= u_brightness;
    color += vec3(u_tint * .055, u_tint * .016, -u_tint * .048);

    float scanPhase = gl_FragCoord.y * 3.14159265 * u_scanDensity;
    float scan = .5 + .5 * sin(scanPhase);
    color *= 1.0 - u_scanline * (.18 + scan * .48);

    float triad = mod(floor(gl_FragCoord.x), 3.0);
    vec3 maskColor = triad < 1.0 ? vec3(1.0, .72, .72) : (triad < 2.0 ? vec3(.72, 1.0, .72) : vec3(.72, .72, 1.0));
    color *= mix(vec3(1.0), maskColor, u_mask);

    float grain = hash(gl_FragCoord.xy + floor(u_time * 24.0)) - .5;
    color += grain * u_noise;
    float edge = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    color *= mix(1.0, pow(max(edge, 0.0), .24), u_vignette);
  }
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function initWebGL() {
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error('当前浏览器不支持 WebGL');
  program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const vertices = new Float32Array([
    -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1,
    -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  const texCoord = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texCoord);
  gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 16, 8);
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function setUniform(name, value) {
  const location = gl.getUniformLocation(program, name);
  if (Array.isArray(value) && value.length === 3) gl.uniform3f(location, value[0], value[1], value[2]);
  else if (Array.isArray(value)) gl.uniform2f(location, value[0], value[1]);
  else gl.uniform1f(location, value);
}

function render(now = performance.now()) {
  if (!sourceImage) return;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  setUniform('u_resolution', [canvas.width, canvas.height]);
  setUniform('u_time', animate ? (now - startTime) / 1000 : 0);
  Object.entries(state).forEach(([key, value]) => setUniform(`u_${key}`, value));
  setUniform('u_bypass', comparing ? 1 : 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function animationLoop(now) {
  render(now);
  requestAnimationFrame(animationLoop);
}

function uploadTexture(image, name, isDemo = false) {
  sourceImage = image;
  imageWidth = image.naturalWidth || image.width;
  imageHeight = image.naturalHeight || image.height;
  imageName = (name || 'crt-output').replace(/\.[^.]+$/, '');
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  document.querySelector('#fileName').textContent = name || 'DEMO_SIGNAL.PNG';
  document.querySelector('#imageSize').textContent = `${imageWidth} × ${imageHeight}`;
  document.querySelector('#outputSize').textContent = `OUTPUT ${imageWidth} × ${imageHeight}`;
  document.querySelector('#renderStatus').textContent = 'SIGNAL LOCKED';
  document.querySelector('#statusMessage').textContent = isDemo ? 'DEMO SIGNAL ACTIVE' : `${name} LOADED`;
  emptyOverlay.hidden = !isDemo;
  exportButton.disabled = isDemo;
  compareButton.disabled = false;
  updateFrameSize();
  render();
}

function updateFrameSize() {
  if (!sourceImage) return;
  if (fitMode) {
    const availableW = Math.max(120, viewport.clientWidth - 52);
    const availableH = Math.max(120, viewport.clientHeight - 52);
    const scale = Math.min(availableW / imageWidth, availableH / imageHeight, 1);
    screenFrame.style.width = `${Math.round(imageWidth * scale)}px`;
    screenFrame.style.height = `${Math.round(imageHeight * scale)}px`;
    document.querySelector('#zoomLabel').textContent = `${Math.round(scale * 100)}% / FIT`;
  } else {
    screenFrame.style.width = `${imageWidth}px`;
    screenFrame.style.height = `${imageHeight}px`;
    document.querySelector('#zoomLabel').textContent = '100% / ACTUAL';
  }
}

function formatValue(value, suffix) {
  const numeric = Number(value);
  const precision = Math.abs(numeric) < 1 ? 3 : (Number.isInteger(numeric) ? 0 : 2);
  return `${numeric.toFixed(precision).replace(/\.0+$/, '')}${suffix}`;
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function rgbToHex(rgb) {
  return `#${rgb.map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function setGlowTarget(hex, enable = true) {
  state.glowColor = hexToRgb(hex);
  if (enable) state.glowColorEnabled = 1;
  syncGlowColorControl();
  clearPresetSelection();
  render();
}

function syncGlowColorControl() {
  const colorInput = document.querySelector('#glowColor');
  const colorLock = document.querySelector('#glowColorEnabled');
  const colorCode = document.querySelector('#glowColorCode');
  if (!colorInput || !colorLock || !colorCode) return;
  const hex = rgbToHex(state.glowColor);
  colorInput.value = hex;
  colorLock.checked = state.glowColorEnabled > 0.5;
  colorCode.textContent = hex.toUpperCase();
}

function buildGlowColorControl(section) {
  const row = document.createElement('div');
  row.className = 'control-row color-control-row';
  row.innerHTML = `
    <label for="glowColor">辉光目标色</label>
    <div class="color-picker-tools">
      <input id="glowColor" type="color" value="#ffe43b" aria-label="选择辉光目标色">
      <button id="pickGlowColor" type="button">吸取</button>
    </div>
    <label class="color-lock" title="只让接近目标色的像素发光">
      <input id="glowColorEnabled" type="checkbox">
      <span>锁定</span>
    </label>
    <output id="glowColorCode">#FFE43B</output>`;
  section.append(row);

  const colorInput = row.querySelector('#glowColor');
  const colorLock = row.querySelector('#glowColorEnabled');
  const pickButton = row.querySelector('#pickGlowColor');
  colorInput.addEventListener('input', () => setGlowTarget(colorInput.value));
  colorLock.addEventListener('change', () => {
    state.glowColorEnabled = colorLock.checked ? 1 : 0;
    clearPresetSelection();
    render();
  });

  if (!('EyeDropper' in window)) {
    pickButton.disabled = true;
    pickButton.title = '当前浏览器不支持屏幕取色，请点击左侧色块选色';
  } else {
    pickButton.addEventListener('click', async () => {
      try {
        const result = await new EyeDropper().open();
        setGlowTarget(result.sRGBHex);
        document.querySelector('#statusMessage').textContent = `GLOW COLOR ${result.sRGBHex.toUpperCase()} LOCKED`;
      } catch (error) {
        if (error.name !== 'AbortError') document.querySelector('#statusMessage').textContent = 'COLOR PICKER FAILED';
      }
    });
  }
  syncGlowColorControl();
}

function buildControls() {
  const root = document.querySelector('#controlGroups');
  controlSchema.forEach((group) => {
    const section = document.createElement('section');
    section.className = 'control-group';
    const title = document.createElement('h3');
    title.textContent = group.title;
    section.append(title);
    group.controls.forEach(([key, label, min, max, step, initial, suffix]) => {
      state[key] = initial;
      const row = document.createElement('div');
      row.className = 'control-row';
      row.innerHTML = `<label for="control-${key}">${label}</label><input id="control-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${initial}"><output>${formatValue(initial, suffix)}</output>`;
      const input = row.querySelector('input');
      const output = row.querySelector('output');
      input.addEventListener('input', () => {
        state[key] = Number(input.value);
        output.textContent = formatValue(input.value, suffix);
        clearPresetSelection();
        render();
      });
      section.append(row);
    });
    if (group.title.startsWith('DISPLAY')) buildGlowColorControl(section);
    root.append(section);
  });
}

function syncControls() {
  controlSchema.flatMap((group) => group.controls).forEach(([key, , , , , , suffix]) => {
    const input = document.querySelector(`#control-${key}`);
    input.value = state[key];
    input.nextElementSibling.textContent = formatValue(state[key], suffix);
  });
  syncGlowColorControl();
  render();
}

function captureParameterSnapshot() {
  return {
    schemaVersion: 1,
    state: JSON.parse(JSON.stringify(state)),
    animate,
    fitMode,
    exportScale: document.querySelector('#exportScale').value,
    savedAt: Date.now(),
  };
}

function applyParameterSnapshot(snapshot) {
  if (!snapshot?.state) return false;
  const controlKeys = new Set(controlSchema.flatMap((group) => group.controls.map(([key]) => key)));
  controlKeys.forEach((key) => {
    if (Number.isFinite(snapshot.state[key])) state[key] = snapshot.state[key];
  });
  if (Array.isArray(snapshot.state.glowColor) && snapshot.state.glowColor.length === 3) {
    state.glowColor = snapshot.state.glowColor.map((value) => clampNumber(value, 0, 1));
  }
  state.glowColorEnabled = snapshot.state.glowColorEnabled > 0.5 ? 1 : 0;
  animate = snapshot.animate !== false;
  fitMode = snapshot.fitMode !== false;
  document.querySelector('#animateToggle').checked = animate;
  document.querySelector('#exportScale').value = snapshot.exportScale || '1';
  document.querySelector('#fitButton').classList.toggle('active', fitMode);
  document.querySelector('#actualButton').classList.toggle('active', !fitMode);
  syncControls();
  updateFrameSize();
  clearPresetSelection();
  return true;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function saveParameterSnapshot(slot) {
  localStorage.setItem(`${CRT_SNAPSHOT_PREFIX}${slot}`, JSON.stringify(captureParameterSnapshot()));
  document.querySelector('#statusMessage').textContent = `SNAPSHOT ${slot} SAVED`;
}

function loadParameterSnapshot(slot) {
  try {
    const raw = localStorage.getItem(`${CRT_SNAPSHOT_PREFIX}${slot}`);
    if (!raw) {
      document.querySelector('#statusMessage').textContent = `SNAPSHOT ${slot} EMPTY`;
      return;
    }
    if (!applyParameterSnapshot(JSON.parse(raw))) throw new Error('Invalid snapshot');
    document.querySelector('#statusMessage').textContent = `SNAPSHOT ${slot} LOADED`;
  } catch (error) {
    console.error(error);
    document.querySelector('#statusMessage').textContent = `SNAPSHOT ${slot} LOAD FAILED`;
  }
}

function clearPresetSelection() {
  document.querySelectorAll('.preset').forEach((button) => button.classList.remove('active'));
}

function applyPreset(name) {
  Object.assign(state, presets[name]);
  syncControls();
  clearPresetSelection();
  document.querySelector(`[data-preset="${name}"]`).classList.add('active');
  document.querySelector('#statusMessage').textContent = `PRESET ${name.toUpperCase()} APPLIED`;
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    document.querySelector('#statusMessage').textContent = 'UNSUPPORTED FILE';
    return;
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    uploadTexture(image, file.name, false);
    URL.revokeObjectURL(url);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    document.querySelector('#statusMessage').textContent = 'IMAGE DECODE FAILED';
  };
  image.src = url;
}

function makeDemoImage() {
  const demo = document.createElement('canvas');
  demo.width = 1600;
  demo.height = 1000;
  const ctx = demo.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, demo.width, demo.height);
  gradient.addColorStop(0, '#132834');
  gradient.addColorStop(.5, '#ad554a');
  gradient.addColorStop(1, '#e9c95f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, demo.width, demo.height);
  ctx.fillStyle = '#0b1518';
  ctx.fillRect(90, 80, 1420, 840);
  const bars = ['#e4504d', '#edb444', '#54c59c', '#4e79c7', '#d36bb1', '#e9e6d8'];
  bars.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(130 + index * 223, 130, 223, 480);
  });
  ctx.fillStyle = '#e9e6d8';
  ctx.font = '900 96px monospace';
  ctx.fillText('NO SIGNAL', 175, 745);
  ctx.font = '36px monospace';
  ctx.fillText('UPLOAD IMAGE / CRT SIGNAL LAB', 180, 820);
  const image = new Image();
  image.onload = () => uploadTexture(image, 'DEMO_SIGNAL.PNG', true);
  image.src = demo.toDataURL('image/png');
}

function setComparing(value) {
  if (!sourceImage) return;
  comparing = value;
  compareButton.classList.toggle('active', value);
  document.querySelector('#fpsLabel').textContent = value ? 'ORIGINAL' : 'LIVE';
  render();
}

async function exportImage() {
  if (!sourceImage || exportButton.disabled) return;
  exportButton.disabled = true;
  document.querySelector('#statusMessage').textContent = 'RENDERING PNG...';
  const scale = Number(document.querySelector('#exportScale').value);
  const originalW = canvas.width;
  const originalH = canvas.height;
  canvas.width = Math.max(1, Math.round(imageWidth * scale));
  canvas.height = Math.max(1, Math.round(imageHeight * scale));
  render();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  canvas.width = originalW;
  canvas.height = originalH;
  render();

  if (!blob) {
    exportButton.disabled = false;
    document.querySelector('#statusMessage').textContent = 'PNG EXPORT FAILED';
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${imageName}-crt.png`;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  exportButton.disabled = false;
  document.querySelector('#statusMessage').textContent = 'PNG EXPORTED';
}

buildControls();
syncGlowColorControl();
initWebGL();
makeDemoImage();
requestAnimationFrame(animationLoop);

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragover'); }));
dropZone.addEventListener('drop', (event) => loadFile(event.dataTransfer.files[0]));
document.querySelector('#presetGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-preset]');
  if (button) applyPreset(button.dataset.preset);
});
document.querySelector('#resetButton').addEventListener('click', () => applyPreset('studio'));
document.querySelectorAll('[data-save-snapshot]').forEach((button) => button.addEventListener('click', () => {
  saveParameterSnapshot(button.dataset.saveSnapshot);
}));
document.querySelectorAll('[data-load-snapshot]').forEach((button) => button.addEventListener('click', () => {
  loadParameterSnapshot(button.dataset.loadSnapshot);
}));
document.querySelector('#randomButton').addEventListener('click', () => {
  controlSchema.flatMap((group) => group.controls).forEach(([key, , min, max, step]) => {
    const steps = Math.round((max - min) / step);
    state[key] = min + Math.floor(Math.random() * (steps + 1)) * step;
  });
  clearPresetSelection();
  syncControls();
  document.querySelector('#statusMessage').textContent = 'PARAMETERS RANDOMIZED';
});
document.querySelector('#animateToggle').addEventListener('change', (event) => { animate = event.target.checked; render(); });
document.querySelector('#fitButton').addEventListener('click', () => {
  fitMode = true;
  document.querySelector('#fitButton').classList.add('active');
  document.querySelector('#actualButton').classList.remove('active');
  updateFrameSize();
});
document.querySelector('#actualButton').addEventListener('click', () => {
  fitMode = false;
  document.querySelector('#actualButton').classList.add('active');
  document.querySelector('#fitButton').classList.remove('active');
  updateFrameSize();
});
compareButton.addEventListener('pointerdown', () => setComparing(true));
window.addEventListener('pointerup', () => setComparing(false));
window.addEventListener('keydown', (event) => { if (event.code === 'Space' && !event.repeat) { event.preventDefault(); setComparing(true); } });
window.addEventListener('keyup', (event) => { if (event.code === 'Space') setComparing(false); });
exportButton.addEventListener('click', exportImage);
window.addEventListener('resize', updateFrameSize);
