const canvas = document.querySelector('#glCanvas');
const sourceCanvas = document.createElement('canvas');
const sourceContext = sourceCanvas.getContext('2d');
const inviteeInput = document.querySelector('#inviteeInput');
const exportButton = document.querySelector('#exportButton');
const statusMessage = document.querySelector('#statusMessage');
const renderStatus = document.querySelector('#renderStatus');
const POSTER_URL = new URL('../../assets/default-poster.png', window.location.href).href;
const STORAGE_KEY = 'retro-visual-lab-invitee';
const WIDTH = 900;
const HEIGHT = 1200;

const crtDefaults = {
  curvature: 0,
  overscan: 0,
  vignette: .16,
  softness: .28,
  rgbSplit: 1.2,
  jitter: .1,
  noise: .195,
  roll: .16,
  scanline: .34,
  scanDensity: .86,
  mask: .16,
  bloom: .22,
  glowRadius: 3.5,
  glowThreshold: .22,
  glowColor: [.9804, .8588, .0078],
  glowColorEnabled: 1,
  glowColorTolerance: .34,
  edgeGlow: .34,
  brightness: 1.02,
  contrast: 1.01,
  saturation: 1.08,
  tint: .02,
};

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
  uv.x += burst * u_jitter * px;
  uv.x += smoothstep(.82, 1.0, sin(uv.y * 35.0 - u_time * 1.4) * .5 + .5) * u_roll * px * 9.0;

  float split = u_rgbSplit * px;
  vec2 radial = normalize((uv - .5) + vec2(.0001)) * split;
  vec3 color = vec3(texture2D(u_image, uv + radial).r, texture2D(u_image, uv).g, texture2D(u_image, uv - radial).b);

  if (u_softness > 0.01 || u_bloom > 0.01 || u_edgeGlow > 0.01) {
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
    color += mix(naturalHalo, targetedHalo, u_glowColorEnabled) * emissionMask * u_bloom * .72;

    float centerLuma = dot(texture2D(u_image, uv).rgb, vec3(.299, .587, .114));
    float horizontalEdge = abs(dot(right - left, vec3(.299, .587, .114)));
    float verticalEdge = abs(dot(down - up, vec3(.299, .587, .114)));
    float edge = smoothstep(.035, .42, horizontalEdge + verticalEdge);
    float luminanceEdge = smoothstep(u_glowThreshold * .72, 1.0, max(centerLuma, haloLuma));
    float highlightEdge = mix(luminanceEdge, targetMask, u_glowColorEnabled);
    vec3 naturalRim = mix(vec3(.08, .62, .68), vec3(1.0, .82, .18), clamp(centerLuma * 1.3, 0.0, 1.0));
    color += mix(naturalRim, u_glowColor, u_glowColorEnabled) * edge * highlightEdge * u_edgeGlow * .42;
    color = mix(color, halo, min(.38, u_softness * .16));
  }
  return color;
}

