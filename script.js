/* =========================================================
   EARS OF THE FOREST - FULL DEBUGGED SCRIPT
   ========================================================= */

/* =========================
   BASIC SETUP
========================= */
let scene, camera, renderer, clock, controls;
let flashlightOn = true;
let flashlightBattery = 100;
let cutsceneActive = false;
let dialogueActive = false;
let player = { health: 100 };

scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a); // dark forest
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);

camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

clock = new THREE.Clock();

/* =========================
   LIGHTS
========================= */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 50, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

/* =========================
   POINTER LOCK (FIRST PERSON)
========================= */
controls = new THREE.PointerLockControls(camera, document.body);
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', ()=>{
    controls.lock();
});

controls.addEventListener('lock', ()=>{
    instructions.style.display = 'none';
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', ()=>{
    blocker.style.display = 'block';
    instructions.style.display = '';
});

scene.add(controls.getObject());

/* =========================
   GROUND
========================= */
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color:0x004400 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

/* =========================
   TREES
========================= */
const trees = [];
for(let i=0;i<50;i++){
    const geom = new THREE.CylinderGeometry(0.3,0.5,5,8);
    const mat = new THREE.MeshStandardMaterial({color:0x3a2b1f});
    const tree = new THREE.Mesh(geom, mat);
    tree.position.set((Math.random()-0.5)*100,2.5,(Math.random()-0.5)*100);
    tree.castShadow = true;
    scene.add(tree);
    trees.push(tree);
}

/* =========================
   CLASSMATES
========================= */
class Classmate{
    constructor(name,x,z){
        const geom = new THREE.CapsuleGeometry(0.3,1.2,4,8);
        const mat = new THREE.MeshStandardMaterial({color:0x6699ff});
        this.mesh = new THREE.Mesh(geom,mat);
        this.mesh.position.set(x,0.6,z);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
        this.name = name;
        this.state = "idle";
        this.speed = 2;
        this.fearDistance = 12;
    }
    update(delta){
        const distanceToWolf = Math.min(...wolves.map(w=>w.mesh.position.distanceTo(this.mesh.position)));
        this.state = distanceToWolf < this.fearDistance ? "hide":"follow";
        switch(this.state){
            case "follow":
                const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
                this.mesh.position.add(dir.multiplyScalar(this.speed*delta));
                break;
            case "hide":
                const nearestWolf = wolves.reduce((a,b)=>a.mesh.position.distanceTo(this.mesh.position)<b.mesh.position.distanceTo(this.mesh.position)?a:b);
                const fleeDir = new THREE.Vector3().subVectors(this.mesh.position,nearestWolf.mesh.position).normalize();
                this.mesh.position.add(fleeDir.multiplyScalar(this.speed*delta));
                break;
        }
    }
}
const classmates = [
    new Classmate("Alex",-2,-2),
    new Classmate("Jamie",2,-3),
    new Classmate("Chris",0,3)
];

/* =========================
   WOLVES
========================= */
class Wolf{
    constructor(x,z){
        const geom = new THREE.SphereGeometry(0.5,16,16);
        const mat = new THREE.MeshStandardMaterial({color:0xff0000});
        this.mesh = new THREE.Mesh(geom,mat);
        this.mesh.position.set(x,0.5,z);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
        this.state = "idle";
        this.fearState = false;
        this.chaseEvent = null;
        this.rotationSpeed = Math.random()*0.5;
    }
    update(delta){
        if(this.state==="chase"){
            const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(2*delta));
            if(this.mesh.position.distanceTo(camera.position)<1.5){
                player.health -= 10*delta;
                player.health = Math.max(player.health,0);
            }
        }
    }
}
const wolves = [];
function animateWolves(delta){ wolves.forEach(w=>{ w.mesh.rotation.y += w.rotationSpeed*delta; }); }

