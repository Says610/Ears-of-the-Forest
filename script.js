// ============================================
// ECHOES OF THE FOREST - MAIN GAME SCRIPT
// ============================================

// Game State
let gameState = {
    isPaused: false,
    isGameOver: false,
    isGameWon: false,
    currentScreen: 'loading',
    gameTime: 0, // in minutes
    dayCount: 1,
    memoryFragments: 0,
    forestMood: 50, // -100 to 100
    wolvesPacified: 0,
    sanity: 100,
    health: 100,
    hunger: 100,
    thirst: 100,
    temperature: 37,
    stamina: 100,
    inventory: [],
    discoveredAreas: new Set(['start']),
    playerPosition: { x: 0, y: 0, z: 0 },
    distanceTraveled: 0,
    wolfEncounters: 0,
    achievements: new Set()
};

// Three.js Variables
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let deltaTime = 0;
let lastPosition = new THREE.Vector3();

// Game Objects
let player;
let wolves = [];
let trees = [];
let plants = [];
let memoryFragments = [];
let campfires = [];
let interactiveObjects = [];

// Audio
let audioListener;
let backgroundMusic;
let soundEffects = {};
let isAudioEnabled = true;

// Input
let keys = {};
let mouse = { x: 0, y: 0, movementX: 0, movementY: 0 };
let isMouseLocked = false;

// Settings
let settings = {
    quality: 'medium',
    renderDistance: 500,
    shadows: true,
    particles: true,
    masterVolume: 80,
    sfxVolume: 100,
    musicVolume: 60,
    spatialAudio: true,
    mouseSensitivity: 5,
    fov: 90,
    autoSave: true,
    hints: true,
    invertY: false,
    toggleCrouch: false,
    keyboardLayout: 'qwerty'
};

// Memory Fragments Data
const memoryData = [
    { id: 1, title: "The Bus Ride", description: "The beginning of the school trip.", effect: "Increases sanity by 10" },
    { id: 2, title: "Lost Path", description: "The moment you realized you were alone.", effect: "Reveals nearby paths" },
    { id: 3, title: "First Howl", description: "The first wolf you heard in the distance.", effect: "Wolves become less aggressive" },
    { id: 4, title: "Forest Whispers", description: "Voices that seem to come from the trees.", effect: "Forest mood improves" },
    { id: 5, title: "Ancient Ruins", description: "Remnants of a civilization long gone.", effect: "Unlocks ancient knowledge" },
    { id: 6, title: "The Guardian", description: "A massive wolf that watches over the forest.", effect: "Wolf boss becomes neutral" },
    { id: 7, title: "River of Memories", description: "The river flows with forgotten stories.", effect: "Restores all stats" },
    { id: 8, title: "Night Terror", description: "Your worst fears manifested.", effect: "Increases sanity resistance" },
    { id: 9, title: "Dawn's Hope", description: "The first light after a long night.", effect: "Temperature stabilizes" },
    { id: 10, title: "Forest's Heart", description: "The core of the forest consciousness.", effect: "Unlifts forest communication" },
    { id: 11, title: "The Choice", description: "To fight or understand the forest.", effect: "Changes ending possibilities" },
    { id: 12, title: "Echoes", description: "All memories combined into understanding.", effect: "Unlocks true ending" }
];

// Achievements Data
const achievements = {
    survival: [
        { id: 'survive_1_day', name: 'Survivor', desc: 'Survive for 1 day' },
        { id: 'survive_7_days', name: 'Forest Dweller', desc: 'Survive for 7 days' },
        { id: 'no_damage', name: 'Untouched', desc: 'Complete a day without taking damage' }
    ],
    discovery: [
        { id: 'all_memories', name: 'Memory Keeper', desc: 'Collect all memory fragments' },
        { id: 'explore_all', name: 'Pathfinder', desc: 'Explore all areas of the forest' },
        { id: 'find_secrets', name: 'Seeker', desc: 'Discover 10 hidden areas' }
    ],
    wolf: [
        { id: 'pacify_wolf', name: 'Wolf Friend', desc: 'Pacify your first wolf' },
        { id: 'pacify_boss', name: 'Alpha\'s Trust', desc: 'Pacify the alpha wolf' },
        { id: 'no_wolf_kills', name: 'Peacekeeper', desc: 'Complete game without killing wolves' }
    ]
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

async function initializeGame() {
    // Show loading screen
    showScreen('loading');
    
    // Load settings from localStorage
    loadSettings();
    
    // Initialize Three.js scene
    await initializeScene();
    
    // Load game assets
    await loadAssets();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize game systems
    initializeGameSystems();
    
    // Hide loading screen and show main menu
    setTimeout(() => {
        hideScreen('loading');
        showScreen('main-menu');
        
        // Load background music
        loadBackgroundMusic();
    }, 2000);
}

async function initializeScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, settings.renderDistance);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('gameCanvas'),
        antialias: settings.quality !== 'low',
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = settings.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create audio listener
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    
    // Set up lighting
    setupLighting();
    
    // Create terrain
    createTerrain();
    
    // Create procedural forest
    createForest();
    
    // Create player
    createPlayer();
    
    // Create wolves
    createWolves();
    
    // Create memory fragments
    createMemoryFragments();
    
    // Create interactive objects
    createInteractiveObjects();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffecd2, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = settings.shadows;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
    
    // Moon light (for night)
    const moonLight = new THREE.DirectionalLight(0x6677aa, 0.3);
    moonLight.position.set(-100, 200, -100);
    scene.add(moonLight);
    scene.add(moonLight.target);
}

function createTerrain() {
    const terrainSize = 1000;
    const terrainSegments = 200;
    
    // Create terrain geometry with noise
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    const vertices = geometry.attributes.position.array;
    
    // Apply terrain height using multiple noise layers
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Multiple layers of Perlin-like noise
        let height = 0;
        height += Math.sin(x * 0.002) * 15;
        height += Math.sin(z * 0.002) * 15;
        height += Math.sin(x * 0.005 + z * 0.003) * 8;
        height += Math.sin(x * 0.01) * 4;
        height += Math.sin(z * 0.01) * 4;
        height += (Math.random() - 0.5) * 2;
        
        vertices[i + 1] = height;
    }
    
    geometry.computeVertexNormals();
    
    // Create terrain material
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3a5f0b,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
    
    // Create water
    const waterGeometry = new THREE.PlaneGeometry(800, 800, 50, 50);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x006994,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.8
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.1;
    scene.add(water);
    
    // Add river
    createRiver();
}

function createRiver() {
    const riverWidth = 15;
    const riverLength = 600;
    const riverSegments = 100;
    
    const riverGeometry = new THREE.PlaneGeometry(riverWidth, riverLength, 10, riverSegments);
    const vertices = riverGeometry.attributes.position.array;
    
    // Create winding river path
    for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2];
        vertices[i] = Math.sin(z * 0.01) * 100;
    }
    
    riverGeometry.computeVertexNormals();
    
    const riverMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.6
    });
    
    const river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.y = 0.2;
    scene.add(river);
}

function createForest() {
    // Create trees
    for (let i = 0; i < 500; i++) {
        const x = (Math.random() - 0.5) * 800;
        const z = (Math.random() - 0.5) * 800;
        
        // Check if position is not in water
        const terrainHeight = getTerrainHeight(x, z);
        if (terrainHeight > 1 && Math.abs(x) < 350 && Math.abs(z) < 350) {
            const tree = createTree(x, z, terrainHeight);
            trees.push(tree);
        }
    }
    
    // Create berry bushes
    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        const terrainHeight = getTerrainHeight(x, z);
        
        if (terrainHeight > 1) {
            const bush = createBerryBush(x, z, terrainHeight);
            plants.push(bush);
        }
    }
    
    // Create rocks
    for (let i = 0; i < 200; i++) {
        const x = (Math.random() - 0.5) * 700;
        const z = (Math.random() - 0.5) * 700;
        const terrainHeight = getTerrainHeight(x, z);
        
        if (terrainHeight > 1) {
            const rock = createRock(x, z, terrainHeight);
            interactiveObjects.push(rock);
        }
    }
}

