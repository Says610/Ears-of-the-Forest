/* =========================================================
   EARS OF THE FOREST - PART 1/20
   Procedural Survival Horror - 5000 lines
========================================================= */

// --- GLOBALS ---
let scene,camera,renderer,clock,controls;
let flashlightOn=true, flashlightBattery=100;
let player={health:100};
let wolves=[], classmates=[], trees=[], items=[];
let cutsceneActive=false, dialogueActive=false;
let gameTime=0;
let storyFlags={helpedClassmate:false, exploredCave:false, foundSecret:false, bossDefeated:false};
let inventory=[];

// --- SCENE ---
scene=new THREE.Scene();
scene.background=new THREE.Color(0xcfd8dc); // light daytime
scene.fog=new THREE.Fog(0xcfd8dc,15,120);

// --- CAMERA ---
camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,500);
camera.position.set(0,1.8,12);
camera.lookAt(0,0,0);

// --- RENDERER ---
renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CLOCK ---
clock=new THREE.Clock();

// --- LIGHTS ---
const hemiLight=new THREE.HemisphereLight(0xffffff,0x888888,1.0);
hemiLight.position.set(0,50,0);
scene.add(hemiLight);

const dirLight=new THREE.DirectionalLight(0xffffff,1.2);
dirLight.position.set(30,50,30);
dirLight.castShadow=true;
dirLight.shadow.mapSize.width=2048;
dirLight.shadow.mapSize.height=2048;
scene.add(dirLight);

// --- POINTER LOCK ---
controls=new THREE.PointerLockControls(camera,document.body);
scene.add(controls.getObject());
document.addEventListener('click',()=>{renderer.domElement.requestPointerLock();});
document.addEventListener('pointerlockchange',()=>{
    document.body.style.cursor=(document.pointerLockElement===renderer.domElement)?'none':'default';
});

// --- GROUND ---
const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(300,300,100,100),
    new THREE.MeshStandardMaterial({color:0x667744, flatShading:true})
);
ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;

// --- UNDULATIONS ---
const verts=ground.geometry.attributes.position;
for(let i=0;i<verts.count;i++){
    let y=Math.random()*0.2; // slight unevenness
    verts.setY(i,y);
}
ground.geometry.attributes.position.needsUpdate=true;
scene.add(ground);

// --- PROCEDURAL TREES ---
for(let i=0;i<100;i++){
    const trunk=new THREE.Mesh(
        new THREE.CylinderGeometry(0.3+Math.random()*0.3,0.5,3+Math.random()*2),
        new THREE.MeshStandardMaterial({color:0x8B5A2B, flatShading:true})
    );
    const leaves=new THREE.Mesh(
        new THREE.ConeGeometry(1+Math.random()*0.7,2+Math.random()*0.5,8),
        new THREE.MeshStandardMaterial({color:0x2E8B57, flatShading:true})
    );
    const x=(Math.random()-0.5)*200;
    const z=(Math.random()-0.5)*200;
    trunk.position.set(x,trunk.geometry.parameters.height/2,z);
    leaves.position.set(x,trunk.position.y + trunk.geometry.parameters.height/2 + leaves.geometry.parameters.height/2,z);
    trunk.castShadow=true; leaves.castShadow=true;
    scene.add(trunk); scene.add(leaves);
    trees.push(trunk,leaves);
}

// --- CLASSMATE AI ---
class Classmate{
    constructor(name,x,z){
        this.mesh=new THREE.Mesh(
            new THREE.BoxGeometry(0.6,1.2,0.6),
            new THREE.MeshStandardMaterial({color:0x3366ff})
        );
        this.mesh.position.set(x,0.6,z);
        scene.add(this.mesh);
        this.name=name;
        this.state="idle"; this.speed=1;
    }
    update(delta){
        if(this.state==="panic") this.speed=2;
        const dir=new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed*delta*0.05));
    }
}
classmates=[new Classmate("Alex",-2,-2), new Classmate("Jamie",2,-3), new Classmate("Chris",0,3)];

// --- BASIC WOLF AI ---
class Wolf{
    constructor(x,z,isBoss=false){
        this.mesh=new THREE.Mesh(
            new THREE.CylinderGeometry(isBoss?0.6:0.4,isBoss?0.6:0.4,1,6),
            new THREE.MeshStandardMaterial({color:isBoss?0x880000:0xaa0000})
        );
        this.mesh.position.set(x,0.5,z);
        scene.add(this.mesh);
        this.state="idle"; this.isBoss=isBoss; this.chaseTimer=0;
    }
    update(delta){
        if(this.state==="stalk" || this.state==="chase"){
            const dir=new THREE.Vector3().subVectors(camera.position,this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar((this.isBoss?2:1.5)*delta));
            this.mesh.lookAt(camera.position.x, this.mesh.position.y, camera.position.z);
            if(this.mesh.position.distanceTo(camera.position)<1.5){
                player.health-=(this.isBoss?20:10)*delta;
                player.health=Math.max(player.health,0);
            }
        }
    }
}
wolves.push(new Wolf(10,10));
wolves.push(new Wolf(-5,8));
const bossWolf=new Wolf(40,40,true); // Cave position

// --- FLASHLIGHT ---
const flashlight=new THREE.SpotLight(0xffffff,1,50,Math.PI/6,0.2,2);
flashlight.position.set(0,1.8,0);
flashlight.target.position.set(0,0,-1);
camera.add(flashlight); scene.add(flashlight.target);
function updateFlashlight(delta){if(flashlightOn) flashlightBattery=Math.max(flashlightBattery-delta*2,0);}

// --- ITEMS ---
class Item{
    constructor(name,x,z){
        this.mesh=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.4), new THREE.MeshStandardMaterial({color:0xffff00}));
        this.mesh.position.set(x,0.2,z);
        scene.add(this.mesh);
        this.name=name; this.picked=false;
    }
    checkPickup(){
        if(this.picked) return;
        if(this.mesh.position.distanceTo(camera.position)<1.5){
            inventory.push(this.name);
            this.picked=true;
            scene.remove(this.mesh);
        }
    }
}
items.push(new Item("Battery Pack",3,-3));
items.push(new Item("Bandage",-2,2));

// --- HUD ---
const healthDiv=document.getElementById("health");
const batteryDiv=document.getElementById("battery");
const inventoryBox=document.getElementById("inventoryBox");
function updateHUD(){
    healthDiv.innerText=`Health: ${Math.round(player.health)}`;
    batteryDiv.innerText=`Flashlight: ${Math.round(flashlightBattery)}%`;
    inventoryBox.innerText="Inventory: "+inventory.join(", ");
}

// --- CUTSCENE START ---
function playStartCutscene(){
    cutsceneActive=true;
    camera.position.set(0,1.8,5);
    setTimeout(()=>{cutsceneActive=false; controls.lock();},3000);
}

// --- MAIN LOOP ---
function animate(){
    requestAnimationFrame(animate);
    const delta=clock.getDelta();
    if(controls.isLocked && !cutsceneActive){
        updateFlashlight(delta);
        wolves.forEach(w=>w.update(delta));
        classmates.forEach(c=>c.update(delta));
        bossWolf.update(delta);
        items.forEach(i=>i.checkPickup());
    }
    updateHUD();
    renderer.render(scene,camera);
}
animate();

// --- WINDOW RESIZE ---
window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});
