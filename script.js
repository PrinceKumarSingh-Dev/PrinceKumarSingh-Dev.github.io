/* ==========================================================================
   PRINCE KUMAR SINGH — DNA PORTFOLIO
   Three.js cinematic DNA helix + GSAP ScrollTrigger.
   The helix lies diagonally across a deep-navy scene; the camera glides
   along it as you scroll, with amber glowing rings and cyan data light.
   No build step: loaded as a native ES module.
   ========================================================================== */

import * as THREE from 'three';

/* --------------------------------------------------------------------------
   0. CONFIG — editable data lives here
   -------------------------------------------------------------------------- */
const CONFIG = {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: window.matchMedia('(hover: none)').matches,
  isMobile: window.innerWidth < 860,

  helix: {
    turns: 22,
    radius: 6,
    totalHeight: 260,
    tube: 0.38,
    tilt: 1.12,          // radians — lays the helix diagonally across the screen
  },

  // Glow colour used on the rings while a project is on screen.
  projects: [
    { name: 'Purpl IBS',    glow: [2.4, 1.35, 0.35] },
    { name: 'MyCityA2Z',    glow: [0.35, 1.9, 2.6] },
    { name: 'Service Book', glow: [2.4, 1.35, 0.35] },
    { name: 'CCPL PM',      glow: [0.35, 1.9, 2.6] },
    { name: 'Drakey',       glow: [2.8, 1.6, 0.45] },
  ],

  skills: [
    'Java 8 / 17', 'Spring Boot', 'Spring Security', 'Microservices',
    'REST APIs', 'JWT / OAuth2', 'Hibernate', 'PostgreSQL', 'MySQL',
    'Redis', 'RabbitMQ', 'AWS (EC2, S3, SQS, SES)', 'Docker', 'Git & CI/CD',
    'JUnit / Mockito', 'Maven', 'Postman', 'Agile / SDLC',
  ],
};

/* --------------------------------------------------------------------------
   1. LOADING SCREEN
   -------------------------------------------------------------------------- */
const loadingScreen  = document.getElementById('loading-screen');
const loaderCanvas   = document.getElementById('loader-canvas');
const loadingBarFill = document.getElementById('loading-bar-fill');
const loadingPercent = document.getElementById('loading-percent');
const loaderCtx = loaderCanvas.getContext('2d');
const loaderDPR = Math.min(window.devicePixelRatio || 1, 2);
let loaderW = 0, loaderH = 0;

function sizeLoaderCanvas() {
  loaderW = window.innerWidth;
  loaderH = window.innerHeight;
  loaderCanvas.width = loaderW * loaderDPR;
  loaderCanvas.height = loaderH * loaderDPR;
  loaderCtx.setTransform(loaderDPR, 0, 0, loaderDPR, 0, 0);
}
sizeLoaderCanvas();

// Particles drift in and settle into a small diagonal double helix.
const LOADER_COUNT = CONFIG.isMobile ? 70 : 130;
const loaderParticles = Array.from({ length: LOADER_COUNT }, (_, i) => {
  const a = Math.random() * Math.PI * 2;
  const k = i / LOADER_COUNT;
  return {
    x: loaderW / 2 + Math.cos(a) * (120 + Math.random() * 300),
    y: loaderH / 2 + Math.sin(a) * (120 + Math.random() * 300),
    k,
    side: i % 2,
    r: Math.random() * 1.6 + 0.6,
    speed: 0.02 + Math.random() * 0.03,
    amber: Math.random() < 0.25,
  };
});

