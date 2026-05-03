import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ========== DOM ==========
const loadingScreen = document.getElementById('loading-screen');
const mainMenu = document.getElementById('main-menu');
const introCutscene = document.getElementById('intro-cutscene');
const clickToStart = document.getElementById('click-to-start');
const hud = document.getElementById('hud');
const pauseMenu = document.getElementById('pause-menu');
const deathScreen = document.getElementById('death-screen');
const winScreen = document.getElementById('win-screen');
const dialogueText = document.getElementById('dialogue-text');
const choiceButtons = document.getElementById('choice-buttons');
const healthFill = document.getElementById('health-fill');
const fearFill = document.getElementById('fear-fill');
const batteryFill = document.getElementById('battery-fill');
const batteryCount = document.getElementById('battery-count');
const medkitCount = document.getElementById('medkit-count');
const survivalCount = document.getElementById('survival-count');
const compass = document.getElementById('compass');
const deathEnding = document.getElementById('death-ending-text');
const winEnding = document.getElementById('win-ending-text');
const typewriter = document.getElementById('typewriter');

// ========== Audio (simple oscillator) ==========
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playBeep(freq = 220, duration = 0.1, vol = 0.1) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => { osc.stop(); }, duration * 1000);
}

// ========== GAME STATE ==========
const state = {
  isPlaying: false, isPaused: false, isDead: false, isWon: false,
  health: 100, fear: 0, flashlightBattery: 100, flashlightOn: true,
  inventory: { batteries: 0, medkits: 0, survivalKits: 0 },
  storyFlags: {
    helpedClassmate: false, exploredCave: false, foundSecret: false,
    bossDefeated: false, classmateLost: false,
  },
  time: 0,
  wolfSpawned: false, packSpawned: false, hordeSpawned: false,
  bossActive: false,
  ending: 'bad',
};

// ========== THREE.JS SETUP ==========
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#c0d0d0', 10, 80); // light daytime fog
scene.background = new THREE.Color('#87ceeb'); // light blue sky

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(0, 1.8, 0);
const controls = new PointerLockControls(camera, document.body);

// Lighting
const hemiLight = new THREE.HemisphereLight('#b1e1ff', '#53752d', 1.0);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight('#fff5e6', 1.5);
sunLight.position.set(50, 80, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
scene.add(sunLight);

// Flashlight
const flashlight = new THREE.SpotLight('#ffecaa', 5, 30, Math.PI / 8);
flashlight.castShadow = true;
flashlight.shadow.mapSize.width = 512;
flashlight.shadow.mapSize.height = 512;
scene.add(flashlight);
scene.add(flashlight.target);

// ========== WORLD ==========
const groundMat = new THREE.MeshStandardMaterial({ color: '#4c7a2d', roughness: 0.9 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// Trees
function createTree(x, z) {
  const group = new THREE.Group();
  const trunkH = 2.5 + Math.random() * 2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, trunkH, 6), new THREE.MeshStandardMaterial({ color: '#5c4033' }));
  trunk.position.y = trunkH/2;
  trunk.castShadow = true; trunk.receiveShadow = true;
  group.add(trunk);
  for (let i = 0; i < 4; i++) {
    const size = 0.8 - i * 0.15;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(size, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#2d5a27' }));
    leaf.position.y = trunkH + i * 0.9;
    leaf.castShadow = true; leaf.receiveShadow = true;
    group.add(leaf);
  }
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}
for (let i = 0; i < 150; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 180;
  if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; // spawn area
  createTree(x, z);
}

// Cave
const caveGroup = new THREE.Group();
const caveBase = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 8), new THREE.MeshStandardMaterial({ color: '#3d3d3d' }));
caveBase.position.y = 2;
caveBase.castShadow = true; caveBase.receiveShadow = true;
caveGroup.add(caveBase);
const caveRoof = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 8), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }));
caveRoof.position.y = 5;
caveGroup.add(caveRoof);
caveGroup.position.set(40, 0, -40);
scene.add(caveGroup);