function createTree(x, z, y) {
    const height = 10 + Math.random() * 15;
    const trunkHeight = height * 0.6;
    const trunkRadius = 0.3 + Math.random() * 0.4;
    
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + trunkHeight / 2, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Create leaves
    const leavesHeight = height * 0.4;
    const leavesRadius = 3 + Math.random() * 4;
    const leavesSegments = Math.floor(6 + Math.random() * 4);
    
    const leavesGeometry = new THREE.ConeGeometry(leavesRadius, leavesHeight, leavesSegments);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(0.3, 0.7, 0.3 + Math.random() * 0.2),
        roughness: 0.8
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, y + trunkHeight + leavesHeight / 2, z);
    leaves.castShadow = true;
    
    // Create tree group
    const tree = new THREE.Group();
    tree.add(trunk, leaves);
    tree.userData = { type: 'tree', canInteract: false };
    scene.add(tree);
    
    return tree;
}

function createBerryBush(x, z, y) {
    const bushSize = 1.5 + Math.random() * 1;
    
    // Create bush base
    const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8);
    const bushMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2e8b57,
        roughness: 0.8
    });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, y + bushSize / 2, z);
    bush.castShadow = true;
    
    // Add berries
    const berryCount = 5 + Math.floor(Math.random() * 10);
    const isPoisonous = Math.random() < 0.3;
    
    for (let i = 0; i < berryCount; i++) {
        const berryGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const berryMaterial = new THREE.MeshStandardMaterial({ 
            color: isPoisonous ? 0x00ff00 : 0xff4444
        });
        const berry = new THREE.Mesh(berryGeometry, berryMaterial);
        
        const angle = (i / berryCount) * Math.PI * 2;
        const radius = bushSize * 0.7;
        berry.position.set(
            Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
            Math.sin(Math.random() * Math.PI) * bushSize * 0.5,
            Math.sin(angle) * radius * (0.5 + Math.random() * 0.5)
        );
        
        bush.add(berry);
    }
    
    bush.userData = {
        type: 'berryBush',
        canInteract: true,
        isPoisonous: isPoisonous,
        berriesLeft: berryCount,
        interact: function() {
            if (this.berriesLeft > 0) {
                this.berriesLeft--;
                
                if (this.isPoisonous) {
                    gameState.health -= 10;
                    gameState.hunger += 5;
                    addMessage('You ate poisonous berries! Health -10');
                    
                    if (gameState.health <= 0) {
                        gameOver('Poisoning');
                    }
                } else {
                    gameState.hunger += 15;
                    gameState.health = Math.min(100, gameState.health + 2);
                    addMessage('You ate some berries. Hunger +15');
                }
                
                // Update HUD
                updateHUD();
                
                // Remove berry visually
                if (this.berriesLeft === 0) {
                    bush.material.color.set(0x556b2f);
                }
                
                return true;
            }
            return false;
        }
    };
    
    scene.add(bush);
    return bush;
}

function createRock(x, z, y) {
    const size = 1 + Math.random() * 2;
    const segments = 3 + Math.floor(Math.random() * 3);
    
    const rockGeometry = new THREE.DodecahedronGeometry(size, segments);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + size / 2, z);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    rock.userData = {
        type: 'rock',
        canInteract: false
    };
    
    scene.add(rock);
    return rock;
}

function createPlayer() {
    player = {
        mesh: camera,
        height: 1.8,
        speed: 5,
        sprintSpeed: 8,
        jumpForce: 8,
        isSprinting: false,
        isCrouching: false,
        isGrounded: true,
        velocity: new THREE.Vector3(),
        flashlightOn: false,
        currentItem: 0
    };
    
    // Create flashlight
    const flashlight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 6, 0.5, 1);
    flashlight.position.set(0, 1.5, 0);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;
    camera.add(flashlight);
    player.flashlight = flashlight;
    
    // Add flashlight target
    const target = new THREE.Object3D();
    target.position.set(0, 0, -10);
    camera.add(target);
    flashlight.target = target;
    
    lastPosition.copy(camera.position);
}

function createWolves() {
    // Normal wolves
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 100 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = getTerrainHeight(x, z) + 0.5;
        
        const wolf = new Wolf(x, y, z, false);
        wolves.push(wolf);
    }
    
    // Alpha wolf (boss)
    const bossX = 200;
    const bossZ = 200;
    const bossY = getTerrainHeight(bossX, bossZ) + 0.5;
    const alphaWolf = new Wolf(bossX, bossY, bossZ, true);
    wolves.push(alphaWolf);
}

class Wolf {
    constructor(x, y, z, isAlpha = false) {
        this.isAlpha = isAlpha;
        this.health = isAlpha ? 200 : 100;
        this.maxHealth = this.health;
        this.speed = isAlpha ? 6 : 4;
        this.detectionRange = isAlpha ? 50 : 30;
        this.attackRange = 2;
        this.state = 'patrol'; // patrol, chase, attack, flee, pacified
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.lastHowlTime = 0;
        this.pacified = false;
        
        // Create wolf mesh
        this.mesh = this.createWolfMesh(x, y, z);
        scene.add(this.mesh);
        
        // Generate patrol points
        this.generatePatrolPoints(x, z);
    }
    
    createWolfMesh(x, y, z) {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.isAlpha ? 0x8B0000 : 0x333333,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.2, 0.8);
        group.add(head);
        
