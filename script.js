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
