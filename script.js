// script.js – Complete game logic for Ears of the Forest

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ===================== DOM ELEMENTS =====================
const loadingScreen = document.getElementById('loading-screen');
const mainMenu = document.getElementById('main-menu');
const introCutscene = document.getElementById('intro-cutscene');
const gameContainer = document.getElementById('game-container');
const hud = document.getElementById('hud');
const pauseMenu = document.getElementById('pause-menu');
const deathScreen = document.getElementById('death-screen');
const winScreen = document.getElementById('win-screen');
const settingsMenu = document.getElementById('settings-menu');
const creditsMenu = document.getElementById('credits-menu');
const messageLog = document.getElementById('message-log');

// HUD bars
const healthBar = document.getElementById('health-bar');
const sanityBar = document.getElementById('sanity-bar');
const hungerBar = document.getElementById('hunger-bar');
const thirstBar = document.getElementById('thirst-bar');
const staminaBar = document.getElementById('stamina-bar');
const tempBar = document.getElementById('temp-bar');
const memoryCount = document.getElementById('memory-count');
const timeDisplay = document.getElementById('time-display');
const inventorySlots = document.querySelectorAll('.inv-slot');
const typewriter = document.getElementById('typewriter');

// ===================== GAME STATE =====================
const state = {
  isPlaying: false,
  isPaused: false,
  isDead: false,
  isWon: false,
  health: 100,
  sanity: 100,
  hunger: 85,
  thirst: 90,
  stamina: 100,
  temperature: 70,
  memoryFragments: 0,
  totalFragments: 12,
  day: 1,
  timeOfDay: 360, // minutes from midnight (360 = 6:00 AM)
  flashlightOn: true,
  flashlightBattery: 100,
  selectedSlot: 0,
  inventory: [
    { name: 'Flashlight', icon: '🔦', usable: true, quantity: Infinity },
    { name: 'Water', icon: '💧', usable: true, quantity: 3 },
    { name: 'Food', icon: '🍞', usable: true, quantity: 2 },
    { name: 'Distraction', icon: '🪶', usable: true, quantity: 2 },
    { name: 'Repellent', icon: '🪵', usable: true, quantity: 1 },
  ],
  forestMood: 'neutral', // friendly, neutral, hostile
  messageQueue: [],
};

// ===================== THREE.JS SETUP =====================
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#1a1a2e', 0.00008);
scene.background = new THREE.Color('#1a1a2e');

const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(0, 1.7, 0);

const controls = new PointerLockControls(camera, document.body);

// Lights
const ambientLight = new THREE.AmbientLight('#334466', 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight('#ffe8cc', 1.5);
directionalLight.position.set(50, 60, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -80;
directionalLight.shadow.camera.right = 80;
directionalLight.shadow.camera.top = 80;
directionalLight.shadow.camera.bottom = -80;
scene.add(directionalLight);

const playerFlashlight = new THREE.SpotLight('#ffe8c0', 8, 35, Math.PI / 7, 0.3, 1);
playerFlashlight.position.copy(camera.position);
playerFlashlight.castShadow = true;
playerFlashlight.shadow.mapSize.width = 512;
playerFlashlight.shadow.mapSize.height = 512;
playerFlashlight.shadow.camera.near = 0.3;
playerFlashlight.shadow.camera.far = 40;
scene.add(playerFlashlight);
scene.add(playerFlashlight.target);

// ===================== WORLD GENERATION =====================
function getTerrainHeight(x, z) {
  return Math.sin(x * 0.03) * Math.cos(z * 0.03) * 3 + Math.sin(x * 0.08 + z * 0.08) * 1.5;
}

function generateWorld() {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(250, 250, 80, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    pos.setZ(i, getTerrainHeight(x, z));
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: '#3d5a3c', roughness: 0.9, metalness: 0.05 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Trees
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 240;
    const z = (Math.random() - 0.5) * 240;
    const y = getTerrainHeight(x, z);
    const tree = new THREE.Group();
    const trunkH = 2.5 + Math.random() * 3;
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, trunkH, 8);
    const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: '#5c3d2e', roughness: 0.9 }));
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    for (let j = 0; j < 2; j++) {
      const coneGeo = new THREE.ConeGeometry(1.2 - j * 0.3, 2 - j * 0.4, 8);
      const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ color: '#2d5a27', roughness: 0.7 }));
      cone.position.y = trunkH + j * 1.2;
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);
    }
    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    tree.scale.setScalar(0.9 + Math.random() * 0.5);
    scene.add(tree);
  }

  // Memory fragments
  window.fragments = [];
  for (let i = 0; i < state.totalFragments; i++) {
    const fx = (Math.random() - 0.5) * 220;
    const fz = (Math.random() - 0.5) * 220;
    const fy = getTerrainHeight(fx, fz) + 1.2;
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5),
      new THREE.MeshStandardMaterial({ color: '#ffdd55', roughness: 0.2, metalness: 0.6, emissive: '#ffaa00', emissiveIntensity: 1.5 })
    );
    crystal.position.set(fx, fy, fz);
    crystal.userData = { fragmentIndex: i, collected: false };
    scene.add(crystal);
    window.fragments.push(crystal);
  }
}