let loaderRunning = true;
let loaderTime = 0;
function drawLoader() {
  if (!loaderRunning) return;
  loaderTime += 0.016;
  loaderCtx.clearRect(0, 0, loaderW, loaderH);
  const span = Math.min(loaderW, 700);
  loaderParticles.forEach((p) => {
    const along = (p.k - 0.5) * span;
    const wave = Math.sin(p.k * Math.PI * 6 + loaderTime * 1.4 + (p.side ? Math.PI : 0)) * 34;
    const tx = loaderW / 2 + along * 0.9 + wave * 0.45;
    const ty = loaderH / 2 + along * 0.45 - wave * 0.9;
    p.x += (tx - p.x) * p.speed;
    p.y += (ty - p.y) * p.speed;
    loaderCtx.beginPath();
    loaderCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    loaderCtx.fillStyle = p.amber ? 'rgba(255,171,61,0.85)' : 'rgba(120,190,255,0.55)';
    loaderCtx.fill();
  });
  requestAnimationFrame(drawLoader);
}
drawLoader();

const loaderProgress = { value: 0 };
function setLoaderProgress(target, duration = 0.6) {
  gsap.to(loaderProgress, {
    value: target, duration, ease: 'power2.out',
    onUpdate: () => {
      loadingBarFill.style.width = loaderProgress.value + '%';
      loadingPercent.textContent = Math.round(loaderProgress.value) + '%';
    },
  });
}

function hideLoader() {
  loaderRunning = false;
  loadingScreen.classList.add('hidden');
  window.scrollTo(0, 0);
  playIntro();
}

/* --------------------------------------------------------------------------
   2. THREE.JS SCENE
   -------------------------------------------------------------------------- */
document.body.style.overflow = 'hidden'; // lock scroll until the intro is done

const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x071631, 0.02);

// Deep-navy gradient background (drawn by the renderer, so bloom sees it too).
function makeBackground() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(330, 190, 10, 280, 260, 420);
  g.addColorStop(0, '#12366a');
  g.addColorStop(0.45, '#0a1f42');
  g.addColorStop(1, '#030a18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
scene.background = makeBackground();

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

/* ---- Lighting ---- */
scene.add(new THREE.HemisphereLight(0x6f9cff, 0x050a18, 0.9));

const keyLight = new THREE.DirectionalLight(0xbfd6ff, 1.6);
keyLight.position.set(10, 22, 16);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x2f7bff, 1.4);
rimLight.position.set(-18, -6, -14);
scene.add(rimLight);

// Warm light that travels with the camera focus, like the amber glow in the video.
const amberLight = new THREE.PointLight(0xff9a2e, 45, 34, 2);
scene.add(amberLight);

// Soft reflections for the metallic strands (loaded lazily).
(async () => {
  try {
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  } catch (e) { /* fine without it */ }
})();

/* ---- Helix groups ----
   tiltGroup lays the helix diagonally; dnaGroup spins around the helix axis. */
const tiltGroup = new THREE.Group();
tiltGroup.rotation.z = CONFIG.helix.tilt;
scene.add(tiltGroup);
const dnaGroup = new THREE.Group();
tiltGroup.add(dnaGroup);
tiltGroup.updateMatrixWorld(true);

const { turns, radius, totalHeight, tube } = CONFIG.helix;
const TOP_Y = totalHeight / 2;

function helixPoint(t, phase, out = new THREE.Vector3()) {
  const angle = t * turns * Math.PI * 2 + phase;
  return out.set(Math.cos(angle) * radius, TOP_Y - t * totalHeight, Math.sin(angle) * radius);
}