void main() {
  vec2 uv = warpedUv(v_uv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(.003, .008, .005, 1.0);
    return;
  }
  vec3 color = sampleSignal(uv);
  float luma = dot(color, vec3(.299, .587, .114));
  color = mix(vec3(luma), color, u_saturation);
  color = (color - .5) * u_contrast + .5;
  color *= u_brightness;
  color += vec3(u_tint * .055, u_tint * .016, -u_tint * .048);
  float scan = .5 + .5 * sin(gl_FragCoord.y * 3.14159265 * u_scanDensity);
  color *= 1.0 - u_scanline * (.18 + scan * .48);
  float triad = mod(floor(gl_FragCoord.x), 3.0);
  vec3 maskColor = triad < 1.0 ? vec3(1.0, .72, .72) : (triad < 2.0 ? vec3(.72, 1.0, .72) : vec3(.72, .72, 1.0));
  color *= mix(vec3(1.0), maskColor, u_mask);
  color += (hash(gl_FragCoord.xy + floor(u_time * 24.0)) - .5) * u_noise;
  float edge = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
  color *= mix(1.0, pow(max(edge, 0.0), .24), u_vignette);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

let gl;
let program;
let texture;
let posterImage;
let startTime = performance.now();

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

function drawBevel(ctx, x, y, w, h) {
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.strokeStyle = '#151515';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function drawButton(ctx, x, y, label) {
  drawBevel(ctx, x, y, 23, 23);
  ctx.fillStyle = '#111';
  ctx.font = '17px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 11, y + 11);
}

function drawInvitationCard() {
  sourceCanvas.width = WIDTH;
  sourceCanvas.height = HEIGHT;
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(posterImage, 0, 0, WIDTH, HEIGHT);

  const x = 32;
  const y = 520;
  const w = 392;
  const h = 152;
  sourceContext.fillStyle = 'rgba(0,0,0,.48)';
  sourceContext.fillRect(x + 9, y + 10, w, h);
  drawBevel(sourceContext, x, y, w, h);
  sourceContext.fillStyle = '#007c7c';
  sourceContext.fillRect(x + 4, y + 4, w - 8, 34);
  sourceContext.fillStyle = '#fff';
  sourceContext.font = '700 18px "Latin Pixelated MS Sans Serif", monospace';
  sourceContext.textAlign = 'left';
  sourceContext.textBaseline = 'middle';
  sourceContext.fillText('WELCOME.MSG', x + 10, y + 21);
  ['_', '□', '×'].forEach((label, index) => drawButton(sourceContext, x + w - 81 + index * 25, y + 8, label));

  const bx = x + 10;
  const by = y + 44;
  const bw = w - 20;
  const bh = h - 54;
  sourceContext.fillStyle = '#e9f3e8';
  sourceContext.fillRect(bx, by, bw, bh);
  sourceContext.strokeStyle = '#4b5b58';
  sourceContext.lineWidth = 2;
  sourceContext.strokeRect(bx, by, bw, bh);

  const invitee = inviteeInput.value.trim();
  sourceContext.fillStyle = '#071d35';
  sourceContext.textBaseline = 'middle';
  sourceContext.textAlign = 'left';
  sourceContext.font = '400 26px "Fusion Pixel 10px Proportional", sans-serif';
  sourceContext.fillText('诚邀：', bx + 16, by + 46);
  sourceContext.font = '400 36px "Fusion Pixel 10px Proportional", sans-serif';
  sourceContext.textAlign = 'center';
  sourceContext.fillText(invitee, bx + 105 + (bw - 125) / 2, by + 43, bw - 127);
  sourceContext.textAlign = 'left';
  sourceContext.fillStyle = '#071d35';
  sourceContext.fillRect(bx + 103, by + 70, bw - 123, 4);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
}

function render(now = performance.now()) {
  if (!posterImage) return;
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.useProgram(program);
  setUniform('u_resolution', [WIDTH, HEIGHT]);
  setUniform('u_time', (now - startTime) / 1000);
  Object.entries(crtDefaults).forEach(([key, value]) => setUniform(`u_${key}`, value));
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function redraw() {
  if (!posterImage) return;
  drawInvitationCard();
  render();
  renderStatus.textContent = inviteeInput.value.trim() ? 'PERSONALIZED' : 'READY FOR NAME';
}

function animationLoop(now) {
  render(now);
  requestAnimationFrame(animationLoop);
}

function loadPoster() {
  posterImage = new Image();
  posterImage.onload = async () => {
    await document.fonts.ready;
    await document.fonts.load('700 18px "Latin Pixelated MS Sans Serif"');
    redraw();
    statusMessage.textContent = 'DEFAULT POSTER + CRT READY';
  };
  posterImage.onerror = () => {
    statusMessage.textContent = 'DEFAULT POSTER LOAD FAILED';
  };
  posterImage.src = POSTER_URL;
}

inviteeInput.value = localStorage.getItem(STORAGE_KEY) || '';
inviteeInput.addEventListener('input', () => {
  localStorage.setItem(STORAGE_KEY, inviteeInput.value);
  redraw();
});

document.querySelector('#resetButton').addEventListener('click', () => {
  inviteeInput.value = '';
  localStorage.removeItem(STORAGE_KEY);
  redraw();
  inviteeInput.focus();
  statusMessage.textContent = 'INVITATION RESET';
});

exportButton.addEventListener('click', async () => {
  if (!posterImage) return;
  exportButton.disabled = true;
  statusMessage.textContent = 'EXPORTING PNG';
  render();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = inviteeInput.value.trim().replace(/[\\/:*?"<>|]/g, '-') || 'blank';
    link.download = `invitation-${safeName}.png`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusMessage.textContent = 'PNG EXPORTED';
  } else {
    statusMessage.textContent = 'EXPORT FAILED';
  }
  exportButton.disabled = false;
});

sourceCanvas.width = WIDTH;
sourceCanvas.height = HEIGHT;
initWebGL();
loadPoster();
requestAnimationFrame(animationLoop);
