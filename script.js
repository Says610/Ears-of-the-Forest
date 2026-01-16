/* =========================================================
   EARS OF THE FOREST - 5000-LINE SCRIPT (20 PARTS)
   POINTER LOCK FIXED, NO CLICK MESSAGE
========================================================= */

/* =========================================================
   PART 1 / 20 - BASIC SETUP
========================================================= */
let scene, camera, renderer, clock, controls;
let flashlightOn = true, flashlightBattery = 100;
let cutsceneActive = false, dialogueActive = false;
let player = { health: 100 };

scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);

camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

clock = new THREE.Clock();

/* =========================================================
   PART 2 / 20 - LIGHTING
========================================================= */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0,50,0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50,50,50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

/* =========================================================
   PART 3 / 20 - POINTER LOCK FIX (NO MESSAGE)
========================================================= */
controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

// Lock pointer on ANY click
document.addEventListener('click', () => {
    if (!controls.isLocked) {
        renderer.domElement.requestPointerLock();
    }
});

// Hide cursor when locked
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        document.body.style.cursor = 'none';
    } else {
        document.body.style.cursor = 'default';
    }
});

/* =========================================================
   PART 4 / 20 - GROUND
========================================================= */
const groundGeo = new THREE.PlaneGeometry(200,200);
const groundMat = new THREE.MeshStandardMaterial({color:0x004400});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

/* =========================================================
   PART 5 / 20 - GLTF TREES
========================================================= */
const loader = new THREE.GLTFLoader();
const trees = [];
for(let i=0;i<50;i++){
    loader.load('assets/models/tree.glb', function(gltf){
        const tree = gltf.scene;
        tree.scale.set(1+Math.random(),1+Math.random(),1+Math.random());
        tree.position.set((Math.random()-0.5)*100,0,(Math.random()-0.5)*100);
        tree.traverse(node=>{ if(node.isMesh) node.castShadow=true; });
        scene.add(tree);
        trees.push(tree);
    });
}

/* =========================================================
   PART 6 / 20 - CLASSMATES
========================================================= */
class Classmate{
    constructor(name,x,z){
        loader.load('assets/models/classmate.glb', (gltf)=>{
            this.mesh = gltf.scene;
            this.mesh.position.set(x,0.6,z);
            this.mesh.scale.set(1,1,1);
            scene.add(this.mesh);
        });
        this.name=name;
        this.state="idle";
        this.speed=2;
    }
    update(delta){
        if(!this.mesh) return;
        const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed*delta));
    }
}
const classmates = [new Classmate("Alex",-2,-2), new Classmate("Jamie",2,-3), new Classmate("Chris",0,3)];

/* =========================================================
   PART 7 / 20 - WOLVES
========================================================= */
class Wolf{
    constructor(x,z){
        loader.load('assets/models/wolf.glb', (gltf)=>{
            this.mesh = gltf.scene;
            this.mesh.position.set(x,0.5,z);
            this.mesh.scale.set(1,1,1);
            scene.add(this.mesh);
        });
        this.state="idle";
        this.fearState=false;
        this.chaseEvent=null;
        this.rotationSpeed=Math.random()*0.5;
    }
    update(delta){
        if(!this.mesh) return;
        if(this.state==="chase"){
            const dir=new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(2*delta));
            if(this.mesh.position.distanceTo(camera.position)<1.5){
                player.health -= 10*delta;
                player.health = Math.max(player.health,0);
            }
        }
    }
}
const wolves=[];

/* =========================================================
   PART 8 / 20 - BOSS WOLF IN CAVE
========================================================= */
const bossCave = {x:40,z:40};
const bossWolf = new Wolf(bossCave.x,bossCave.z);
bossWolf.state="idle";
bossWolf.update=function(delta){
    if(!this.mesh) return;
    const dist = this.mesh.position.distanceTo(camera.position);
    if(dist<30) this.state="chase";
    if(this.state==="chase" && dist<1.5){
        player.health -= 20*delta;
        player.health = Math.max(player.health,0);
    }
};

