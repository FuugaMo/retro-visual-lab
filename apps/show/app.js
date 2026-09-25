const windows = [...document.querySelectorAll('[data-window]')];
const desktop = document.querySelector('#desktop');
const taskButtons = document.querySelector('#taskButtons');
const startButton = document.querySelector('#startButton');
const startMenu = document.querySelector('#startMenu');
let topZ = 20;

const windowLabels = {
  welcome: 'WELCOME.MSG', bands: 'BANDS', showinfo: 'SHOW_INFO.EXE',
  poster: 'POSTER.BMP', player: 'MIXTAPE.WAV', venue: 'VENUE.TXT',
};

function refreshTasks() {
  taskButtons.innerHTML = '';
  windows.filter((win) => !win.hidden).forEach((win) => {
    const button = document.createElement('button');
    button.textContent = windowLabels[win.dataset.window];
    button.classList.toggle('active', win.classList.contains('active'));
    button.addEventListener('click', () => focusWindow(win));
    taskButtons.appendChild(button);
  });
}

function focusWindow(win) {
  windows.forEach((item) => item.classList.remove('active'));
  win.hidden = false;
  win.classList.add('active');
  win.style.zIndex = String(++topZ);
  refreshTasks();
}

function openWindow(name) {
  const win = document.querySelector(`[data-window="${name}"]`);
  if (win) focusWindow(win);
  startMenu.hidden = true;
}

document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open]');
  if (opener) openWindow(opener.dataset.open);
  const closer = event.target.closest('[data-close]');
  if (closer) {
    const win = closer.closest('[data-window]');
    win.hidden = true;
    win.classList.remove('active');
    refreshTasks();
  }
});

windows.forEach((win) => {
  win.addEventListener('pointerdown', () => focusWindow(win));
  const bar = win.querySelector('.titlebar');
  bar.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    if (matchMedia('(max-width: 760px)').matches) return;
    const rect = win.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    bar.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      win.style.left = `${Math.max(0, Math.min(innerWidth - rect.width, rect.left + moveEvent.clientX - startX))}px`;
      win.style.top = `${Math.max(0, Math.min(innerHeight - 55, rect.top + moveEvent.clientY - startY))}px`;
    };
    const end = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
  });
});

startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  startMenu.hidden = !startMenu.hidden;
});
desktop.addEventListener('click', (event) => {
  if (!event.target.closest('.start-menu') && !event.target.closest('#startButton')) startMenu.hidden = true;
});

const bands = {
  touch: { index: '01 / HOST BAND', name: 'Touch Grass', art: 'TOUCH<br>GRASS', className: 'touch', description: '把卧室里的噪音、迟到的情绪和吉他反馈带到现场。今晚不解决问题，只把它放大。', mood: 'indie rock / emo' },
  night: { index: '02 / ZHUHAI', name: '夜间疾走 Nighty GOGO', art: '夜间<br>疾走', className: 'night', description: '来自珠海的 Emo 乐队。旋律在夜路上加速，情绪则停在那些还没来得及说出口的瞬间。', mood: 'emo / alternative' },
  running: { index: '03 / RETURNING', name: 'Running in the 00s', art: 'RUNNING<br>IN 00s', className: 'running', description: '沉寂之后携新专回归。千禧年代的残影、失真的吉他与重新启动的现场共同抵达。', mood: 'indie / post-emo' },
};

document.querySelectorAll('[data-band]').forEach((button) => {
  button.addEventListener('click', () => {
    const band = bands[button.dataset.band];
    document.querySelectorAll('[data-band]').forEach((item) => item.classList.toggle('active', item === button));
    document.querySelector('#bandProfile').innerHTML = `<div class="band-art ${band.className}" aria-hidden="true"><span>${band.art}</span></div><div class="band-copy"><small>FILE ${band.index}</small><h2>${band.name}</h2><p>${band.description}</p><dl><dt>MOOD</dt><dd>${band.mood}</dd><dt>STATUS</dt><dd>LIVE · 20:00</dd></dl></div>`;
  });
});

const tracks = ['TOUCH GRASS — LIVE DEMO', 'NIGHTY GOGO — NIGHT RUN', 'RUNNING IN THE 00S — NEW FILE'];
let track = 0;
let playing = false;
let elapsed = 0;
const player = document.querySelector('[data-window="player"]');
const playButton = document.querySelector('#playButton');
function renderPlayer() {
  document.querySelector('#trackNumber').textContent = String(track + 1).padStart(2, '0');
  document.querySelector('#trackName').textContent = tracks[track];
  document.querySelector('#playerTime').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  document.querySelector('#playerProgress').style.width = `${(elapsed % 181) / 1.8}%`;
  playButton.textContent = playing ? 'Ⅱ' : '▶';
  player.classList.toggle('paused', !playing);
}
playButton.addEventListener('click', () => { playing = !playing; renderPlayer(); });
document.querySelector('#previousTrack').addEventListener('click', () => { track = (track + 2) % 3; elapsed = 0; renderPlayer(); });
document.querySelector('#nextTrack').addEventListener('click', () => { track = (track + 1) % 3; elapsed = 0; renderPlayer(); });
setInterval(() => { if (playing) { elapsed = (elapsed + 1) % 181; renderPlayer(); } }, 1000);

refreshTasks();
renderPlayer();
