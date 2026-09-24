/* ==========================================================================
   PRINCE — DIGITAL DNA
   Three.js DNA helix + GSAP ScrollTrigger scroll experience.
   No build step: loaded as a native ES module via <script type="module">.
   ========================================================================== */

import * as THREE from 'three';

/* --------------------------------------------------------------------------
   0. CONFIG — all editable project / skill data lives here.
   -------------------------------------------------------------------------- */
const CONFIG = {
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: window.matchMedia('(hover: none)').matches,
  isMobile: window.innerWidth < 860,

  helix: {
    turns: 34,
    radius: 6.4,
    totalHeight: 260,     // total vertical span the helix occupies
    strandTubeRadius: 0.32,
  },

  // Each project maps to a normalised depth (0 = top/hero, 1 = bottom/contact)
  // along the helix, and an accent colour used to "glow" that section of DNA
  // while the visitor is inside its scroll range.
  projects: [
    { key: 'browser',   name: 'MMS HRMS',   depth: 0.16, color: 0x6fa8ff },
    { key: 'phone',     name: 'NaamJaap',    depth: 0.32, color: 0x4df0ff },
    { key: 'split',     name: 'CHSeva',      depth: 0.48, color: 0xffffff },
    { key: 'dashboard', name: 'MMS PMS',     depth: 0.64, color: 0x6fa8ff },
    { key: 'featured',  name: 'offerX',      depth: 0.82, color: 0x4df0ff },
  ],

  skills: [
    'HTML', 'CSS', 'JAVASCRIPT', 'REACT', 'JAVA',
    'SPRING BOOT', 'KOTLIN', 'NODE.JS', 'PHP', 'CLOUD',
  ],
};

/* --------------------------------------------------------------------------
   1. LOADING SCREEN — particle-forming intro + progress ramp
   -------------------------------------------------------------------------- */
const loadingScreen   = document.getElementById('loading-screen');
const loaderCanvas    = document.getElementById('loader-canvas');
const loadingBarFill  = document.getElementById('loading-bar-fill');
const loadingPercent  = document.getElementById('loading-percent');

const loaderCtx = loaderCanvas.getContext('2d');
let loaderW = 0, loaderH = 0, loaderDPR = Math.min(window.devicePixelRatio || 1, 2);

function sizeLoaderCanvas(){
  loaderW = window.innerWidth;
  loaderH = window.innerHeight;
  loaderCanvas.width  = loaderW * loaderDPR;
  loaderCanvas.height = loaderH * loaderDPR;
  loaderCanvas.style.width  = loaderW + 'px';
  loaderCanvas.style.height = loaderH + 'px';
  loaderCtx.setTransform(loaderDPR, 0, 0, loaderDPR, 0, 0);
}
sizeLoaderCanvas();

// A small cloud of particles that drift and loosely gather into a vertical
// column — evoking a DNA strand assembling itself out of noise.
const LOADER_COUNT = CONFIG.isMobile ? 60 : 120;
const loaderParticles = Array.from({ length: LOADER_COUNT }, () => {
  const angle = Math.random() * Math.PI * 2;
  const spread = 40 + Math.random() * 160;
  return {
    x: loaderW / 2 + Math.cos(angle) * spread,
    y: loaderH / 2 + Math.sin(angle) * spread,
    tx: loaderW / 2 + (Math.random() - 0.5) * 26,
    ty: loaderH / 2 + (Math.random() - 0.5) * 260,
    r: Math.random() * 1.6 + 0.4,
    speed: 0.01 + Math.random() * 0.02,
  };
});

let loaderRunning = true;
function drawLoader(){
  if (!loaderRunning) return;
  loaderCtx.clearRect(0, 0, loaderW, loaderH);
  loaderCtx.fillStyle = 'rgba(5,5,5,1)';
  loaderCtx.fillRect(0, 0, loaderW, loaderH);

  loaderCtx.save();
  loaderParticles.forEach((p) => {
    p.x += (p.tx - p.x) * p.speed;
    p.y += (p.ty - p.y) * p.speed;
    loaderCtx.beginPath();
    loaderCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    loaderCtx.fillStyle = 'rgba(180, 210, 255, 0.55)';
    loaderCtx.fill();
  });
  // faint connective lines between nearby particles, like forming base pairs
  loaderCtx.strokeStyle = 'rgba(120,170,255,0.12)';
  loaderCtx.lineWidth = 1;
  for (let i = 0; i < loaderParticles.length; i += 2) {
    const a = loaderParticles[i], b = loaderParticles[i + 1];
    if (!b) continue;
    loaderCtx.beginPath();
    loaderCtx.moveTo(a.x, a.y);
    loaderCtx.lineTo(b.x, b.y);
    loaderCtx.stroke();
  }
  loaderCtx.restore();
  requestAnimationFrame(drawLoader);
}
drawLoader();

