// ======================
// THREE.JS SETUP
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030305);
scene.fog = new THREE.FogExp2(0x000000, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 500);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.shadowMap.enabled=true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTING
const ambient = new THREE.AmbientLight(0x202020);
scene.add(ambient);
const moon = new THREE.DirectionalLight(0x8899ff,1);
moon.position.set(30,50,30);
moon.castShadow=true;
moon.shadow.mapSize.width=2048;
moon.shadow.mapSize.height=2048;
moon.shadow.camera.near=0.1; moon.shadow.camera.far=200;
scene.add(moon);

// ======================
// FIRST-PERSON CONTROLS
// ======================
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener("click", ()=>controls.lock());

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

// ======================
// ENVIRONMENT: GROUND + PATHS + HAZARDS
// ======================
const groundGeo = new THREE.PlaneGeometry(300,300,128,128);
for(let i=0;i<groundGeo.attributes.position.count;i++){
  groundGeo.attributes.position.array[i*3+2]=Math.random()*1;
}
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo,new THREE.MeshStandardMaterial({color:0x0a1a0a}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
scene.add(ground);

// Pathway (safe)
const path = new THREE.Mesh(new THREE.PlaneGeometry(300,6), new THREE.MeshStandardMaterial({color:0x2b1b10}));
path.rotation.x=-Math.PI/2; path.position.y+=0.01; path.receiveShadow=true;
scene.add(path);

// Hazards: fallen logs, broken branches
const hazardMaterial = new THREE.MeshStandardMaterial({color:0x553322});
for(let i=0;i<20;i++){
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,4),hazardMaterial);
  log.position.set(Math.random()*260-130,0.1,Math.random()*260-130);
  log.rotation.z=Math.random()*Math.PI; log.castShadow=true; log.receiveShadow=true;
  scene.add(log);
}

// ======================
// TREES
// ======================
const treeTypes = [
  {trunk:0.3,leaf:2,colorLeaf:0x0f4411},
  {trunk:0.4,leaf:3,colorLeaf:0x114411},
  {trunk:0.25,leaf:2.5,colorLeaf:0x227722}
];
for(let i=0;i<250;i++){
  const x=Math.random()*260-130; const z=Math.random()*260-130;
  if(Math.abs(z)<5) continue;
  const t = treeTypes[Math.floor(Math.random()*treeTypes.length)];
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(t.trunk,t.trunk*1.5,4), new THREE.MeshStandardMaterial({color:0x4b2e1e}));
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(t.leaf,5), new THREE.MeshStandardMaterial({color:t.colorLeaf}));
  trunk.position.set(x,2,z); leaves.position.set(x,6,z); leaves.rotation.y=Math.random()*Math.PI*2;
  trunk.castShadow=true; trunk.receiveShadow=true;
  leaves.castShadow=true; leaves.receiveShadow=true;
  scene.add(trunk,leaves);
}

// ======================
// FLASHLIGHT + BATTERY
// ======================
const flashlight = new THREE.SpotLight(0xffffff,3,30,Math.PI/7,0.4);
flashlight.position.set(0,1.6,0); flashlight.target.position.set(0,1.6,-1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);
let flashlightOn=true, battery=100;
document.addEventListener("keydown",e=>{
  if(e.key==="f"){ flashlightOn=!flashlightOn; flashlight.intensity=flashlightOn?3:0; }
});
function drainBattery(){ if(flashlightOn && battery>0) battery-=0.02; if(battery<0) battery=0;
document.getElementById("battery").innerText="Flashlight: "+Math.floor(battery)+"%"; }

// ======================
// INVENTORY & CRAFTING
// ======================
const inventory={wood:0,scrap:0};
function updateInventory(){ document.getElementById("inventoryUI").innerText=`Wood: ${inventory.wood} | Scrap: ${inventory.scrap}`; }

// ======================
// STORY FLAGS
// ======================
const story={shortcut:false,helpedFriend:false,enteredCave:false,fearful:false};

// ======================
// WOLF CLASS (FULL ANIMATION + ATTACK)
class Wolf{
  constructor(x,z,boss=false){
    this.loader=new THREE.GLTFLoader(); this.boss=boss; this.health=boss?400:60;
    this.state="stalking"; this.fear=0; this.mixer=null; this.mesh=null;
    this.loader.load("models/animated_wolf.glb", gltf=>{
      this.mesh=gltf.scene; this.mesh.scale.set(1.5,1.5,1.5);
      this.mesh.position.set(x,0.75,z); this.mesh.traverse(c=>{ if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; }});
      scene.add(this.mesh);
      this.mixer = new THREE.AnimationMixer(this.mesh);
      gltf.animations.forEach(clip=>this.mixer.clipAction(clip).play());
    });
  }
  update(delta){
    if(!this.mesh) return;
    const dist=this.mesh.position.distanceTo(camera.position);
    // AI
    switch(this.state){
      case"stalking": if(dist<20) this.state="circling"; this.mesh.position.lerp(camera.position,0.001); break;
      case"circling": this.mesh.position.x+=Math.sin(Date.now()*0.002)*0.03; this.mesh.position.z+=Math.cos(Date.now()*0.002)*0.03; if(dist<8)this.state="chasing"; break;
      case"chasing": this.mesh.position.lerp(camera.position,0.006); if(this.health<20) this.state="retreating"; break;
      case"retreating": this.mesh.position.lerp(new THREE.Vector3(this.mesh.position.x+Math.random()*10,this.mesh.position.y,this.mesh.position.z+Math.random()*10),0.01); break;
    }
    // Fear triggers heartbeat
    if(dist<15){ story.fearful=true; heartbeatAudio.volume=0.4; heartbeatAudio.play(); }
    if(this.mixer) this.mixer.update(delta);
  }
}
const wolves=[]; function spawnWolf(x,z,boss=false){ wolves.push(new Wolf(x,z,boss)); }