        // Ears
        const earGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.3, 0.3, 0.6);
        leftEar.rotation.x = -Math.PI / 6;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.3, 0.3, 0.6);
        rightEar.rotation.x = -Math.PI / 6;
        group.add(rightEar);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 4);
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, bodyMaterial);
            const xPos = i < 2 ? -0.3 : 0.3;
            const zPos = i % 2 === 0 ? -0.4 : 0.4;
            leg.position.set(xPos, -0.9, zPos);
            group.add(leg);
        }
        
        // Tail
        const tailGeometry = new THREE.ConeGeometry(0.1, 0.8, 4);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, -0.4, -0.8);
        tail.rotation.x = Math.PI / 3;
        group.add(tail);
        
        group.position.set(x, y, z);
        group.castShadow = true;
        group.receiveShadow = true;
        
        // Add glowing eyes for alpha
        if (this.isAlpha) {
            const eyeGeometry = new THREE.SphereGeometry(0.08, 4, 4);
            const eyeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.15, 0.25, 1.1);
            group.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.15, 0.25, 1.1);
            group.add(rightEye);
        }
        
        return group;
    }
    
    generatePatrolPoints(x, z) {
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const radius = 20 + Math.random() * 20;
            this.patrolPoints.push(new THREE.Vector3(
                x + Math.cos(angle) * radius,
                0,
                z + Math.sin(angle) * radius
            ));
        }
    }
    
    update(deltaTime) {
        if (this.pacified) return;
        
        const playerPosition = camera.position.clone();
        const wolfPosition = this.mesh.position;
        const distanceToPlayer = wolfPosition.distanceTo(playerPosition);
        
        // Update based on state
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                if (distanceToPlayer < this.detectionRange) {
                    this.state = 'chase';
                    this.howl();
                    gameState.wolfEncounters++;
                }
                break;
                
            case 'chase':
                this.chasePlayer(deltaTime, playerPosition);
                if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                } else if (distanceToPlayer > this.detectionRange * 1.5) {
                    this.state = 'patrol';
                }
                break;
                
            case 'attack':
                this.attackPlayer(deltaTime, playerPosition);
                if (distanceToPlayer > this.attackRange * 1.5) {
                    this.state = 'chase';
                }
                break;
                
            case 'flee':
                this.fleeFromPlayer(deltaTime, playerPosition);
                if (distanceToPlayer > this.detectionRange * 2) {
                    this.state = 'patrol';
                }
                break;
        }
        
        // Update wolf position based on terrain
        const terrainHeight = getTerrainHeight(wolfPosition.x, wolfPosition.z);
        this.mesh.position.y = terrainHeight + 0.5;
        
        // Update animation
        this.updateAnimation(deltaTime);
    }
    
    updatePatrol(deltaTime) {
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const direction = new THREE.Vector3().subVectors(targetPoint, this.mesh.position);
        direction.y = 0;
        
        if (direction.length() < 2) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed * 0.3 * deltaTime));
            this.mesh.lookAt(targetPoint);
        }
    }
    
    chasePlayer(deltaTime, playerPosition) {
        const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
        direction.y = 0;
        
        if (direction.length() > 0.5) {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));
            this.mesh.lookAt(playerPosition);
        }
        
        // Howl occasionally
        if (Date.now() - this.lastHowlTime > 10000) {
            this.howl();
        }
    }
    
    attackPlayer(deltaTime, playerPosition) {
        // Deal damage to player
        if (Math.random() < 0.1) {
            const damage = this.isAlpha ? 20 : 10;
            gameState.health -= damage;
            
            if (this.isAlpha) {
                addMessage('The alpha wolf attacks ferociously!');
            } else {
                addMessage('Wolf bites you!');
            }
            
            updateHUD();
            
            if (gameState.health <= 0) {
                gameOver('Killed by wolves');
            }
        }
        
        // Chance to flee if player is healthy
        if (gameState.health > 50 && Math.random() < 0.05) {
            this.state = 'flee';
        }
    }
    
    fleeFromPlayer(deltaTime, playerPosition) {
        const direction = new THREE.Vector3().subVectors(this.mesh.position, playerPosition);
        direction.y = 0;
        
        if (direction.length() > 0) {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed * 1.2 * deltaTime));
        }
    }
    
    howl() {
        this.lastHowlTime = Date.now();
        
        if (this.isAlpha) {
            addMessage('A deep, powerful howl echoes through the forest...');
        } else {
            addMessage('You hear a wolf howl nearby...');
        }
        
        // Alert other wolves
        wolves.forEach(wolf => {
            if (wolf !== this && !wolf.pacified) {
                const distance = this.mesh.position.distanceTo(wolf.mesh.position);
                if (distance < 100) {
                    wolf.state = 'chase';
                }
            }
        });
    }
    
    updateAnimation(deltaTime) {
        // Simple walking animation
        if (this.state === 'chase' || this.state === 'patrol') {
            const bobAmount = Math.sin(Date.now() * 0.01) * 0.1;
            this.mesh.position.y += bobAmount;
            
            // Slight rotation for walking
            const walkRotation = Math.sin(Date.now() * 0.02) * 0.1;
            this.mesh.rotation.y += walkRotation;
        }
    }
    
    pacify() {
        if (!this.pacified) {
            this.pacified = true;
            this.state = 'pacified';
            gameState.wolvesPacified++;
            
            // Change color to indicate pacification
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    if (this.isAlpha) {
                        child.material.color.set(0x8a2be2); // Purple for alpha
                    } else {
                        child.material.color.set(0x4682b4); // Blue for normal
                    }
                }
            });
            
            addMessage(this.isAlpha ? 
                'The alpha wolf accepts your peace offering.' : 
                'The wolf becomes friendly.'
            );
            
            // Award achievement
            if (this.isAlpha) {
                awardAchievement('pacify_boss');
            } else {
                awardAchievement('pacify_wolf');
            }
        }
    }
}

function createMemoryFragments() {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 80 + Math.random() * 120;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = getTerrainHeight(x, z) + 1;
        
        const fragment = createMemoryFragment(x, y, z, i + 1);
        memoryFragments.push(fragment);
    }
}

function createMemoryFragment(x, y, z, id) {
    const geometry = new THREE.IcosahedronGeometry(0.5, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x9c27b0,
        emissive: 0x9c27b0,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const fragment = new THREE.Mesh(geometry, material);
    fragment.position.set(x, y, z);
    fragment.castShadow = true;
    
    // Add glow effect
    const glowGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x9c27b0,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    fragment.add(glow);
    
    fragment.userData = {
        type: 'memoryFragment',
        canInteract: true,
        id: id,
        collected: false,
        interact: function() {
            if (!this.collected) {
                this.collected = true;
                gameState.memoryFragments++;
                
                // Hide fragment
                fragment.visible = false;
                
                // Update memory UI
                updateMemoryUI();
                
                // Add message
                addMessage(`Memory fragment ${id} collected! (${gameState.memoryFragments}/12)`);
                
                // Check if all fragments collected
                if (gameState.memoryFragments >= 12) {
                    addMessage('All memory fragments collected! The forest\'s secrets are revealed...');
                    awardAchievement('all_memories');
                }
                
                return true;
            }
            return false;
        }
    };
    
    scene.add(fragment);
    return fragment;
}

function createInteractiveObjects() {
    // Create campfire sites
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = getTerrainHeight(x, z);
        
        const campfire = createCampfire(x, y, z);
        campfires.push(campfire);
    }
    
    // Create water sources
    for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        const y = getTerrainHeight(x, z);
        
        if (Math.abs(x) > 100 || Math.abs(z) > 100) {
            const waterSource = createWaterSource(x, y, z);
            interactiveObjects.push(waterSource);
        }
    }
}

function createCampfire(x, y, z) {
    const campfire = new THREE.Group();
    
    // Logs
    for (let i = 0; i < 5; i++) {
        const logLength = 1 + Math.random() * 0.5;
        const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, logLength, 6);
        const logMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        const log = new THREE.Mesh(logGeometry, logMaterial);
        
        const angle = (i / 5) * Math.PI * 2;
        log.position.set(
            Math.cos(angle) * 0.3,
            logLength / 2,
            Math.sin(angle) * 0.3
        );
        log.rotation.z = angle;
        log.rotation.x = Math.PI / 2;
        
        campfire.add(log);
    }
    
    // Fire particles (simplified)
    const fireGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.7
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = 0.4;
    campfire.add(fire);
    
    campfire.position.set(x, y, z);
    
    campfire.userData = {
        type: 'campfire',
        canInteract: true,
        isLit: false,
        interact: function() {
            if (!this.isLit) {
                this.isLit = true;
                addMessage('You light a campfire. Warmth restored.');
                
                // Restore temperature
                gameState.temperature = Math.min(100, gameState.temperature + 20);
                
                // Increase forest mood
                gameState.forestMood = Math.min(100, gameState.forestMood + 5);
                
                // Wolves avoid fire
                wolves.forEach(wolf => {
                    const distance = wolf.mesh.position.distanceTo(campfire.position);
                    if (distance < 20) {
                        wolf.state = 'flee';
                    }
                });
                
                updateHUD();
                return true;
            }
            return false;
        }
    };
    
    scene.add(campfire);
    return campfire;
}

function createWaterSource(x, y, z) {
    const waterSource = new THREE.Group();
    
    // Water pool
    const poolGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16);
    const poolMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.8
    });
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    waterSource.add(pool);
    
    waterSource.position.set(x, y + 0.05, z);
    
    waterSource.userData = {
        type: 'waterSource',
        canInteract: true,
        interact: function() {
            addMessage('You drink from the clear water. Thirst quenched.');
            
            // Restore thirst
            gameState.thirst = Math.min(100, gameState.thirst + 40);
            
            // Chance to get sick
            if (Math.random() < 0.1) {
                gameState.health -= 5;
                addMessage('The water makes you feel sick...');
            }
            
            updateHUD();
            return true;
        }
    };
    
    scene.add(waterSource);
    return waterSource;
}

function getTerrainHeight(x, z) {
    // Simple terrain height calculation
    let height = 0;
    height += Math.sin(x * 0.002) * 15;
    height += Math.sin(z * 0.002) * 15;
    height += Math.sin(x * 0.005 + z * 0.003) * 8;
    height += Math.sin(x * 0.01) * 4;
    height += Math.sin(z * 0.01) * 4;
    return height;
}

// ============================================
// GAME SYSTEMS
// ============================================

function initializeGameSystems() {
    // Initialize HUD
    updateHUD();
    
    // Initialize memory UI
    updateMemoryUI();
    
    // Start game loop
    animate();
}