const loaderProgress = { value: 0 };
function setLoaderProgress(target, duration = 0.6) {
  gsap.to(loaderProgress, {
    value: target,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      loadingBarFill.style.width = loaderProgress.value + '%';
      loadingPercent.textContent = Math.round(loaderProgress.value) + '%';
    },
  });
}

function hideLoader() {
  loaderRunning = false;
  loadingScreen.classList.add('hidden');
  document.body.style.overflow = '';
  window.scrollTo(0, 0);
  playIntro();
}

/* --------------------------------------------------------------------------
   2. THREE.JS SCENE SETUP
   -------------------------------------------------------------------------- */
document.body.style.overflow = 'hidden'; // lock scroll until intro is ready

const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.0105);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 700
);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ---- Lighting --------------------------------------------------------- */
scene.add(new THREE.AmbientLight(0x8fa8c0, 0.55));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
keyLight.position.set(12, 20, 18);
scene.add(keyLight);

const rimBlue = new THREE.PointLight(0x6fa8ff, 6, 90, 2);
rimBlue.position.set(-16, 10, -10);
scene.add(rimBlue);

const rimCyan = new THREE.PointLight(0x4df0ff, 5, 90, 2);
rimCyan.position.set(14, -30, 12);
scene.add(rimCyan);

/* ---- DNA group ---------------------------------------------------------
   Everything belonging to the helix (strands, rungs, particles) lives in
   one group so it can be rotated / nudged as a whole while individual
   parts still animate independently.
-------------------------------------------------------------------------- */
const dnaGroup = new THREE.Group();
scene.add(dnaGroup);

const { turns, radius, totalHeight, strandTubeRadius } = CONFIG.helix;
const TOP_Y = totalHeight / 2;

function helixPoint(t, phase) {
  const angle = t * turns * Math.PI * 2 + phase;
  const y = TOP_Y - t * totalHeight;
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

// ---- Strands (smooth tubes through sampled helix points) ----
function buildStrand(phase, color) {
  const sampleCount = CONFIG.isMobile ? 220 : 420;
  const pts = [];
  for (let i = 0; i <= sampleCount; i++) pts.push(helixPoint(i / sampleCount, phase));
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, sampleCount, strandTubeRadius, 8, false);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.15,
    roughness: 0.25,
    transmission: 0.35,
    thickness: 1.2,
    transparent: true,
    opacity: 0.92,
    emissive: color,
    emissiveIntensity: 0.12,
  });
  const mesh = new THREE.Mesh(geo, mat);
  dnaGroup.add(mesh);
  return mesh;
}

const strandA = buildStrand(0, 0xf4f6f8);
const strandB = buildStrand(Math.PI, 0xb9c2c9);

// ---- Base-pair rungs (instanced cylinders) ----
const RUNG_COUNT = CONFIG.isMobile ? 70 : 150;
const rungGeo = new THREE.CylinderGeometry(0.055, 0.055, 1, 6, 1, true);
const rungMat = new THREE.MeshStandardMaterial({
  color: 0xaebccb,
  emissive: 0x2a3d55,
  emissiveIntensity: 0.4,
  roughness: 0.4,
  metalness: 0.1,
  transparent: true,
  opacity: 0.85,
  vertexColors: true,
});
const rungMesh = new THREE.InstancedMesh(rungGeo, rungMat, RUNG_COUNT);
rungMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(RUNG_COUNT * 3), 3);

const rungT = new Float32Array(RUNG_COUNT);
const baseColor = new THREE.Color(0xaebccb);
const dummyObj = new THREE.Object3D();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

for (let i = 0; i < RUNG_COUNT; i++) {
  const t = 0.015 + (i / (RUNG_COUNT - 1)) * 0.97;
  rungT[i] = t;
  const pA = helixPoint(t, 0);
  const pB = helixPoint(t, Math.PI);
  const mid = pA.clone().lerp(pB, 0.5);
  const dir = pB.clone().sub(pA);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.normalize());

  dummyObj.position.copy(mid);
  dummyObj.quaternion.copy(quat);
  dummyObj.scale.set(1, len, 1);
  dummyObj.updateMatrix();
  rungMesh.setMatrixAt(i, dummyObj.matrix);
  rungMesh.setColorAt(i, baseColor);
}
rungMesh.instanceMatrix.needsUpdate = true;
rungMesh.instanceColor.needsUpdate = true;
dnaGroup.add(rungMesh);

