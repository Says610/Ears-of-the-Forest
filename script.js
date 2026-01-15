// =======================================================
// FULL 3D SURVIVAL HORROR GAME: EARS OF THE FOREST
// =======================================================

// -------------------- SCENE SETUP --------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05050f);
scene.fog = new THREE.FogExp2(0x05050f, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0,1.7,5);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// -------------------- LIGHTING --------------------
const ambient = new THREE.AmbientLight(0x404040,1.0);
scene.add(ambient);

const moon = new THREE.DirectionalLight(0x88aaff,0.8);
moon.position.set(30,50,30);
moon.castShadow = true;
moon.shadow.mapSize.width = 2048;
moon.shadow.mapSize.height = 2048;
scene.add(moon);

// -------------------- CONTROLS --------------------
const controls = new THREE.PointerLockControls(camera,document.body);
document.body.addEventListener("click",()=>controls.lock());

const velocity = new THREE.Vector3();
const move = {forward:false,back:false,left:false,right:false};
document.addEventListener("keydown", e=>{
  if(e.key==="w") move.forward=true;
  if(e.key==="s") move.back=true;
  if(e.key==="a") move.left=true;
  if(e.key==="d") move.right=true;
});
document.addEventListener("keyup", e=>{
  if(e.key==="w") move.forward=false;
  if(e.key==="s") move.back=false;
  if(e.key==="a") move.left=false;
  if(e.key==="d") move.right=false;
});

// -------------------- TERRAIN --------------------
const terrainSize = 300;
const groundGeo = new THREE.PlaneGeometry(terrainSize,terrainSize,128,128);
for(let i=0;i<groundGeo.attributes.position.count;i++){
  groundGeo.attributes.position.array[i*3+2] = Math.random()*2; // hills
}
groundGeo.computeVertexNormals();
const groundMat = new THREE.MeshStandardMaterial({color:0x0a1a0a});
const ground = new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;
scene.add(ground);

// PATH
const path = new THREE.Mesh(new THREE.PlaneGeometry(terrainSize,6),new THREE.MeshStandardMaterial({color:0x2b1b10}));
path.rotation.x=-Math.PI/2;
path.position.y+=0.01;
path.receiveShadow=true;
scene.add(path);

// Trees & hazards
const treeTypes=[
  {trunk:0.3,leaf:2,colorLeaf:0x0f4411},
  {trunk:0.4,leaf:3,colorLeaf:0x114411},
  {trunk:0.25,leaf:2.5,colorLeaf:0x227722}
];
for(let i=0;i<250;i++){
  const x=Math.random()*terrainSize-terrainSize/2;
  const z=Math.random()*terrainSize-terrainSize/2;
  if(Math.abs(z)<5) continue;
  const t = treeTypes[Math.floor(Math.random()*treeTypes.length)];
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(t.trunk,t.trunk*1.5,4), new THREE.MeshStandardMaterial({color:0x4b2e1e}));
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(t.leaf,5),new THREE.MeshStandardMaterial({color:t.colorLeaf}));
  trunk.position.set(x,2,z); leaves.position.set(x,6,z); leaves.rotation.y=Math.random()*Math.PI*2;
  trunk.castShadow=true; trunk.receiveShadow=true;
  leaves.castShadow=true; leaves.receiveShadow=true;
  scene.add(trunk,leaves);
}

// -------------------- FLASHLIGHT --------------------
const flashlight = new THREE.SpotLight(0xffffff,3,30,Math.PI/7,0.4);
flashlight.position.set(0,1.7,0);
flashlight.target.position.set(0,1.7,-1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);

let flashlightOn=true,battery=100;
document.addEventListener("keydown",e=>{
  if(e.key==="f"){ flashlightOn=!flashlightOn; flashlight.intensity=flashlightOn?3:0; }
});
function drainBattery(){ if(flashlightOn && battery>0) battery-=0.02; if(battery<0) battery=0; document.getElementById("battery").innerText="Flashlight: "+Math.floor(battery)+"%"; }

// -------------------- PLAYER HEALTH --------------------
let health = 100;
function takeDamage(amount){ health -= amount; if(health<0) health=0; document.getElementById("health").innerText="Health:"+Math.floor(health); if(health<=0) triggerEnding("bad"); }

// -------------------- AUDIO --------------------
const forestAudio = document.getElementById("forest"); forestAudio.volume=0.4; forestAudio.play();
const howlAudio = document.getElementById("howl");
const heartbeatAudio = document.getElementById("heartbeat"); heartbeatAudio.volume=0.3;
const creakAudio = document.getElementById("creak");
const jumpAudio = document.getElementById("jumpScare");

// -------------------- CLASSMATES --------------------
const classmates=[];
function spawnClassmate(x,z){ const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.7,1.8,0.7),new THREE.MeshStandardMaterial({color:0x8888ff})); mesh.position.set(x,0.9,z); scene.add(mesh); classmates.push({mesh,following:true}); }
function updateClassmates(){ classmates.forEach(c=>{ if(c.following) c.mesh.position.lerp(camera.position,0.002); }); }

