/* =========================================================
   EARS OF THE FOREST - COMPLETE WORKING VERSION
========================================================= */

// ===============================
// CORE VARIABLES
// ===============================
let scene, camera, renderer, clock, controls;
let player = { 
    health: 100, 
    battery: 100,
    maxBattery: 100
};
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let sprinting = false, canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let stamina = 100;
const maxStamina = 100;
let fear = 5;
let maxFear = 100;
let gameTime = 0;
let wolves = [];
let obstacles = [];
let flashlightOn = true;
let flashlightBattery = 100;
let insideCave = false;
let cutsceneActive = true; // Start with cutscene
let fogPulse = 0;
let stepTimer = 0;
let dialogueTimer = 0;
let wolfTimers = { threeMin: false, fiveMin: false, tenMin: false };
let jumpTimer = 0;
let inventory = {
    medkits: 1,
    batteries: 2,
    "Battery Pack": 0,
    "Medkit": 0,
    "Bandage": 0,
    "Survival Kit": 0
};

// ===============================
// STORY FLAGS
// ===============================
const storyFlags = {
    helpedClassmate: false,
    exploredCave: false,
    foundSecret: false,
    bossDefeated: false,
    classmateLost: false
};

// ===============================
// WOLF CLASS
// ===============================
class Wolf {
    constructor(x, z, isBoss = false) {
        this.isBoss = isBoss;
        
        // Create wolf mesh (simple box shape for now)
        const geometry = new THREE.BoxGeometry(isBoss ? 2 : 1, isBoss ? 1.5 : 1, isBoss ? 3 : 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: isBoss ? 0x550000 : 0x222222,
            roughness: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, isBoss ? 0.75 : 0.5, z);
        this.mesh.castShadow = true;
        
        // Add red eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.6
        });
        
        this.eyeL = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.eyeR = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.eyeL.position.set(isBoss ? 0.3 : 0.2, 0.2, 0.1);
        this.eyeR.position.set(isBoss ? 0.3 : 0.2, 0.2, -0.1);
        this.mesh.add(this.eyeL);
        this.mesh.add(this.eyeR);
        
        scene.add(this.mesh);
        
        // AI Properties
        this.state = "idle"; // idle, stalk, chase, retreat
        this.speed = isBoss ? 4 : 3;
        this.attackCooldown = 0;
        this.circleAngle = Math.random() * Math.PI * 2;
        this.stalkDistance = isBoss ? 40 : 30;
        this.chaseDistance = isBoss ? 50 : 20;
        this.attackDistance = isBoss ? 2.5 : 1.8;
    }
    
    update(delta) {
        if (!this.mesh) return;
        
        const playerPos = controls.getObject().position;
        const dist = this.mesh.position.distanceTo(playerPos);
        
        // AI STATE LOGIC
        if (this.state === "idle" && dist < this.stalkDistance) {
            this.state = "stalk";
        }
        
        if (this.state === "stalk" && dist < this.chaseDistance) {
            this.state = "chase";
        }
        
        if (this.state === "chase" && dist > this.chaseDistance + 10) {
            this.state = "stalk";
        }
        
        // BEHAVIOR
        if (this.state === "stalk") {
            // Circle player
            this.circleAngle += delta;
            const radius = 15;
            const targetX = playerPos.x + Math.cos(this.circleAngle) * radius;
            const targetZ = playerPos.z + Math.sin(this.circleAngle) * radius;
            
            const dir = new THREE.Vector3(targetX - this.mesh.position.x, 0, targetZ - this.mesh.position.z).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed * 0.5 * delta));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        }
        
        if (this.state === "chase") {
            // Chase player
            const dir = new THREE.Vector3(playerPos.x - this.mesh.position.x, 0, playerPos.z - this.mesh.position.z).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
            
            // Attack if close enough
            if (dist < this.attackDistance && this.attackCooldown <= 0) {
                player.health -= this.isBoss ? 25 : 15;
                fear += this.isBoss ? 20 : 12;
                this.attackCooldown = 2.0;
                
                // Damage flash
                showDamageFlash();
            }
        }
        
        if (this.state === "idle") {
            // Random wandering
            this.circleAngle += delta * 0.5;
            this.mesh.position.x += Math.sin(this.circleAngle) * delta * 0.5;
            this.mesh.position.z += Math.cos(this.circleAngle) * delta * 0.5;
        }
        
        // Keep on ground
        this.mesh.position.y = this.isBoss ? 0.75 : 0.5;
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
}