// ===================== PLAYER CONTROLS =====================
const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW': keys.w = true; break;
    case 'KeyA': keys.a = true; break;
    case 'KeyS': keys.s = true; break;
    case 'KeyD': keys.d = true; break;
    case 'ShiftLeft': case 'ShiftRight': keys.shift = true; break;
    case 'Space': keys.space = true; break;
    case 'KeyF': if (state.isPlaying && !state.isPaused) toggleFlashlight(); break;
    case 'Digit1': state.selectedSlot = 0; updateInventoryUI(); break;
    case 'Digit2': state.selectedSlot = 1; updateInventoryUI(); break;
    case 'Digit3': state.selectedSlot = 2; updateInventoryUI(); break;
    case 'Digit4': state.selectedSlot = 3; updateInventoryUI(); break;
    case 'Digit5': state.selectedSlot = 4; updateInventoryUI(); break;
    case 'KeyE': tryInteract(); break;
    case 'Escape': if (state.isPlaying && !state.isPaused) pauseGame(); break;
  }
});
document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': keys.w = false; break;
    case 'KeyA': keys.a = false; break;
    case 'KeyS': keys.s = false; break;
    case 'KeyD': keys.d = false; break;
    case 'ShiftLeft': case 'ShiftRight': keys.shift = false; break;
    case 'Space': keys.space = false; break;
  }
});

function toggleFlashlight() {
  state.flashlightOn = !state.flashlightOn;
  playerFlashlight.intensity = state.flashlightOn ? 8 : 0;
  addMessage(state.flashlightOn ? 'Flashlight on' : 'Flashlight off');
}

let playerVelocity = new THREE.Vector3();
let verticalVelocity = 0;
const GRAVITY = -20;

function updatePlayer(delta) {
  if (!state.isPlaying || state.isPaused || state.isDead || state.isWon) return;
  
  // Speed
  const sprintMult = (keys.shift && state.stamina > 0) ? 1.8 : 1;
  const speed = 5 * sprintMult * delta;
  if (keys.shift && state.stamina > 0) state.stamina = Math.max(0, state.stamina - 20 * delta);
  else state.stamina = Math.min(100, state.stamina + 10 * delta);
  
  // Direction
  const moveDir = new THREE.Vector3();
  if (keys.w) moveDir.add(new THREE.Vector3(0,0,-1));
  if (keys.s) moveDir.add(new THREE.Vector3(0,0,1));
  if (keys.a) moveDir.add(new THREE.Vector3(-1,0,0));
  if (keys.d) moveDir.add(new THREE.Vector3(1,0,0));
  if (moveDir.length() > 0) moveDir.normalize().applyQuaternion(camera.quaternion);
  
  const newPos = camera.position.clone();
  newPos.x += moveDir.x * speed;
  newPos.z += moveDir.z * speed;
  
  // Terrain height
  const groundY = getTerrainHeight(newPos.x, newPos.z);
  const targetY = groundY + 1.7;
  
  // Jumping
  if (keys.space && Math.abs(camera.position.y - targetY) < 0.1) {
    verticalVelocity = 5;
  }
  verticalVelocity += GRAVITY * delta;
  newPos.y += verticalVelocity * delta;
  if (newPos.y <= targetY) {
    newPos.y = targetY;
    verticalVelocity = 0;
  }
  
  camera.position.copy(newPos);
  
  // Flashlight
  playerFlashlight.position.copy(camera.position);
  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  playerFlashlight.target.position.copy(camera.position).add(dir.multiplyScalar(20));
}