// -------------------- WOLVES --------------------
class Wolf{
  constructor(x,z,boss=false,cave=false){
    this.loader=new THREE.GLTFLoader();
    this.boss=boss; this.health=boss?400:60; this.state="stalking"; this.mesh=null; this.mixer=null; this.attackCooldown=0; this.cave=cave;
    this.loader.load("models/animated_wolf.glb",gltf=>{
      this.mesh=gltf.scene; this.mesh.scale.set(1.5,1.5,1.5); this.mesh.position.set(x,0.75,z);
      this.mesh.traverse(c=>{ if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; }});
      scene.add(this.mesh);
      this.mixer=new THREE.AnimationMixer(this.mesh);
      gltf.animations.forEach(clip=>this.mixer.clipAction(clip).play());
    });
  }
  update(delta){
    if(!this.mesh) return;
    const dist=this.mesh.position.distanceTo(camera.position);
    switch(this.state){
      case "stalking": if(dist<20) this.state="circling"; this.mesh.position.lerp(camera.position,0.001); break;
      case "circling": this.mesh.position.x+=Math.sin(Date.now()*0.002)*0.03; this.mesh.position.z+=Math.cos(Date.now()*0.002)*0.03; if(dist<6)this.state="chasing"; break;
      case "chasing": this.mesh.position.lerp(camera.position,0.006); if(dist<2 && this.attackCooldown<=0){ takeDamage(this.boss?30:10); this.attackCooldown=120; jumpAudio.play(); } break;
    }
    if(this.attackCooldown>0) this.attackCooldown--;
    if(dist<15){ heartbeatAudio.volume=0.4; heartbeatAudio.play(); }
    if(this.mixer) this.mixer.update(delta);
  }
}
const wolves=[];
function spawnWolf(x,z,boss=false,cave=false){ wolves.push(new Wolf(x,z,boss,cave)); }

// -------------------- STORY + CUTSCENES --------------------
const dialogue=document.getElementById("dialogue");
const choices=document.getElementById("choices");
const ending=document.getElementById("ending");
const storyFlags={shortcut:false,helpedFriend:false,enteredCave:false,fearful:false,sparedWolves:false,foundSecret:true};

function speak(text,opt=[]){ dialogue.style.display="block"; dialogue.innerText=text; choices.innerHTML=""; opt.forEach(o=>{ const b=document.createElement("button"); b.innerText=o.text; b.onclick=o.action; choices.appendChild(b); }); }

function startStory(){
  speak("Wake up at the sleepover, excited for the forest trip!",[{text:"Get ready",action:()=>choosePath()}]);
}

function choosePath(){
  speak("Safe path or shortcut?",[
    {text:"Safe path",action:()=>{ storyFlags.shortcut=false; enterForest(); }},
    {text:"Shortcut",action:()=>{ storyFlags.shortcut=true; enterForest(); }}
  ]);
}

function enterForest(){
  spawnClassmate(camera.position.x+1,camera.position.z+1);
  speak("Your friends are with you. Rustling sounds nearby...",[
    {text:"Stick together",action:()=>{ storyFlags.helpedFriend=true; timedWolves(); }},
    {text:"Run ahead",action:()=>{ storyFlags.helpedFriend=false; timedWolves(); }}
  ]);
}

// TIMED WOLF EVENTS
const startTime = Date.now();
const eventsTriggered = {chase:false,surround:false,horde:false};
function timedWolves(){
  const interval = setInterval(()=>{
    const t = (Date.now()-startTime)/1000;
    if(t>180 && !eventsTriggered.chase){ spawnWolf(camera.position.x+10,camera.position.z+10); eventsTriggered.chase=true; howlAudio.play(); }
    if(t>300 && !eventsTriggered.surround){ for(let i=0;i<4;i++) spawnWolf(camera.position.x+Math.random()*10,camera.position.z+Math.random()*10); eventsTriggered.surround=true; howlAudio.play(); }
    if(t>600 && !eventsTriggered.horde){ for(let i=0;i<8;i++) spawnWolf(Math.random()*40-20,Math.random()*40-20); eventsTriggered.horde=true; clearInterval(interval); }
  },1000);
}

// ENDINGS
function triggerEnding(type){
  dialogue.style.display="none"; choices.innerHTML="";
  let text="";
  switch(type){
    case "good": text="GOOD ENDING\nYou escaped safely with your friends."; break;
    case "bad": text="BAD ENDING\nLost in the forest forever."; break;
    case "secret": text="SECRET ENDING\nThe forest spared you."; break;
    case "alternate": text="ALTERNATE ENDING\nYou survived, but your friends didn't."; break;
  }
  ending.style.display="block"; ending.innerText=text;
}

// -------------------- GAME LOOP --------------------
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  velocity.set(0,0,0);
  if(move.forward) velocity.z=-0.12;
  if(move.back) velocity.z=0.12;
  if(move.left) velocity.x=-0.12;
  if(move.right) velocity.x=0.12;
  controls.moveRight(velocity.x);
  controls.moveForward(velocity.z);

  drainBattery();
  document.getElementById("health").innerText="Health:"+Math.floor(health);
  document.getElementById("compass").innerText=Math.round(THREE.MathUtils.radToDeg(camera.rotation.y))+"°";

  wolves.forEach(w=>w.update(delta));
  updateClassmates();

  renderer.render(scene,camera);
}
animate();

// START GAME
startStory();
