/* =========================================================
   EARS OF THE FOREST
   PART 1 / 10
   Core Engine + World Rendering (DEBUG SAFE)
   ========================================================= */

/* =========================
   GLOBAL FLAGS
========================= */
const DEBUG = true;
const GAME_VERSION = "0.1.0";

/* =========================
   THREE CORE
========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f0a);
scene.fog = new THREE.Fog(0x050805, 15, 120);

/* =========================
   CAMERA
========================= */
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 1.7, 5);

/* =========================
   RENDERER
========================= */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

/* =========================
   LIGHTING (NO BLACK SCREEN)
========================= */
const ambientLight = new THREE.AmbientLight(0x889988, 0.35);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xcceeff, 0.9);
moonLight.position.set(25, 40, 10);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 150;
scene.add(moonLight);

/* =========================
   FIRST PERSON CONTROLS
========================= */
const controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const startScreen = document.getElementById("startScreen");
startScreen.addEventListener("click", () => {
  controls.lock();
  startScreen.style.display = "none";
});

/* =========================
   INPUT
========================= */
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

/* =========================
   PLAYER PHYSICS
========================= */
const player = {
  height: 1.7,
  speed: 6,
  sprint: 10,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  health: 100
};

/* =========================
   TERRAIN (NOT FLAT)
========================= */
const terrainSize = 400;
const terrainSegments = 120;

const terrainGeo = new THREE.PlaneGeometry(
  terrainSize,
  terrainSize,
  terrainSegments,
  terrainSegments
);
terrainGeo.rotateX(-Math.PI / 2);

for (let i = 0; i < terrainGeo.attributes.position.count; i++) {
  const y =
    Math.sin(i * 0.1) * 0.6 +
    Math.random() * 0.8;
  terrainGeo.attributes.position.setY(i, y);
}

terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
  color: 0x1a2f1a,
  roughness: 1,
  metalness: 0
});

const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.receiveShadow = true;
scene.add(terrain);

/* =========================
   FOREST GENERATION
========================= */
const forest = new THREE.Group();

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x4b2e1a })
  );

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x0b3d0b })
  );

  trunk.position.set(x, 1.5, z);
  leaves.position.set(x, 3.6, z);

  trunk.castShadow = true;
  leaves.castShadow = true;

  forest.add(trunk);
  forest.add(leaves);
}

for (let i = 0; i < 300; i++) {
  createTree(
    (Math.random() - 0.5) * terrainSize,
    (Math.random() - 0.5) * terrainSize
  );
}

scene.add(forest);

/* =========================
   DEBUG LANDMARK
========================= */
if (DEBUG) {
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  marker.position.set(0, 0.5, -10);
  scene.add(marker);
}

/* =========================
   MOVEMENT LOOP
========================= */
const clock = new THREE.Clock();

function updatePlayer(delta) {
  player.velocity.set(0, 0, 0);

  const moveSpeed = keys["ShiftLeft"]
    ? player.sprint
    : player.speed;

  if (keys["KeyW"]) player.velocity.z -= moveSpeed * delta;
  if (keys["KeyS"]) player.velocity.z += moveSpeed * delta;
  if (keys["KeyA"]) player.velocity.x -= moveSpeed * delta;
  if (keys["KeyD"]) player.velocity.x += moveSpeed * delta;

  controls.moveRight(player.velocity.x);
  controls.moveForward(player.velocity.z);
}

/* =========================
   MAIN LOOP
========================= */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (controls.isLocked) {
    updatePlayer(delta);
  }

  renderer.render(scene, camera);
}

animate();

/* =========================
   RESIZE FIX
========================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("EARS OF THE FOREST — PART 1 LOADED");
/* =========================================================
   PART 2 / 10
   INTRO CUTSCENE + DIALOGUE
   ========================================================= */

/* =========================
   CUTSCENE FLAGS
========================= */
let cutsceneActive = true;
let cutsceneTime = 0;