/* ---- Cyan "data" texture used as the strands' emissive map ---- */
function makeDataTexture() {
  const w = 1024, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // Only draw on one side of the tube so the light reads as a stripe.
  for (let i = 0; i < 90; i++) {
    const y = 8 + Math.floor(Math.random() * 7) * 6;
    const x = Math.random() * w;
    const len = 6 + Math.random() * (Math.random() < 0.2 ? 140 : 40);
    const a = 0.35 + Math.random() * 0.65;
    ctx.fillStyle = `rgba(70,220,255,${a})`;
    ctx.fillRect(x, y, len, 2 + Math.random() * 3);
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(140,240,255,0.9)';
    ctx.fillRect(Math.random() * w, 10 + Math.random() * 40, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(turns * 2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const dataTexture = makeDataTexture();

/* ---- Strands ---- */
function buildStrand(phase, color) {
  const samples = CONFIG.isMobile ? 360 : 700;
  const pts = [];
  for (let i = 0; i <= samples; i++) pts.push(helixPoint(i / samples, phase));
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, samples, tube, 14, false);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.3,
    envMapIntensity: 0.45,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
    emissiveIntensity: 1.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  dnaGroup.add(mesh);
  return mesh;
}
const strandA = buildStrand(0, 0x1a3360);
const strandB = buildStrand(Math.PI, 0x152b52);

/* ---- Rungs (instanced rods) ---- */
const RUNG_COUNT = CONFIG.isMobile ? 130 : 220;
const rungGeo = new THREE.CylinderGeometry(0.13, 0.13, 1, 10, 1, true);
const rungMat = new THREE.MeshStandardMaterial({
  color: 0x1f3a66, metalness: 0.6, roughness: 0.35, envMapIntensity: 0.8,
  emissive: 0x0a2a55, emissiveIntensity: 0.5,
});
const rungMesh = new THREE.InstancedMesh(rungGeo, rungMat, RUNG_COUNT);

/* ---- Glowing rings: two per rung + bands along the strands ---- */
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const rungRingGeo = new THREE.TorusGeometry(0.24, 0.065, 8, 22);
const strandRingGeo = new THREE.TorusGeometry(tube + 0.08, 0.06, 8, 28);

const RUNG_RINGS = RUNG_COUNT * 2;
const STRAND_RINGS_PER = CONFIG.isMobile ? 60 : 80;
const STRAND_RINGS = STRAND_RINGS_PER * 2;

const rungRingMesh = new THREE.InstancedMesh(rungRingGeo, ringMat, RUNG_RINGS);
const strandRingMesh = new THREE.InstancedMesh(strandRingGeo, ringMat, STRAND_RINGS);
const rungRingT = new Float32Array(RUNG_RINGS);
const strandRingT = new Float32Array(STRAND_RINGS);

const AMBER = new THREE.Color().setRGB(1.15, 0.5, 0.1);
const dummy = new THREE.Object3D();
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const pA = new THREE.Vector3(), pB = new THREE.Vector3(), dir = new THREE.Vector3();

for (let i = 0; i < RUNG_COUNT; i++) {
  const t = 0.01 + (i / (RUNG_COUNT - 1)) * 0.98;
  helixPoint(t, 0, pA);
  helixPoint(t, Math.PI, pB);
  dir.copy(pB).sub(pA);
  const len = dir.length();
  dir.normalize();

  dummy.position.copy(pA).lerp(pB, 0.5);
  dummy.quaternion.setFromUnitVectors(Y_AXIS, dir);
  dummy.scale.set(1, len, 1);
  dummy.updateMatrix();
  rungMesh.setMatrixAt(i, dummy.matrix);

  [0.2, 0.8].forEach((f, j) => {
    const idx = i * 2 + j;
    dummy.position.copy(pA).lerp(pB, f);
    dummy.quaternion.setFromUnitVectors(Z_AXIS, dir);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rungRingMesh.setMatrixAt(idx, dummy.matrix);
    rungRingMesh.setColorAt(idx, AMBER);
    rungRingT[idx] = t;
  });
}

for (let s = 0; s < 2; s++) {
  const phase = s === 0 ? 0 : Math.PI;
  for (let i = 0; i < STRAND_RINGS_PER; i++) {
    const idx = s * STRAND_RINGS_PER + i;
    // slightly irregular spacing so it feels hand-placed
    const t = 0.01 + ((i + 0.5 + (Math.sin(i * 12.9898) * 0.3)) / STRAND_RINGS_PER) * 0.98;
    helixPoint(t, phase, pA);
    helixPoint(t + 0.0005, phase, pB);
    dir.copy(pB).sub(pA).normalize();
    dummy.position.copy(pA);
    dummy.quaternion.setFromUnitVectors(Z_AXIS, dir);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    strandRingMesh.setMatrixAt(idx, dummy.matrix);
    strandRingMesh.setColorAt(idx, AMBER);
    strandRingT[idx] = t;
  }
}
[rungMesh, rungRingMesh, strandRingMesh].forEach((m) => {
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  dnaGroup.add(m);
});

/* ---- Floating dust particles ---- */
const PARTICLE_COUNT = CONFIG.isMobile ? 260 : 700;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(PARTICLE_COUNT * 3);
const pPhase = new Float32Array(PARTICLE_COUNT);
const pSpeed = new Float32Array(PARTICLE_COUNT);
const pBaseY = new Float32Array(PARTICLE_COUNT);
const pAngle = new Float32Array(PARTICLE_COUNT);
const pRadius = new Float32Array(PARTICLE_COUNT);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  pAngle[i] = Math.random() * Math.PI * 2;
  pRadius[i] = radius * (1.3 + Math.random() * 2.4);
  pBaseY[i] = TOP_Y - Math.random() * totalHeight;
  pPhase[i] = Math.random() * Math.PI * 2;
  pSpeed[i] = 0.15 + Math.random() * 0.3;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

function createGlowTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(150,200,255,0.5)');
  g.addColorStop(1, 'rgba(150,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
  size: CONFIG.isMobile ? 0.45 : 0.55,
  map: createGlowTexture(),
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0x86b6ff,
}));
dnaGroup.add(particles);

/* ---- Bloom (lazy, degrades gracefully) ---- */
let composer = null;
(async () => {
  if (CONFIG.isMobile) return;
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
    ]);
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.75, 0.5, 0.45));
    c.addPass(new OutputPass());
    composer = c;
  } catch (err) {
    composer = null;
  }
})();