// Items (batteries, medkits)
const items = [];
function spawnItem(type, x, z) {
  const color = type === 'battery' ? '#f1c40f' : '#e74c3c';
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, 0.3, z);
  mesh.userData = { type, collected: false };
  scene.add(mesh);
  items.push(mesh);
}
for (let i = 0; i < 8; i++) {
  const x = (Math.random() - 0.5) * 150;
  const z = (Math.random() - 0.5) * 150;
  if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
  spawnItem(i < 4 ? 'battery' : 'medkit', x, z);
}

// Classmates (simple humanoids)
const classmates = [];
function createClassmate(x, z) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8), new THREE.MeshStandardMaterial({ color: '#3498db' }));
  body.position.y = 0.7;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: '#f1c40f' }));
  head.position.y = 1.65;
  group.add(head);
  group.position.set(x, 0, z);
  scene.add(group);
  return { mesh: group, state: 'follow' };
}
for (let i = 0; i < 3; i++) {
  classmates.push(createClassmate((i-1)*2, -5));
}

// Wolves (enemies)
const wolves = [];
function createWolf(x, z, isBoss = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.7), new THREE.MeshStandardMaterial({ color: isBoss ? '#000' : '#4d4d4d' }));
  body.position.y = 0.5;
  group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: '#222' }));
  head.position.set(0, 0.9, 0.6);
  group.add(head);
  group.position.set(x, 0, z);
  scene.add(group);
  return {
    mesh: group, state: 'idle', speed: isBoss ? 6 : 3.5, damage: isBoss ? 15 : 8,
    isBoss, health: isBoss ? 80 : 30,
  };
}

// ========== PLAYER ==========
const keys = { w: false, a: false, s: false, d: false, shift: false };
document.addEventListener('keydown', e => {
  if (e.code === 'KeyW') keys.w = true;
  if (e.code === 'KeyA') keys.a = true;
  if (e.code === 'KeyS') keys.s = true;
  if (e.code === 'KeyD') keys.d = true;
  if (e.code === 'ShiftLeft') keys.shift = true;
  if (e.code === 'KeyF' && state.isPlaying) toggleFlashlight();
  if (e.code === 'KeyE') interact();
  if (e.code === 'Digit1') useItem('battery');
  if (e.code === 'Digit2') useItem('medkit');
  if (e.code === 'Digit3') craftSurvivalKit();
  if (e.code === 'Escape' && state.isPlaying && !state.isPaused) pauseGame();
});
document.addEventListener('keyup', e => {
  if (e.code === 'KeyW') keys.w = false;
  if (e.code === 'KeyA') keys.a = false;
  if (e.code === 'KeyS') keys.s = false;
  if (e.code === 'KeyD') keys.d = false;
  if (e.code === 'ShiftLeft') keys.shift = false;
});

function toggleFlashlight() {
  state.flashlightOn = !state.flashlightOn;
  flashlight.intensity = state.flashlightOn ? 5 : 0;
}

let verticalVel = 0;
function updatePlayer(delta) {
  if (!state.isPlaying || state.isPaused || state.isDead) return;
  const speed = (keys.shift ? 9 : 5) * delta;
  const dir = new THREE.Vector3();
  if (keys.w) dir.z -= 1;
  if (keys.s) dir.z += 1;
  if (keys.a) dir.x -= 1;
  if (keys.d) dir.x += 1;
  if (dir.length() > 0) dir.normalize().applyQuaternion(camera.quaternion);
  const newPos = camera.position.clone();
  newPos.x += dir.x * speed;
  newPos.z += dir.z * speed;
  verticalVel -= 20 * delta;
  newPos.y += verticalVel * delta;
  if (newPos.y <= 1.8) { newPos.y = 1.8; verticalVel = 0; }
  camera.position.copy(newPos);
  flashlight.position.copy(camera.position);
  const lookDir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  flashlight.target.position.copy(camera.position).add(lookDir.multiplyScalar(15));
  compass.textContent = `N (${Math.round(camera.position.x)}, ${Math.round(camera.position.z)})`;
}