/* =========================
   DIALOGUE SYSTEM
========================= */
const dialogueSequences = [
  { speaker: "Alex", text: "Ugh… I barely slept last night." },
  { speaker: "Jamie", text: "Same. But hey, forest trip day!" },
  { speaker: "Chris", text: "This is gonna be awesome." },
  { speaker: "You", text: "Yeah… let’s get going." }
];

let dialogueIndex = 0;
let dialogueActive = false;

/* =========================
   DIALOGUE HTML
========================= */
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
dialogueBox.style.fontSize = "16px";
dialogueBox.style.display = "none";
dialogueBox.style.zIndex = "15";
document.body.appendChild(dialogueBox);

/* =========================
   PLAY DIALOGUE FUNCTION
========================= */
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

/* =========================
   CUTSCENE CAMERA PATH
========================= */
const cutscenePath = [
  { pos: new THREE.Vector3(0, 2, 8), look: new THREE.Vector3(0, 1.7, 0) },
  { pos: new THREE.Vector3(5, 2, 2), look: new THREE.Vector3(0, 1.7, -5) },
  { pos: new THREE.Vector3(0, 1.8, -5), look: new THREE.Vector3(0, 1.7, -10) }
];

const cutsceneDuration = 8; // seconds

function updateCutscene(delta) {
  if (!cutsceneActive) return;

  cutsceneTime += delta;
  const t = Math.min(cutsceneTime / cutsceneDuration, 1);

  const total = cutscenePath.length - 1;
  const idx = Math.floor(t * total);
  const lerpT = (t * total) - idx;

  if (cutscenePath[idx + 1]) {
    camera.position.lerpVectors(
      cutscenePath[idx].pos,
      cutscenePath[idx + 1].pos,
      lerpT
    );
    camera.lookAt(cutscenePath[idx + 1].look);
  }

  // End cutscene
  if (t >= 1) {
    cutsceneActive = false;
    playDialogue(dialogueSequences);
  }
}

/* =========================
   SKIP CUTSCENE KEY
========================= */
document.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && cutsceneActive) {
    cutsceneActive = false;
    playDialogue(dialogueSequences);
  }
});

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const originalAnimate = animate; // From Part 1

animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
  }

  renderer.render(scene, camera);
};

/* =========================
   AUTO START CUTSCENE
========================= */
document.body.addEventListener(
  "click",
  () => {
    cutsceneActive = true;
    cutsceneTime = 0;
  },
  { once: true }
);

console.log("PART 2 LOADED — CUTSCENE ACTIVE");
/* =========================================================
   PART 3 / 10
   FLASHLIGHT + HUD + BATTERY SYSTEM
   ========================================================= */

/* =========================
   FLASHLIGHT
========================= */
const flashlight = new THREE.SpotLight(0xffffff, 3, 50, Math.PI / 8, 0.5);
flashlight.castShadow = true;
flashlight.position.set(0, 1.6, 0);
flashlight.target.position.set(0, 1.6, -10);
camera.add(flashlight);
camera.add(flashlight.target);

let flashlightOn = false;
let flashlightBattery = 100; // percent
const batteryDrainRate = 5; // percent per 10 sec

/* =========================
   HUD ELEMENTS
========================= */
const batteryDisplay = document.getElementById("battery");
const healthDisplay = document.getElementById("health");

function updateHUD() {
  batteryDisplay.innerText = `Flashlight: ${Math.floor(flashlightBattery)}%`;
  healthDisplay.innerText = `Health: ${player.health}`;
}

/* =========================
   TOGGLE FLASHLIGHT
========================= */
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyF") {
    if (flashlightBattery > 0) {
      flashlightOn = !flashlightOn;
      flashlight.intensity = flashlightOn ? 3 : 0;
    }
  }
});

