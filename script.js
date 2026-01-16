// ======================================================
// Ears of the Forest - Part 1/10
// Core setup: scene, camera, renderer, lighting, ground, trees, fog, first-person
// ======================================================

// Global variables
let scene, camera, renderer, clock, controls;
let startTime = Date.now();
let cutsceneActive = false;

// ------------------- Init Scene -------------------
function initPart1() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050f);
  scene.fog = new THREE.FogExp2(0x05050f, 0.02);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.7, 5); // Start above ground

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("gameCanvas"),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Clock for delta
  clock = new THREE.Clock();

  // ------------------- Lighting -------------------
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // ------------------- Ground -------------------
  const groundGeom = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x223322 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ------------------- Trees -------------------
  const treeGeom = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x886633 });
  for (let i = 0; i < 20; i++) {
    const tree = new THREE.Mesh(treeGeom, treeMat);
    tree.position.set(Math.random() * 40 - 20, 1.5, Math.random() * 40 - 20);
    tree.castShadow = true;
    scene.add(tree);
  }

  // ------------------- First-Person Controls -------------------
  controls = new THREE.PointerLockControls(camera, document.body);

  // Unlock pointer & start game on click
  document.body.addEventListener(
    "click",
    () => {
      controls.lock();
      startTime = Date.now();
    },
    { once: true }
  );

  // ------------------- Resize Handler -------------------
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log("Part 1 initialized: scene, camera, renderer, lighting, ground, trees, controls.");
}

// ------------------- Animate (basic for Part 1) -------------------
function animatePart1() {
  requestAnimationFrame(animatePart1);
  const delta = clock.getDelta();

  // Render scene
  renderer.render(scene, camera);
}

// ------------------- Initialize Part 1 -------------------
initPart1();
animatePart1();
// ======================================================
// Part 2/10 – Intro Cutscene + Dialogue System
// ======================================================

// ------------------- Dialogue Data -------------------
const dialogueSequences = {
  intro: [
    { speaker: "Alex", text: "Ugh… I barely slept last night." },
    { speaker: "Jamie", text: "Same. But hey, forest trip day!" },
    { speaker: "Chris", text: "This is gonna be awesome." },
    { speaker: "You", text: "Yeah… let’s get going." }
  ]
};

let dialogueIndex = 0;
let dialogueActive = false;

// ------------------- Dialogue Display -------------------
const dialogueBox = document.createElement("div");
dialogueBox.id = "dialogueBox";
dialogueBox.style.position = "absolute";
dialogueBox.style.bottom = "20px";
dialogueBox.style.left = "50%";
dialogueBox.style.transform = "translateX(-50%)";
dialogueBox.style.padding = "10px 20px";
dialogueBox.style.background = "rgba(0,0,0,0.7)";
dialogueBox.style.color = "#fff";
dialogueBox.style.fontFamily = "Arial";
dialogueBox.style.display = "none";
document.body.appendChild(dialogueBox);

function playDialogue(sequence, onFinish) {
  dialogueActive = true;
  dialogueIndex = 0;
  dialogueBox.style.display = "block";

  function nextLine() {
    if (dialogueIndex >= sequence.length) {
      dialogueBox.style.display = "none";
      dialogueActive = false;
      if (onFinish) onFinish();
      return;
    }
    const line = sequence[dialogueIndex];
    dialogueBox.innerText = `${line.speaker}: ${line.text}`;
    dialogueIndex++;
    setTimeout(nextLine, 2500);
  }

  nextLine();
}

// ------------------- Intro Cutscene -------------------
let introCutscene = {
  active: false,
  time: 0,
  duration: 10,
  path: [
    { pos: new THREE.Vector3(0, 2, 8), look: new THREE.Vector3(0, 1.7, 0) },
    { pos: new THREE.Vector3(2, 2, 5), look: new THREE.Vector3(0, 1.7, -5) },
    { pos: new THREE.Vector3(0, 1.7, 2), look: new THREE.Vector3(0, 1.7, -10) }
  ]
};