// ===============================
// INITIALIZATION
// ===============================
function init() {
    console.log("=== EARS OF THE FOREST - INITIALIZING ===");
    
    // 1. SCENE
    scene = new THREE.Scene();
    
    // Sky-blue background for daytime
    scene.background = new THREE.Color(0x87CEEB);
    
    // Light gray translucent fog
    scene.fog = new THREE.Fog(0xCCCCCC, 20, 150);
    
    // 2. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // 3. CAMERA
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 5);
    
    // 4. CLOCK
    clock = new THREE.Clock();
    
    // 5. SETUP ALL SYSTEMS
    setupLighting();
    setupGround();
    setupEnvironment();
    setupObstacles();
    setupCave();
    setupFlashlight();
    setupControls();
    setupHUD();
    
    // 6. START CUTSCENE
    startFieldTripCutscene();
    
    console.log("=== INITIALIZATION COMPLETE ===");
}

// ===============================
// 1. ENVIRONMENT & VISUALS
// ===============================
function setupLighting() {
    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    scene.add(sunLight);
    
    // Hemisphere light for ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4f6b4f, 0.6);
    scene.add(hemisphereLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
}

function setupGround() {
    // Green forest floor
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 64, 64);
    
    // Add slight terrain variation
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ(i);
        const height = Math.sin(x * 0.05) * 1.5 + Math.cos(z * 0.05) * 1.5;
        vertices.setY(i, height);
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4f6b4f,
        roughness: 0.9,
        metalness: 0
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
}

function setupEnvironment() {
    // Create some trees (simple cylinders and spheres)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5f2f, roughness: 0.9 });
    
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        
        // Don't spawn trees in starting area
        if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
        
        // Trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 5 + Math.random() * 3, 8),
            trunkMat
        );
        trunk.position.set(x, 2.5, z);
        trunk.castShadow = true;
        scene.add(trunk);
        
        // Leaves
        const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8),
            leafMat
        );
        leaves.position.set(x, 6 + Math.random() * 2, z);
        leaves.castShadow = true;
        scene.add(leaves);
    }
    
    // Create some rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 });
    for (let i = 0; i < 30; i++) {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0),
            rockMat
        );
        rock.position.set(
            (Math.random() - 0.5) * 300,
            0.5,
            (Math.random() - 0.5) * 300
        );
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        scene.add(rock);
    }
}

function setupCave() {
    // Cave entrance (torus shape)
    const caveMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 1
    });
    
    const caveEntrance = new THREE.Mesh(
        new THREE.TorusGeometry(8, 3, 16, 32),
        caveMat
    );
    caveEntrance.rotation.x = Math.PI / 2;
    caveEntrance.position.set(60, 5, 60);
    caveEntrance.castShadow = true;
    scene.add(caveEntrance);
    
    // Cave interior (dark cylinder)
    const caveInterior = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 30, 16, 1, true),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.7
        })
    );
    caveInterior.rotation.x = Math.PI / 2;
    caveInterior.position.set(60, 5, 75);
    scene.add(caveInterior);
    
    // Boss wolf spawn point is inside cave
    window.cavePosition = new THREE.Vector3(60, 0, 75);
}

function setupObstacles() {
    const obstacleMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1 });
    
    // Fallen logs
    for (let i = 0; i < 20; i++) {
        const logLength = 3 + Math.random() * 4;
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, logLength, 8),
            obstacleMat
        );
        log.position.set(
            (Math.random() - 0.5) * 200,
            0.3,
            (Math.random() - 0.5) * 200
        );
        log.rotation.x = Math.PI / 2;
        log.castShadow = true;
        log.receiveShadow = true;
        scene.add(log);
        obstacles.push(log);
    }
    
    // Rocks
    for (let i = 0; i < 15; i++) {
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.5, 0),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        rock.position.set(
            (Math.random() - 0.5) * 200,
            0.8,
            (Math.random() - 0.5) * 200
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
        obstacles.push(rock);
    }
}