/* =========================
   BATTERY DRAIN
========================= */
function updateFlashlight(delta) {
  if (flashlightOn && flashlightBattery > 0) {
    flashlightBattery -= (batteryDrainRate / 10) * delta;
    flashlightBattery = Math.max(flashlightBattery, 0);
    if (flashlightBattery === 0) flashlightOn = false;
    flashlight.intensity = flashlightOn ? 3 : 0;
  }
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate2 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 3 LOADED — FLASHLIGHT & HUD ACTIVE");
/* =========================================================
   PART 4 / 10
   WOLVES + AI + STALKING
   ========================================================= */

/* =========================
   WOLF SETUP
========================= */
class Wolf {
  constructor(x, z) {
    // placeholder sphere
    const geom = new THREE.SphereGeometry(0.5, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, 0.5, z);
    scene.add(this.mesh);

    // AI properties
    this.state = "patrol"; // patrol, stalk, chase
    this.speed = 2; // base patrol
    this.stalkSpeed = 3;
    this.chaseSpeed = 5;
    this.target = null; // player
    this.detectionRadius = 15;
    this.chaseRadius = 25;
  }

  update(delta) {
    if (cutsceneActive || dialogueActive) return;

    const distance = this.mesh.position.distanceTo(camera.position);

    switch (this.state) {
      case "patrol":
        // wander randomly
        if (!this.target) {
          this.mesh.position.x += (Math.random() - 0.5) * delta * this.speed;
          this.mesh.position.z += (Math.random() - 0.5) * delta * this.speed;
        }

        // detect player
        if (distance < this.detectionRadius) {
          this.state = "stalk";
          this.target = camera.position.clone();
        }
        break;

      case "stalk":
        if (distance > this.chaseRadius) {
          this.state = "patrol";
          this.target = null;
        } else if (distance < 5) {
          this.state = "chase";
        } else {
          // slowly approach player
          const dir = new THREE.Vector3().subVectors(camera.position, this.mesh.position).normalize();
          this.mesh.position.add(dir.multiplyScalar(this.stalkSpeed * delta));
        }
        break;

      case "chase":
        // fast move toward player
        const dir = new THREE.Vector3().subVectors(camera.position, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.chaseSpeed * delta));

        // if close enough, “attack”
        if (distance < 1.2) {
          player.health -= 10 * delta; // damage over time
          player.health = Math.max(player.health, 0);
        }

        if (distance > this.chaseRadius * 1.2) {
          this.state = "patrol";
          this.target = null;
        }
        break;
    }
  }
}

/* =========================
   SPAWN WOLVES
========================= */
const wolves = [];

function spawnWolves() {
  for (let i = 0; i < 5; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    wolves.push(new Wolf(x, z));
  }
}

spawnWolves();

/* =========================
   WOLF UPDATE LOOP
========================= */
function updateWolves(delta) {
  wolves.forEach(wolf => wolf.update(delta));
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate4 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 4 LOADED — WOLVES ACTIVE");
/* =========================================================
   PART 5 / 10
   CLASSMATE AI + WOLF ANIMATIONS + ENVIRONMENTAL HAZARDS
   ========================================================= */

/* =========================
   CLASSMATE SETUP
========================= */
class Classmate {
  constructor(name, x, z) {
    this.name = name;

    // Placeholder capsule
    const geom = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x6699ff });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, 0.6, z);
    scene.add(this.mesh);

    // AI properties
    this.state = "idle"; // idle, follow, hide
    this.fearDistance = 12;
    this.speed = 2;
  }

  update(delta) {
    const distanceToWolf = Math.min(
      ...wolves.map(w => w.mesh.position.distanceTo(this.mesh.position))
    );

    if (distanceToWolf < this.fearDistance) {
      this.state = "hide";
    } else {
      this.state = "follow";
    }

    switch (this.state) {
      case "idle":
        break;
      case "follow":
        // move toward player
        const dir = new THREE.Vector3().subVectors(camera.position, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
        break;
      case "hide":
        // run away from nearest wolf
        const nearestWolf = wolves.reduce((a, b) =>
          a.mesh.position.distanceTo(this.mesh.position) <
          b.mesh.position.distanceTo(this.mesh.position)
            ? a
            : b
        );
        const fleeDir = new THREE.Vector3().subVectors(this.mesh.position, nearestWolf.mesh.position).normalize();
        this.mesh.position.add(fleeDir.multiplyScalar(this.speed * delta));
        break;
    }
  }
}

