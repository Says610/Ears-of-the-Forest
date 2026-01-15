// ======================================================
// EARS OF THE FOREST - Part 1/4
// Scene, Camera, Renderer, Lighting, Ground, Trees, Classmates, Audio, Intro Cutscene
// ======================================================

// ------------------- Global Variables -------------------
let scene, camera, renderer, clock, controls;
let health = 100, battery = 100, flashlightOn = false;
let velocity = new THREE.Vector3();
let bobTime = 0;
let cutsceneActive = false;
let wolves = [], classmates = [], boss;
let eventsTriggered = {chase:false,surround:false,horde:false};
let startTime = Date.now();
let inventory = {wood:0,stick:0,bandage:0};
let storyFlags = {};
let move = {forward:false,back:false,left:false,right:false,sprint:false};
let bossHealth = 500;

// ------------------- Audio -------------------
const forestAudio = new Audio("assets/audio/forest.mp3");
forestAudio.loop = true;
const howlAudio = new Audio("assets/audio/wolf_howl.mp3");
const jumpAudio = new Audio("assets/audio/jump_scare.mp3");

// ------------------- Dialogue -------------------
const dialogues = {
  wakingUp:[
    {text:"Hey! Are you awake? The trip starts soon!",speaker:"Friend1"},
    {text:"Yeah! I'm so excited!",speaker:"Player"},
    {text:"We need to pack our stuff!",speaker:"Friend2"},
    {text:"Let's go! We can't be late!",speaker:"Friend3"}
  ],
  forestIntro:[
    {text:"Look at these trees! They're huge.",speaker:"Friend1"},
    {text:"It's so quiet... almost too quiet.",speaker:"Friend2"},
    {text:"Keep moving. We don't want to get lost.",speaker:"Player"}
  ]
};

// ------------------- Dialogue Player -------------------
function playDialogue(sequence, callback){
  let idx = 0;
  function nextLine(){
    if(idx >= sequence.length){ if(callback) callback(); return; }
    const line = sequence[idx];
    console.log(line.speaker + ": " + line.text); // For HUD, overlay text can replace this
    idx++;
    setTimeout(nextLine,2000);
  }
  nextLine();
}

// ------------------- Initialize Scene -------------------
function init(){
  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050f,0.02);

  // Camera
  camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(0,1.7,0);

  // Renderer
  renderer = new THREE.WebGLRenderer({canvas:document.getElementById("gameCanvas"),antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);

  // Clock
  clock = new THREE.Clock();

  // Controls
  controls = new THREE.PointerLockControls(camera, document.body);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff,0.6);
  dirLight.position.set(5,10,5);
  scene.add(dirLight);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100,100),
    new THREE.MeshStandardMaterial({color:0x223322})
  );
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // Trees
  const treeGeom = new THREE.CylinderGeometry(0.3,0.5,3,8);
  const treeMat = new THREE.MeshStandardMaterial({color:0x886633});
  for(let i=0;i<15;i++){
    const tree = new THREE.Mesh(treeGeom,treeMat);
    tree.position.set(Math.random()*30-15,1.5,Math.random()*30-15);
    scene.add(tree);
  }

  // Classmates as cubes
  classmates = [];
  for(let i=0;i<3;i++){
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5,1.7,0.5),
      new THREE.MeshStandardMaterial({color:0x8888ff})
    );
    mesh.position.set(Math.random()*5-2.5,0.85,Math.random()*5-2.5);
    scene.add(mesh);
    classmates.push({mesh,fear:0,following:true});
  }

  // Lock pointer and play audio after user click
  document.body.addEventListener("click", ()=>{
    controls.lock();
    forestAudio.play();
    startIntroCutscene();
  }, {once:true});

  // Start game loop
  startGameLoop();
}