// ===============================
// 2. PLAYER & CONTROLS
// ===============================
function setupControls() {
    // Pointer lock controls
    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    
    // Click anywhere to engage pointer lock
    document.addEventListener("click", () => {
        if (!controls.isLocked) {
            controls.lock();
        }
    });
    
    // Keyboard input
    document.addEventListener("keydown", (event) => {
        switch (event.code) {
            case "KeyW": moveForward = true; break;
            case "KeyS": moveBackward = true; break;
            case "KeyA": moveLeft = true; break;
            case "KeyD": moveRight = true; break;
            case "Space": 
                if (canJump) {
                    velocity.y = 8;
                    canJump = false;
                }
                break;
            case "ShiftLeft": sprinting = true; break;
            case "KeyF": // Flashlight toggle
                flashlightOn = !flashlightOn;
                window.flashlight.visible = flashlightOn;
                break;
            case "KeyH": // Use medkit
                if (inventory.medkits > 0) {
                    player.health = Math.min(100, player.health + 40);
                    inventory.medkits--;
                    updateHUD();
                    showDialogue("Used Medkit: +40 Health");
                }
                break;
            case "KeyB": // Use battery
                if (inventory.batteries > 0) {
                    player.battery = player.maxBattery;
                    inventory.batteries--;
                    updateHUD();
                    showDialogue("Used Battery: Flashlight recharged");
                }
                break;
            case "KeyC": // Craft survival kit
                craftItem();
                break;
        }
    });
    
    document.addEventListener("keyup", (event) => {
        switch (event.code) {
            case "KeyW": moveForward = false; break;
            case "KeyS": moveBackward = false; break;
            case "KeyA": moveLeft = false; break;
            case "KeyD": moveRight = false; break;
            case "ShiftLeft": sprinting = false; break;
        }
    });
}

function updatePlayerMovement(delta) {
    if (!controls.isLocked || cutsceneActive) return;
    
    // Apply friction
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    // Gravity
    velocity.y -= 9.8 * delta;
    
    // Direction based on input
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    // Speed calculation
    let speed = 8.0;
    if (sprinting && stamina > 0) {
        speed = 14.0;
        stamina -= 30 * delta;
    } else {
        stamina = Math.min(maxStamina, stamina + 15 * delta);
    }
    
    // Apply movement
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * speed * delta;
    }
    if (moveLeft || moveRight) {
        velocity.x -= direction.x * speed * delta;
    }
    
    // Move the player
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    
    // Vertical movement
    controls.getObject().position.y += velocity.y * delta;
    
    // Check if on ground
    if (controls.getObject().position.y <= 1.7) {
        controls.getObject().position.y = 1.7;
        velocity.y = 0;
        canJump = true;
    }
    
    // Collision with obstacles
    checkObstacleCollisions();
}

function checkObstacleCollisions() {
    const playerPos = controls.getObject().position;
    
    obstacles.forEach(obstacle => {
        const distance = playerPos.distanceTo(obstacle.position);
        if (distance < 2.0) {
            // Push player away from obstacle
            const pushDirection = new THREE.Vector3()
                .subVectors(playerPos, obstacle.position)
                .normalize();
            controls.getObject().position.add(pushDirection.multiplyScalar(0.1));
        }
    });
}

// ===============================
// 3. FLASHLIGHT
// ===============================
function setupFlashlight() {
    const flashlight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 6, 0.2, 1);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;
    camera.add(flashlight);
    camera.add(flashlight.target);
    window.flashlight = flashlight;
}

function updateFlashlight(delta) {
    if (!flashlightOn || !window.flashlight) return;
    
    // Drain battery
    player.battery -= delta * 3;
    if (player.battery <= 0) {
        player.battery = 0;
        flashlightOn = false;
        window.flashlight.visible = false;
    }
    
    // Dim flashlight as battery drains
    const intensity = Math.max(0.2, (player.battery / 100) * 2);
    window.flashlight.intensity = intensity;
}

// ===============================
// 4. WOLVES AI
// ===============================
function updateWolves(delta) {
    wolves.forEach(wolf => {
        if (wolf && wolf.update) {
            wolf.update(delta);
        }
    });
    
    // Remove dead wolves
    wolves = wolves.filter(wolf => wolf && wolf.mesh);
}

function spawnWolf(x, z, isBoss = false) {
    const wolf = new Wolf(x, z, isBoss);
    wolves.push(wolf);
    return wolf;
}