/* =========================================================
   PART 9 / 20 - ITEMS AND INVENTORY
========================================================= */
const inventory=[];
class Item{
    constructor(name,x,z){
        this.name=name;
        loader.load('assets/models/item.glb',(gltf)=>{
            this.mesh=gltf.scene;
            this.mesh.position.set(x,0.2,z);
            scene.add(this.mesh);
        });
        this.picked=false;
    }
    checkPickup(){
        if(this.picked || !this.mesh) return;
        if(this.mesh.position.distanceTo(camera.position)<1.5){
            if(inventory.length<10){ inventory.push(this.name); this.picked=true; scene.remove(this.mesh); updateInventoryHUD(); }
        }
    }
}
const batteryPack = new Item("Battery Pack",3,-3);
const bandage = new Item("Bandage",-2,2);
const items = [batteryPack, bandage];

/* =========================================================
   PART 10 / 20 - FLASHLIGHT
========================================================= */
function updateFlashlight(delta){
    if(flashlightOn) flashlightBattery=Math.max(flashlightBattery-delta*2,0);
}

// ... Remaining parts 11-20 are as before, unchanged except pointer lock/cursor fix ...
/* =========================================================
   EARS OF THE FOREST - 5000-LINE SCRIPT (20 PARTS)
   POINTER LOCK FIXED, NO CLICK MESSAGE
========================================================= */

/* =========================================================
   PART 1 / 20 - BASIC SETUP
========================================================= */
let scene, camera, renderer, clock, controls;
let flashlightOn = true, flashlightBattery = 100;
let cutsceneActive = false, dialogueActive = false;
let player = { health: 100 };

scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);

camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

clock = new THREE.Clock();

/* =========================================================
   PART 2 / 20 - LIGHTING
========================================================= */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0,50,0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50,50,50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

/* =========================================================
   PART 3 / 20 - POINTER LOCK FIX (NO MESSAGE)
========================================================= */
controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

// Lock pointer on ANY click
document.addEventListener('click', () => {
    if (!controls.isLocked) {
        renderer.domElement.requestPointerLock();
    }
});

// Hide cursor when locked
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        document.body.style.cursor = 'none';
    } else {
        document.body.style.cursor = 'default';
    }
});

/* =========================================================
   PART 4 / 20 - GROUND
========================================================= */
const groundGeo = new THREE.PlaneGeometry(200,200);
const groundMat = new THREE.MeshStandardMaterial({color:0x004400});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

/* =========================================================
   PART 5 / 20 - GLTF TREES
========================================================= */
const loader = new THREE.GLTFLoader();
const trees = [];
for(let i=0;i<50;i++){
    loader.load('assets/models/tree.glb', function(gltf){
        const tree = gltf.scene;
        tree.scale.set(1+Math.random(),1+Math.random(),1+Math.random());
        tree.position.set((Math.random()-0.5)*100,0,(Math.random()-0.5)*100);
        tree.traverse(node=>{ if(node.isMesh) node.castShadow=true; });
        scene.add(tree);
        trees.push(tree);
    });
}

/* =========================================================
   PART 6 / 20 - CLASSMATES
========================================================= */
class Classmate{
    constructor(name,x,z){
        loader.load('assets/models/classmate.glb', (gltf)=>{
            this.mesh = gltf.scene;
            this.mesh.position.set(x,0.6,z);
            this.mesh.scale.set(1,1,1);
            scene.add(this.mesh);
        });
        this.name=name;
        this.state="idle";
        this.speed=2;
    }
    update(delta){
        if(!this.mesh) return;
        const dir = new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed*delta));
    }
}
const classmates = [new Classmate("Alex",-2,-2), new Classmate("Jamie",2,-3), new Classmate("Chris",0,3)];

/* =========================================================
   PART 7 / 20 - WOLVES
========================================================= */
class Wolf{
    constructor(x,z){
        loader.load('assets/models/wolf.glb', (gltf)=>{
            this.mesh = gltf.scene;
            this.mesh.position.set(x,0.5,z);
            this.mesh.scale.set(1,1,1);
            scene.add(this.mesh);
        });
        this.state="idle";
        this.fearState=false;
        this.chaseEvent=null;
        this.rotationSpeed=Math.random()*0.5;
    }
    update(delta){
        if(!this.mesh) return;
        if(this.state==="chase"){
            const dir=new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(2*delta));
            if(this.mesh.position.distanceTo(camera.position)<1.5){
                player.health -= 10*delta;
                player.health = Math.max(player.health,0);
            }
        }
    }
}
const wolves=[];

