// ===============================
// PART 1 — CORE RENDER SETUP
// ===============================

// Basic Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x000000, 10, 80);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.6, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights (THIS PREVENTS BLACK SCREEN)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xffffff, 0.8);
moonLight.position.set(10, 20, 10);
moonLight.castShadow = true;
scene.add(moonLight);

// Ground (NOT FLAT VISUALLY)
const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
groundGeo.rotateX(-Math.PI / 2);

for (let i = 0; i < groundGeo.attributes.position.count; i++) {
  groundGeo.attributes.position.setY(
    i,
    Math.random() * 0.4
  );
}

const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b2d1b });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.receiveShadow = true;
scene.add(ground);

// Trees (VISUAL DEPTH)
function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2),
    new THREE.MeshStandardMaterial({ color: 0x4a2f1b })
  );
  trunk.position.set(x, 1, z);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0b3d0b })
  );
  leaves.position.set(x, 2.8, z);

  trunk.castShadow = leaves.castShadow = true;
  scene.add(trunk, leaves);
}

// Scatter trees
for (let i = 0; i < 80; i++) {
  createTree(
    (Math.random() - 0.5) * 150,
    (Math.random() - 0.5) * 150
  );
}

// ===============================
// POINTER LOCK (FIRST PERSON)
// ===============================
const controls = new THREE.PointerLockControls(camera, document.body);

const startScreen = document.getElementById("startScreen");
startScreen.addEventListener("click", () => {
  controls.lock();
  startScreen.style.display = "none";
});

scene.add(controls.getObject());

// ===============================
// MOVEMENT
// ===============================
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

const velocity = new THREE.Vector3();
const speed = 6;

// ===============================
// MAIN LOOP (REQUIRED)
// ===============================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  velocity.set(0, 0, 0);

  if (keys["KeyW"]) velocity.z -= speed * delta;
  if (keys["KeyS"]) velocity.z += speed * delta;
  if (keys["KeyA"]) velocity.x -= speed * delta;
  if (keys["KeyD"]) velocity.x += speed * delta;

  controls.moveRight(velocity.x);
  controls.moveForward(velocity.z);

  renderer.render(scene, camera);
}

animate();

// Resize fix
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("GAME BOOTED SUCCESSFULLY");