function updateTimedWolfEvents() {
    const minutes = gameTime / 60;
    
    // 3 minute event: single wolf
    if (minutes > 3 && !wolfTimers.threeMin) {
        const playerPos = controls.getObject().position;
        const wolf = spawnWolf(playerPos.x + 20, playerPos.z + 20);
        wolf.state = "stalk";
        wolfTimers.threeMin = true;
        showDialogue("You hear a wolf nearby...");
    }
    
    // 5 minute event: wolf pack
    if (minutes > 5 && !wolfTimers.fiveMin) {
        const playerPos = controls.getObject().position;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const radius = 25;
            const wolf = spawnWolf(
                playerPos.x + Math.cos(angle) * radius,
                playerPos.z + Math.sin(angle) * radius
            );
            wolf.state = "stalk";
        }
        wolfTimers.fiveMin = true;
        showDialogue("Wolves are surrounding you!");
    }
    
    // 10 minute event: horde
    if (minutes > 10 && !wolfTimers.tenMin) {
        const playerPos = controls.getObject().position;
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 20;
            const wolf = spawnWolf(
                playerPos.x + Math.cos(angle) * radius,
                playerPos.z + Math.sin(angle) * radius
            );
            wolf.state = "chase";
        }
        wolfTimers.tenMin = true;
        showDialogue("A horde of wolves is chasing!");
    }
    
    // Boss wolf spawn (in cave area)
    const playerPos = controls.getObject().position;
    const caveDist = playerPos.distanceTo(window.cavePosition || new THREE.Vector3(60, 0, 75));
    
    if (caveDist < 40 && !window.bossSpawned) {
        const boss = spawnWolf(window.cavePosition.x, window.cavePosition.z, true);
        boss.state = "chase";
        window.bossSpawned = boss;
        showDialogue("A massive wolf emerges from the cave!");
    }
}

// ===============================
// 5. STORY & ENDINGS
// ===============================
function checkStoryTriggers() {
    const playerPos = controls.getObject().position;
    
    // Check for secret path
    if (!storyFlags.foundSecret) {
        const secretPos = new THREE.Vector3(100, 0, 100);
        if (playerPos.distanceTo(secretPos) < 10) {
            storyFlags.foundSecret = true;
            showDialogue("You found a hidden path!");
        }
    }
    
    // Check if helped classmate (simulated by being near certain area)
    if (!storyFlags.helpedClassmate) {
        const classmateArea = new THREE.Vector3(-30, 0, -30);
        if (playerPos.distanceTo(classmateArea) < 15) {
            storyFlags.helpedClassmate = true;
            showDialogue("You found a lost classmate and helped them!");
        }
    }
    
    // Check if explored cave
    if (!storyFlags.exploredCave) {
        if (playerPos.distanceTo(window.cavePosition || new THREE.Vector3(60, 0, 75)) < 25) {
            storyFlags.exploredCave = true;
            showDialogue("You discovered the dark cave...");
        }
    }
    
    // Check if boss defeated
    if (!storyFlags.bossDefeated && window.bossSpawned) {
        if (!window.bossSpawned.mesh || window.bossSpawned.mesh.position.y < -10) {
            storyFlags.bossDefeated = true;
            showDialogue("You defeated the boss wolf!");
        }
    }
    
    // Check for endings
    if (player.health <= 0) {
        triggerEnding("bad");
    } else if (storyFlags.bossDefeated && storyFlags.helpedClassmate && gameTime > 300) {
        triggerEnding("good");
    } else if (storyFlags.foundSecret && gameTime > 600) {
        triggerEnding("secret");
    }
}

// ===============================
// 6. INVENTORY & CRAFTING
// ===============================
function craftItem() {
    // Survival Kit: Battery Pack + Medkit
    if (inventory["Battery Pack"] >= 1 && inventory["Medkit"] >= 1) {
        inventory["Battery Pack"]--;
        inventory["Medkit"]--;
        inventory["Survival Kit"] = (inventory["Survival Kit"] || 0) + 1;
        inventory.medkits += 1; // Survival kit gives medkit
        updateHUD();
        showDialogue("Crafted Survival Kit!");
    } else {
        showDialogue("Need 1 Battery Pack and 1 Medkit to craft!");
    }
}

// ===============================
// 7. ENVIRONMENTAL EFFECTS
// ===============================
function updateFearSystem(delta) {
    // Natural fear increase
    fear += delta * 0.2;
    
    // Darkness increases fear
    if (!flashlightOn && (insideCave || scene.fog.density > 0.05)) {
        fear += delta * 0.5;
    }
    
    // Wolves nearby increase fear
    const playerPos = controls.getObject().position;
    let wolfFear = 0;
    wolves.forEach(wolf => {
        if (wolf && wolf.mesh) {
            const dist = playerPos.distanceTo(wolf.mesh.position);
            if (dist < 30) {
                wolfFear += (30 - dist) * 0.1;
            }
        }
    });
    fear += wolfFear * delta;
    
    // Low health increases fear
    if (player.health < 40) {
        fear += delta * 0.3;
    }
    
    // Cap fear
    fear = Math.min(maxFear, fear);
    
    // Update fog based on fear
    const targetFogDensity = 0.02 + (fear / maxFear) * 0.06;
    scene.fog.density += (targetFogDensity - scene.fog.density) * delta * 2;
    
    // Pulse fog
    fogPulse += delta;
    scene.fog.density += Math.sin(fogPulse * 2) * 0.002;
}