/* =========================
   SPAWN CLASSMATES
========================= */
const classmates = [
  new Classmate("Alex", -2, -2),
  new Classmate("Jamie", 2, -3),
  new Classmate("Chris", 0, 3)
];

/* =========================
   WOLF ANIMATION PLACEHOLDER
========================= */
wolves.forEach(wolf => {
  wolf.mesh.rotationSpeed = Math.random() * 0.5;
});

function animateWolves(delta) {
  wolves.forEach(wolf => {
    // rotate for visual effect
    wolf.mesh.rotation.y += wolf.mesh.rotationSpeed * delta;
  });
}

/* =========================
   ENVIRONMENTAL HAZARDS
========================= */
const hazards = [];
function createHazard(x, z) {
  const geom = new THREE.BoxGeometry(1, 0.5, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4b2f1b });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, 0.25, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  hazards.push(mesh);
}

for (let i = 0; i < 30; i++) {
  createHazard(
    (Math.random() - 0.5) * 80,
    (Math.random() - 0.5) * 80
  );
}

/* =========================
   UPDATE CLASSMATES
========================= */
function updateClassmates(delta) {
  classmates.forEach(cm => cm.update(delta));
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate5 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 5 LOADED — CLASSMATES & ENVIRONMENT ACTIVE");
/* =========================================================
   PART 6 / 10
   BOSS WOLF + TIMED WOLF CHASES
   ========================================================= */

/* =========================
   BOSS WOLF SETUP
========================= */
class BossWolf {
  constructor(x, z) {
    const geom = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff1111 });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(x, 1, z);
    scene.add(this.mesh);

    this.state = "idle"; // idle, chase, attack
    this.speed = 4;
    this.chaseRadius = 30;
  }

  update(delta) {
    const distance = this.mesh.position.distanceTo(camera.position);

    switch (this.state) {
      case "idle":
        // stay in cave until player gets close
        if (distance < this.chaseRadius) this.state = "chase";
        break;

      case "chase":
        // move toward player
        const dir = new THREE.Vector3().subVectors(camera.position, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed * delta));

        if (distance < 1.5) {
          player.health -= 20 * delta; // heavy damage
          player.health = Math.max(player.health, 0);
        }
        break;
    }
  }
}

// Spawn cave and boss
const bossCave = { x: 40, z: 40 }; // simple placeholder
const bossWolf = new BossWolf(bossCave.x, bossCave.z);

/* =========================
   TIMED WOLF CHASES
========================= */
let gameTime = 0; // in seconds

function updateTimedChases(delta) {
  gameTime += delta;

  // 3 min → single wolf chase
  if (gameTime > 180 && !wolves.some(w => w.chaseEvent === "3min")) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    const w = new Wolf(x, z);
    w.state = "chase";
    w.chaseEvent = "3min";
    wolves.push(w);
  }

  // 5 min → wolves surround
  if (gameTime > 300 && !wolves.some(w => w.chaseEvent === "5min")) {
    for (let i = 0; i < 3; i++) {
      const x = (Math.random() - 0.5) * 20 + camera.position.x;
      const z = (Math.random() - 0.5) * 20 + camera.position.z;
      const w = new Wolf(x, z);
      w.state = "chase";
      w.chaseEvent = "5min";
      wolves.push(w);
    }
  }

  // 10 min → horde
  if (gameTime > 600 && !wolves.some(w => w.chaseEvent === "10min")) {
    for (let i = 0; i < 10; i++) {
      const x = (Math.random() - 0.5) * 50 + camera.position.x;
      const z = (Math.random() - 0.5) * 50 + camera.position.z;
      const w = new Wolf(x, z);
      w.state = "chase";
      w.chaseEvent = "10min";
      wolves.push(w);
    }
  }
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate6 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
    updateTimedChases(delta);
    bossWolf.update(delta);
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 6 LOADED — BOSS WOLF & TIMED CHASES ACTIVE");
/* =========================================================
   PART 7 / 10
   STORY BRANCHING + DIALOGUE TREES
   ========================================================= */

