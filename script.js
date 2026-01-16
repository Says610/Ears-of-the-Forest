/* =========================================================
   EARS OF THE FOREST
   PART 1 / 20
   CORE SETUP (VISIBLE, DAYTIME, NOT GRAY)
========================================================= */

// ===============================
// BASIC VARIABLES
// ===============================
let scene, camera, renderer, clock;
let player = { health: 100 };

// ===============================
// SCENE
// ===============================
scene = new THREE.Scene();

// DAYTIME SKY COLOR (NOT DARK, NOT GRAY)
scene.background = new THREE.Color(0x9bb0b5);

// LIGHT GRAY TRANSLUCENT FOG (DAYTIME)
scene.fog = new THREE.Fog(
  0x9bb0b5, // fog color
  25,       // near
  200       // far
);

// ===============================
// CAMERA
// ===============================
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// CAMERA HEIGHT = HUMAN EYES
camera.position.set(0, 1.7, 5);
camera.lookAt(0, 1.7, 0);

// ===============================
// RENDERER
// ===============================
renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ENABLE SHADOWS
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ATTACH CANVAS
document.body.appendChild(renderer.domElement);

// ===============================
// CLOCK
// ===============================
clock = new THREE.Clock();

// ===============================
// LIGHTING (DAYTIME FOREST)
// ===============================

// SUN LIGHT
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(100, 200, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// SOFT SKY LIGHT
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

// ===============================
// GROUND (VISIBLE & REALISTIC)
// ===============================
const groundGeometry = new THREE.PlaneGeometry(
  500,
  500,
  64,
  64
);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x4f6b4f,   // forest green
  roughness: 1
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ===============================
// DEBUG OBJECT (MUST SEE THIS)
// ===============================
const debugCube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
debugCube.position.set(0, 1, -5);
debugCube.castShadow = true;
scene.add(debugCube);

// ===============================
// BASIC RENDER LOOP (TEMP)
// ===============================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ===============================
// RESIZE FIX
// ===============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===============================
// CONFIRM LOAD
// ===============================
console.log("PART 1 LOADED: Scene visible, daytime, ground rendered");

/* =========================================================
   PART 2 / 20
   FIRST PERSON CONTROLS + MOVEMENT
========================================================= */

// ===============================
// POINTER LOCK CONTROLS
// ===============================
const controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

// lock mouse on ANY click (no message, no blocker)
document.addEventListener("click", () => {
  if (!controls.isLocked) {
    controls.lock();
  }
});

// ===============================
// MOVEMENT STATE
// ===============================
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let sprinting = false;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

// ===============================
// PLAYER STATS
// ===============================
let stamina = 100;
const maxStamina = 100;

// ===============================
// KEY INPUT
// ===============================
document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyW": moveForward = true; break;
    case "KeyS": moveBackward = true; break;
    case "KeyA": moveLeft = true; break;
    case "KeyD": moveRight = true; break;
    case "ShiftLeft": sprinting = true; break;
  }
});

document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW": moveForward = false; break;
    case "KeyS": moveBackward = false; break;
    case "KeyA": moveLeft = false; break;
    case "KeyD": moveRight = false; break;
    case "ShiftLeft": sprinting = false; break;
  }
});

// ===============================
// MOVEMENT UPDATE FUNCTION
// ===============================
function updatePlayerMovement(delta) {

  // friction
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  let speed = 8;

  // sprint logic
  if (sprinting && stamina > 0) {
    speed = 14;
    stamina -= 35 * delta;
  } else {
    stamina += 20 * delta;
  }

  stamina = THREE.MathUtils.clamp(stamina, 0, maxStamina);

  if (moveForward || moveBackward)
    velocity.z -= direction.z * speed * delta;

  if (moveLeft || moveRight)
    velocity.x -= direction.x * speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  // keep player above ground
  controls.getObject().position.y = 1.7;
}

// ===============================
// STAMINA HUD UPDATE
// ===============================
const staminaDiv = document.getElementById("stamina");

function updateStaminaHUD() {
  staminaDiv.textContent = "Stamina: " + Math.round(stamina);
}

// ===============================
// INTEGRATE INTO MAIN LOOP
// ===============================
// Replace the animate() function from Part 1
// with THIS version:

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls.isLocked) {
    updatePlayerMovement(delta);
    updateStaminaHUD();
  }

  renderer.render(scene, camera);
}

// restart loop safely
renderer.setAnimationLoop(null);
animate();

// ===============================
// DEBUG CONFIRM
// ===============================
console.log("PART 2 LOADED: FPS movement & pointer lock active");
/* =========================================================
   PART 3 / 20
   PROCEDURAL FOREST + TERRAIN + CAVE
========================================================= */