// ---- Ambient particles drifting around the helix ----
const PARTICLE_COUNT = CONFIG.isMobile ? 300 : 850;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(PARTICLE_COUNT * 3);
const particlePhase = new Float32Array(PARTICLE_COUNT);
const particleSpeed = new Float32Array(PARTICLE_COUNT);
const particleBaseY = new Float32Array(PARTICLE_COUNT);
const particleAngle = new Float32Array(PARTICLE_COUNT);
const particleRadius = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const r = radius * (1.1 + Math.random() * 1.8);
  const angle = Math.random() * Math.PI * 2;
  const y = TOP_Y - Math.random() * totalHeight;
  particleAngle[i] = angle;
  particleRadius[i] = r;
  particleBaseY[i] = y;
  particlePhase[i] = Math.random() * Math.PI * 2;
  particleSpeed[i] = 0.15 + Math.random() * 0.3;
  particlePos[i * 3] = Math.cos(angle) * r;
  particlePos[i * 3 + 1] = y;
  particlePos[i * 3 + 2] = Math.sin(angle) * r;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

function createGlowTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(160,210,255,0.6)');
  g.addColorStop(1, 'rgba(160,210,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
const glowTexture = createGlowTexture();

const particleMat = new THREE.PointsMaterial({
  size: CONFIG.isMobile ? 0.55 : 0.7,
  map: glowTexture,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0x9fc4ff,
});
const particles = new THREE.Points(particleGeo, particleMat);
dnaGroup.add(particles);

/* ---- Optional bloom post-processing (loaded lazily, degrades gracefully) */
let composer = null;
let bloomPass = null;
(async () => {
  if (CONFIG.isMobile) return; // keep mobile lean
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
    ]);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.55, 0.6, 0.82
    );
    composer.addPass(bloomPass);
  } catch (err) {
    composer = null; // fall back to plain rendering
  }
})();

/* --------------------------------------------------------------------------
   3. SCROLL STATE, CAMERA TRAVEL & MOUSE PARALLAX
   -------------------------------------------------------------------------- */
gsap.registerPlugin(ScrollTrigger);

const scrollState = { target: 0, current: 0 };
const mouseState = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
let introDone = false;

window.addEventListener('mousemove', (e) => {
  mouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseState.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// Master scroll tracker — drives the camera's journey through the helix.
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: () => document.body.scrollHeight - window.innerHeight,
  scrub: 0.8,
  onUpdate: (self) => { scrollState.target = self.progress; },
});

const CAM_START_Y = TOP_Y - 4;
const CAM_END_Y = TOP_Y - totalHeight + 14;
const CAM_START_Z = CONFIG.reducedMotion ? 26 : 13;
const CAM_END_Z = 30;

camera.position.set(0, CAM_START_Y, CAM_START_Z);
camera.lookAt(0, CAM_START_Y - 3, 0);

/* --------------------------------------------------------------------------
   4. PROJECT GLOW + PANEL SCROLL TRIGGERS
   -------------------------------------------------------------------------- */
const glowState = { index: -1, strength: 0, targetStrength: 0, color: new THREE.Color(0xffffff) };
const tmpColor = new THREE.Color();

function setActiveProject(index, active) {
  const marker = document.querySelector(`.nav-marker[data-index="${index}"]`);
  if (marker) marker.classList.toggle('active', active);
  if (active) {
    glowState.index = index;
    glowState.targetStrength = 1;
    glowState.color.setHex(CONFIG.projects[index].color);
  } else if (glowState.index === index) {
    glowState.targetStrength = 0;
  }
}

const navIndicator = document.getElementById('nav-indicator');
const projectSections = document.querySelectorAll('.project-section, .featured-section');

projectSections.forEach((section) => {
  const idx = Number(section.dataset.projectIndex);
  const panel = section.querySelector('[data-panel]');

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
    .fromTo(panel,
      { opacity: 0, scale: 0.82, y: 70, rotateX: 10 },
      { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 0.4, ease: 'power3.out' })
    .to(panel, { opacity: 1, scale: 1, duration: 0.35 })
    .to(panel, { opacity: 0, scale: 0.88, y: -70, rotateX: -10, duration: 0.4, ease: 'power3.out' });
});