function updateHUD() {
    // Update stat bars
    document.getElementById('health-bar').style.width = `${gameState.health}%`;
    document.getElementById('sanity-bar').style.width = `${gameState.sanity}%`;
    document.getElementById('hunger-bar').style.width = `${gameState.hunger}%`;
    document.getElementById('thirst-bar').style.width = `${gameState.thirst}%`;
    document.getElementById('temp-bar').style.width = `${gameState.temperature}%`;
    document.getElementById('stamina-bar').style.width = `${gameState.stamina}%`;
    
    // Update stat values
    document.getElementById('health-value').textContent = Math.floor(gameState.health);
    document.getElementById('sanity-value').textContent = Math.floor(gameState.sanity);
    document.getElementById('hunger-value').textContent = Math.floor(gameState.hunger);
    document.getElementById('thirst-value').textContent = Math.floor(gameState.thirst);
    document.getElementById('temp-value').textContent = `${Math.floor(gameState.temperature)}°C`;
    document.getElementById('stamina-value').textContent = Math.floor(gameState.stamina);
    
    // Update time and day
    const hours = Math.floor(gameState.gameTime / 60) % 24;
    const minutes = gameState.gameTime % 60;
    document.getElementById('time-display').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    document.getElementById('day-count').textContent = `Day ${gameState.dayCount}`;
    
    // Update forest mood
    let moodText;
    if (gameState.forestMood > 70) moodText = 'Friendly';
    else if (gameState.forestMood > 30) moodText = 'Neutral';
    else if (gameState.forestMood > -30) moodText = 'Wary';
    else if (gameState.forestMood > -70) moodText = 'Hostile';
    else moodText = 'Vengeful';
    
    document.getElementById('forest-mood').textContent = moodText;
    document.getElementById('mood-bar').style.width = `${(gameState.forestMood + 100) / 2}%`;
    
    // Update weight display
    const totalWeight = gameState.inventory.reduce((sum, item) => sum + item.weight, 0);
    document.getElementById('weight-value').textContent = `${totalWeight}/50`;
}

function updateMemoryUI() {
    const fragmentSlots = document.querySelectorAll('.fragment-slot');
    fragmentSlots.forEach((slot, index) => {
        if (index < gameState.memoryFragments) {
            slot.classList.add('collected');
        } else {
            slot.classList.remove('collected');
        }
    });
    
    document.querySelector('.memory-count').textContent = `${gameState.memoryFragments}/12`;
}

function addMessage(text) {
    const messageLog = document.getElementById('message-log');
    const message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = `<i class="fas fa-info-circle"></i><span>${text}</span>`;
    messageLog.appendChild(message);
    
    // Keep only last 10 messages
    while (messageLog.children.length > 10) {
        messageLog.removeChild(messageLog.firstChild);
    }
    
    // Auto scroll to bottom
    messageLog.scrollTop = messageLog.scrollHeight;
}

function showInteractionPrompt(text) {
    const prompt = document.getElementById('interaction-prompt');
    document.getElementById('prompt-text').textContent = text;
    prompt.classList.remove('hidden');
}

function hideInteractionPrompt() {
    document.getElementById('interaction-prompt').classList.add('hidden');
}

function updateSanityEffects() {
    const overlay = document.getElementById('sanity-overlay');
    
    if (gameState.sanity < 30) {
        overlay.style.opacity = (30 - gameState.sanity) / 30;
        
        // Add visual distortions
        if (Math.random() < 0.01) {
            camera.rotation.x += (Math.random() - 0.5) * 0.1;
            camera.rotation.y += (Math.random() - 0.5) * 0.1;
        }
        
        // Add whispers
        if (Math.random() < 0.005) {
            const whispers = [
                "The trees are watching...",
                "You're not alone here...",
                "They remember what you did...",
                "The forest whispers your name...",
                "Leave while you still can...",
                "The wolves know your scent...",
                "Your memories are not your own..."
            ];
            addMessage(whispers[Math.floor(Math.random() * whispers.length)]);
        }
    } else {
        overlay.style.opacity = 0;
    }
}

function updateSurvivalStats(deltaTime) {
    // Hunger and thirst decay
    gameState.hunger -= 0.2 * deltaTime;
    gameState.thirst -= 0.3 * deltaTime;
    
    // Temperature changes based on time of day
    const timeOfDay = (gameState.gameTime % 1440) / 1440;
    const isNight = timeOfDay > 0.75 || timeOfDay < 0.25;
    
    if (isNight) {
        gameState.temperature -= 0.5 * deltaTime;
    } else {
        gameState.temperature += 0.2 * deltaTime;
    }
    
    // Sanity effects
    if (gameState.sanity < 50) {
        gameState.sanity -= 0.1 * deltaTime;
    } else {
        gameState.sanity += 0.05 * deltaTime;
    }
    
    // Health effects from low stats
    if (gameState.hunger <= 0 || gameState.thirst <= 0) {
        gameState.health -= 2 * deltaTime;
        addMessage('Starvation/dehydration is damaging your health!');
    }
    
    if (gameState.temperature < 20) {
        gameState.health -= 3 * deltaTime;
        addMessage('Hypothermia is setting in!');
    }
    
    if (gameState.temperature > 40) {
        gameState.health -= 2 * deltaTime;
        addMessage('Heat stroke is affecting you!');
    }
    
    // Check for death
    if (gameState.health <= 0) {
        gameOver('Succumbed to the elements');
    }
    
    // Clamp values
    gameState.hunger = Math.max(0, Math.min(100, gameState.hunger));
    gameState.thirst = Math.max(0, Math.min(100, gameState.thirst));
    gameState.temperature = Math.max(0, Math.min(100, gameState.temperature));
    gameState.health = Math.max(0, Math.min(100, gameState.health));
    gameState.sanity = Math.max(0, Math.min(100, gameState.sanity));
    gameState.stamina = Math.max(0, Math.min(100, gameState.stamina));
    
    // Update HUD
    updateHUD();
}

function updateDayNightCycle(deltaTime) {
    // Update game time (10x faster than real time)
    gameState.gameTime += deltaTime * 10;
    
    // Check for new day
    if (gameState.gameTime >= 1440) { // 24 hours in minutes
        gameState.gameTime = 0;
        gameState.dayCount++;
        addMessage(`Day ${gameState.dayCount} begins...`);
        
        // Award survival achievement
        if (gameState.dayCount === 2) {
            awardAchievement('survive_1_day');
        } else if (gameState.dayCount === 8) {
            awardAchievement('survive_7_days');
        }
    }
    
    // Update lighting based on time of day
    const timeOfDay = (gameState.gameTime % 1440) / 1440;
    const sunAngle = timeOfDay * Math.PI * 2;
    
    // Update sun position
    const sun = scene.children.find(child => child.isDirectionalLight && child.position.y > 0);
    if (sun) {
        sun.position.x = Math.cos(sunAngle) * 200;
        sun.position.z = Math.sin(sunAngle) * 200;
        sun.position.y = Math.sin(sunAngle) * 100 + 100;
        
        // Update light intensity
        if (timeOfDay > 0.75 || timeOfDay < 0.25) { // Night
            sun.intensity = 0.1;
            scene.fog.color.setHex(0x0a0a2a);
        } else if (timeOfDay > 0.7 || timeOfDay < 0.3) { // Dawn/Dusk
            sun.intensity = 0.5;
            scene.fog.color.setHex(0xffa07a);
        } else { // Day
            sun.intensity = 0.8;
            scene.fog.color.setHex(0x87CEEB);
        }
    }
}

function checkInteractions() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const allObjects = [...memoryFragments, ...plants, ...campfires, ...interactiveObjects];
    const intersects = raycaster.intersectObjects(allObjects, true);
    
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        
        // Traverse up to find parent with userData
        while (obj.parent && !obj.userData.type) {
            obj = obj.parent;
        }
        
        if (obj.userData.canInteract && intersects[0].distance < 5) {
            showInteractionPrompt(`Press E to ${getInteractionText(obj.userData.type)}`);
            
            if (keys['e']) {
                if (obj.userData.interact && obj.userData.interact()) {
                    // Interaction successful
                    keys['e'] = false; // Prevent repeated interactions
                }
            }
        } else {
            hideInteractionPrompt();
        }
    } else {
        hideInteractionPrompt();
    }
}

