// ======================
// SCENE SETUP
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x000000, 10, 90);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x404040));
const moon = new THREE.DirectionalLight(0x8899ff, 1);
moon.position.set(30,50,30);
scene.add(moon);

// ======================
// GROUND + PATHS
// ======================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300,300,32,32),
  new THREE.MeshStandardMaterial({ color: 0x1f331f })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

const path = new THREE.Mesh(
  new THREE.PlaneGeometry(300,8),
  new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
);
path.rotation.x = -Math.PI/2;
scene.add(path);

// ======================
// TREES (VARIED)
// ======================
function tree(x,z){
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3,0.5,4),
    new THREE.MeshStandardMaterial({ color: 0x4b2e1e })
  );
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2,5),
    new THREE.MeshStandardMaterial({ color: 0x0f4411 })
  );
  const s = Math.random()*0.5+0.8;
  trunk.scale.set(s,s,s);
  leaves.scale.set(s,s,s);
  trunk.position.set(x,2,z);
  leaves.position.set(x,6,z);
  leaves.rotation.y = Math.random()*Math.PI*2;
  scene.add(trunk,leaves);
}
for(let i=0;i<120;i++){
  const x=Math.random()*260-130;
  const z=Math.random()*260-130;
  if(Math.abs(z)<5) continue; // path clear
  tree(x,z);
}

// ======================
// PLAYER (FIRST-PERSON)
// ======================
const player = new THREE.Object3D();
scene.add(player);

let yaw = 0;
document.body.addEventListener("click",()=>document.body.requestPointerLock());
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement){
    yaw -= e.movementX*0.002;
    camera.rotation.y=yaw;
  }
});

// ======================
// FLASHLIGHT + BATTERY
// ======================
const flashlight=new THREE.SpotLight(0xffffff,3,30,Math.PI/7,0.4);
flashlight.position.set(0,1.6,0);
flashlight.target.position.set(0,1.6,-1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);

let flashlightOn=true; let battery=100;
document.addEventListener("keydown",e=>{
  if(e.key==="f"){
    flashlightOn=!flashlightOn;
    flashlight.intensity=flashlightOn?3:0;
  }
});

// battery drain
function drainBattery(){
  if(flashlightOn && battery>0){ battery-=0.02; }
  if(battery<0) battery=0;
  document.getElementById("battery").innerText="Flashlight: "+Math.floor(battery)+"%";
}

// ======================
// INVENTORY & CRAFTING
// ======================
const inventory={wood:0,scrap:0};
const recipes={spear:{wood:3},medkit:{scrap:2}};
function updateInventory(){
  document.getElementById("inventoryUI").innerText=
    `Wood: ${inventory.wood} | Scrap: ${inventory.scrap}`;
}
function craft(item){
  const cost=recipes[item]; if(!cost) return false;
  for(let k in cost) if(inventory[k]<cost[k]) return false;
  for(let k in cost) inventory[k]-=cost[k];
  updateInventory(); return true;
}

// ======================
// STORY FLAGS
// ======================
const story={sparedWolves:true,helpedFriend:false,enteredCaveAlone:false};

// ======================
// WOLF CLASS
// ======================
class Wolf {
  constructor(x,z,boss=false){
    this.loader=new THREE.GLTFLoader();
    this.boss=boss;
    this.health=boss?400:60;
    this.state="stalking"; this.fear=0;
    this.loader.load("models/wolf.glb",gltf=>{
      this.mesh=gltf.scene; this.mesh.scale.set(1.5,1.5,1.5);
      this.mesh.position.set(x,0.75,z);
      scene.add(this.mesh);
    });
  }
  update(){
    if(!this.mesh) return;
    const dist=this.mesh.position.distanceTo(player.position);
    switch(this.state){
      case"stalking": if(dist<20) this.state="circling"; this.mesh.position.lerp(player.position,0.001); break;
      case"circling": this.mesh.position.x+=Math.sin(Date.now()*0.002)*0.03;
                       this.mesh.position.z+=Math.cos(Date.now()*0.002)*0.03;
                       if(dist<8) this.state="chasing"; break;
      case"chasing": this.mesh.position.lerp(player.position,0.006);
                      if(this.health<20) this.state="retreating"; break;
      case"retreating": this.mesh.position.lerp(new THREE.Vector3(this.mesh.position.x+Math.random()*10,this.mesh.position.y,this.mesh.position.z+Math.random()*10),0.01); break;
    }
  }
}

