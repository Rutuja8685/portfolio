/* =========================================================
   Rutuja Karande: portfolio script
   1. mobile menu   2. header + active link   3. request pipeline
   ========================================================= */

/* ---------- 1. mobile menu ---------- */
const menuBtn = document.getElementById('menuBtn');
const siteNav = document.getElementById('siteNav');

menuBtn.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- 2. header border + active nav link ---------- */
const topbar = document.getElementById('topbar');
const navLinks = document.querySelectorAll('.site-nav a');

function onScroll() {
  topbar.classList.toggle('is-scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((link) => link.classList.toggle('active', link.dataset.target === id));
    });
  },
  { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
);
document.querySelectorAll('main section[id]').forEach((section) => spy.observe(section));

/* ---------- 3. request pipeline (Skills section) ---------- */
const pipeline = document.getElementById('pipeline');
const layers = Array.from(pipeline.querySelectorAll('.layer'));
const trackLine = document.getElementById('trackLine');
const trackDot = document.getElementById('trackDot');
const pipeStatus = document.getElementById('pipeStatus');
const replayBtn = document.getElementById('replayBtn');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stackedQuery = window.matchMedia('(max-width: 960px)');

// Edit these sentences to change what the status line says at each step.
const stepText = [
  'Client: the browser sends a request.',
  'Controller: the API receives it.',
  'Service: the business logic decides what to do.',
  'Repository: the data layer builds the query.',
  'Database: the data is found and returned.'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let runId = 0;

function layerCenters() {
  const base = pipeline.getBoundingClientRect().left;
  return layers.map((layer) => {
    const box = layer.getBoundingClientRect();
    return box.left - base + box.width / 2;
  });
}

function moveDot(x, ms) {
  trackDot.style.transitionDuration = ms + 'ms, 300ms, 300ms';
  trackDot.style.transform = 'translateX(' + (x - 10) + 'px)';
}

function placeTrack() {
  if (stackedQuery.matches) return;
  const centers = layerCenters();
  trackLine.style.left = centers[0] + 'px';
  trackLine.style.width = centers[centers.length - 1] - centers[0] + 'px';
  moveDot(centers[0], 0);
}

function light(index) {
  layers.forEach((layer, i) => layer.classList.toggle('is-lit', i === index));
  if (index >= 0) {
    const color = getComputedStyle(layers[index]).getPropertyValue('--layer-color').trim();
    trackDot.style.setProperty('--dot', color);
  }
}

async function playRequest() {
  const id = ++runId;
  const stacked = stackedQuery.matches;
  const centers = stacked ? [] : layerCenters();
  const stale = () => id !== runId;

  light(-1);
  pipeline.classList.add('is-running');
  if (!stacked) moveDot(centers[0], 0);

  // request travels down the stack
  for (let i = 0; i < layers.length; i++) {
    if (!stacked) moveDot(centers[i], i === 0 ? 0 : 550);
    await sleep(i === 0 ? 200 : 600);
    if (stale()) return;
    light(i);
    pipeStatus.textContent = stepText[i];
    await sleep(650);
    if (stale()) return;
  }

  // response travels back to the client
  pipeStatus.textContent = 'The response travels back to the client.';
  for (let i = layers.length - 2; i >= 0; i--) {
    if (!stacked) moveDot(centers[i], 350);
    await sleep(380);
    if (stale()) return;
    light(i);
  }
  await sleep(450);
  if (stale()) return;

  light(-1);
  pipeline.classList.remove('is-running');
  pipeStatus.textContent = 'Response delivered. Replay to watch it again.';
}

if (reduceMotion) {
  replayBtn.hidden = true;
  pipeStatus.textContent = 'A request passes through Client, Controller, Service, Repository and Database.';
} else {
  placeTrack();
  window.addEventListener('resize', placeTrack);
  replayBtn.addEventListener('click', playRequest);

  // play once, the first time the section scrolls into view
  const starter = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        starter.disconnect();
        playRequest();
      }
    },
    { threshold: 0.4 }
  );
  starter.observe(pipeline);
}