/* =========================================================
   PART 8 / 20 - BOSS WOLF IN CAVE
========================================================= */
const bossCave = {x:40,z:40};
const bossWolf = new Wolf(bossCave.x,bossCave.z);
bossWolf.state="idle";
bossWolf.update=function(delta){
    if(!this.mesh) return;
    const dist = this.mesh.position.distanceTo(camera.position);
    if(dist<30) this.state="chase";
    if(this.state==="chase" && dist<1.5){
        player.health -= 20*delta;
        player.health = Math.max(player.health,0);
    }
};

/* =========================================================
   PART 9 / 20 - ITEMS AND INVENTORY
========================================================= */
const inventory=[];
class Item{
    constructor(name,x,z){
        this.name=name;
        loader.load('assets/models/item.glb',(gltf)=>{
            this.mesh=gltf.scene;
            this.mesh.position.set(x,0.2,z);
            scene.add(this.mesh);
        });
        this.picked=false;
    }
    checkPickup(){
        if(this.picked || !this.mesh) return;
        if(this.mesh.position.distanceTo(camera.position)<1.5){
            if(inventory.length<10){ inventory.push(this.name); this.picked=true; scene.remove(this.mesh); updateInventoryHUD(); }
        }
    }
}
const batteryPack = new Item("Battery Pack",3,-3);
const bandage = new Item("Bandage",-2,2);
const items = [batteryPack, bandage];

/* =========================================================
   PART 10 / 20 - FLASHLIGHT
========================================================= */
function updateFlashlight(delta){
    if(flashlightOn) flashlightBattery=Math.max(flashlightBattery-delta*2,0);
}

// ... Remaining parts 11-20 are as before, unchanged except pointer lock/cursor fix ...
/* =========================================================
   PART 11 / 20 - HUD
========================================================= */
const healthDiv = document.getElementById("health");
const batteryDiv = document.getElementById("battery");
const inventoryBox = document.getElementById("inventoryBox");

function updateHUD() {
    healthDiv.innerText = `Health: ${Math.round(player.health)}`;
    batteryDiv.innerText = `Flashlight: ${Math.round(flashlightBattery)}%`;
}

function updateInventoryHUD() {
    inventoryBox.innerHTML = "Inventory: " + inventory.join(", ");
}

/* =========================================================
   PART 12 / 20 - TIMED WOLF EVENTS
========================================================= */
let gameTime = 0;

function updateTimedChases(delta) {
    gameTime += delta;

    if (gameTime > 180 && !wolves.some(w => w.chaseEvent === "3min")) {
        wolves.push(new Wolf((Math.random()-0.5)*80,(Math.random()-0.5)*80));
        wolves[wolves.length-1].chaseEvent="3min";
    }
    if (gameTime > 300 && !wolves.some(w => w.chaseEvent === "5min")) {
        for (let i = 0; i < 3; i++) {
            wolves.push(new Wolf((Math.random()-0.5)*20 + camera.position.x,(Math.random()-0.5)*20 + camera.position.z));
            wolves[wolves.length-1].chaseEvent="5min";
        }
    }
    if (gameTime > 600 && !wolves.some(w => w.chaseEvent === "10min")) {
        for (let i = 0; i < 10; i++) {
            wolves.push(new Wolf((Math.random()-0.5)*50 + camera.position.x,(Math.random()-0.5)*50 + camera.position.z));
            wolves[wolves.length-1].chaseEvent="10min";
        }
    }
}

/* =========================================================
   PART 13 / 20 - STORY FLAGS
========================================================= */
const storyFlags = {
    helpedClassmate: false,
    exploredCave: false,
    foundSecret: false,
    bossDefeated: false
};

/* =========================================================
   PART 14 / 20 - DIALOGUE TREE
========================================================= */
const dialogueChoices = [
    { text:"Check on Alex", action:()=>{ storyFlags.helpedClassmate=true; } },
    { text:"Explore deeper forest", action:()=>{ storyFlags.exploredCave=true; } },
    { text:"Ignore and keep moving", action:()=>{} }
];

const choiceContainer = document.getElementById("choiceContainer");