// ======================
// SPAWN WOLVES
// ======================
const wolves=[];
function spawnWolf(x,z,boss=false){
  const w=new Wolf(x,z,boss); wolves.push(w);
}

// ======================
// TIMED EVENTS
// ======================
const events={chase:false,surround:false,horde:false};
const startTime=Date.now();

function timedEvents(){
  const t=(Date.now()-startTime)/1000;
  if(t>180&&!events.chase){ spawnWolf(player.position.x+10,player.position.z+10); events.chase=true; }
  if(t>300&&!events.surround){ for(let i=0;i<4;i++) spawnWolf(player.position.x+Math.random()*10,player.position.z+Math.random()*10); events.surround=true; }
  if(t>600&&!events.horde){ for(let i=0;i<8;i++) spawnWolf(Math.random()*40-20,Math.random()*40-20); events.horde=true; }
}

// ======================
// CLASSMATE AI
// ======================
const classmates=[];
function spawnClassmate(x,z){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.7,1.8,0.7),new THREE.MeshStandardMaterial({color:0x8888ff}));
  mesh.position.set(x,0.9,z); scene.add(mesh);
  classmates.push({mesh:mesh,following:true});
}
function updateClassmates(){
  classmates.forEach(c=>{
    if(c.following) c.mesh.position.lerp(player.position,0.002);
  });
}

// ======================
// AUDIO
// ======================
const forestAudio=document.getElementById("forest");
forestAudio.volume=0.4; forestAudio.play();
const howlAudio=document.getElementById("howl");
const shotAudio=document.getElementById("shot");

// ======================
// PLAYER MOVEMENT
// ======================
const keys={};
addEventListener("keydown",e=>keys[e.key]=true);
addEventListener("keyup",e=>keys[e.key]=false);

// ======================
// DIALOGUE TREE
// ======================
const dialogue=document.getElementById("dialogue");
const choices=document.getElementById("choices");
function speak(text,opts=[]){
  dialogue.style.display="block"; dialogue.innerText=text;
  choices.innerHTML="";
  opts.forEach(o=>{ const b=document.createElement("button"); b.innerText=o.text; b.onclick=o.action; choices.appendChild(b); });
}

// ======================
// ENDINGS
// ======================
const ending=document.getElementById("ending");
function end(type){
  ending.style.display="block";
  if(type==="bad") ending.innerText="BAD ENDING\nLost to the forest.";
  if(type==="good") ending.innerText="GOOD ENDING\nYou escaped.";
  if(type==="secret") ending.innerText="SECRET ENDING\nThe forest spared you.";
}

// ======================
// GAME LOOP
// ======================
function update(){
  // Movement
  const speed=0.12;
  if(keys.w) player.position.z-=speed;
  if(keys.s) player.position.z+=speed;
  if(keys.a) player.position.x-=speed;
  if(keys.d) player.position.x+=speed;

  camera.position.set(player.position.x,1.6,player.position.z);

  // Compass
  document.getElementById("compass").innerText=Math.round(THREE.MathUtils.radToDeg(yaw))+"°";

  // Flashlight drain
  drainBattery();

  // Timed wolf events
  timedEvents();

  // Update wolves
  wolves.forEach(w=>w.update());

  // Update classmates
  updateClassmates();
}

function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// ======================
// ASSET LINKS (FREE)
// ======================
// Wolves: https://sketchfab.com/3d-models/wolf-low-poly-animated
// Trees/Rocks: https://kenney.nl/assets/kenney-game-assets-1
// Forest sounds: https://pixabay.com/sound-effects/forest/
// Wolf howl: https://pixabay.com/sound-effects/wolf-howl/
// Gun shot: https://pixabay.com/sound-effects/gunshot/