// ------------------- Intro Cutscene -------------------
function startIntroCutscene(){
  cutsceneActive = true;

  // Define camera path
  const path = [
    {pos:new THREE.Vector3(0,2,0),look:new THREE.Vector3(0,1.7,5)},
    {pos:new THREE.Vector3(2,2,3),look:new THREE.Vector3(0,1.7,8)},
    {pos:new THREE.Vector3(4,2,6),look:new THREE.Vector3(0,1.7,12)}
  ];

  let progress = 0;

  function animateCut(delta){
    progress += delta/10; // slower intro
    if(progress >= 1){ 
      cutsceneActive = false;
      playDialogue(dialogues.wakingUp); // start dialogue after cutscene
      return; 
    }
    const idx = Math.floor(progress*(path.length-1));
    const next = idx+1; if(next>=path.length) return;
    camera.position.lerpVectors(path[idx].pos, path[next].pos, (progress*path.length-idx)%1);
    camera.lookAt(path[next].look);
  }

  // Animate loop for cutscene
  renderer.setAnimationLoop(()=>{
    const delta = clock.getDelta();
    if(cutsceneActive) animateCut(delta);
    renderer.render(scene,camera);
  });
}

// ------------------- Start Game Loop -------------------
function startGameLoop(){
  function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(!cutsceneActive){
      // Movement (W/A/S/D)
      velocity.set(0,0,0);
      if(move.forward) velocity.z=-0.12;
      if(move.back) velocity.z=0.12;
      if(move.left) velocity.x=-0.12;
      if(move.right) velocity.x=0.12;

      controls.moveRight(velocity.x);
      controls.moveForward(velocity.z);

      bobTime += delta*10;
      camera.position.y = 1.7 + Math.sin(bobTime)*0.02;
    }

    renderer.render(scene,camera);
  }
  animate();
}

// ------------------- Key Listeners -------------------
document.addEventListener("keydown", e=>{
  if(e.code==="KeyW") move.forward=true;
  if(e.code==="KeyS") move.back=true;
  if(e.code==="KeyA") move.left=true;
  if(e.code==="KeyD") move.right=true;
  if(e.code==="ShiftLeft") move.sprint=true;
});
document.addEventListener("keyup", e=>{
  if(e.code==="KeyW") move.forward=false;
  if(e.code==="KeyS") move.back=false;
  if(e.code==="KeyA") move.left=false;
  if(e.code==="KeyD") move.right=false;
  if(e.code==="ShiftLeft") move.sprint=false;
});

// ------------------- Initialize Game -------------------
init();
// ======================================================
// EARS OF THE FOREST - Part 2/4
// Wolf AI, Environmental Hazards, Flashlight, Inventory, HUD
// ======================================================

// ------------------- HUD Update -------------------
function updateHUD(){
  const healthBar = document.getElementById("healthBar");
  const batteryLevel = document.getElementById("batteryLevel");
  const inventoryWood = document.getElementById("inventoryWood");
  const inventoryStick = document.getElementById("inventoryStick");
  const inventoryBandage = document.getElementById("inventoryBandage");

  if(healthBar) healthBar.style.width = health + "%";
  if(batteryLevel) batteryLevel.style.width = battery + "%";
  if(inventoryWood) inventoryWood.innerText = inventory.wood || 0;
  if(inventoryStick) inventoryStick.innerText = inventory.stick || 0;
  if(inventoryBandage) inventoryBandage.innerText = inventory.bandage || 0;
}

// ------------------- Flashlight System -------------------
document.addEventListener("keydown", e=>{
  if(e.code==="KeyF") flashlightOn = !flashlightOn;
});

function updateFlashlight(){
  if(!flashlightOn) return;
  battery = Math.max(battery - 0.05,0);
  if(battery<=0) flashlightOn=false;

  if(!scene.getObjectByName("flashlight")){
    const light = new THREE.SpotLight(0xffffff,1,10,Math.PI/6,0.1,1);
    light.name = "flashlight";
    camera.add(light);
    light.position.set(0,0,0);
    scene.add(camera);
  }
}

// ------------------- Wolf Class -------------------
class Wolf {
  constructor(x,z){
    const geometry = new THREE.ConeGeometry(0.5,1.5,8);
    const material = new THREE.MeshStandardMaterial({color:0x333333});
    this.mesh = new THREE.Mesh(geometry,material);
    this.mesh.position.set(x,0.75,z);
    this.mesh.rotation.x = Math.PI/2;
    this.state = "idle"; // idle, stalking, chasing
    this.speed = 0.02;
    scene.add(this.mesh);
  }