// ======================
// CLASSMATE AI
const classmates=[]; function spawnClassmate(x,z){ const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.7,1.8,0.7),new THREE.MeshStandardMaterial({color:0x8888ff})); mesh.position.set(x,0.9,z); scene.add(mesh); classmates.push({mesh,following:true}); }
function updateClassmates(){ classmates.forEach(c=>{ if(c.following) c.mesh.position.lerp(camera.position,0.002); }); }

// ======================
// AUDIO
const forestAudio=document.getElementById("forest"); forestAudio.volume=0.4; forestAudio.play();
const howlAudio=document.getElementById("howl"); const heartbeatAudio=document.getElementById("heartbeat"); heartbeatAudio.volume=0.3;
const creakAudio=document.getElementById("creak"); const jumpAudio=document.getElementById("jumpScare");

// ======================
// STORY DIALOGUE TREE (5+ branching endings)
const dialogue=document.getElementById("dialogue");
const choices=document.getElementById("choices");
function speak(text,opt=[]){ dialogue.style.display="block"; dialogue.innerText=text; choices.innerHTML=""; opt.forEach(o=>{ const b=document.createElement("button"); b.innerText=o.text; b.onclick=o.action; choices.appendChild(b); }); }
function startStory(){ speak("Wake up at the sleepover, excited for the forest trip!",[{text:"Get ready",action:()=>choosePath()}]); }
function choosePath(){ speak("Path or shortcut?",[{text:"Path",action:()=>{ story.shortcut=false; enterForest(); }},{text:"Shortcut",action:()=>{ story.shortcut=true; enterForest(); }}]); }
function enterForest(){ spawnClassmate(camera.position.x+1,camera.position.z+1); speak("Your friends are with you. Suddenly rustling...",[{text:"Stick together",action:()=>{ story.helpedFriend=true; wolfEncounter(); }},{text:"Run ahead",action:()=>{ story.helpedFriend=false; wolfEncounter(); }}]); }
function wolfEncounter(){ spawnWolf(camera.position.x+5,camera.position.z+5); speak("Wolf emerges! Fight or hide?",[{text:"Fight",action:()=>{ story.sparedWolves=false; forestPath(); }},{text:"Hide",action:()=>{ story.sparedWolves=true; forestPath(); }}]); }
function forestPath(){ speak("You find a cave ahead. Enter or avoid?",[{text:"Enter",action:()=>{ story.enteredCave=true; secretEnding(); }},{text:"Avoid",action:()=>{ goodEnding(); }},{text:"Run away",action:()=>{ badEnding(); }}]); }

// ======================
// ENDINGS + CUTSCENES
const ending=document.getElementById("ending");
function cutscene(text){ dialogue.style.display="none"; choices.innerHTML=""; let t=0; ending.innerText=text; ending.style.display="block"; function animateCut(){ t++; camera.position.y+=0.01; if(t<200) requestAnimationFrame(animateCut); } animateCut(); }
function badEnding(){ cutscene("BAD ENDING\nLost in forest."); }
function goodEnding(){ cutscene("GOOD ENDING\nEscaped safely."); }
function secretEnding(){ cutscene("SECRET ENDING\nForest spared you."); }
function alternateEnding(){ cutscene("ALTERNATE ENDING\nSurvived, friends lost."); }

// ======================
// GAME LOOP
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const delta=clock.getDelta();
  // Movement
  velocity.set(0,0,0);
  if(move.forward) velocity.z=-0.12; if(move.back) velocity.z=0.12;
  if(move.left) velocity.x=-0.12; if(move.right) velocity.x=0.12;
  controls.moveRight(velocity.x); controls.moveForward(velocity.z);
  drainBattery(); document.getElementById("health").innerText="Health:100";
  document.getElementById("compass").innerText=Math.round(THREE.MathUtils.radToDeg(camera.rotation.y))+"°";
  wolves.forEach(w=>w.update(delta)); updateClassmates();
  renderer.render(scene,camera);
}
animate();

// ======================
// START GAME
startStory();