// ========== INTERACTIONS ==========
function interact() {
  if (!state.isPlaying || state.isPaused) return;
  // Collect items
  for (const item of items) {
    if (!item.userData.collected && camera.position.distanceTo(item.position) < 2.5) {
      item.userData.collected = true;
      scene.remove(item);
      if (item.userData.type === 'battery') { state.inventory.batteries++; showDialogue('Picked up a battery pack.'); }
      else { state.inventory.medkits++; showDialogue('Picked up a medkit.'); }
      updateUI();
      return;
    }
  }
  // Enter cave
  if (camera.position.distanceTo(caveGroup.position) < 7) {
    state.storyFlags.exploredCave = true;
    scene.fog.density = 0.02;
    showDialogue('You enter the dark cave...');
    if (!state.bossActive) {
      state.bossActive = true;
      const boss = createWolf(caveGroup.position.x, caveGroup.position.z, true);
      wolves.push(boss);
      showDialogue('A monstrous black wolf blocks the path!');
    }
  }
}

function useItem(type) {
  if (type === 'battery' && state.inventory.batteries > 0) {
    state.inventory.batteries--;
    state.flashlightBattery = 100;
    showDialogue('Flashlight battery restored.');
  }
  if (type === 'medkit' && state.inventory.medkits > 0) {
    state.inventory.medkits--;
    state.health = Math.min(100, state.health + 40);
    showDialogue('Used a medkit.');
  }
  updateUI();
}

function craftSurvivalKit() {
  if (state.inventory.batteries >= 1 && state.inventory.medkits >= 1) {
    state.inventory.batteries--;
    state.inventory.medkits--;
    state.inventory.survivalKits++;
    showDialogue('Crafted a Survival Kit!');
    updateUI();
  }
}

// ========== AI ==========
function updateClassmates(delta) {
  for (const cm of classmates) {
    const dist = cm.mesh.position.distanceTo(camera.position);
    if (cm.state === 'follow') {
      const dir = camera.position.clone().sub(cm.mesh.position).normalize();
      cm.mesh.position.x += dir.x * 2 * delta;
      cm.mesh.position.z += dir.z * 2 * delta;
    }
    // Panic when fear high
    if (state.fear > 60 && cm.state === 'follow') {
      cm.state = 'panic';
      showDialogue('A classmate panics!');
    }
    if (cm.state === 'panic') {
      cm.mesh.position.x += (Math.random()-0.5) * 0.2;
      cm.mesh.position.z += (Math.random()-0.5) * 0.2;
    }
  }
}

function updateWolves(delta) {
  for (const wolf of wolves) {
    const dist = wolf.mesh.position.distanceTo(camera.position);
    const dir = camera.position.clone().sub(wolf.mesh.position).normalize();
    if (wolf.state === 'idle') {
      if (dist < 20) wolf.state = 'stalk';
    } else if (wolf.state === 'stalk') {
      wolf.mesh.position.x += dir.x * wolf.speed * 0.4 * delta;
      wolf.mesh.position.z += dir.z * wolf.speed * 0.4 * delta;
      if (dist < 5) wolf.state = 'chase';
    } else if (wolf.state === 'chase') {
      wolf.mesh.position.x += dir.x * wolf.speed * delta;
      wolf.mesh.position.z += dir.z * wolf.speed * delta;
      if (dist < 2) {
        state.health -= wolf.damage * delta * 2;
        state.fear += 10 * delta;
        if (state.health <= 0) die();
      }
    }
    // face player
    wolf.mesh.lookAt(camera.position);
  }
}