  update(delta){
    if(this.state === "idle"){
      // Random patrol
      this.mesh.position.x += (Math.random()-0.5)*0.01;
      this.mesh.position.z += (Math.random()-0.5)*0.01;
    } else if(this.state === "stalking" || this.state === "chasing"){
      const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
      this.mesh.position.addScaledVector(dir,this.speed*(this.state==="chasing"?2:1));
      // Attack if close
      if(this.mesh.position.distanceTo(camera.position)<1.5){
        takeDamage(10);
        jumpAudio.play();
      }
    }
  }
}

// ------------------- Spawn Wolves -------------------
function spawnWolf(x,z){
  const wolf = new Wolf(x,z);
  wolves.push(wolf);
}

// ------------------- Update Wolves -------------------
function updateWolves(delta){
  wolves.forEach(wolf => wolf.update(delta));
}

// ------------------- Environmental Hazards -------------------
class Hazard {
  constructor(x,z,type){
    const geometry = new THREE.BoxGeometry(1,0.2,1);
    const material = new THREE.MeshStandardMaterial({color:type==="pit"?0x222222:0x664422});
    this.mesh = new THREE.Mesh(geometry,material);
    this.mesh.position.set(x,0.1,z);
    this.type = type;
    scene.add(this.mesh);
  }

  checkCollision(){
    if(camera.position.distanceTo(this.mesh.position)<1){
      if(this.type==="pit") takeDamage(20);
      if(this.type==="log") takeDamage(5);
    }
  }
}

let hazards = [];
function spawnHazard(x,z,type){
  const h = new Hazard(x,z,type);
  hazards.push(h);
}
function updateHazards(){
  hazards.forEach(h=>h.checkCollision());
}

// ------------------- Inventory -------------------
function collectItem(type){
  inventory[type] = (inventory[type]||0)+1;
  console.log("Collected",type);
}

function craftItem(item){
  const requirements = {torch:["stick","wood"],bandage:["scrap","cloth"]};
  const reqs = requirements[item];
  if(reqs && reqs.every(r=>inventory[r]>0)){
    reqs.forEach(r=>inventory[r]--);
    inventory[item] = (inventory[item]||0)+1;
    console.log("Crafted",item);
  } else {
    console.log("Cannot craft",item);
  }
}

// ------------------- Player Damage -------------------
function takeDamage(amount){
  health = Math.max(health-amount,0);
  if(health<=0){
    console.log("You have died!");
    triggerEnding("bad");
  }
}

// ------------------- Example Wolf Spawns -------------------
spawnWolf(5,10);
spawnWolf(-8,-5);
spawnHazard(3,7,"pit");
spawnHazard(-5,12,"log");
spawnHazard(10,-4,"pit");

// ------------------- HUD Update Loop -------------------
setInterval(updateHUD,100);
// ======================================================
// EARS OF THE FOREST - Part 3/4
// Timed Wolf Events, Jump Scares, Secret Shrine, Story Branching, Classmate Reactions
// ======================================================

// ------------------- Timed Wolf Events -------------------
let eventsTimerStarted = false;

function startTimedEvents() {
  if(eventsTimerStarted) return;
  eventsTimerStarted = true;
  const startSec = (Date.now() - startTime)/1000;

  setInterval(()=>{
    const t = (Date.now() - startTime)/1000;

    // Single wolf chase after 3 minutes
    if(t>180 && !eventsTriggered.chase){
      console.log("Single wolf chasing!");
      spawnWolf(camera.position.x+5, camera.position.z+5);
      wolves[wolves.length-1].state = "chasing";
      eventsTriggered.chase = true;
      howlAudio.play();
    }

    // Surrounding wolves after 5 minutes
    if(t>300 && !eventsTriggered.surround){
      console.log("Wolves surrounding!");
      for(let i=0;i<4;i++){
        spawnWolf(camera.position.x + Math.random()*5-2.5, camera.position.z + Math.random()*5-2.5);
        wolves[wolves.length-1].state = "stalking";
      }
      eventsTriggered.surround = true;
      howlAudio.play();
    }

    // Horde chase after 10 minutes
    if(t>600 && !eventsTriggered.horde){
      console.log("Wolf horde attacking!");
      for(let i=0;i<8;i++){
        spawnWolf(camera.position.x + Math.random()*10-5, camera.position.z + Math.random()*10-5);
        wolves[wolves.length-1].state = "chasing";
      }
      eventsTriggered.horde = true;
      howlAudio.play();
    }

  },1000);
}