// ------------------- Start Cutscene -------------------
function startIntroCutscene() {
  introCutscene.active = true;
  introCutscene.time = 0;
  cutsceneActive = true;

  // Safety reset
  camera.position.set(0, 2, 8);
  camera.lookAt(0, 1.7, 0);

  console.log("Intro cutscene started.");
}

// ------------------- Update Cutscene -------------------
function updateIntroCutscene(delta) {
  if (!introCutscene.active) return;

  introCutscene.time += delta;
  const t = Math.min(introCutscene.time / introCutscene.duration, 1);

  const path = introCutscene.path;
  const total = path.length - 1;
  const idx = Math.floor(t * total);
  const lerpT = (t * total) - idx;

  if (path[idx + 1]) {
    camera.position.lerpVectors(
      path[idx].pos,
      path[idx + 1].pos,
      lerpT
    );
    camera.lookAt(path[idx + 1].look);
  }

  // End cutscene
  if (t >= 1) {
    introCutscene.active = false;
    cutsceneActive = false;
    playDialogue(dialogueSequences.intro);
    console.log("Intro cutscene ended.");
  }
}

// ------------------- Skip Cutscene -------------------
document.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && introCutscene.active) {
    introCutscene.active = false;
    cutsceneActive = false;
    playDialogue(dialogueSequences.intro);
    console.log("Intro cutscene skipped.");
  }
});

// ------------------- Hook into Main Loop -------------------
// This safely extends Part 1's animation loop
const originalAnimatePart1 = animatePart1;
animatePart1 = function () {
  requestAnimationFrame(animatePart1);
  const delta = clock.getDelta();

  if (introCutscene.active) {
    updateIntroCutscene(delta);
  }

  renderer.render(scene, camera);
};

// ------------------- Auto-start Cutscene After Click -------------------
document.body.addEventListener(
  "click",
  () => {
    startIntroCutscene();
  },
  { once: true }
);
// ======================================================
// Part 3/10 – Player Movement System
// ======================================================

// ------------------- Player State -------------------
const player = {
  speed: 3.5,
  sprintMultiplier: 1.8,
  velocity: new THREE.Vector3(),
  bobTime: 0
};

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false
};

// ------------------- Input -------------------
document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyW": movement.forward = true; break;
    case "KeyS": movement.backward = true; break;
    case "KeyA": movement.left = true; break;
    case "KeyD": movement.right = true; break;
    case "ShiftLeft": movement.sprint = true; break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW": movement.forward = false; break;
    case "KeyS": movement.backward = false; break;
    case "KeyA": movement.left = false; break;
    case "KeyD": movement.right = false; break;
    case "ShiftLeft": movement.sprint = false; break;
  }
});

// ------------------- Movement Update -------------------
function updatePlayerMovement(delta) {
  if (cutsceneActive || dialogueActive) return;
  if (!controls.isLocked) return;

  player.velocity.set(0, 0, 0);

  const speed =
    player.speed *
    (movement.sprint ? player.sprintMultiplier : 1);

  if (movement.forward) player.velocity.z -= speed;
  if (movement.backward) player.velocity.z += speed;
  if (movement.left) player.velocity.x -= speed;
  if (movement.right) player.velocity.x += speed;

  controls.moveRight(player.velocity.x * delta);
  controls.moveForward(player.velocity.z * delta);

  // Head bob
  const moving =
    movement.forward ||
    movement.backward ||
    movement.left ||
    movement.right;

  if (moving) {
    player.bobTime += delta * 8;
    camera.position.y =
      1.7 + Math.sin(player.bobTime) * 0.04;
  } else {
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      1.7,
      delta * 10
    );
  }
}

// ------------------- Hook Into Main Loop -------------------
const previousAnimate = animatePart1;
animatePart1 = function () {
  requestAnimationFrame(animatePart1);
  const delta = clock.getDelta();

  if (introCutscene.active) {
    updateIntroCutscene(delta);
  } else {
    updatePlayerMovement(delta);
  }

  renderer.render(scene, camera);
};