/* --------------------------------------------------------------------------
   3. SCROLL, CAMERA PATH & MOUSE
   -------------------------------------------------------------------------- */
gsap.registerPlugin(ScrollTrigger);

const scrollState = { target: 0, current: 0 };
const mouseState = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
const intro = { p: CONFIG.reducedMotion ? 1 : 0 };

window.addEventListener('mousemove', (e) => {
  mouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseState.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: () => document.body.scrollHeight - window.innerHeight,
  onUpdate: (self) => { scrollState.target = self.progress; },
});

const CAM_T0 = 0.05;
const CAM_T1 = 0.95;
const axisDir = new THREE.Vector3(0, -1, 0).applyAxisAngle(Z_AXIS, CONFIG.helix.tilt).normalize();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function axisPoint(t, out) {
  return out.set(0, TOP_Y - t * totalHeight, 0).applyMatrix4(tiltGroup.matrixWorld);
}

const camTarget = new THREE.Vector3();
const camOffset = new THREE.Vector3();
const lookPoint = new THREE.Vector3();
const fwd = new THREE.Vector3(), rightV = new THREE.Vector3(), upV = new THREE.Vector3();

function updateCamera(progress) {
  const t = THREE.MathUtils.lerp(CAM_T0, CAM_T1, progress);
  axisPoint(t, camTarget);

  const motion = CONFIG.reducedMotion ? 0.3 : 1;
  const base = CONFIG.isMobile ? 27 : 34;
  // Cinematic push-in / pull-out as you travel.
  let dist = base * (0.9 + 0.12 * Math.sin(progress * Math.PI * 7) * motion);
  dist *= THREE.MathUtils.lerp(0.16, 1, intro.p);

  // Orbit around the helix axis for changing angles, plus mouse parallax.
  const orbit = (0.55 * Math.sin(progress * Math.PI * 3.3) + mouseState.smoothX * 0.14) * motion;
  camOffset.set(0, 0, dist).applyAxisAngle(axisDir, orbit);
  // Sit a little "behind" the focus point so we look along the strand.
  camOffset.addScaledVector(axisDir, -dist * 0.22);
  camOffset.addScaledVector(WORLD_UP, mouseState.smoothY * -1.2 * motion);

  camera.position.copy(camTarget).add(camOffset);

  // Shift the look point so the helix sits beside the text (left on desktop, top on mobile).
  fwd.copy(camOffset).negate().normalize();
  rightV.crossVectors(fwd, WORLD_UP).normalize();
  upV.crossVectors(rightV, fwd).normalize();
  lookPoint.copy(camTarget);
  const shiftAmount = intro.p;
  if (CONFIG.isMobile) lookPoint.addScaledVector(upV, -dist * 0.2 * shiftAmount);
  else lookPoint.addScaledVector(rightV, dist * 0.3 * shiftAmount);
  camera.up.copy(WORLD_UP);
  camera.lookAt(lookPoint);

  amberLight.position.copy(camTarget).addScaledVector(upV, 3).addScaledVector(fwd, -3);
  return t;
}