// ------------------- Jump Scares -------------------
function triggerRandomJumpScare(){
  const scarePos = new THREE.Vector3(Math.random()*30-15,0,Math.random()*30-15);
  if(camera.position.distanceTo(scarePos)<1.5){
    jumpAudio.play();
    document.body.style.backgroundColor = "#ff0000";
    setTimeout(()=>document.body.style.backgroundColor="#000000",150);
  }
}

// ------------------- Secret Shrine -------------------
let shrineSpawned = false;
function checkSecretShrine(){
  if(!shrineSpawned && camera.position.distanceTo(new THREE.Vector3(12,0,12))<2){
    console.log("You found the secret shrine!");
    storyFlags.foundSecret = true;
    shrineSpawned = true;
    triggerEnding("secret");
  }
}

// ------------------- Story Branching -------------------
function triggerStoryEvent(id){
  switch(id){
    case "shortcutTaken":
      storyFlags.shortcut = true;
      console.log("Shortcut path chosen");
      break;
    case "friendHelped":
      storyFlags.helpedFriend = true;
      break;
    case "friendLost":
      storyFlags.friendLost = true;
      break;
  }
}

// ------------------- Classmate Reactions -------------------
function updateClassmates(delta){
  classmates.forEach(c=>{
    // Increase fear if wolves nearby
    let nearbyWolves = wolves.filter(w=>w.mesh.position.distanceTo(c.mesh.position)<5);
    if(nearbyWolves.length>0) c.fear += delta*2;
    else c.fear = Math.max(c.fear - delta,0);

    // Panic movement
    if(c.fear>7){
      const rand = new THREE.Vector3(Math.random()-0.5,0,Math.random()-0.5).normalize();
      c.mesh.position.addScaledVector(rand,0.02);
    }

    // Color changes based on fear
    if(c.fear>5) c.mesh.material.color.set(0xff0000);
    else if(c.fear>2) c.mesh.material.color.set(0xffff00);
    else c.mesh.material.color.set(0x8888ff);
  });
}

// ------------------- Dialogue Triggers -------------------
function checkDialogueTriggers(){
  const distToTrees = Math.min(...scene.children.filter(obj=>obj.geometry instanceof THREE.CylinderGeometry)
    .map(tree=>tree.position.distanceTo(camera.position)));
  if(distToTrees<3 && !storyFlags.treesNoticed){
    playDialogue([{text:"These trees are huge!",speaker:"Friend1"}]);
    storyFlags.treesNoticed = true;
  }

  // Forest quiet warning
  if(!storyFlags.quietNoticed && startTime && (Date.now()-startTime)/1000>20){
    playDialogue([{text:"It's too quiet here...",speaker:"Friend2"}]);
    storyFlags.quietNoticed = true;
  }
}

// ------------------- Game Loop Extensions -------------------
function gameLoopExtensions(delta){
  startTimedEvents();
  updateWolves(delta);
  updateClassmates(delta);
  updateFlashlight();
  updateHazards();
  checkDialogueTriggers();
  checkSecretShrine();
  triggerRandomJumpScare();
}
// ======================================================
// EARS OF THE FOREST - Part 4/4
// Boss Fight, Endings, Cutscenes, Final Polish
// ======================================================