function getInteractionText(type) {
    switch(type) {
        case 'berryBush': return 'pick berries';
        case 'memoryFragment': return 'collect memory';
        case 'campfire': return 'light campfire';
        case 'waterSource': return 'drink water';
        default: return 'interact';
    }
}

function updateDistanceTraveled() {
    const currentPosition = camera.position.clone();
    const distance = currentPosition.distanceTo(lastPosition);
    
    if (distance > 10) { // Only update for significant movement
        gameState.distanceTraveled += distance;
        lastPosition.copy(currentPosition);
        
        // Update discovered areas
        const areaX = Math.floor(currentPosition.x / 100) * 100;
        const areaZ = Math.floor(currentPosition.z / 100) * 100;
        const areaKey = `${areaX},${areaZ}`;
        
        if (!gameState.discoveredAreas.has(areaKey)) {
            gameState.discoveredAreas.add(areaKey);
            const totalAreas = Math.ceil(800 / 100) * Math.ceil(800 / 100);
            const exploredPercent = Math.round((gameState.discoveredAreas.size / totalAreas) * 100);
            
            if (exploredPercent >= 100) {
                awardAchievement('explore_all');
            }
        }
    }
}

function awardAchievement(achievementId) {
    if (!gameState.achievements.has(achievementId)) {
        gameState.achievements.add(achievementId);
        
        // Find achievement name
        let achievementName = '';
        for (const category in achievements) {
            const achievement = achievements[category].find(a => a.id === achievementId);
            if (achievement) {
                achievementName = achievement.name;
                break;
            }
        }
        
        addMessage(`Achievement Unlocked: ${achievementName}!`);
    }
}

function gameOver(cause) {
    gameState.isGameOver = true;
    
    // Update death screen
    document.getElementById('death-cause').textContent = cause;
    
    const hours = Math.floor(gameState.gameTime / 60);
    const minutes = gameState.gameTime % 60;
    document.getElementById('death-time').textContent = `${hours}h ${minutes}m`;
    document.getElementById('death-memories').textContent = `${gameState.memoryFragments}/12`;
    document.getElementById('death-days').textContent = gameState.dayCount;
    
    // Show death screen
    showScreen('death-screen');
}

function winGame(endingType) {
    gameState.isGameWon = true;
    
    // Update win screen based on ending
    const endings = {
        'friendly': {
            title: 'The Forest\'s Friend',
            description: 'You understood the forest and lived in harmony with its creatures.',
            type: 'Friendly Forest'
        },
        'neutral': {
            title: 'The Survivor',
            description: 'You survived the forest and found your way back to civilization.',
            type: 'Neutral Ending'
        },
        'hostile': {
            title: 'The Conqueror',
            description: 'You fought against the forest and emerged victorious.',
            type: 'Hostile Takeover'
        },
        'true': {
            title: 'Echoes Understood',
            description: 'You uncovered all secrets and became one with the forest.',
            type: 'True Ending'
        }
    };
    
    const ending = endings[endingType] || endings.neutral;
    
    document.getElementById('ending-title').textContent = ending.title;
    document.getElementById('ending-description').textContent = ending.description;
    document.getElementById('ending-type').textContent = ending.type;
    
    const hours = Math.floor(gameState.gameTime / 60);
    const minutes = gameState.gameTime % 60;
    document.getElementById('total-time').textContent = `${hours}h ${minutes}m`;
    document.getElementById('total-memories').textContent = `${gameState.memoryFragments}/12`;
    document.getElementById('wolf-relationship').textContent = gameState.wolvesPacified > 5 ? 'Friendly' : 'Neutral';
    
    // Show win screen
    showScreen('win-screen');
}

// ============================================
// INPUT HANDLING
// ============================================

function setupEventListeners() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        
        // Handle special keys
        switch(key) {
            case 'escape':
                if (gameState.currentScreen === 'game') {
                    togglePauseMenu();
                } else if (gameState.currentScreen === 'pause') {
                    togglePauseMenu();
                } else if (gameState.currentScreen === 'memory') {
                    closeMemoryInterface();
                }
                break;
                
            case 'f':
                toggleFlashlight();
                break;
                
            case 'm':
                if (gameState.currentScreen === 'game') {
                    openMemoryInterface();
                }
                break;
                
            case 'h':
                toggleControlsHelp();
                break;
                
            case '1':
            case '2':
            case '3':
            case '4':
                selectQuickItem(parseInt(key) - 1);
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse input
    document.addEventListener('mousemove', (e) => {
        mouse.movementX = e.movementX;
        mouse.movementY = e.movementY;
    });
    
    document.addEventListener('click', () => {
        if (gameState.currentScreen === 'game' && !isMouseLocked) {
            canvas.requestPointerLock();
        }
    });
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
        isMouseLocked = document.pointerLockElement === canvas;
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Menu button events
    setupMenuEvents();
}

function setupMenuEvents() {
    // Main menu buttons
    document.getElementById('new-game').addEventListener('click', startNewGame);
    document.getElementById('continue-game').addEventListener('click', continueGame);
    document.getElementById('load-game').addEventListener('click', showLoadScreen);
    document.getElementById('settings').addEventListener('click', showSettingsScreen);
    document.getElementById('credits').addEventListener('click', showCreditsScreen);
    document.getElementById('quit').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit?')) {
            window.close();
        }
    });
    
    // Cutscene skip
    document.getElementById('skip-cutscene').addEventListener('click', () => {
        hideScreen('intro-cutscene');
        showScreen('game-screen');
        gameState.currentScreen = 'game';
        canvas.requestPointerLock();
    });
    
    // Pause menu buttons
    document.getElementById('resume-game').addEventListener('click', togglePauseMenu);
    document.getElementById('save-game').addEventListener('click', saveGame);
    document.getElementById('load-game-menu').addEventListener('click', showLoadScreen);
    document.getElementById('settings-menu').addEventListener('click', showSettingsScreen);
    document.getElementById('quit-to-menu').addEventListener('click', quitToMainMenu);
    
    // Death screen buttons
    document.getElementById('retry-game').addEventListener('click', startNewGame);
    document.getElementById('death-to-menu').addEventListener('click', quitToMainMenu);
    
    // Win screen buttons
    document.getElementById('new-game-plus').addEventListener('click', startNewGamePlus);
    document.getElementById('win-to-menu').addEventListener('click', quitToMainMenu);
    
    // Memory interface
    document.getElementById('close-memory').addEventListener('click', closeMemoryInterface);
    document.getElementById('use-memory').addEventListener('click', useMemory);
    
    // Settings
    document.getElementById('apply-settings').addEventListener('click', applySettings);
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
    document.getElementById('back-to-menu').addEventListener('click', () => {
        hideScreen('settings-screen');
        showScreen('main-menu');
    });
    
    // Load game
    document.getElementById('back-from-load').addEventListener('click', () => {
        if (gameState.currentScreen === 'pause') {
            hideScreen('load-screen');
            showScreen('game-screen');
        } else {
            hideScreen('load-screen');
            showScreen('main-menu');
        }
    });
    document.getElementById('delete-save').addEventListener('click', deleteSave);
    
    // Credits
    document.getElementById('back-from-credits').addEventListener('click', () => {
        hideScreen('credits-screen');
        showScreen('main-menu');
    });
}

function toggleFlashlight() {
    player.flashlightOn = !player.flashlightOn;
    player.flashlight.visible = player.flashlightOn;
    addMessage(player.flashlightOn ? 'Flashlight ON' : 'Flashlight OFF');
}