/* =========================
   STORY FLAGS
========================= */
const storyFlags = {
  helpedClassmate: false,
  exploredCave: false,
  foundSecret: false,
  bossDefeated: false
};

/* =========================
   DIALOGUE CHOICES
========================= */
const dialogueChoices = [
  {
    text: "Check on Alex",
    action: () => {
      storyFlags.helpedClassmate = true;
      playDialogue([{ speaker: "Alex", text: "Thanks! I feel safer now." }]);
    }
  },
  {
    text: "Explore deeper forest",
    action: () => {
      storyFlags.exploredCave = true;
      playDialogue([{ speaker: "You", text: "Let's see what’s ahead..." }]);
    }
  },
  {
    text: "Ignore and keep moving",
    action: () => {
      playDialogue([{ speaker: "You", text: "Better keep moving…" }]);
    }
  }
];

/* =========================
   DIALOGUE CHOICES UI
========================= */
const choiceContainer = document.createElement("div");
choiceContainer.id = "choiceContainer";
choiceContainer.style.position = "absolute";
choiceContainer.style.bottom = "80px";
choiceContainer.style.left = "50%";
choiceContainer.style.transform = "translateX(-50%)";
choiceContainer.style.display = "none";
choiceContainer.style.flexDirection = "column";
choiceContainer.style.alignItems = "center";
choiceContainer.style.zIndex = "20";
document.body.appendChild(choiceContainer);

function showChoices(choices) {
  choiceContainer.innerHTML = "";
  choiceContainer.style.display = "flex";

  choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    btn.style.margin = "5px";
    btn.style.padding = "8px 16px";
    btn.style.fontSize = "14px";
    btn.onclick = () => {
      choice.action();
      choiceContainer.style.display = "none";
    };
    choiceContainer.appendChild(btn);
  });
}

/* =========================
   TRIGGER STORY EVENTS
========================= */
function checkStoryEvents() {
  // Example: first branch near start
  if (camera.position.distanceTo(new THREE.Vector3(5, 0, -5)) < 3 && !storyFlags.helpedClassmate) {
    showChoices(dialogueChoices);
  }

  // Example: secret ending trigger
  if (camera.position.distanceTo(new THREE.Vector3(50, 0, 50)) < 2 && !storyFlags.foundSecret) {
    storyFlags.foundSecret = true;
    playDialogue([{ speaker: "You", text: "A hidden path… what is this?" }]);
  }
}

/* =========================
   CHECK ENDINGS
========================= */
function checkEndings() {
  if (player.health <= 0) {
    alert("BAD ENDING: You did not survive the forest.");
    window.location.reload();
  } else if (storyFlags.bossDefeated && storyFlags.helpedClassmate) {
    alert("GOOD ENDING: You survived and your friends too!");
    window.location.reload();
  } else if (storyFlags.foundSecret) {
    alert("SECRET ENDING: You discovered the hidden forest mysteries!");
    window.location.reload();
  }
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate7 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
    updateTimedChases(delta);
    bossWolf.update(delta);
    checkStoryEvents();
    checkEndings();
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 7 LOADED — STORY BRANCHING ACTIVE");
/* =========================================================
   PART 8 / 10
   ENDING CUTSCENES + AUDIO + WOLF FEAR AI
   ========================================================= */

/* =========================
   AUDIO SETUP
========================= */
const listener = new THREE.AudioListener();
camera.add(listener);

// Ambient forest sound
const ambientSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/audio/forest_ambient.mp3', function(buffer){
  ambientSound.setBuffer(buffer);
  ambientSound.setLoop(true);
  ambientSound.setVolume(0.5);
  ambientSound.play();
});