// ===================== INTERACTION =====================
function tryInteract() {
  if (!state.isPlaying || state.isPaused) return;
  // Check memory fragments
  for (const frag of window.fragments) {
    if (frag.userData.collected) continue;
    if (camera.position.distanceTo(frag.position) < 3.5) {
      collectFragment(frag);
      return;
    }
  }
}

function collectFragment(frag) {
  frag.userData.collected = true;
  scene.remove(frag);
  state.memoryFragments++;
  state.sanity = Math.min(100, state.sanity + 15);
  memoryCount.textContent = state.memoryFragments;
  addMessage(`Memory fragment collected (${state.memoryFragments}/12). Sanity restored.`);
  if (state.memoryFragments >= state.totalFragments) {
    winGame();
  }
}

// ===================== SURVIVAL SYSTEMS =====================
function updateSurvival(delta) {
  if (!state.isPlaying || state.isPaused || state.isDead || state.isWon) return;
  
  state.hunger = Math.max(0, state.hunger - delta * 1.2);
  state.thirst = Math.max(0, state.thirst - delta * 1.5);
  const isNight = state.timeOfDay < 360 || state.timeOfDay > 1080;
  state.temperature += (isNight ? -delta * 4 : delta * 2);
  state.temperature = THREE.MathUtils.clamp(state.temperature, 10, 100);
  
  // Sanity drain at night, or if dark
  const darknessFactor = state.flashlightOn ? 0.1 : (isNight ? 0.8 : 0.2);
  state.sanity = Math.max(0, state.sanity - delta * darknessFactor * 5);
  
  // Effects of low stats
  if (state.hunger < 10) state.health -= delta * 4;
  if (state.thirst < 10) state.health -= delta * 5;
  if (state.temperature < 25) state.health -= delta * 3;
  
  if (state.health <= 0) {
    state.health = 0;
    die();
  }
  
  // Forest mood
  if (state.sanity < 30) state.forestMood = 'hostile';
  else if (state.sanity < 60) state.forestMood = 'neutral';
  else state.forestMood = 'friendly';
  
  // Whispers & shaking when low sanity
  if (state.sanity < 40 && Math.random() < delta * 0.6) {
    addMessage('...don\'t look back...');
  }
  if (state.sanity < 20) {
    camera.position.x += (Math.random() - 0.5) * 0.03;
    camera.position.z += (Math.random() - 0.5) * 0.03;
  }
}

