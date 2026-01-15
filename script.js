// =====================
// SCENE SETUP
// =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0b);
scene.fog = new THREE.Fog(0x000000, 10, 90);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,2,6);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =====================
// LIGHTING
// =====================
scene.add(new THREE.AmbientLight(0x444444));
const moon = new THREE.DirectionalLight(0xaaaaff, 1);
moon.position.set(20,40,20);
scene.add(moon);

// =====================
// GROUND + TREES
// =====================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300,300),
  new THREE.MeshStandardMaterial({color:0x1f331f})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

function tree(x,z){
  const t = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3,0.6,4),
    new THREE.MeshStandardMaterial({color:0x553311})
  );
  t.position.set(x,2,z);

  const l = new THREE.Mesh(
    new THREE.ConeGeometry(2,5),
    new THREE.MeshStandardMaterial({color:0x0f4411})
  );
  l.position.set(x,6,z);
  scene.add(t,l);
}

for(let i=0;i<100;i++){
  tree(Math.random()*260-130, Math.random()*260-130);
}

// =====================
// PLAYER
// =====================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1,2,1),
  new THREE.MeshStandardMaterial({color:0x3366ff})
);
player.position.y = 1;
scene.add(player);

let health = 100;
let weapon = "Rifle";
let sparedWolves = true;

// =====================
// DIALOGUE
// =====================
const dialogue = document.getElementById("dialogue");
const choices = document.getElementById("choices");

function speak(text, opts=[]){
  dialogue.style.display = "block";
  dialogue.innerText = text;
  choices.innerHTML = "";

  opts.forEach(o=>{
    const b=document.createElement("button");
    b.innerText=o.text;
    b.onclick=o.action;
    choices.appendChild(b);
  });
}

speak(
  "We weren't supposed to wander this far...",
  [{text:"Continue", action:()=>dialogue.style.display="none"}]
);

// =====================
// WOLVES + BOSS
// =====================
const wolves = [];

function spawnWolf(x,z,boss=false){
  const w = new THREE.Mesh(
    new THREE.BoxGeometry(boss?4:2,1.5,1),
    new THREE.MeshStandardMaterial({color:boss?0x880000:0x552222})
  );
  w.position.set(x,0.75,z);
  w.health = boss?400:60;
  w.boss = boss;
  scene.add(w);
  wolves.push(w);
}

for(let i=0;i<6;i++) spawnWolf(Math.random()*40-20,Math.random()*40-20);
spawnWolf(0,-70,true);

// =====================
// CONTROLS
// =====================
const keys = {};
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

// =====================
// WEAPONS + SOUND
// =====================
const shotSound = document.getElementById("shot");
const growl = document.getElementById("growl");

document.addEventListener("click",()=>{
  shotSound.play();
  wolves.forEach(w=>{
    if(player.position.distanceTo(w.position)<8){
      w.health -= 25;
      sparedWolves = false;
      if(w.health<=0){
        scene.remove(w);
        wolves.splice(wolves.indexOf(w),1);
      }
    }
  });
});

// =====================
// AI + GAME LOGIC
// =====================
function update(){
  // Movement
  if(keys["w"]) player.position.z -= 0.15;
  if(keys["s"]) player.position.z += 0.15;
  if(keys["a"]) player.position.x -= 0.15;
  if(keys["d"]) player.position.x += 0.15;

  camera.position.lerp(
    new THREE.Vector3(player.position.x,2,player.position.z+6),
    0.1
  );
  camera.lookAt(player.position);

  // Wolves
  wolves.forEach(w=>{
    w.lookAt(player.position);
    w.position.lerp(player.position, w.boss?0.006:0.004);

    if(player.position.distanceTo(w.position)<1.5){
      growl.play();
      health -= w.boss?1.2:0.6;
      document.getElementById("health").innerText="Health: "+Math.floor(health);
      if(health<=0) end("bad");
    }
  });

  // Endings
  if(wolves.length===0) end("good");
  if(player.position.z<-120 && sparedWolves) end("secret");
}

// =====================
// ENDINGS
// =====================
const ending = document.getElementById("ending");

function end(type){
  ending.style.display="block";
  if(type==="bad") ending.innerText="BAD ENDING\nLost to the forest.";
  if(type==="good") ending.innerText="GOOD ENDING\nYou escaped together.";
  if(type==="secret") ending.innerText="SECRET ENDING\nThe forest spared you.";
}

// =====================
// LOOP + RESIZE
// =====================
function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene,camera);
}
animate();

window.addEventListener("resize",()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