// ------------------- Boss Class -------------------
class Boss {
  constructor(x,z){
    const geometry = new THREE.CylinderGeometry(1,1.5,3,12);
    const material = new THREE.MeshStandardMaterial({color:0x660000});
    this.mesh = new THREE.Mesh(geometry,material);
    this.mesh.position.set(x,1.5,z);
    scene.add(this.mesh);
    this.state = "idle"; // idle, chasing, attacking
    this.health = 500;
    this.speed = 0.02;
  }

  update(delta){
    const dist = this.mesh.position.distanceTo(camera.position);
    if(this.state==="idle" && dist<10){
      this.state="chasing";
      console.log("Boss activated!");
      howlAudio.play();
    }
    if(this.state==="chasing"){
      const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
      this.mesh.position.addScaledVector(dir,this.speed*1.5);
      if(dist<2){
        takeDamage(30);
        jumpAudio.play();
      }
    }
  }
}

// ------------------- Spawn Boss in Cave -------------------
boss = new Boss(20,20);

// ------------------- Endings -------------------
function triggerEnding(type){
  cutsceneActive = true;
  console.log("ENDING TRIGGERED:",type);
  let path=[];
  switch(type){
    case "good":
      path.push({pos:new THREE.Vector3(0,2,0),look:new THREE.Vector3(0,1.7,10)});
      path.push({pos:new THREE.Vector3(5,2,15),look:new THREE.Vector3(0,1.7,20)});
      break;
    case "bad":
      path.push({pos:new THREE.Vector3(0,1,0),look:new THREE.Vector3(0,0,5)});
      break;
    case "alternate":
      path.push({pos:new THREE.Vector3(-5,2,0),look:new THREE.Vector3(-10,1.7,5)});
      break;
    case "secret":
      path.push({pos:new THREE.Vector3(12,3,12),look:new THREE.Vector3(15,2,15)});
      break;
  }

  let progress=0;
  function animateCut(delta){
    progress+=delta/5;
    if(progress>=1){ cutsceneActive=false; return; }
    const idx=Math.floor(progress*(path.length-1));
    const next=idx+1; if(next>=path.length) return;
    camera.position.lerpVectors(path[idx].pos,path[next].pos,progress*path.length-idx);
    camera.lookAt(path[next].look);
  }

  renderer.setAnimationLoop(()=>{
    const delta = clock.getDelta();
    if(cutsceneActive) animateCut(delta);
    renderer.render(scene,camera);
  });
}

// ------------------- Skip Cutscene -------------------
document.addEventListener("keydown", e=>{
  if(e.code==="Escape" && cutsceneActive){
    cutsceneActive=false;
    console.log("Cutscene skipped.");
  }
});

// ------------------- Final Game Loop -------------------
function startGameLoop(){
  function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(!cutsceneActive){
      // Player Movement
      velocity.set(0,0,0);
      if(move.forward) velocity.z=-0.12*(move.sprint?2:1);
      if(move.back) velocity.z=0.12*(move.sprint?2:1);
      if(move.left) velocity.x=-0.12*(move.sprint?2:1);
      if(move.right) velocity.x=0.12*(move.sprint?2:1);

      controls.moveRight(velocity.x);
      controls.moveForward(velocity.z);
      bobTime+=delta*10;
      camera.position.y=1.7+Math.sin(bobTime)*0.02;

      // Update gameplay
      updateWolves(delta);
      updateClassmates(delta);
      updateFlashlight();
      updateHazards();
      checkDialogueTriggers();
      checkSecretShrine();
      triggerRandomJumpScare();
      boss.update(delta);
      startTimedEvents();
    }

    // HUD
    updateHUD();

    // Render
    renderer.render(scene,camera);
  }
  animate();
}

// ------------------- Final Polish -------------------
function finalPolish(){
  // Fog already added in Part 1
  // Add directional shadows
  renderer.shadowMap.enabled = true;
  const dirLight = scene.children.find(o=>o.type==="DirectionalLight");
  if(dirLight){
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width=1024;
    dirLight.shadow.mapSize.height=1024;
  }

  // Ambient audio layers can be looped
  forestAudio.volume = 0.5;
}

// ------------------- Initialize Full Game -------------------
init();
finalPolish();