// Show the nav indicator only while travelling through the project zone.
ScrollTrigger.create({
  trigger: '#project-0',
  start: 'top 80%',
  end: '#contact',
  onEnter: () => navIndicator.classList.add('visible'),
  onEnterBack: () => navIndicator.classList.add('visible'),
  onLeave: () => navIndicator.classList.remove('visible'),
  onLeaveBack: () => navIndicator.classList.remove('visible'),
});

// Scroll progress rail on the left edge.
const scrollFill = document.getElementById('scroll-progress-fill');
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: () => document.body.scrollHeight - window.innerHeight,
  scrub: true,
  onUpdate: (self) => { scrollFill.style.height = (self.progress * 100) + '%'; },
});

/* --------------------------------------------------------------------------
   5. ABOUT SECTION — DNA slows & the strands read as two vertical lines
   -------------------------------------------------------------------------- */
ScrollTrigger.create({
  trigger: '#about',
  start: 'top 70%',
  end: 'bottom top',
  onEnter: () => { dnaTargetSpeed = 0.05; },
  onLeaveBack: () => { dnaTargetSpeed = 1; },
  onLeave: () => { dnaTargetSpeed = 0.02; },
  onEnterBack: () => { dnaTargetSpeed = 0.05; },
});

/* --------------------------------------------------------------------------
   6. CONTACT — DNA dissolves, one particle follows the cursor
   -------------------------------------------------------------------------- */
const contactParticle = document.getElementById('contact-particle');
let inContact = false;
const contactX = gsap.quickTo(contactParticle, 'x', { duration: 0.5, ease: 'power3.out' });
const contactY = gsap.quickTo(contactParticle, 'y', { duration: 0.5, ease: 'power3.out' });

ScrollTrigger.create({
  trigger: '#contact',
  start: 'top 60%',
  end: 'bottom bottom',
  onEnter: () => { inContact = true; gsap.to(contactParticle, { opacity: 1, duration: 0.6 }); },
  onLeaveBack: () => { inContact = false; gsap.to(contactParticle, { opacity: 0, duration: 0.4 }); },
});

window.addEventListener('mousemove', (e) => {
  if (!inContact) return;
  contactX(e.clientX);
  contactY(e.clientY);
}, { passive: true });

/* --------------------------------------------------------------------------
   7. SKILLS — technologies rendered as glowing DNA nodes
   -------------------------------------------------------------------------- */
const skillsHelix = document.getElementById('skills-helix');
CONFIG.skills.forEach((label) => {
  const node = document.createElement('div');
  node.className = 'skill-node';
  node.setAttribute('role', 'listitem');
  node.tabIndex = 0;
  node.innerHTML = `<span class="node-dot"></span><span class="node-bar"></span><span class="node-label">${label}</span>`;
  node.addEventListener('click', () => node.classList.toggle('active'));
  skillsHelix.appendChild(node);
});

/* --------------------------------------------------------------------------
   8. CUSTOM CURSOR
   -------------------------------------------------------------------------- */
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
  }, { passive: true });

  document.querySelectorAll('.project-link, .skill-node, .contact-link, [data-panel]').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover-project'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover-project'));
  });
}

/* --------------------------------------------------------------------------
   9. RAYCAST — hovering directly over the DNA swells the cursor dot
   -------------------------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let raycastAccum = 0;

if (!CONFIG.isTouch) {
  window.addEventListener('mousemove', (e) => {
    pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   10. INTRO ANIMATION — camera pulls back from an extreme close-up
   -------------------------------------------------------------------------- */
function playIntro() {
  const heroContent = document.querySelector('.hero-content');
  gsap.set(heroContent, { opacity: 0, y: 30 });

  if (CONFIG.reducedMotion) {
    camera.position.set(0, CAM_START_Y, CAM_END_Z);
    gsap.to(heroContent, { opacity: 1, y: 0, duration: 0.8 });
    document.body.style.overflow = '';
    introDone = true;
    return;
  }

  camera.position.set(0, CAM_START_Y, 4.2);
  const camProxy = { z: 4.2 };
  gsap.timeline({
    onComplete: () => {
      document.body.style.overflow = '';
      introDone = true;
    },
  })
    .to(camProxy, {
      z: CAM_END_Z,
      duration: 2.6,
      ease: 'power4.out',
      onUpdate: () => { camera.position.z = camProxy.z; },
    }, 0)
    .to(heroContent, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 0.9);
}

/* --------------------------------------------------------------------------
   11. RENDER LOOP
   -------------------------------------------------------------------------- */
const clock = new THREE.Clock();
let dnaSpeed = 1;
let dnaTargetSpeed = 1;
let rafId = null;

