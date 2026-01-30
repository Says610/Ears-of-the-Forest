// =====================
// Basic Scene Setup
// =====================
const canvas = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// =====================
// Lighting
// =====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// =====================
// Terrain
// =====================
const planeGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// =====================
// Trees
// =====================
function addTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 5),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  );
  trunk.position.set(x, 2.5, z);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x006400 })
  );
  leaves.position.set(x, 6, z);

  scene.add(trunk, leaves);
}

for (let i = 0; i < 50; i++) {
  addTree(Math.random()*200-100, Math.random()*200-100);
}

// =====================
// Player
// =====================
const player = {
  height: 1.8,
  speed: 0.2,
  stamina: 100,
  hunger: 100,
  thirst: 100,
  temperature: 37,
  position: new THREE.Vector3(0, 1.8, 0),
  flashlight: false
};

camera.position.set(player.position.x, player.position.y, player.position.z);

// =====================
// Wolves
// =====================
const wolves = [];
function addWolf(x, z, isBoss=false) {
  const geometry = new THREE.BoxGeometry(1, 1, 2);
  const material = new THREE.MeshStandardMaterial({ color: isBoss ? 0xff0000 : 0x555555 });
  const wolf = new THREE.Mesh(geometry, material);
  wolf.position.set(x, 0.5, z);
  wolf.isBoss = isBoss;
  scene.add(wolf);
  wolves.push(wolf);
}

// Spawn normal wolves
for (let i = 0; i < 5; i++) {
  addWolf(Math.random()*100-50, Math.random()*100-50);
}

// Spawn wolf boss
addWolf(20, -30, true);

// =====================
// Flashlight
// =====================
const flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/6, 0.2, 1);
flashlight.position.set(player.position.x, player.position.y, player.position.z);
flashlight.target.position.set(player.position.x, player.position.y, player.position.z-1);
scene.add(flashlight);
scene.add(flashlight.target);

// =====================
// Controls
// =====================
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

document.addEventListener('mousemove', e => {
  camera.rotation.y -= e.movementX * 0.002;
  camera.rotation.x -= e.movementY * 0.002;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
});

document.addEventListener('keydown', e => {
  if(e.key.toLowerCase() === 'f') player.flashlight = !player.flashlight;
});

// =====================
// HUD Updates
// =====================
function updateHUD() {
  document.getElementById('hunger').innerText = Math.floor(player.hunger);
  document.getElementById('thirst').innerText = Math.floor(player.thirst);
  document.getElementById('stamina').innerText = Math.floor(player.stamina);
  document.getElementById('temperature').innerText = Math.floor(player.temperature);
}

// =====================
// Game Loop
// =====================
function animate() {
  requestAnimationFrame(animate);

  // Player movement
  let dx=0, dz=0;
  if(keys['w']) dz -= player.speed;
  if(keys['s']) dz += player.speed;
  if(keys['a']) dx -= player.speed;
  if(keys['d']) dx += player.speed;

  // Stamina drain when sprinting
  if(keys['shift'] && player.stamina > 0) {
    dx *= 2; dz *= 2;
    player.stamina -= 0.2;
  } else if(player.stamina < 100) {
    player.stamina += 0.1;
  }

  player.position.x += dx * Math.cos(camera.rotation.y) - dz * Math.sin(camera.rotation.y);
  player.position.z += dz * Math.cos(camera.rotation.y) + dx * Math.sin(camera.rotation.y);

  camera.position.set(player.position.x, player.position.y, player.position.z);

  // Flashlight toggle
  flashlight.visible = player.flashlight;
  flashlight.position.set(player.position.x, player.position.y, player.position.z);
  flashlight.target.position.set(
    player.position.x + Math.sin(camera.rotation.y),
    player.position.y + Math.sin(camera.rotation.x),
    player.position.z - Math.cos(camera.rotation.y)
  );

  // Hunger/Thirst decay
  player.hunger -= 0.01;
  player.thirst -= 0.015;

  updateHUD();
  renderer.render(scene, camera);
}
animate();
// =====================
// Basic Scene Setup
// =====================
const canvas = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// =====================
// Lighting
// =====================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// =====================
// Terrain
// =====================
const planeGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// =====================
// Trees
// =====================
function addTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 5),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  );
  trunk.position.set(x, 2.5, z);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x006400 })
  );
  leaves.position.set(x, 6, z);

  scene.add(trunk, leaves);
}