function togglePauseMenu() {
    if (gameState.currentScreen === 'game') {
        gameState.isPaused = true;
        gameState.currentScreen = 'pause';
        
        // Update pause menu stats
        const hours = Math.floor(gameState.gameTime / 60);
        const minutes = gameState.gameTime % 60;
        document.getElementById('survived-time').textContent = `${hours}h ${minutes}m`;
        document.getElementById('survived-days').textContent = gameState.dayCount;
        document.getElementById('distance-traveled').textContent = `${Math.round(gameState.distanceTraveled)}m`;
        document.getElementById('memories-found').textContent = `${gameState.memoryFragments}/12`;
        document.getElementById('areas-explored').textContent = 
            `${Math.round((gameState.discoveredAreas.size / 64) * 100)}%`;
        document.getElementById('wolf-encounters').textContent = gameState.wolfEncounters;
        
        document.exitPointerLock();
        showScreen('pause-menu');
    } else if (gameState.currentScreen === 'pause') {
        gameState.isPaused = false;
        gameState.currentScreen = 'game';
        hideScreen('pause-menu');
        canvas.requestPointerLock();
    }
}

function openMemoryInterface() {
    if (gameState.memoryFragments === 0) {
        addMessage('No memory fragments collected yet.');
        return;
    }
    
    gameState.currentScreen = 'memory';
    document.exitPointerLock();
    
    // Populate memory grid
    const memoryGrid = document.getElementById('memory-grid');
    memoryGrid.innerHTML = '';
    
    memoryData.forEach((memory, index) => {
        const card = document.createElement('div');
        card.className = `memory-card ${index < gameState.memoryFragments ? 'collected' : ''}`;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="memory-icon"><i class="fas fa-brain"></i></div>
            <div class="memory-title">${memory.title}</div>
            <div class="memory-number">#${index + 1}</div>
        `;
        
        if (index < gameState.memoryFragments) {
            card.addEventListener('click', () => selectMemory(index));
        }
        
        memoryGrid.appendChild(card);
    });
    
    showScreen('memory-interface');
}

function closeMemoryInterface() {
    hideScreen('memory-interface');
    gameState.currentScreen = 'game';
    canvas.requestPointerLock();
}

function selectMemory(index) {
    const memory = memoryData[index];
    const useButton = document.getElementById('use-memory');
    
    document.getElementById('memory-title').textContent = memory.title;
    document.getElementById('memory-description').textContent = memory.description;
    
    const effectsList = document.getElementById('memory-effects-list');
    effectsList.innerHTML = `<li>${memory.effect}</li>`;
    
    // Calculate clarity
    const clarity = Math.min(100, gameState.memoryFragments * 8.33);
    document.getElementById('clarity-value').textContent = `${Math.floor(clarity)}%`;
    
    useButton.classList.remove('hidden');
    useButton.dataset.memoryIndex = index;
}

function useMemory() {
    const index = parseInt(document.getElementById('use-memory').dataset.memoryIndex);
    const memory = memoryData[index];
    
    // Apply memory effects
    switch(index) {
        case 0: // The Bus Ride
            gameState.sanity = Math.min(100, gameState.sanity + 10);
            addMessage('Sanity restored by memories of the beginning.');
            break;
        case 2: // First Howl
            wolves.forEach(wolf => {
                if (!wolf.isAlpha) {
                    wolf.pacify();
                }
            });
            addMessage('Wolves become less aggressive.');
            break;
        case 6: // River of Memories
            gameState.health = 100;
            gameState.hunger = 100;
            gameState.thirst = 100;
            gameState.sanity = 100;
            addMessage('All stats restored by the river\'s memories.');
            break;
        case 9: // Forest's Heart
            gameState.temperature = 37;
            addMessage('Temperature stabilized by the forest\'s heart.');
            break;
        case 11: // Echoes
            if (gameState.memoryFragments === 12) {
                winGame('true');
            }
            break;
    }
    
    updateHUD();
    closeMemoryInterface();
}

function toggleControlsHelp() {
    const help = document.getElementById('controls-help');
    help.classList.toggle('hidden');
}

function selectQuickItem(slot) {
    const slots = document.querySelectorAll('.item-slot');
    slots.forEach(s => s.classList.remove('active'));
    slots[slot].classList.add('active');
    player.currentItem = slot;
    
    addMessage(`Selected: ${slots[slot].querySelector('.item-name').textContent}`);
}

// ============================================
// GAME LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);
    deltaTime = clock.getDelta();
    
    // Don't update if game is paused or over
    if (gameState.isPaused || gameState.isGameOver || gameState.isGameWon || gameState.currentScreen !== 'game') {
        return;
    }
    
    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Update wolves
    wolves.forEach(wolf => wolf.update(deltaTime));
    
    // Update memory fragments
    memoryFragments.forEach(fragment => {
        if (fragment.userData && !fragment.userData.collected) {
            fragment.rotation.y += deltaTime;
            
            // Pulse glow effect
            const glow = fragment.children[0];
            if (glow) {
                const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
                glow.scale.setScalar(pulse);
            }
        }
    });
    
    // Check interactions
    checkInteractions();
    
    // Update survival stats
    updateSurvivalStats(deltaTime);
    
    // Update day/night cycle
    updateDayNightCycle(deltaTime);
    
    // Update sanity effects
    updateSanityEffects();
    
    // Update distance traveled
    updateDistanceTraveled();
    
    // Auto-save every 5 minutes
    if (settings.autoSave && gameState.gameTime % 5 < deltaTime * 10) {
        autoSave();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

function updatePlayerMovement(deltaTime) {
    if (!isMouseLocked) return;
    
    // Update camera rotation based on mouse movement
    const sensitivity = settings.mouseSensitivity * 0.002;
    camera.rotation.y -= mouse.movementX * sensitivity;
    camera.rotation.x -= mouse.movementY * sensitivity * (settings.invertY ? -1 : 1);
    
    // Clamp vertical rotation
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    
    // Reset mouse movement
    mouse.movementX = 0;
    mouse.movementY = 0;
    
    // Calculate movement direction
    const moveVector = new THREE.Vector3();
    
    if (keys['w']) moveVector.z -= 1;
    if (keys['s']) moveVector.z += 1;
    if (keys['a']) moveVector.x -= 1;
    if (keys['d']) moveVector.x += 1;
    
    if (moveVector.length() > 0) {
        moveVector.normalize();
        
        // Handle sprinting
        if (keys['shift'] && gameState.stamina > 0) {
            player.isSprinting = true;
            moveVector.multiplyScalar(player.sprintSpeed * deltaTime);
            gameState.stamina -= 20 * deltaTime;
        } else {
            player.isSprinting = false;
            moveVector.multiplyScalar(player.speed * deltaTime);
            
            // Regenerate stamina when not sprinting
            if (gameState.stamina < 100) {
                gameState.stamina += 10 * deltaTime;
            }
        }
        
        // Apply movement relative to camera direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const moveDirection = forward.multiplyScalar(moveVector.z)
            .add(right.multiplyScalar(moveVector.x));
        
        // Apply gravity
        player.velocity.y -= 9.8 * deltaTime;
        moveDirection.y = player.velocity.y * deltaTime;
        
        // Check collision with terrain
        const newPosition = camera.position.clone().add(moveDirection);
        const terrainHeight = getTerrainHeight(newPosition.x, newPosition.z);
        
        if (newPosition.y <= terrainHeight + player.height) {
            newPosition.y = terrainHeight + player.height;
            player.velocity.y = 0;
            player.isGrounded = true;
        } else {
            player.isGrounded = false;
        }
        
        // Update camera position
        camera.position.copy(newPosition);
        
        // Apply head bobbing when walking
        if (moveVector.length() > 0 && player.isGrounded) {
            const bobAmount = Math.sin(Date.now() * 0.01) * 0.05;
            camera.position.y += bobAmount;
        }
    } else {
        player.isSprinting = false;
        
        // Regenerate stamina when standing still
        if (gameState.stamina < 100) {
            gameState.stamina += 15 * deltaTime;
        }
    }
    
    // Handle jumping
    if (keys[' '] && player.isGrounded) {
        player.velocity.y = player.jumpForce;
        player.isGrounded = false;
        keys[' '] = false; // Prevent continuous jumping
    }
    
    // Handle crouching
    if (settings.toggleCrouch) {
        if (keys['c'] && !keys['c_called']) {
            player.isCrouching = !player.isCrouching;
            keys['c_called'] = true;
        } else if (!keys['c']) {
            keys['c_called'] = false;
        }
    } else {
        player.isCrouching = keys['c'];
    }
    
    if (player.isCrouching) {
        camera.position.y = player.height * 0.6;
    } else {
        camera.position.y = player.height;
    }
    
    // Update flashlight position and direction
    if (player.flashlight) {
        player.flashlight.position.copy(camera.position);
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        player.flashlight.target.position.copy(camera.position).add(forward.multiplyScalar(10));
    }
}

// ============================================
// MENU & SCREEN MANAGEMENT
// ============================================

function showScreen(screenId) {
    document.getElementById(screenId).classList.remove('hidden');
    gameState.currentScreen = screenId.replace('-screen', '');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.add('hidden');
}

function startNewGame() {
    // Reset game state
    gameState = {
        isPaused: false,
        isGameOver: false,
        isGameWon: false,
        currentScreen: 'game',
        gameTime: 720, // Start at noon
        dayCount: 1,
        memoryFragments: 0,
        forestMood: 50,
        wolvesPacified: 0,
        sanity: 100,
        health: 100,
        hunger: 100,
        thirst: 100,
        temperature: 37,
        stamina: 100,
        inventory: [],
        discoveredAreas: new Set(['start']),
        playerPosition: { x: 0, y: 0, z: 0 },
        distanceTraveled: 0,
        wolfEncounters: 0,
        achievements: new Set()
    };
    
    // Reset player position
    camera.position.set(0, getTerrainHeight(0, 0) + player.height, 0);
    lastPosition.copy(camera.position);
    
    // Reset wolves
    wolves.forEach(wolf => {
        scene.remove(wolf.mesh);
    });
    wolves = [];
    createWolves();
    
    // Reset memory fragments
    memoryFragments.forEach(fragment => {
        fragment.visible = true;
        fragment.userData.collected = false;
    });
    gameState.memoryFragments = 0;
    
    // Reset campfires
    campfires.forEach(campfire => {
        campfire.userData.isLit = false;
    });
    
    // Update HUD
    updateHUD();
    updateMemoryUI();
    
    // Clear message log
    document.getElementById('message-log').innerHTML = `
        <div class="message">
            <i class="fas fa-info-circle"></i>
            <span>You wake up in the forest. Find shelter and food.</span>
        </div>
        <div class="message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Listen for wolf howls. They hunt at night.</span>
        </div>
    `;
    
    // Hide all screens and show game
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show intro cutscene or go straight to game
    if (settings.hints) {
        showScreen('intro-cutscene');
        startCutscene();
    } else {
        showScreen('game-screen');
        gameState.currentScreen = 'game';
        canvas.requestPointerLock();
    }
}

function startNewGamePlus() {
    // Start new game with some bonuses
    startNewGame();
    
    // Add bonuses for NG+
    gameState.sanity = 120; // Overcapped
    gameState.health = 120;
    gameState.forestMood = 80;
    
    addMessage('New Game+ started! Enhanced abilities activated.');
    updateHUD();
}

function continueGame() {
    loadGame();
}

function startCutscene() {
    const texts = document.querySelectorAll('.typewriter');
    texts.forEach((text, index) => {
        setTimeout(() => {
            if (index > 0) {
                texts[index - 1].classList.add('hidden');
            }
            text.classList.remove('hidden');
        }, index * 3500);
    });
    
    // Auto-proceed to game after cutscene
    setTimeout(() => {
        if (gameState.currentScreen === 'cutscene') {
            hideScreen('intro-cutscene');
            showScreen('game-screen');
            gameState.currentScreen = 'game';
            canvas.requestPointerLock();
        }
    }, texts.length * 3500 + 2000);
}

function quitToMainMenu() {
    hideScreen('pause-menu');
    hideScreen('death-screen');
    hideScreen('win-screen');
    hideScreen('memory-interface');
    showScreen('main-menu');
    gameState.currentScreen = 'menu';
}

// ============================================
// SAVE/LOAD SYSTEM
// ============================================

function saveGame() {
    const saveData = {
        gameState: {
            ...gameState,
            discoveredAreas: Array.from(gameState.discoveredAreas),
            achievements: Array.from(gameState.achievements)
        },
        playerPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        timestamp: Date.now(),
        playtime: gameState.gameTime + (gameState.dayCount - 1) * 1440
    };
    
    // Convert to JSON and save to localStorage
    const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
    const slotId = `save_${Date.now()}`;
    saveSlots[slotId] = saveData;
    
    localStorage.setItem('echoesSaveSlots', JSON.stringify(saveSlots));
    
    addMessage('Game saved successfully!');
    
    // Update load screen if open
    if (gameState.currentScreen === 'pause') {
        updateLoadScreen();
    }
}

function autoSave() {
    if (settings.autoSave) {
        const saveData = {
            gameState: {
                ...gameState,
                discoveredAreas: Array.from(gameState.discoveredAreas),
                achievements: Array.from(gameState.achievements)
            },
            playerPosition: {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            },
            timestamp: Date.now(),
            playtime: gameState.gameTime + (gameState.dayCount - 1) * 1440
        };
        
        const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
        saveSlots['autosave'] = saveData;
        localStorage.setItem('echoesSaveSlots', JSON.stringify(saveSlots));
    }
}

function loadGame() {
    const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
    const saveData = saveSlots['autosave'] || Object.values(saveSlots)[0];
    
    if (saveData) {
        // Restore game state
        const loadedState = saveData.gameState;
        gameState = {
            ...loadedState,
            discoveredAreas: new Set(loadedState.discoveredAreas),
            achievements: new Set(loadedState.achievements)
        };
        
        // Restore player position
        camera.position.set(
            saveData.playerPosition.x,
            saveData.playerPosition.y,
            saveData.playerPosition.z
        );
        lastPosition.copy(camera.position);
        
        // Update UI
        updateHUD();
        updateMemoryUI();
        
        // Show game screen
        hideScreen('load-screen');
        hideScreen('main-menu');
        showScreen('game-screen');
        gameState.currentScreen = 'game';
        canvas.requestPointerLock();
        
        addMessage('Game loaded successfully!');
    } else {
        addMessage('No save file found. Starting new game...');
        startNewGame();
    }
}

function showLoadScreen() {
    updateLoadScreen();
    
    if (gameState.currentScreen === 'pause') {
        hideScreen('pause-menu');
    } else {
        hideScreen('main-menu');
    }
    
    showScreen('load-screen');
}

function updateLoadScreen() {
    const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
    const slotsContainer = document.getElementById('save-slots');
    slotsContainer.innerHTML = '';
    
    Object.entries(saveSlots).forEach(([id, saveData]) => {
        const date = new Date(saveData.timestamp);
        const hours = Math.floor(saveData.playtime / 60);
        const minutes = saveData.playtime % 60;
        
        const slot = document.createElement('div');
        slot.className = 'save-slot';
        slot.dataset.saveId = id;
        
        slot.innerHTML = `
            <div class="save-title">${id === 'autosave' ? 'Autosave' : 'Manual Save'}</div>
            <div class="save-info">
                <div>Date: ${date.toLocaleDateString()}</div>
                <div>Time: ${date.toLocaleTimeString()}</div>
                <div>Playtime: ${hours}h ${minutes}m</div>
                <div>Day: ${saveData.gameState.dayCount}</div>
                <div>Memories: ${saveData.gameState.memoryFragments}/12</div>
            </div>
        `;
        
        slot.addEventListener('click', () => loadSpecificSave(id));
        slotsContainer.appendChild(slot);
    });
    
    if (Object.keys(saveSlots).length === 0) {
        slotsContainer.innerHTML = '<div class="no-saves">No save files found</div>';
    }
}

function loadSpecificSave(saveId) {
    const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
    const saveData = saveSlots[saveId];
    
    if (saveData) {
        // Restore game state
        const loadedState = saveData.gameState;
        gameState = {
            ...loadedState,
            discoveredAreas: new Set(loadedState.discoveredAreas),
            achievements: new Set(loadedState.achievements)
        };
        
        // Restore player position
        camera.position.set(
            saveData.playerPosition.x,
            saveData.playerPosition.y,
            saveData.playerPosition.z
        );
        lastPosition.copy(camera.position);
        
        // Update UI
        updateHUD();
        updateMemoryUI();
        
        // Show game screen
        hideScreen('load-screen');
        showScreen('game-screen');
        gameState.currentScreen = 'game';
        canvas.requestPointerLock();
        
        addMessage('Game loaded successfully!');
    }
}

function deleteSave() {
    const selectedSlot = document.querySelector('.save-slot.active');
    if (selectedSlot) {
        const saveId = selectedSlot.dataset.saveId;
        const saveSlots = JSON.parse(localStorage.getItem('echoesSaveSlots') || '{}');
        delete saveSlots[saveId];
        localStorage.setItem('echoesSaveSlots', JSON.stringify(saveSlots));
        updateLoadScreen();
    }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

function showSettingsScreen() {
    // Update settings UI with current values
    document.getElementById('quality').value = settings.quality;
    document.getElementById('render-distance').value = settings.renderDistance;
    document.getElementById('render-distance-value').textContent = `${settings.renderDistance}m`;
    document.getElementById('shadows').checked = settings.shadows;
    document.getElementById('particles').checked = settings.particles;
    
    document.getElementById('master-volume').value = settings.masterVolume;
    document.getElementById('master-volume-value').textContent = `${settings.masterVolume}%`;
    document.getElementById('sfx-volume').value = settings.sfxVolume;
    document.getElementById('sfx-volume-value').textContent = `${settings.sfxVolume}%`;
    document.getElementById('music-volume').value = settings.musicVolume;
    document.getElementById('music-volume-value').textContent = `${settings.musicVolume}%`;
    document.getElementById('spatial-audio').checked = settings.spatialAudio;
    
    document.getElementById('mouse-sensitivity').value = settings.mouseSensitivity;
    document.getElementById('mouse-sensitivity-value').textContent = settings.mouseSensitivity;
    document.getElementById('fov').value = settings.fov;
    document.getElementById('fov-value').textContent = `${settings.fov}°`;
    document.getElementById('auto-save').checked = settings.autoSave;
    document.getElementById('hints').checked = settings.hints;
    
    document.getElementById('invert-y').checked = settings.invertY;
    document.getElementById('toggle-crouch').checked = settings.toggleCrouch;
    document.getElementById('keyboard-layout').value = settings.keyboardLayout;
    
    // Add event listeners for real-time updates
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', updateSliderValue);
    });
    
    // Show settings screen
    if (gameState.currentScreen === 'pause') {
        hideScreen('pause-menu');
    } else {
        hideScreen('main-menu');
    }
    showScreen('settings-screen');
}

function updateSliderValue(e) {
    const slider = e.target;
    const valueSpan = document.getElementById(`${slider.id}-value`);
    
    if (valueSpan) {
        switch(slider.id) {
            case 'render-distance':
                valueSpan.textContent = `${slider.value}m`;
                break;
            case 'fov':
                valueSpan.textContent = `${slider.value}°`;
                break;
            case 'master-volume':
            case 'sfx-volume':
            case 'music-volume':
                valueSpan.textContent = `${slider.value}%`;
                break;
            default:
                valueSpan.textContent = slider.value;
        }
    }
}

function applySettings() {
    // Get values from UI
    settings.quality = document.getElementById('quality').value;
    settings.renderDistance = parseInt(document.getElementById('render-distance').value);
    settings.shadows = document.getElementById('shadows').checked;
    settings.particles = document.getElementById('particles').checked;
    
    settings.masterVolume = parseInt(document.getElementById('master-volume').value);
    settings.sfxVolume = parseInt(document.getElementById('sfx-volume').value);
    settings.musicVolume = parseInt(document.getElementById('music-volume').value);
    settings.spatialAudio = document.getElementById('spatial-audio').checked;
    
    settings.mouseSensitivity = parseInt(document.getElementById('mouse-sensitivity').value);
    settings.fov = parseInt(document.getElementById('fov').value);
    settings.autoSave = document.getElementById('auto-save').checked;
    settings.hints = document.getElementById('hints').checked;
    
    settings.invertY = document.getElementById('invert-y').checked;
    settings.toggleCrouch = document.getElementById('toggle-crouch').checked;
    settings.keyboardLayout = document.getElementById('keyboard-layout').value;
    
    // Apply Three.js settings
    renderer.shadowMap.enabled = settings.shadows;
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
    scene.fog.far = settings.renderDistance;
    
    // Update audio settings
    if (audioListener) {
        audioListener.setMasterVolume(settings.masterVolume / 100);
    }
    
    // Save settings to localStorage
    localStorage.setItem('echoesSettings', JSON.stringify(settings));
    
    addMessage('Settings applied successfully!');
    
    // Return to appropriate screen
    if (gameState.currentScreen === 'pause') {
        hideScreen('settings-screen');
        showScreen('pause-menu');
    } else {
        hideScreen('settings-screen');
        showScreen('main-menu');
    }
}

function resetSettings() {
    if (confirm('Reset all settings to default?')) {
        settings = {
            quality: 'medium',
            renderDistance: 500,
            shadows: true,
            particles: true,
            masterVolume: 80,
            sfxVolume: 100,
            musicVolume: 60,
            spatialAudio: true,
            mouseSensitivity: 5,
            fov: 90,
            autoSave: true,
            hints: true,
            invertY: false,
            toggleCrouch: false,
            keyboardLayout: 'qwerty'
        };
        
        localStorage.removeItem('echoesSettings');
        showSettingsScreen();
    }
}

function loadSettings() {
    const savedSettings = localStorage.getItem('echoesSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

// ============================================
// AUDIO SYSTEM
// ============================================

function loadBackgroundMusic() {
    // This is a placeholder for actual audio loading
    // In a real implementation, you would load actual audio files
    
    addMessage('Audio system initialized');
}

function showCreditsScreen() {
    hideScreen('main-menu');
    showScreen('credits-screen');
}

// ============================================
// ASSET LOADING
// ============================================

async function loadAssets() {
    // Update loading progress
    const progressBar = document.querySelector('.progress');
    const stages = [
        'Initializing engine...',
        'Loading terrain...',
        'Generating forest...',
        'Creating creatures...',
        'Loading audio...',
        'Finalizing...'
    ];
    
    for (let i = 0; i < stages.length; i++) {
        progressBar.style.width = `${((i + 1) / stages.length) * 100}%`;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// ============================================
// DEBUG FUNCTIONS (Remove in production)
// ============================================

// Add debug hotkeys
document.addEventListener('keydown', (e) => {
    if (e.key === '`' && e.ctrlKey) { // Ctrl+` for debug menu
        if (confirm('Debug Menu:\n1. Add all memories\n2. Restore all stats\n3. Teleport to center\n4. Spawn wolf\n\nSelect option?')) {
            const choice = prompt('Enter option (1-4):');
            switch(choice) {
                case '1':
                    gameState.memoryFragments = 12;
                    updateMemoryUI();
                    addMessage('Debug: All memories added');
                    break;
                case '2':
                    gameState.health = 100;
                    gameState.hunger = 100;
                    gameState.thirst = 100;
                    gameState.sanity = 100;
                    gameState.temperature = 37;
                    updateHUD();
                    addMessage('Debug: All stats restored');
                    break;
                case '3':
                    camera.position.set(0, getTerrainHeight(0, 0) + player.height, 0);
                    addMessage('Debug: Teleported to center');
                    break;
                case '4':
                    const wolf = new Wolf(
                        camera.position.x + 10,
                        getTerrainHeight(camera.position.x + 10, camera.position.z) + 0.5,
                        camera.position.z,
                        false
                    );
                    wolves.push(wolf);
                    addMessage('Debug: Wolf spawned');
                    break;
            }
        }
    }
});