function updateRungHighlight() {
  glowState.strength += (glowState.targetStrength - glowState.strength) * 0.08;
  if (glowState.strength < 0.003 && glowState.targetStrength === 0) return;

  const activeProject = CONFIG.projects[glowState.index];
  if (!activeProject) return;
  const centerT = activeProject.depth;
  const spread = 0.05;

  for (let i = 0; i < RUNG_COUNT; i++) {
    const d = Math.abs(rungT[i] - centerT);
    if (d > spread * 2.2) continue;
    const local = Math.max(0, 1 - d / (spread * 2.2)) * glowState.strength;
    tmpColor.copy(baseColor).lerp(glowState.color, local);
    rungMesh.setColorAt(i, tmpColor);
  }
  rungMesh.instanceColor.needsUpdate = true;
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  // Smooth (inertial) scroll progress toward the ScrollTrigger target.
  scrollState.current += (scrollState.target - scrollState.current) * (CONFIG.reducedMotion ? 0.18 : 0.09);

  // Smoothed mouse parallax.
  mouseState.smoothX += (mouseState.x - mouseState.smoothX) * 0.06;
  mouseState.smoothY += (mouseState.y - mouseState.smoothY) * 0.06;

  // Continuous independent DNA motion (never a static background).
  dnaSpeed += (dnaTargetSpeed - dnaSpeed) * 0.03;
  const rotAmount = CONFIG.reducedMotion ? 0.04 : 0.14;
  dnaGroup.rotation.y += dt * rotAmount * dnaSpeed;
  dnaGroup.position.x = Math.sin(elapsed * 0.12) * 0.4;
  strandA.material.emissiveIntensity = 0.1 + Math.sin(elapsed * 0.8) * 0.04;
  strandB.material.emissiveIntensity = 0.1 + Math.cos(elapsed * 0.7) * 0.04;

  // Particle drift.
  const pos = particleGeo.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const wobble = Math.sin(elapsed * particleSpeed[i] + particlePhase[i]) * 0.6;
    const a = particleAngle[i] + elapsed * 0.02 * particleSpeed[i];
    pos.array[i * 3] = Math.cos(a) * particleRadius[i] + wobble * 0.3;
    pos.array[i * 3 + 1] = particleBaseY[i] + wobble;
    pos.array[i * 3 + 2] = Math.sin(a) * particleRadius[i];
  }
  pos.needsUpdate = true;

  updateRungHighlight();

  if (introDone) {
    // Camera travels vertically through the helix as the page scrolls.
    const camY = THREE.MathUtils.lerp(CAM_START_Y, CAM_END_Y, scrollState.current);
    const parallax = CONFIG.reducedMotion ? 0.6 : 2.4;
    const targetX = mouseState.smoothX * parallax;
    const targetZLift = mouseState.smoothY * (CONFIG.reducedMotion ? 0.3 : 1.6);

    camera.position.y = camY;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z = THREE.MathUtils.lerp(CAM_END_Z, CAM_END_Z + 4, Math.abs(mouseState.smoothX)) + targetZLift * 0.2;

    camera.lookAt(mouseState.smoothX * 1.2, camY - 4.5, 0);
  }

  // Lightweight raycast for the "hovering the DNA" cursor state.
  if (!CONFIG.isTouch) {
    raycastAccum += dt;
    if (raycastAccum > 0.08) {
      raycastAccum = 0;
      raycaster.setFromCamera(pointerNDC, camera);
      const hit = raycaster.intersectObjects([strandA, strandB, rungMesh], false);
      document.body.classList.toggle('cursor-hover-dna', hit.length > 0);
    }
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);

  rafId = requestAnimationFrame(animate);
}

function startLoop() {
  if (rafId === null) {
    clock.getDelta(); // discard the gap accumulated while paused
    rafId = requestAnimationFrame(animate);
  }
}
function stopLoop() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop(); else startLoop();
});

/* --------------------------------------------------------------------------
   12. RESIZE
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

/* --------------------------------------------------------------------------
   13. BOOT SEQUENCE
   -------------------------------------------------------------------------- */
setLoaderProgress(22, 0.5);

// Fonts + a beat of polish before revealing the scene.
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise((res) => setTimeout(res, 400)),
]).then(() => {
  setLoaderProgress(60, 0.6);
  return new Promise((res) => setTimeout(res, 500));
}).then(() => {
  setLoaderProgress(92, 0.5);
  return new Promise((res) => setTimeout(res, 380));
}).then(() => {
  setLoaderProgress(100, 0.4);
  setTimeout(hideLoader, 480);
});

startLoop();