/* =========================
   ITEMS
========================= */
class Item{
    constructor(name,x,z){
        this.name = name;
        const geom = new THREE.BoxGeometry(0.4,0.4,0.4);
        const mat = new THREE.MeshStandardMaterial({color:0xffff00});
        this.mesh = new THREE.Mesh(geom,mat);
        this.mesh.position.set(x,0.2,z);
        scene.add(this.mesh);
        this.picked = false;
    }
    checkPickup(){
        if(this.picked) return;
        if(this.mesh.position.distanceTo(camera.position)<1.5){
            if(inventory.length<10){
                inventory.push(this.name);
                this.picked = true;
                scene.remove(this.mesh);
                updateInventoryHUD();
            }
        }
    }
}
const batteryPack = new Item("Battery Pack",3,-3);
const bandage = new Item("Bandage",-2,2);
const items = [batteryPack,bandage];
const inventory = [];

/* =========================
   FLASHLIGHT
========================= */
function updateFlashlight(delta){
    if(flashlightOn) flashlightBattery = Math.max(flashlightBattery-delta*2,0);
}

/* =========================
   TIMED WOLVES
========================= */
let gameTime=0;
function updateTimedChases(delta){
    gameTime+=delta;
    if(gameTime>180&&!wolves.some(w=>w.chaseEvent==="3min")){
        wolves.push(new Wolf((Math.random()-0.5)*80,(Math.random()-0.5)*80));
        wolves[wolves.length-1].chaseEvent="3min";
    }
    if(gameTime>300&&!wolves.some(w=>w.chaseEvent==="5min")){
        for(let i=0;i<3;i++){
            const x=(Math.random()-0.5)*20+camera.position.x;
            const z=(Math.random()-0.5)*20+camera.position.z;
            const w=new Wolf(x,z);
            w.chaseEvent="5min";
            wolves.push(w);
        }
    }
    if(gameTime>600&&!wolves.some(w=>w.chaseEvent==="10min")){
        for(let i=0;i<10;i++){
            const x=(Math.random()-0.5)*50+camera.position.x;
            const z=(Math.random()-0.5)*50+camera.position.z;
            const w=new Wolf(x,z);
            w.chaseEvent="10min";
            wolves.push(w);
        }
    }
}

/* =========================
   BOSS WOLF IN CAVE
========================= */
const bossCave = {x:40,z:40};
const bossWolf = new Wolf(bossCave.x,bossCave.z);
bossWolf.state="idle";
bossWolf.speed=4;
bossWolf.chaseRadius=30;
bossWolf.update = function(delta){
    const distance = this.mesh.position.distanceTo(camera.position);
    if(distance<this.chaseRadius) this.state="chase";
    if(this.state==="chase"&&distance<1.5){
        player.health -= 20*delta;
        player.health = Math.max(player.health,0);
    }
};

/* =========================
   HUD
========================= */
const healthDiv = document.getElementById("health");
const batteryDiv = document.getElementById("battery");
function updateHUD(){
    healthDiv.innerText=`Health: ${Math.round(player.health)}`;
    batteryDiv.innerText=`Flashlight: ${Math.round(flashlightBattery)}%`;
}

/* =========================
   ITEMS & INVENTORY HUD
========================= */
const inventoryBox = document.getElementById("inventoryBox");
function updateInventoryHUD(){ inventoryBox.innerHTML="Inventory: "+inventory.join(", "); }
function updateItems(delta){ items.forEach(i=>i.checkPickup()); }

/* =========================
   MAIN LOOP
========================= */
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(cutsceneActive){
        // placeholder cutscene update
    } else if(controls.isLocked && !dialogueActive){
        updateFlashlight(delta);
        animateWolves(delta);
        wolves.forEach(w=>w.update(delta));
        classmates.forEach(c=>c.update(delta));
        updateTimedChases(delta);
        bossWolf.update(delta);
        updateItems(delta);
    }

    updateHUD();
    renderer.render(scene,camera);
}
animate();

/* =========================
   WINDOW RESIZE
========================= */
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});
