// ======================================================
// EARS OF THE FOREST: 3D SURVIVAL HORROR
// WITH CINEMATIC CUTSCENES FIX
// ======================================================

// ------------------- Scene Setup -------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05050f);
scene.fog = new THREE.FogExp2(0x05050f,0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0,1.7,5);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ------------------ Lights ------------------
const ambient = new THREE.AmbientLight(0x404040,1.0);
scene.add(ambient);

const moon = new THREE.DirectionalLight(0x88aaff,0.8);
moon.position.set(30,50,30);
moon.castShadow=true;
scene.add(moon);

// ------------------ Controls ------------------
const controls = new THREE.PointerLockControls(camera,document.body);
document.body.addEventListener("click",()=>controls.lock());

const velocity = new THREE.Vector3();
const move={forward:false,back:false,left:false,right:false,sprint:false};
document.addEventListener("keydown",e=>{
  if(e.key==="w") move.forward=true;
  if(e.key==="s") move.back=true;
  if(e.key==="a") move.left=true;
  if(e.key==="d") move.right=true;
  if(e.key==="Shift") move.sprint=true;
});
document.addEventListener("keyup",e=>{
  if(e.key==="w") move.forward=false;
  if(e.key==="s") move.back=false;
  if(e.key==="a") move.left=false;
  if(e.key==="d") move.right=false;
  if(e.key==="Shift") move.sprint=false;
});

// ------------------ Terrain ------------------
const terrainSize=300;
const groundGeo=new THREE.PlaneGeometry(terrainSize,terrainSize,128,128);
for(let i=0;i<groundGeo.attributes.position.count;i++){
  groundGeo.attributes.position.array[i*3+2]=Math.random()*2; // hills
}
groundGeo.computeVertexNormals();
const groundMat=new THREE.MeshStandardMaterial({color:0x0a1a0a});
const ground=new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

// ------------------ Path ------------------
const path=new THREE.Mesh(new THREE.PlaneGeometry(terrainSize,6),new THREE.MeshStandardMaterial({color:0x2b1b10}));
path.rotation.x=-Math.PI/2; path.position.y+=0.01; path.receiveShadow=true;
scene.add(path);

// ------------------ Trees ------------------
const treeTypes=[{trunk:0.3,leaf:2,colorLeaf:0x0f4411},{trunk:0.4,leaf:3,colorLeaf:0x114411},{trunk:0.25,leaf:2.5,colorLeaf:0x227722}];
for(let i=0;i<250;i++){
  const x=Math.random()*terrainSize-terrainSize/2;
  const z=Math.random()*terrainSize-terrainSize/2;
  if(Math.abs(z)<5) continue;
  const t=treeTypes[Math.floor(Math.random()*treeTypes.length)];
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(t.trunk,t.trunk*1.5,4),new THREE.MeshStandardMaterial({color:0x4b2e1e}));
  const leaves=new THREE.Mesh(new THREE.ConeGeometry(t.leaf,5),new THREE.MeshStandardMaterial({color:t.colorLeaf}));
  trunk.position.set(x,2,z); leaves.position.set(x,6,z); leaves.rotation.y=Math.random()*Math.PI*2;
  trunk.castShadow=true; trunk.receiveShadow=true;
  leaves.castShadow=true; leaves.receiveShadow=true;
  scene.add(trunk,leaves);
}

// ------------------ Flashlight ------------------
const flashlight=new THREE.SpotLight(0xffffff,3,30,Math.PI/7,0.4);
flashlight.position.set(0,1.7,0);
flashlight.target.position.set(0,1.7,-1);
camera.add(flashlight); camera.add(flashlight.target); scene.add(camera);
let flashlightOn=true,battery=100;
document.addEventListener("keydown",e=>{ if(e.key==="f"){ flashlightOn=!flashlightOn; flashlight.intensity=flashlightOn?3:0; } });
function drainBattery(){ if(flashlightOn && battery>0) battery-=0.02; if(battery<0) battery=0; document.getElementById("battery").innerText="Flashlight: "+Math.floor(battery)+"%"; }

// ------------------ Player Health ------------------
let health=100;
function takeDamage(amount){ health-=amount; if(health<0) health=0; document.getElementById("health").innerText="Health:"+Math.floor(health); if(health<=0) triggerEnding("bad"); }

// ------------------ Audio ------------------
const forestAudio=document.getElementById("forest"); forestAudio.volume=0.4; forestAudio.play();
const howlAudio=document.getElementById("howl");
const heartbeatAudio=document.getElementById("heartbeat"); heartbeatAudio.volume=0.3;
const jumpAudio=document.getElementById("jumpScare");

// ------------------ Cutscene Camera ------------------
let cutsceneActive=false;
let cutsceneProgress=0;
function startCutscene(pathPoints, duration, callback){
  cutsceneActive=true; cutsceneProgress=0;
  function animateCutscene(delta){
    cutsceneProgress+=delta/duration;
    if(cutsceneProgress>=1){ cutsceneActive=false; if(callback)callback(); return; }
    const index=Math.floor(cutsceneProgress*(pathPoints.length-1));
    const next=index+1;
    if(next>=pathPoints.length) return;
    const p1=pathPoints[index], p2=pathPoints[next];
    camera.position.lerpVectors(p1.position,p2.position, cutsceneProgress*pathPoints.length-index);
    camera.lookAt(p2.lookAt);
  }
  renderer.setAnimationLoop(()=>{
    const delta=clock.getDelta();
    animateCutscene(delta);
    renderer.render(scene,camera);
  });
}

// ------------------ Game Loop ------------------
const clock=new THREE.Clock();
let bobTime=0;
function animate(){
  requestAnimationFrame(animate);
  const delta=clock.getDelta();
  if(!cutsceneActive){
    // Movement
    velocity.set(0,0,0);
    if(move.forward) velocity.z=-0.12*(move.sprint?2:1);
    if(move.back) velocity.z=0.12*(move.sprint?2:1);
    if(move.left) velocity.x=-0.12*(move.sprint?2:1);
    if(move.right) velocity.x=0.12*(move.sprint?2:1);
    controls.moveRight(velocity.x); controls.moveForward(velocity.z);
    // Head bob
    bobTime+=delta*10; camera.position.y=1.7+Math.sin(bobTime)*0.02;
  }
  drainBattery(); document.getElementById("health").innerText="Health:"+Math.floor(health);
  renderer.render(scene,camera);
}
animate();

// ------------------ Start Game ------------------
startCutscene([
  {position:new THREE.Vector3(0,1.7,10),lookAt:new THREE.Vector3(0,1.7,0)},
  {position:new THREE.Vector3(0,1.7,5),lookAt:new THREE.Vector3(5,1.7,0)}
], 5, ()=>{ /* after cutscene, start gameplay */ });