function updateJumpScares(delta) {
    jumpTimer += delta;
    
    if (jumpTimer > 15 + Math.random() * 15 && wolves.length > 0) {
        jumpTimer = 0;
        
        // Random chance for jump scare
        if (Math.random() < 0.3) {
            // Flash a wolf's eyes
            const randomWolf = wolves[Math.floor(Math.random() * wolves.length)];
            if (randomWolf && randomWolf.eyeL && randomWolf.eyeR) {
                randomWolf.eyeL.material.emissiveIntensity = 2.0;
                randomWolf.eyeR.material.emissiveIntensity = 2.0;
                
                setTimeout(() => {
                    if (randomWolf.eyeL && randomWolf.eyeR) {
                        randomWolf.eyeL.material.emissiveIntensity = 0.6;
                        randomWolf.eyeR.material.emissiveIntensity = 0.6;
                    }
                }, 200);
                
                showDialogue("A wolf howls in the distance...");
            }
        }
    }
}

// ===============================
// 8. UI & HUD
// ===============================
function setupHUD() {
    // Remove existing HUD if any
    const existingHUD = document.getElementById('game-hud');
    if (existingHUD) existingHUD.remove();
    
    // Create HUD container
    const hud = document.createElement('div');
    hud.id = 'game-hud';
    hud.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        font-family: Arial, sans-serif;
        color: white;
        text-shadow: 1px 1px 2px black;
    `;
    
    // Health bar
    hud.innerHTML += `
        <div id="health-display" style="position: absolute; top: 20px; left: 20px; font-size: 20px;">
            ❤️ Health: ${player.health}
        </div>
    `;
    
    // Stamina bar
    hud.innerHTML += `
        <div id="stamina-display" style="position: absolute; top: 50px; left: 20px; font-size: 20px;">
            ⚡ Stamina: ${Math.round(stamina)}
        </div>
    `;
    
    // Battery display
    hud.innerHTML += `
        <div id="battery-display" style="position: absolute; top: 80px; left: 20px; font-size: 20px;">
            🔦 Battery: ${Math.round(player.battery)}%
        </div>
    `;
    
    // Fear display
    hud.innerHTML += `
        <div id="fear-display" style="position: absolute; top: 110px; left: 20px; font-size: 20px;">
            😨 Fear: ${Math.round(fear)}
        </div>
    `;
    
    // Inventory display
    hud.innerHTML += `
        <div id="inventory-display" style="position: absolute; bottom: 20px; left: 20px; font-size: 16px;">
            Inventory: Medkits(${inventory.medkits}) Batteries(${inventory.batteries})
        </div>
    `;
    
    // Coordinates display
    hud.innerHTML += `
        <div id="coord-display" style="position: absolute; top: 20px; right: 20px; font-size: 16px; text-align: right;">
            Coordinates
        </div>
    `;
    
    // Dialogue container
    hud.innerHTML += `
        <div id="dialogue-container" style="
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 15px 30px;
            border-radius: 10px;
            max-width: 600px;
            display: none;
            text-align: center;
            font-size: 18px;
        ">
        </div>
    `;
    
    // Damage flash overlay
    hud.innerHTML += `
        <div id="damage-flash" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,0,0,0);
            pointer-events: none;
            transition: background 0.3s;
        ">
        </div>
    `;
    
    document.body.appendChild(hud);
}

function updateHUD() {
    // Health
    const healthEl = document.getElementById('health-display');
    if (healthEl) {
        healthEl.innerHTML = `❤️ Health: ${Math.max(0, Math.round(player.health))}`;
        healthEl.style.color = player.health < 30 ? 'red' : 'white';
    }
    
    // Stamina
    const staminaEl = document.getElementById('stamina-display');
    if (staminaEl) {
        staminaEl.innerHTML = `⚡ Stamina: ${Math.round(stamina)}`;
        staminaEl.style.color = stamina < 20 ? 'orange' : 'white';
    }
    
    // Battery
    const batteryEl = document.getElementById('battery-display');
    if (batteryEl) {
        batteryEl.innerHTML = `🔦 Battery: ${Math.round(player.battery)}%`;
        batteryEl.style.color = player.battery < 20 ? 'yellow' : 'white';
    }
    
    // Fear
    const fearEl = document.getElementById('fear-display');
    if (fearEl) {
        fearEl.innerHTML = `😨 Fear: ${Math.round(fear)}`;
        fearEl.style.color = fear > 70 ? 'purple' : 'white';
    }
    
    // Inventory
    const inventoryEl = document.getElementById('inventory-display');
    if (inventoryEl) {
        inventoryEl.innerHTML = `Inventory: Medkits(${inventory.medkits}) Batteries(${inventory.batteries})`;
    }
    
    // Coordinates
    const coordEl = document.getElementById('coord-display');
    if (coordEl && controls && controls.getObject) {
        const pos = controls.getObject().position;
        coordEl.innerHTML = `X: ${pos.x.toFixed(1)}<br>Y: ${pos.y.toFixed(1)}<br>Z: ${pos.z.toFixed(1)}`;
    }
}

function showDamageFlash() {
    const flashEl = document.getElementById('damage-flash');
    if (flashEl) {
        flashEl.style.background = 'rgba(255,0,0,0.3)';
        setTimeout(() => {
            flashEl.style.background = 'rgba(255,0,0,0)';
        }, 300);
    }
}

function showDialogue(text) {
    const dialogueEl = document.getElementById('dialogue-container');
    if (dialogueEl) {
        dialogueEl.textContent = text;
        dialogueEl.style.display = 'block';
        dialogueTimer = 4; // Show for 4 seconds
    }
}

function updateDialogue(delta) {
    if (dialogueTimer > 0) {
        dialogueTimer -= delta;
        if (dialogueTimer <= 0) {
            const dialogueEl = document.getElementById('dialogue-container');
            if (dialogueEl) {
                dialogueEl.style.display = 'none';
            }
        }
    }
}

// ===============================
// 9. CUTSCENES
// ===============================
function startFieldTripCutscene() {
    cutsceneActive = true;
    
    // Reset camera position for cutscene
    camera.position.set(0, 1.7, 10);
    camera.lookAt(0, 1.7, 0);
    
    showDialogue("You wake up in the forest... Your classmates are gone.");
    
    // End cutscene after 5 seconds
    setTimeout(() => {
        cutsceneActive = false;
        showDialogue("Find your way out. Watch for wolves. Use F for flashlight.");
    }, 5000);
}

function triggerEnding(type) {
    cutsceneActive = true;
    
    // Create ending overlay
    const endingOverlay = document.createElement('div');
    endingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 36px;
        text-align: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 3s;
    `;
    
    let endingText = "";
    switch(type) {
        case "good":
            endingText = "GOOD ENDING\nYou and your classmates survived!";
            break;
        case "bad":
            endingText = "BAD ENDING\nYou didn't make it out...";
            break;
        case "secret":
            endingText = "SECRET ENDING\nYou discovered the forest's secrets!";
            break;
    }
    
    endingOverlay.textContent = endingText;
    document.body.appendChild(endingOverlay);
    
    // Fade in
    setTimeout(() => {
        endingOverlay.style.opacity = "1";
    }, 100);
    
    // After 5 seconds, restart
    setTimeout(() => {
        location.reload();
    }, 8000);
}

// ===============================
// 10. MAIN GAME LOOP
// ===============================
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); // Cap delta for stability
    
    // Update game time
    gameTime += delta;
    
    // Only update game logic if not in cutscene
    if (!cutsceneActive && controls.isLocked) {
        // Player systems
        updatePlayerMovement(delta);
        updateFlashlight(delta);
        
        // Wolf systems
        updateWolves(delta);
        updateTimedWolfEvents();
        
        // Environment systems
        updateFearSystem(delta);
        updateJumpScares(delta);
        
        // Check for death
        if (player.health <= 0) {
            player.health = 0;
            triggerEnding("bad");
        }
        
        // Check story triggers
        checkStoryTriggers();
    }
    
    // Always update these
    updateHUD();
    updateDialogue(delta);
    
    // Render scene
    renderer.render(scene, camera);
}

// ===============================
// WINDOW RESIZE
// ===============================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===============================
// START GAME
// ===============================
// Wait for page to load
window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
    console.log("Game started! Click to begin.");
});