// Wolf howls
const wolfHowl = new THREE.Audio(listener);
audioLoader.load('assets/audio/wolf_howl.mp3', function(buffer){
  wolfHowl.setBuffer(buffer);
  wolfHowl.setLoop(false);
  wolfHowl.setVolume(0.8);
});

/* =========================
   WOLF FEAR AI
========================= */
wolves.forEach(wolf => {
  wolf.fearState = false; // true if scared
});

function updateWolfFear() {
  wolves.forEach(wolf => {
    const distance = wolf.mesh.position.distanceTo(camera.position);

    // Flashlight scares wolf if player points at it
    if (flashlightOn && distance < 10) {
      wolf.fearState = true;
      wolf.state = "patrol";
    }

    // Retreat from nearest classmate if scared
    if (wolf.fearState && classmates.length) {
      const nearest = classmates.reduce((a, b) =>
        a.mesh.position.distanceTo(wolf.mesh.position) <
        b.mesh.position.distanceTo(wolf.mesh.position)
          ? a
          : b
      );
      const dir = new THREE.Vector3().subVectors(wolf.mesh.position, nearest.mesh.position).normalize();
      wolf.mesh.position.add(dir.multiplyScalar(2 * clock.getDelta()));
    }
  });
}

/* =========================
   ENDING CUTSCENES
========================= */
function playEndingCutscene(type) {
  cutsceneActive = true;

  switch(type) {
    case "good":
      playDialogue([
        { speaker: "You", text: "We made it… everyone is safe." },
        { speaker: "Alex", text: "I knew we could survive together!" }
      ]);
      break;
    case "bad":
      playDialogue([
        { speaker: "You", text: "I… didn’t make it…" }
      ]);
      break;
    case "secret":
      playDialogue([
        { speaker: "You", text: "A hidden forest secret… maybe we'll return one day." }
      ]);
      break;
  }

  // Fade out effect (simple)
  const fadeDiv = document.createElement("div");
  fadeDiv.style.position = "fixed";
  fadeDiv.style.inset = 0;
  fadeDiv.style.background = "black";
  fadeDiv.style.opacity = 0;
  fadeDiv.style.zIndex = 50;
  document.body.appendChild(fadeDiv);

  let opacity = 0;
  const fadeInterval = setInterval(() => {
    opacity += 0.01;
    fadeDiv.style.opacity = opacity;
    if(opacity >= 1) clearInterval(fadeInterval);
  }, 30);
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate8 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (cutsceneActive) {
    updateCutscene(delta);
  } else if (controls.isLocked && !dialogueActive) {
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
    updateTimedChases(delta);
    bossWolf.update(delta);
    checkStoryEvents();
    checkEndings();
    updateWolfFear();
  }

  updateHUD();
  renderer.render(scene, camera);
};

console.log("PART 8 LOADED — ENDINGS & AUDIO ACTIVE");
/* =========================================================
   PART 9 / 10
   INVENTORY + CRAFTING + SURVIVAL ITEMS
   ========================================================= */

/* =========================
   INVENTORY SETUP
========================= */
const inventory = [];
const maxInventory = 10;

// Inventory HUD
const inventoryBox = document.createElement("div");
inventoryBox.id = "inventoryBox";
inventoryBox.style.position = "absolute";
inventoryBox.style.top = "20px";
inventoryBox.style.right = "20px";
inventoryBox.style.background = "rgba(0,0,0,0.7)";
inventoryBox.style.color = "#fff";
inventoryBox.style.padding = "10px";
inventoryBox.style.fontFamily = "Arial";
inventoryBox.style.fontSize = "14px";
inventoryBox.style.zIndex = 20;
document.body.appendChild(inventoryBox);