/* --------------------------------------------------------------------------
   4. PROJECT PANELS & RING GLOW
   -------------------------------------------------------------------------- */
const glowState = { index: -1, strength: 0, targetStrength: 0, color: new THREE.Color(), depth: 0.5 };
const projectSections = document.querySelectorAll('.project-section');
const projectDepths = [];

function computeProjectDepths() {
  const max = document.body.scrollHeight - window.innerHeight;
  projectSections.forEach((s, i) => {
    const mid = s.offsetTop + s.offsetHeight / 2 - window.innerHeight / 2;
    const p = THREE.MathUtils.clamp(mid / Math.max(max, 1), 0, 1);
    projectDepths[i] = THREE.MathUtils.lerp(CAM_T0, CAM_T1, p);
  });
}

function setActiveProject(index, active) {
  const marker = document.querySelector(`.nav-marker[data-index="${index}"]`);
  if (marker) marker.classList.toggle('active', active);
  if (active) {
    glowState.index = index;
    glowState.targetStrength = 1;
    glowState.color.setRGB(...CONFIG.projects[index].glow);
  } else if (glowState.index === index) {
    glowState.targetStrength = 0;
  }
}

projectSections.forEach((section) => {
  const idx = Number(section.dataset.projectIndex);
  const panel = section.querySelector('[data-panel]');
  const copy = panel.querySelector('.project-copy');
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      onEnter: () => setActiveProject(idx, true),
      onEnterBack: () => setActiveProject(idx, true),
      onLeave: () => setActiveProject(idx, false),
      onLeaveBack: () => setActiveProject(idx, false),
    },
  })
    .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    .fromTo(copy, { y: 60, filter: 'blur(6px)' }, { y: 0, filter: 'blur(0px)', duration: 0.3, ease: 'power3.out' }, 0)
    .to(panel, { opacity: 1, duration: 0.35 })
    .to(panel, { opacity: 0, duration: 0.3 })
    .to(copy, { y: -60, filter: 'blur(6px)', duration: 0.3, ease: 'power3.in' }, '<');
});

// Fade-in for the glass sections
gsap.utils.toArray('.about-card, .section-head, .timeline-item, .edu-card, .skills-grid, .contact-content').forEach((el) => {
  gsap.from(el, {
    opacity: 0, y: 40, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
  });
});

const navIndicator = document.getElementById('nav-indicator');
ScrollTrigger.create({
  trigger: '#project-0',
  start: 'top 80%',
  endTrigger: '#project-4',
  end: 'bottom 20%',
  onToggle: (self) => navIndicator.classList.toggle('visible', self.isActive),
});

const scrollFill = document.getElementById('scroll-progress-fill');
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: () => document.body.scrollHeight - window.innerHeight,
  onUpdate: (self) => { scrollFill.style.height = (self.progress * 100) + '%'; },
});

/* ---- About slows the helix; contact makes one amber particle follow the cursor ---- */
let dnaSpeed = 1;
let dnaTargetSpeed = 1;
ScrollTrigger.create({
  trigger: '#about',
  start: 'top 70%',
  onEnter: () => { dnaTargetSpeed = 0.25; document.body.classList.add('dim-scene'); },
  onLeaveBack: () => { dnaTargetSpeed = 1; document.body.classList.remove('dim-scene'); },
});