// ===============================
// REMOVE DEBUG CUBE (SAFETY)
// ===============================
scene.children.forEach(obj=>{
  if(obj.geometry && obj.geometry.type==="BoxGeometry"){
    scene.remove(obj);
  }
});

// ===============================
// TERRAIN HEIGHT VARIATION
// ===============================
const groundPos = ground.geometry.attributes.position;
for (let i = 0; i < groundPos.count; i++) {
  const x = groundPos.getX(i);
  const z = groundPos.getZ(i);

  // rolling hills (gentle)
  const height =
    Math.sin(x * 0.03) * 1.5 +
    Math.cos(z * 0.03) * 1.5 +
    Math.random() * 0.5;

  groundPos.setY(i, height);
}
ground.geometry.computeVertexNormals();
ground.geometry.attributes.position.needsUpdate = true;

// ===============================
// FOREST MATERIALS
// ===============================
const treeTrunkMat = new THREE.MeshStandardMaterial({
  color: 0x4a2e1f,
  roughness: 1
});

const treeLeafMat = new THREE.MeshStandardMaterial({
  color: 0x2f5f2f,
  roughness: 0.9
});

// ===============================
// PROCEDURAL TREE FUNCTION
// ===============================
function createTree(x, z) {
  const trunkHeight = 4 + Math.random() * 3;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 6),
    treeTrunkMat
  );

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 6, 8),
    treeLeafMat
  );

  trunk.position.set(x, trunkHeight / 2, z);
  leaves.position.set(x, trunkHeight + 3, z);

  trunk.castShadow = true;
  leaves.castShadow = true;

  scene.add(trunk);
  scene.add(leaves);

  trees.push({ trunk, leaves });
}

// ===============================
// SPAWN FOREST
// ===============================
const trees = [];

for (let i = 0; i < 200; i++) {
  const x = (Math.random() - 0.5) * 400;
  const z = (Math.random() - 0.5) * 400;

  // keep center area clearer
  if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

  createTree(x, z);
}

// ===============================
// PATH GENERATION
// ===============================
const pathMat = new THREE.MeshStandardMaterial({
  color: 0x6b5a3a,
  roughness: 1
});

const path = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 300),
  pathMat
);
path.rotation.x = -Math.PI / 2;
path.position.y = 0.02;
scene.add(path);

// ===============================
// LANDMARK ROCKS
// ===============================
const rockMat = new THREE.MeshStandardMaterial({
  color: 0x555555,
  roughness: 1
});

for (let i = 0; i < 30; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1 + Math.random() * 2),
    rockMat
  );
  rock.position.set(
    (Math.random() - 0.5) * 300,
    0.5,
    (Math.random() - 0.5) * 300
  );
  rock.rotation.set(
    Math.random(),
    Math.random(),
    Math.random()
  );
  rock.castShadow = true;
  scene.add(rock);
}

// ===============================
// CAVE ENTRANCE
// ===============================
const caveMat = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 1
});

const caveEntrance = new THREE.Mesh(
  new THREE.TorusGeometry(6, 2.5, 12, 16),
  caveMat
);
caveEntrance.rotation.x = Math.PI / 2;
caveEntrance.position.set(60, 3, 60);
caveEntrance.castShadow = true;
scene.add(caveEntrance);

// dark cave interior
const caveTunnel = new THREE.Mesh(
  new THREE.CylinderGeometry(6, 6, 40, 16, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x222222,
    side: THREE.BackSide
  })
);
caveTunnel.rotation.x = Math.PI / 2;
caveTunnel.position.set(60, 3, 80);
scene.add(caveTunnel);

// ===============================
// CAVE TRIGGER ZONE
// ===============================
let inCave = false;

function checkCaveEntry() {
  const pos = controls.getObject().position;
  const dist = pos.distanceTo(new THREE.Vector3(60, 1.7, 60));

  if (dist < 8 && !inCave) {
    inCave = true;
    scene.fog.near = 5;
    scene.fog.far = 40;
    ambientLight.intensity = 0.2;
    console.log("Entered cave");
  }

  if (dist > 10 && inCave) {
    inCave = false;
    scene.fog.near = 25;
    scene.fog.far = 200;
    ambientLight.intensity = 0.45;
    console.log("Exited cave");
  }
}

// ===============================
// INTEGRATE INTO LOOP
// ===============================
// Add this call inside animate():
//
// checkCaveEntry();

// ===============================
// DEBUG CONFIRM
// ===============================
console.log("PART 3 LOADED: Forest, terrain, path, cave visible");