function updateInventoryHUD() {
  inventoryBox.innerHTML = "Inventory:<br>" + inventory.join(", ");
}

/* =========================
   ITEM PICKUP
========================= */
class Item {
  constructor(name, x, z) {
    this.name = name;
    const geom = new THREE.BoxGeometry(0.4,0.4,0.4);
    const mat = new THREE.MeshStandardMaterial({color:0xffff00});
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(x,0.2,z);
    scene.add(this.mesh);
    this.picked = false;
  }

  checkPickup() {
    if(this.picked) return;
    const distance = this.mesh.position.distanceTo(camera.position);
    if(distance < 1.5) {
      if(inventory.length < maxInventory){
        inventory.push(this.name);
        this.picked = true;
        scene.remove(this.mesh);
        updateInventoryHUD();
        playDialogue([{speaker:"You",text:`Picked up ${this.name}!`}]);
      }
    }
  }
}

// Example items
const batteryPack = new Item("Battery Pack", 3, -3);
const bandage = new Item("Bandage", -2, 2);
const items = [batteryPack, bandage];

/* =========================
   CRAFTING SYSTEM
========================= */
function craftItem() {
  // Example: combine battery pack + bandage → "Survival Kit"
  if(inventory.includes("Battery Pack") && inventory.includes("Bandage")){
    inventory.splice(inventory.indexOf("Battery Pack"),1);
    inventory.splice(inventory.indexOf("Bandage"),1);
    inventory.push("Survival Kit");
    playDialogue([{speaker:"You", text:"Crafted a Survival Kit!"}]);
    updateInventoryHUD();
  } else {
    playDialogue([{speaker:"You", text:"Cannot craft anything right now."}]);
  }
}

// Craft keybind
document.addEventListener("keydown", (e)=>{
  if(e.code==="KeyC"){
    craftItem();
  }
});

/* =========================
   USE ITEMS
========================= */
document.addEventListener("keydown",(e)=>{
  if(e.code==="KeyB" && inventory.includes("Battery Pack")){
    flashlightBattery = Math.min(flashlightBattery+50,100);
    inventory.splice(inventory.indexOf("Battery Pack"),1);
    updateInventoryHUD();
    playDialogue([{speaker:"You",text:"Used Battery Pack, flashlight recharged."}]);
  }
  if(e.code==="KeyH" && inventory.includes("Bandage")){
    player.health = Math.min(player.health+30,100);
    inventory.splice(inventory.indexOf("Bandage"),1);
    updateInventoryHUD();
    playDialogue([{speaker:"You",text:"Used Bandage, health restored."}]);
  }
});

/* =========================
   CHECK ITEM PICKUP LOOP
========================= */
function updateItems(delta){
  items.forEach(item=>item.checkPickup());
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate9 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if(cutsceneActive){
    updateCutscene(delta);
  } else if(controls.isLocked && !dialogueActive){
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
    updateTimedChases(delta);
    bossWolf.update(delta);
    updateWolfFear();
    checkStoryEvents();
    checkEndings();
    updateItems(delta);
  }

  updateHUD();
  renderer.render(scene,camera);
};

console.log("PART 9 LOADED — INVENTORY & CRAFTING ACTIVE");
/* =========================================================
   PART 9 / 10
   INVENTORY + CRAFTING + SURVIVAL ITEMS
   ========================================================= */

/* =========================
   INVENTORY SETUP
========================= */
const inventory = [];
const maxInventory = 10;