// ===================== DAY/NIGHT CYCLE =====================
function updateTime(delta) {
  if (!state.isPlaying || state.isPaused || state.isDead || state.isWon) return;
  state.timeOfDay += delta * 1.5; // speed
  if (state.timeOfDay >= 1440) {
    state.timeOfDay -= 1440;
    state.day++;
  }
  const hours = Math.floor(state.timeOfDay / 60);
  const mins = Math.floor(state.timeOfDay % 60);
  timeDisplay.textContent = `Day ${state.day}, ${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;
  
  const sunAngle = (state.timeOfDay / 1440) * Math.PI * 2;
  const sunHeight = Math.sin(sunAngle);
  directionalLight.intensity = Math.max(0.2, sunHeight * 1.2 + 0.5);
  ambientLight.intensity = 0.1 + Math.max(0, sunHeight * 0.4);
}

// ===================== UI HELPERS =====================
function updateHUD() {
  healthBar.style.width = `${state.health}%`;
  sanityBar.style.width = `${state.sanity}%`;
  hungerBar.style.width = `${state.hunger}%`;
  thirstBar.style.width = `${state.thirst}%`;
  staminaBar.style.width = `${state.stamina}%`;
  tempBar.style.width = `${state.temperature}%`;
  memoryCount.textContent = state.memoryFragments;
}

function updateInventoryUI() {
  inventorySlots.forEach((slot, idx) => {
    slot.classList.toggle('active', idx === state.selectedSlot);
    slot.textContent = state.inventory[idx].icon;
  });
}

function addMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.textContent = text;
  messageLog.appendChild(msg);
  requestAnimationFrame(() => msg.classList.add('show'));
  setTimeout(() => {
    msg.classList.remove('show');
    setTimeout(() => msg.remove(), 600);
  }, 4000);
  while (messageLog.children.length > 5) messageLog.firstChild.remove();
}

// ===================== MENU FLOW =====================
function showMainMenu() {
  closeAll();
  mainMenu.classList.remove('hidden');
}

function closeAll() {
  [mainMenu, introCutscene, hud, pauseMenu, deathScreen, winScreen, settingsMenu, creditsMenu].forEach(el => el.classList.add('hidden'));
}

function startNewGame() {
  resetState();
  closeAll();
  hud.classList.remove('hidden');
  state.isPlaying = true;
  controls.lock();
  addMessage('The bus broke down. You wander into the trees…');
}

function resetState() {
  state.health = 100; state.sanity = 100; state.hunger = 85; state.thirst = 90; state.stamina = 100;
  state.temperature = 70; state.memoryFragments = 0; state.day = 1; state.timeOfDay = 360;
  state.flashlightOn = true; playerFlashlight.intensity = 8;
  state.forestMood = 'neutral';
  state.inventory = [
    { name: 'Flashlight', icon: '🔦', usable: true, quantity: Infinity },
    { name: 'Water', icon: '💧', usable: true, quantity: 3 },
    { name: 'Food', icon: '🍞', usable: true, quantity: 2 },
    { name: 'Distraction', icon: '🪶', usable: true, quantity: 2 },
    { name: 'Repellent', icon: '🪵', usable: true, quantity: 1 },
  ];
  state.selectedSlot = 0;
  // Remove old fragments
  if (window.fragments) window.fragments.forEach(f => scene.remove(f));
  window.fragments = [];
  generateWorld();
  updateInventoryUI();
  memoryCount.textContent = '0';
}

function pauseGame() {
  state.isPaused = true;
  pauseMenu.classList.remove('hidden');
  controls.unlock();
}

function resumeGame() {
  state.isPaused = false;
  pauseMenu.classList.add('hidden');
  controls.lock();
}

function die() {
  state.isDead = true;
  state.isPlaying = false;
  controls.unlock();
  closeAll();
  deathScreen.classList.remove('hidden');
}

function winGame() {
  state.isWon = true;
  state.isPlaying = false;
  controls.unlock();
  closeAll();
  winScreen.classList.remove('hidden');
}

function saveGame() {
  localStorage.setItem('earsOfTheForest_save', JSON.stringify(state));
  addMessage('Game saved.');
}

function loadGame() {
  const saved = localStorage.getItem('earsOfTheForest_save');
  if (!saved) return false;
  Object.assign(state, JSON.parse(saved));
  // remove old fragments and regenerate based on saved state? We'll regenerate world and then collect already collected ones
  if (window.fragments) window.fragments.forEach(f => scene.remove(f));
  window.fragments = [];
  generateWorld();
  // mark collected fragments as invisible
  for (let i = 0; i < state.memoryFragments; i++) {
    if (window.fragments[i]) {
      window.fragments[i].userData.collected = true;
      scene.remove(window.fragments[i]);
    }
  }
  memoryCount.textContent = state.memoryFragments;
  updateHUD();
  updateInventoryUI();
  addMessage('Game loaded.');
  return true;
}

// ===================== EVENT BINDINGS =====================
document.getElementById('new-game-btn').addEventListener('click', () => {
  // intro cutscene
  closeAll();
  introCutscene.classList.remove('hidden');
  typewriter.innerHTML = '';
  const story = 'The school bus broke down on the forest road. As the others argued, you slipped into the trees…';
  let i = 0;
  const interval = setInterval(() => {
    typewriter.textContent += story[i];
    i++;
    if (i >= story.length) {
      clearInterval(interval);
      setTimeout(() => {
        startNewGame();
      }, 2000);
    }
  }, 50);
});
document.getElementById('continue-btn').addEventListener('click', () => {
  if (!loadGame()) {
    addMessage('No save data found.');
    startNewGame();
  } else {
    closeAll();
    hud.classList.remove('hidden');
    state.isPlaying = true;
    state.isPaused = false;
    controls.lock();
  }
});
document.getElementById('load-btn').addEventListener('click', () => {
  if (loadGame()) {
    closeAll();
    hud.classList.remove('hidden');
    state.isPlaying = true;
    state.isPaused = false;
    controls.lock();
  } else {
    alert('No save found!');
  }
});
document.getElementById('settings-btn').addEventListener('click', () => {
  closeAll();
  settingsMenu.classList.remove('hidden');
});
document.getElementById('credits-btn').addEventListener('click', () => {
  closeAll();
  creditsMenu.classList.remove('hidden');
});
document.getElementById('quit-btn').addEventListener('click', () => window.close());
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('save-btn').addEventListener('click', saveGame);
document.getElementById('pause-quit-btn').addEventListener('click', () => {
  state.isPlaying = false;
  controls.unlock();
  showMainMenu();
});
document.getElementById('restart-btn').addEventListener('click', startNewGame);
document.getElementById('death-quit-btn').addEventListener('click', showMainMenu);
document.getElementById('win-restart-btn').addEventListener('click', startNewGame);
document.getElementById('win-quit-btn').addEventListener('click', showMainMenu);
document.getElementById('back-from-settings').addEventListener('click', showMainMenu);
document.getElementById('back-from-credits').addEventListener('click', showMainMenu);

// Pointer lock state change
controls.addEventListener('lock', () => {
  if (state.isPlaying && !state.isPaused) {
    // nothing
  }
});
controls.addEventListener('unlock', () => {
  if (state.isPlaying && !state.isPaused && !state.isDead && !state.isWon) {
    pauseGame();
  }
});

// Inventory item usage on right click
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('mousedown', (e) => {
  if (e.button === 2 && state.isPlaying && !state.isPaused && !state.isDead && !state.isWon) {
    useInventoryItem(state.selectedSlot);
  }
});

function useInventoryItem(slot) {
  const item = state.inventory[slot];
  if (item.quantity <= 0) return;
  switch (item.name) {
    case 'Flashlight': toggleFlashlight(); break;
    case 'Water': state.thirst = Math.min(100, state.thirst + 30); item.quantity--; addMessage('Drank water.'); break;
    case 'Food': state.hunger = Math.min(100, state.hunger + 35); item.quantity--; addMessage('Ate food.'); break;
    case 'Distraction': addMessage('Distraction thrown!'); item.quantity--; break;
    case 'Repellent': state.sanity += 20; item.quantity--; addMessage('Repellent used.'); break;
  }
  updateInventoryUI();
}

// ===================== GAME LOOP =====================
let lastTime = performance.now();
generateWorld();
// Initialize UI
updateInventoryUI();
memoryCount.textContent = '0';
showMainMenu();
// Hide loading screen after a short delay (simulate loading)
setTimeout(() => {
  loadingScreen.style.display = 'none';
}, 2000);

function animate(timestamp) {
  requestAnimationFrame(animate);
  const delta = Math.min(0.1, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  
  updatePlayer(delta);
  updateSurvival(delta);
  updateTime(delta);
  updateHUD();
  
  // Rotate fragments
  if (window.fragments) {
    window.fragments.forEach(f => {
      if (!f.userData.collected) f.rotation.y += delta * 1.5;
    });
  }
  
  renderer.render(scene, camera);
}
animate(performance.now());

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