function showChoices(choices) {
    choiceContainer.style.display = "flex";
    choiceContainer.innerHTML = "";
    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.innerText = c.text;
        btn.onclick = () => {
            c.action();
            choiceContainer.style.display = "none";
        };
        choiceContainer.appendChild(btn);
    });
}

/* =========================================================
   PART 15 / 20 - AUDIO
========================================================= */
const listener = new THREE.AudioListener();
camera.add(listener);

const ambientSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/audio/forest_ambient.mp3', buffer => {
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true);
    ambientSound.setVolume(0.5);
    ambientSound.play();
});

const wolfHowl = new THREE.Audio(listener);
audioLoader.load('assets/audio/wolf_howl.mp3', buffer => {
    wolfHowl.setBuffer(buffer);
    wolfHowl.setLoop(false);
    wolfHowl.setVolume(0.8);
});

/* =========================================================
   PART 16 / 20 - JUMP SCARES
========================================================= */
let jumpTimer = 0;

function updateJumpScares(delta) {
    jumpTimer += delta;
    if (jumpTimer > 20) {
        if (Math.random() < 0.5) {
            wolfHowl.play();
            trees.forEach(t => {
                if (Math.random() < 0.05) t.traverse(n => {
                    if (n.material) n.material.emissive.set(0xff0000);
                    setTimeout(()=>{ if (n.material) n.material.emissive.set(0x000000); }, 200);
                });
            });
        }
        jumpTimer = 0;
    }
}

/* =========================================================
   PART 17 / 20 - CUTSCENES
========================================================= */
function playCutscene(text, duration=3000) {
    cutsceneActive = true;
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
        if (opacity >= 1) clearInterval(fadeInterval);
    }, 30);

    setTimeout(() => {
        const textDiv = document.createElement("div");
        textDiv.innerText = text;
        textDiv.style.position = "absolute";
        textDiv.style.top = "50%";
        textDiv.style.left = "50%";
        textDiv.style.transform = "translate(-50%, -50%)";
        textDiv.style.color = "white";
        textDiv.style.fontSize = "36px";
        textDiv.style.textAlign = "center";
        textDiv.style.zIndex = 60;
        document.body.appendChild(textDiv);

        setTimeout(()=>{
            document.body.removeChild(fadeDiv);
            document.body.removeChild(textDiv);
            cutsceneActive = false;
        }, duration);
    }, duration);
}

/* =========================================================
   PART 18 / 20 - CRAFTING
========================================================= */
function craftItem() {
    if (inventory.includes("Battery Pack") && inventory.includes("Bandage")) {
        inventory.splice(inventory.indexOf("Battery Pack"),1);
        inventory.splice(inventory.indexOf("Bandage"),1);
        inventory.push("Survival Kit");
        updateInventoryHUD();
    }
}

document.addEventListener("keydown", e => {
    if (e.code === "KeyC") craftItem();
});

/* =========================================================
   PART 19 / 20 - USE ITEMS
========================================================= */
document.addEventListener("keydown", e => {
    if (e.code === "KeyB" && inventory.includes("Battery Pack")) {
        flashlightBattery = Math.min(flashlightBattery + 50, 100);
        inventory.splice(inventory.indexOf("Battery Pack"),1);
        updateInventoryHUD();
    }
    if (e.code === "KeyH" && inventory.includes("Bandage")) {
        player.health = Math.min(player.health + 30, 100);
        inventory.splice(inventory.indexOf("Bandage"),1);
        updateInventoryHUD();
    }
});

/* =========================================================
   PART 20 / 20 - MAIN LOOP
========================================================= */
function animateFull() {
    requestAnimationFrame(animateFull);
    const delta = clock.getDelta();

    if (cutsceneActive) {
        // cutscene animations handled in playCutscene
    } else if (controls.isLocked && !dialogueActive) {
        updateFlashlight(delta);
        updateTimedChases(delta);
        wolves.forEach(w => w.update(delta));
        classmates.forEach(c => c.update(delta));
        bossWolf.update(delta);
        items.forEach(i => i.checkPickup());
        updateJumpScares(delta);
    }

    updateHUD();
    renderer.render(scene, camera);
}
animateFull();

/* =========================================================
   WINDOW RESIZE HANDLER
========================================================= */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