const contactParticle = document.getElementById('contact-particle');
let inContact = false;
const contactX = gsap.quickTo(contactParticle, 'x', { duration: 0.5, ease: 'power3.out' });
const contactY = gsap.quickTo(contactParticle, 'y', { duration: 0.5, ease: 'power3.out' });
ScrollTrigger.create({
  trigger: '#contact',
  start: 'top 60%',
  onEnter: () => { inContact = true; if (!CONFIG.isTouch) gsap.to(contactParticle, { opacity: 1, duration: 0.6 }); },
  onLeaveBack: () => { inContact = false; gsap.to(contactParticle, { opacity: 0, duration: 0.4 }); },
});
window.addEventListener('mousemove', (e) => {
  if (!inContact) return;
  contactX(e.clientX);
  contactY(e.clientY);
}, { passive: true });

/* --------------------------------------------------------------------------
   5. SKILLS
   -------------------------------------------------------------------------- */
const skillsGrid = document.getElementById('skills-grid');
CONFIG.skills.forEach((label) => {
  const chip = document.createElement('div');
  chip.className = 'skill-chip glass';
  chip.setAttribute('role', 'listitem');
  chip.tabIndex = 0;
  chip.innerHTML = `<span class="chip-ring"></span><span>${label}</span>`;
  chip.addEventListener('click', () => chip.classList.toggle('active'));
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.classList.toggle('active'); } });
  skillsGrid.appendChild(chip);
});

/* --------------------------------------------------------------------------
   6. MENU & IN-PAGE LINKS
   -------------------------------------------------------------------------- */
const menuBtn = document.getElementById('menu-btn');
const menuOverlay = document.getElementById('menu-overlay');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.textContent = open ? 'close' : 'menu';
  menuBtn.setAttribute('aria-expanded', String(open));
  menuOverlay.setAttribute('aria-hidden', String(!open));
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

document.querySelectorAll('a[data-scroll]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    // Land a little inside project sections so the panel is fully visible.
    const extra = el.classList.contains('project-section') ? el.offsetHeight * 0.3 : 0;
    window.scrollTo({ top: el.offsetTop + extra, behavior: CONFIG.reducedMotion ? 'auto' : 'smooth' });
  });
});

/* --------------------------------------------------------------------------
   7. CUSTOM CURSOR + RAYCAST
   -------------------------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2(-2, -2);
let raycastAccum = 0;

if (!CONFIG.isTouch) {
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const dotX = gsap.quickTo(cursorDot, 'x', { duration: 0.12, ease: 'power3.out' });
  const dotY = gsap.quickTo(cursorDot, 'y', { duration: 0.12, ease: 'power3.out' });
  const ringX = gsap.quickTo(cursorRing, 'x', { duration: 0.3, ease: 'power3.out' });
  const ringY = gsap.quickTo(cursorRing, 'y', { duration: 0.3, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  document.querySelectorAll('a, button, .skill-chip').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover-project'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover-project'));
  });
}

/* --------------------------------------------------------------------------
   8. INTRO — camera pulls back from an extreme close-up
   -------------------------------------------------------------------------- */
function playIntro() {
  const heroBits = document.querySelectorAll('.hero-content > *, .hero-cta, .scroll-hint');
  gsap.set(heroBits, { opacity: 0, y: 24 });

  const unlock = () => { document.body.style.overflow = ''; ScrollTrigger.refresh(); };

  if (CONFIG.reducedMotion) {
    intro.p = 1;
    gsap.to(heroBits, { opacity: 1, y: 0, duration: 0.6 });
    unlock();
    return;
  }
  gsap.timeline({ onComplete: unlock })
    .to(intro, { p: 1, duration: 3, ease: 'power3.inOut' }, 0)
    .to(heroBits, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 1.6);
}