// ========== EVENTS ==========
function updateTimedEvents(delta) {
  state.time += delta;
  if (state.time > 10 && !state.storyFlags.classmateLost) {
    state.storyFlags.classmateLost = true;
    if (classmates.length > 0) {
      const lost = classmates.pop();
      scene.remove(lost.mesh);
      showDialogue('Someone is missing...');
      state.fear += 20;
    }
  }
  if (state.time > 30 && !state.wolfSpawned) {
    state.wolfSpawned = true;
    const wolf = createWolf(20, -20);
    wolves.push(wolf);
    showDialogue('A wolf howls in the distance.');
  }
  if (state.time > 60 && !state.packSpawned) {
    state.packSpawned = true;
    for (let i=0; i<4; i++) {
      wolves.push(createWolf((Math.random()-0.5)*60, (Math.random()-0.5)*60));
    }
    showDialogue('A pack of wolves surrounds you!');
  }
}

// ========== DIALOGUE & CHOICES ==========
function showDialogue(text, choices = []) {
  dialogueText.textContent = text;
  choiceButtons.innerHTML = '';
  for (const c of choices) {
    const btn = document.createElement('button');
    btn.textContent = c.text;
    btn.onclick = c.action;
    choiceButtons.appendChild(btn);
  }
}

function checkChoices() {
  if (state.storyFlags.classmateLost && !state.storyFlags.helpedClassmate) {
    showDialogue('What do you do?', [
      { text: 'Look for them', action: () => {
        state.storyFlags.helpedClassmate = true;
        state.health += 10;
        showDialogue('You find their trail, but they are gone.');
      }},
      { text: 'Keep moving', action: () => {
        state.fear += 15;
        showDialogue('You abandon the search.');
      }},
    ]);
  }
}

// ========== ENDINGS ==========
function die() {
  state.isDead = true; state.isPlaying = false; controls.unlock();
  deathEnding.textContent = 'You were consumed by the forest.';
  deathScreen.classList.remove('hidden');
  hud.classList.add('hidden');
}
function win() {
  state.isWon = true; state.isPlaying = false; controls.unlock();
  const helped = state.storyFlags.helpedClassmate;
  const boss = state.storyFlags.bossDefeated;
  if (helped && boss) {
    state.ending = 'good';
    winEnding.textContent = 'You and your classmates escape the forest together.';
  } else if (boss) {
    state.ending = 'secret';
    winEnding.textContent = 'You defeated the beast alone and found a hidden escape route.';
  } else {
    state.ending = 'bad';
    winEnding.textContent = 'You stagger out of the forest, forever changed.';
  }
  winScreen.classList.remove('hidden');
  hud.classList.add('hidden');
}

// ========== UI ==========
function updateUI() {
  healthFill.style.width = state.health + '%';
  fearFill.style.width = state.fear + '%';
  batteryFill.style.width = state.flashlightBattery + '%';
  batteryCount.textContent = state.inventory.batteries;
  medkitCount.textContent = state.inventory.medkits;
  survivalCount.textContent = state.inventory.survivalKits;
}