// Inventory HUD
const inventoryBox = document.createElement("div");
inventoryBox.id = "inventoryBox";
inventoryBox.style.position = "absolute";
inventoryBox.style.top = "20px";
inventoryBox.style.right = "20px";
inventoryBox.style.background = "rgba(0,0,0,0.7)";
inventoryBox.style.color = "#fff";
inventoryBox.style.padding = "10px";
inventoryBox.style.fontFamily = "Arial";
inventoryBox.style.fontSize = "14px";
inventoryBox.style.zIndex = 20;
document.body.appendChild(inventoryBox);

function updateInventoryHUD() {
  inventoryBox.innerHTML = "Inventory:<br>" + inventory.join(", ");
}

/* =========================
   ITEM PICKUP
========================= */
class Item {
  constructor(name, x, z) {
    this.name = name;
    const geom = new THREE.BoxGeometry(0.4,0.4,0.4);
    const mat = new THREE.MeshStandardMaterial({color:0xffff00});
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(x,0.2,z);
    scene.add(this.mesh);
    this.picked = false;
  }

  checkPickup() {
    if(this.picked) return;
    const distance = this.mesh.position.distanceTo(camera.position);
    if(distance < 1.5) {
      if(inventory.length < maxInventory){
        inventory.push(this.name);
        this.picked = true;
        scene.remove(this.mesh);
        updateInventoryHUD();
        playDialogue([{speaker:"You",text:`Picked up ${this.name}!`}]);
      }
    }
  }
}

// Example items
const batteryPack = new Item("Battery Pack", 3, -3);
const bandage = new Item("Bandage", -2, 2);
const items = [batteryPack, bandage];

/* =========================
   CRAFTING SYSTEM
========================= */
function craftItem() {
  // Example: combine battery pack + bandage → "Survival Kit"
  if(inventory.includes("Battery Pack") && inventory.includes("Bandage")){
    inventory.splice(inventory.indexOf("Battery Pack"),1);
    inventory.splice(inventory.indexOf("Bandage"),1);
    inventory.push("Survival Kit");
    playDialogue([{speaker:"You", text:"Crafted a Survival Kit!"}]);
    updateInventoryHUD();
  } else {
    playDialogue([{speaker:"You", text:"Cannot craft anything right now."}]);
  }
}

// Craft keybind
document.addEventListener("keydown", (e)=>{
  if(e.code==="KeyC"){
    craftItem();
  }
});

/* =========================
   USE ITEMS
========================= */
document.addEventListener("keydown",(e)=>{
  if(e.code==="KeyB" && inventory.includes("Battery Pack")){
    flashlightBattery = Math.min(flashlightBattery+50,100);
    inventory.splice(inventory.indexOf("Battery Pack"),1);
    updateInventoryHUD();
    playDialogue([{speaker:"You",text:"Used Battery Pack, flashlight recharged."}]);
  }
  if(e.code==="KeyH" && inventory.includes("Bandage")){
    player.health = Math.min(player.health+30,100);
    inventory.splice(inventory.indexOf("Bandage"),1);
    updateInventoryHUD();
    playDialogue([{speaker:"You",text:"Used Bandage, health restored."}]);
  }
});

/* =========================
   CHECK ITEM PICKUP LOOP
========================= */
function updateItems(delta){
  items.forEach(item=>item.checkPickup());
}

/* =========================
   HOOK INTO MAIN LOOP
========================= */
const previousAnimate9 = animate;
animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if(cutsceneActive){
    updateCutscene(delta);
  } else if(controls.isLocked && !dialogueActive){
    updatePlayer(delta);
    updateFlashlight(delta);
    updateWolves(delta);
    animateWolves(delta);
    updateClassmates(delta);
    updateTimedChases(delta);
    bossWolf.update(delta);
    updateWolfFear();
    checkStoryEvents();
    checkEndings();
    updateItems(delta);
  }

  updateHUD();
  renderer.render(scene,camera);
};

console.log("PART 9 LOADED — INVENTORY & CRAFTING ACTIVE");