/* --------------------------------------------------------------------------
   9. RENDER LOOP
   -------------------------------------------------------------------------- */
const clock = new THREE.Clock();
const tmpColor = new THREE.Color();
let rafId = null;

function updateRings(elapsed, camT) {
  glowState.strength += (glowState.targetStrength - glowState.strength) * 0.06;
  const hasGlow = glowState.index >= 0 && glowState.strength > 0.003;
  const centerT = hasGlow ? (projectDepths[glowState.index] ?? camT) : 0;
  const spread = 0.06;

  const paint = (mesh, tArr) => {
    for (let i = 0; i < tArr.length; i++) {
      const t = tArr[i];
      // a soft pulse of light travelling down the strand
      const pulse = Math.pow(Math.max(0, Math.sin(t * 90 - elapsed * 1.6)), 16) * 0.9;
      tmpColor.copy(AMBER).multiplyScalar(1 + pulse);
      if (hasGlow) {
        const d = Math.abs(t - centerT);
        if (d < spread) {
          const k = (1 - d / spread) * glowState.strength;
          tmpColor.lerp(glowState.color, k);
        }
      }
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceColor.needsUpdate = true;
  };
  paint(rungRingMesh, rungRingT);
  paint(strandRingMesh, strandRingT);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  scrollState.current += (scrollState.target - scrollState.current) * (CONFIG.reducedMotion ? 0.2 : 0.07);
  mouseState.smoothX += (mouseState.x - mouseState.smoothX) * 0.05;
  mouseState.smoothY += (mouseState.y - mouseState.smoothY) * 0.05;

  // Slow spin around the helix axis — never a static background.
  dnaSpeed += (dnaTargetSpeed - dnaSpeed) * 0.03;
  dnaGroup.rotation.y += dt * (CONFIG.reducedMotion ? 0.03 : 0.12) * dnaSpeed;
  dataTexture.offset.x -= dt * 0.02 * dnaSpeed;

  // Particle drift
  const pos = particleGeo.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const wob = Math.sin(elapsed * pSpeed[i] + pPhase[i]) * 0.6;
    const a = pAngle[i] + elapsed * 0.02 * pSpeed[i];
    pos.array[i * 3] = Math.cos(a) * pRadius[i] + wob * 0.3;
    pos.array[i * 3 + 1] = pBaseY[i] + wob;
    pos.array[i * 3 + 2] = Math.sin(a) * pRadius[i];
  }
  pos.needsUpdate = true;

  const camT = updateCamera(scrollState.current);
  updateRings(elapsed, camT);

  if (!CONFIG.isTouch) {
    raycastAccum += dt;
    if (raycastAccum > 0.1) {
      raycastAccum = 0;
      raycaster.setFromCamera(pointerNDC, camera);
      const hit = raycaster.intersectObjects([strandA, strandB], false);
      document.body.classList.toggle('cursor-hover-dna', hit.length > 0);
    }
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);

  rafId = requestAnimationFrame(animate);
}

function startLoop() {
  if (rafId === null) { clock.getDelta(); rafId = requestAnimationFrame(animate); }
}
function stopLoop() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopLoop(); else startLoop(); });

/* --------------------------------------------------------------------------
   10. RESIZE
   -------------------------------------------------------------------------- */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  sizeLoaderCanvas();
  ScrollTrigger.refresh();
}
window.addEventListener('resize', onResize);
ScrollTrigger.addEventListener('refresh', computeProjectDepths);
computeProjectDepths();

/* --------------------------------------------------------------------------
   11. BOOT
   -------------------------------------------------------------------------- */
setLoaderProgress(24, 0.5);
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise((res) => setTimeout(res, 450)),
]).then(() => {
  setLoaderProgress(64, 0.6);
  return new Promise((res) => setTimeout(res, 500));
}).then(() => {
  setLoaderProgress(100, 0.5);
  setTimeout(hideLoader, 600);
});

startLoop();