// ========== GAME FLOW ==========
function startNewGame() {
  state.isPlaying = true; state.isPaused = false; state.isDead = false; state.isWon = false;
  state.health = 100; state.fear = 0; state.flashlightBattery = 100; state.flashlightOn = true;
  state.inventory = { batteries: 0, medkits: 0, survivalKits: 0 };
  state.storyFlags = { helpedClassmate: false, exploredCave: false, foundSecret: false, bossDefeated: false, classmateLost: false };
  state.time = 0; state.wolfSpawned = false; state.packSpawned = false; state.hordeSpawned = false; state.bossActive = false;
  camera.position.set(0, 1.8, 10);
  flashlight.intensity = 5;
  // reset items
  items.forEach(i => scene.remove(i));
  items.length = 0;
  for (let i = 0; i < 8; i++) {
    const x = (Math.random()-0.5)*150;
    const z = (Math.random()-0.5)*150;
    spawnItem(i < 4 ? 'battery' : 'medkit', x, z);
  }
  // reset classmates
  classmates.forEach(c => scene.remove(c.mesh));
  classmates.length = 0;
  for (let i = 0; i < 3; i++) classmates.push(createClassmate((i-1)*2, -5));
  // reset wolves
  wolves.forEach(w => scene.remove(w.mesh));
  wolves.length = 0;
  scene.fog = new THREE.Fog('#c0d0d0', 10, 80);
  closeAll();
  hud.classList.remove('hidden');
  updateUI();
  controls.lock();
  showDialogue('You wake up alone. Your classmates are nearby.');
}
function closeAll() {
  [mainMenu, introCutscene, pauseMenu, deathScreen, winScreen].forEach(el => el.classList.add('hidden'));
}
function pauseGame() { state.isPaused = true; pauseMenu.classList.remove('hidden'); controls.unlock(); }
function resumeGame() { state.isPaused = false; pauseMenu.classList.add('hidden'); controls.lock(); }

// ========== EVENT LISTENERS ==========
document.getElementById('new-game-btn').addEventListener('click', () => {
  initAudio();
  closeAll(); introCutscene.classList.remove('hidden');
  typewriter.textContent = ''; clickToStart.classList.add('hidden');
  const story = 'The school bus crashed. You stumble into the woods. Your friends are calling your name...';
  let i = 0;
  const interval = setInterval(() => {
    typewriter.textContent += story[i];
    i++;
    if (i >= story.length) { clearInterval(interval); clickToStart.classList.remove('hidden'); }
  }, 40);
});
clickToStart.addEventListener('click', startNewGame);
document.getElementById('continue-btn').addEventListener('click', () => { /* not implemented */ });
document.getElementById('quit-btn').addEventListener('click', () => window.close());
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('save-btn').addEventListener('click', () => alert('Save not implemented.'));
document.getElementById('pause-quit-btn').addEventListener('click', () => {
  state.isPlaying = false; controls.unlock(); showMainMenu();
});
function showMainMenu() { closeAll(); mainMenu.classList.remove('hidden'); hud.classList.add('hidden'); }
document.getElementById('restart-btn').addEventListener('click', startNewGame);
document.getElementById('death-quit-btn').addEventListener('click', showMainMenu);
document.getElementById('win-restart-btn').addEventListener('click', startNewGame);
document.getElementById('win-quit-btn').addEventListener('click', showMainMenu);
controls.addEventListener('unlock', () => { if (state.isPlaying && !state.isPaused) pauseGame(); });

// Right click to use survival kit
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('mousedown', e => {
  if (e.button === 2 && state.isPlaying && state.inventory.survivalKits > 0) {
    state.inventory.survivalKits--;
    state.health = Math.min(100, state.health + 50);
    state.fear = Math.max(0, state.fear - 30);
    showDialogue('Used a Survival Kit!');
    updateUI();
  }
});

// ========== LOOP ==========
let lastTime = performance.now();
showMainMenu();
setTimeout(() => { loadingScreen.style.display = 'none'; }, 1500);

function animate(time) {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, (time - lastTime) / 1000);
  lastTime = time;
  if (state.isPlaying && !state.isPaused) {
    updatePlayer(delta);
    updateClassmates(delta);
    updateWolves(delta);
    updateTimedEvents(delta);
    // fear increase
    state.fear += delta * 2;
    if (state.flashlightOn) state.flashlightBattery = Math.max(0, state.flashlightBattery - delta * 3);
    if (state.flashlightBattery <= 0) { state.flashlightOn = false; flashlight.intensity = 0; }
    if (state.fear > 80) scene.fog.density = 0.025;
    else scene.fog.density = 0.005;
    checkChoices();
    updateUI();
  }
  renderer.render(scene, camera);
}
animate(performance.now());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