for (let i = 0; i < 50; i++) {
  addTree(Math.random()*200-100, Math.random()*200-100);
}

// =====================
// Player
// =====================
const player = {
  height: 1.8,
  speed: 0.2,
  stamina: 100,
  hunger: 100,
  thirst: 100,
  temperature: 37,
  position: new THREE.Vector3(0, 1.8, 0),
  flashlight: false
};

camera.position.set(player.position.x, player.position.y, player.position.z);

// =====================
// Wolves
// =====================
const wolves = [];
function addWolf(x, z, isBoss=false) {
  const geometry = new THREE.BoxGeometry(1, 1, 2);
  const material = new THREE.MeshStandardMaterial({ color: isBoss ? 0xff0000 : 0x555555 });
  const wolf = new THREE.Mesh(geometry, material);
  wolf.position.set(x, 0.5, z);
  wolf.isBoss = isBoss;
  scene.add(wolf);
  wolves.push(wolf);
}

// Spawn normal wolves
for (let i = 0; i < 5; i++) {
  addWolf(Math.random()*100-50, Math.random()*100-50);
}

// Spawn wolf boss
addWolf(20, -30, true);

// =====================
// Flashlight
// =====================
const flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI/6, 0.2, 1);
flashlight.position.set(player.position.x, player.position.y, player.position.z);
flashlight.target.position.set(player.position.x, player.position.y, player.position.z-1);
scene.add(flashlight);
scene.add(flashlight.target);

// =====================
// Controls
// =====================
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

document.addEventListener('mousemove', e => {
  camera.rotation.y -= e.movementX * 0.002;
  camera.rotation.x -= e.movementY * 0.002;
  camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
});

document.addEventListener('keydown', e => {
  if(e.key.toLowerCase() === 'f') player.flashlight = !player.flashlight;
});

// =====================
// HUD Updates
// =====================
function updateHUD() {
  document.getElementById('hunger').innerText = Math.floor(player.hunger);
  document.getElementById('thirst').innerText = Math.floor(player.thirst);
  document.getElementById('stamina').innerText = Math.floor(player.stamina);
  document.getElementById('temperature').innerText = Math.floor(player.temperature);
}

// =====================
// Game Loop
// =====================
function animate() {
  requestAnimationFrame(animate);

  // Player movement
  let dx=0, dz=0;
  if(keys['w']) dz -= player.speed;
  if(keys['s']) dz += player.speed;
  if(keys['a']) dx -= player.speed;
  if(keys['d']) dx += player.speed;

  // Stamina drain when sprinting
  if(keys['shift'] && player.stamina > 0) {
    dx *= 2; dz *= 2;
    player.stamina -= 0.2;
  } else if(player.stamina < 100) {
    player.stamina += 0.1;
  }

  player.position.x += dx * Math.cos(camera.rotation.y) - dz * Math.sin(camera.rotation.y);
  player.position.z += dz * Math.cos(camera.rotation.y) + dx * Math.sin(camera.rotation.y);

  camera.position.set(player.position.x, player.position.y, player.position.z);

  // Flashlight toggle
  flashlight.visible = player.flashlight;
  flashlight.position.set(player.position.x, player.position.y, player.position.z);
  flashlight.target.position.set(
    player.position.x + Math.sin(camera.rotation.y),
    player.position.y + Math.sin(camera.rotation.x),
    player.position.z - Math.cos(camera.rotation.y)
  );

  // Hunger/Thirst decay
  player.hunger -= 0.01;
  player.thirst -= 0.015;

  updateHUD();
  renderer.render(scene, camera);
}
animate();
