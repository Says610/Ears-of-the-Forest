// =========================================================
// EARS OF THE FOREST - MAIN GAME SCRIPT
// =========================================================

class EarsOfTheForest {
    constructor() {
        // Core game state
        this.isRunning = false;
        this.isPaused = false;
        this.isInCutscene = false;
        this.gameTime = 0;
        this.gameStarted = false;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Camera controls
        this.cameraRotation = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        
        // Player stats
        this.player = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            hunger: 100,
            maxHunger: 100,
            thirst: 100,
            maxThirst: 100,
            temperature: 37,
            minTemperature: 35,
            maxTemperature: 40,
            fear: 5,
            maxFear: 100,
            battery: 100,
            maxBattery: 100,
            position: new THREE.Vector3(0, 1.7, 5),
            velocity: new THREE.Vector3(),
            onGround: true,
            movementSpeed: 5,
            sprintSpeed: 8,
            crouchSpeed: 2,
            currentSpeed: 5,
            isCrouching: false,
            isExhausted: false,
            hypothermia: false,
            poisoned: false
        };
        
        // Input system
        this.keys = {};
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            flashlight: true,
            crouch: false
        };
        
        // World objects
        this.trees = [];
        this.rocks = [];
        this.wolves = [];
        this.berries = [];
        this.mushrooms = [];
        this.waterSources = [];
        this.campfires = [];
        this.sticks = [];
        this.heartseedTree = null;
        this.cave = null;
        this.flashlight = null;
        this.sunLight = null;
        this.fog = null;
        this.particleSystem = null;
        
        // Weather system
        this.weather = {
            isRaining: false,
            rainIntensity: 0,
            temperature: 20,
            timeOfDay: 16, // 4 PM
            fogDensity: 0.015
        };
        
        // Inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            berries: 0,
            mushrooms: 0,
            sticks: 0,
            water: 0,
            survivalKit: false
        };
        
        // Story flags
        this.story = {
            helpedClassmate: false,
            exploredCave: false,
            foundSecret: false,
            bossDefeated: false,
            foundHeartseed: false,
            wolvesEncountered: 0,
            itemsCollected: 0,
            escapeFound: false
        };
        
        // Wolf AI timers
        this.wolfEvents = {
            firstChase: false,
            packAttack: false,
            hordeAttack: false,
            bossSpawned: false,
            timer: 0
        };
        
        // UI elements cache
        this.ui = {};
        
        // Audio
        this.audioEnabled = true;
        this.sounds = {};
        
        // Messages
        this.messages = [];
        this.maxMessages = 10;
        
        // Cutscene state
        this.currentCutscene = null;
        
        // Dialogue system
        this.dialogueOptions = [];
        this.onDialogueSelect = null;
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    init() {
        console.log("🎮 Starting Ears of the Forest...");
        this.updateLoadingProgress("Initializing game engine...", 10);
        
        // Quick load sequence
        const loadingSteps = [
            { text: "Creating 3D world...", progress: 30 },
            { text: "Generating terrain...", progress: 50 },
            { text: "Loading survival systems...", progress: 70 },
            { text: "Setting up AI...", progress: 85 },
            { text: "Finalizing atmosphere...", progress: 95 }
        ];
        
        let step = 0;
        const loadStep = () => {
            if (step < loadingSteps.length) {
                const stepInfo = loadingSteps[step];
                this.updateLoadingProgress(stepInfo.text, stepInfo.progress);
                step++;
                setTimeout(loadStep, 300);
            } else {
                this.initThreeJS();
                this.initWorld();
                this.initUI();
                this.initInput();
                this.initAudio();
                this.updateLoadingProgress("Ready to play!", 100);
                
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showCutscene('start');
                }, 500);
            }
        };
        
        setTimeout(loadStep, 300);
    }
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingTip = document.getElementById('loading-tip');
        
        if (progressBar) progressBar.style.width = percent + '%';
        if (loadingText) loadingText.textContent = text;
        
        // Random tips
        const tips = [
            "Keep your hunger and thirst above 20%",
            "Some mushrooms are poisonous!",
            "Listen for wolf howls - they're getting closer",
            "Stay near campfires when cold",
            "Use flashlight sparingly to save battery",
            "Follow the path markers to escape",
            "Collect sticks to make campfires",
            "Drink from clean water sources",
            "Wolf howls mean danger is near"
        ];
        
        if (loadingTip && Math.random() < 0.3) {
            loadingTip.textContent = "Tip: " + tips[Math.floor(Math.random() * tips.length)];
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const canvas = document.getElementById('gameCanvas');
        const gameUI = document.getElementById('game-ui');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        if (gameUI) gameUI.style.display = 'block';
    }
    
    // ===============================
    // THREE.JS SETUP
    // ===============================
    
    initThreeJS() {
        try {
            // Scene with enhanced fog
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a1a0a);
            this.fog = new THREE.FogExp2(0x0a1a0a, this.weather.fogDensity);
            this.scene.fog = this.fog;
            
            // Camera with wide FOV for horror feel
            this.camera = new THREE.PerspectiveCamera(
                85,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.copy(this.player.position);
            
            // Renderer with enhanced effects
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('gameCanvas'),
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Clock for animations
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
        } catch (error) {
            console.error("Graphics initialization failed:", error);
            alert("Unable to initialize 3D graphics. Please try Chrome or Firefox with WebGL support.");
        }
    }
    
    // ===============================
    // WORLD GENERATION
    // ===============================
    
    initWorld() {
        // Enhanced lighting for horror atmosphere
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
        
        // Moonlight/directional light
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        
        // Create uneven terrain
        this.createTerrain();
        
        // Generate world objects
        this.generateTrees(60);
        this.generateRocks(25);
        this.generateBerries(12);
        this.generateMushrooms(15);
        this.generateWaterSources(4);
        this.generateCampfires(2);
        this.generateSticks(8);
        this.generateWolves(3);
        this.generateBossWolf();
        this.createCave();
        this.createHeartseedTree();
        
        // Setup flashlight
        this.setupFlashlight();
        
        // Create particle system for fog/mist
        this.createParticleSystem();
    }
    
    createTerrain() {
        // Create a large, uneven ground plane
        const groundGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
        
        // Displace vertices for uneven terrain
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            // Add random height variations
            const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3 +
                          Math.random() * 1.5;
            vertices[i + 1] = height;
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        ground.receiveShadow = true;
        ground.castShadow = true;
        this.scene.add(ground);
        
        // Add grass/foliage
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 380;
            const z = (Math.random() - 0.5) * 380;
            const grassGeometry = new THREE.ConeGeometry(0.1, 0.3, 3);
            const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x3a7d34 });
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.position.set(x, -2.85, z);
            grass.rotation.x = Math.random() * Math.PI;
            this.scene.add(grass);
        }
    }
    
    generateTrees(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            
            // Skip near spawn
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            // Random tree properties
            const height = 5 + Math.random() * 8;
            const trunkRadius = 0.4 + Math.random() * 0.3;
            const leavesRadius = 2 + Math.random() * 3;
            
            // Trunk
            const trunkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 0.8,
                trunkRadius,
                height,
                8
            );
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a2e1f,
                roughness: 0.9
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, height/2 - 3, z);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            this.scene.add(trunk);
            
            // Leaves
            const leavesGeometry = new THREE.SphereGeometry(
                leavesRadius,
                6 + Math.floor(Math.random() * 4),
                6 + Math.floor(Math.random() * 4)
            );
            const leavesMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(
                    0.1 + Math.random() * 0.1,
                    0.3 + Math.random() * 0.2,
                    0.1 + Math.random() * 0.1
                ),
                roughness: 0.8
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(x, height - 3 + leavesRadius * 0.5, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
            
            this.trees.push({
                trunk,
                leaves,
                position: new THREE.Vector3(x, -3, z),
                radius: trunkRadius + leavesRadius * 0.8
            });
        }
    }
    
    generateWolves(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            
            const wolfGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
            const wolfMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                roughness: 0.8,
                emissive: 0x111111
            });
            const wolf = new THREE.Mesh(wolfGeometry, wolfMaterial);
            wolf.position.set(x, 0.4, z);
            wolf.castShadow = true;
            
            // Add glowing eyes
            const eyeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.3, 0.3, 0.8);
            rightEye.position.set(0.3, 0.3, 0.8);
            wolf.add(leftEye);
            wolf.add(rightEye);
            
            this.scene.add(wolf);
            this.wolves.push({
                mesh: wolf,
                position: new THREE.Vector3(x, 0, z),
                target: new THREE.Vector3(x, 0, z),
                speed: 2 + Math.random() * 2,
                state: 'idle',
                health: 50,
                attackCooldown: 0,
                lastHowl: 0
            });
        }
    }
    
    generateBossWolf() {
        const x = 120;
        const z = 120;
        
        const bossGeometry = new THREE.BoxGeometry(3, 1.5, 4);
        const bossMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.5,
            emissive: 0x330000
        });
        const bossWolf = new THREE.Mesh(bossGeometry, bossMaterial);
        bossWolf.position.set(x, 0.75, z);
        bossWolf.castShadow = true;
        
        // Larger glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000 
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 0.5, 1.5);
        rightEye.position.set(0.5, 0.5, 1.5);
        bossWolf.add(leftEye);
        bossWolf.add(rightEye);
        
        this.scene.add(bossWolf);
        
        this.bossWolf = {
            mesh: bossWolf,
            position: new THREE.Vector3(x, 0, z),
            target: new THREE.Vector3(x, 0, z),
            speed: 3,
            state: 'idle',
            health: 200,
            attackDamage: 30,
            lastRoar: 0
        };
    }
    
    generateBerries(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            
            const berryGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const berryMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff4444,
                emissive: 0x330000 
            });
            const berry = new THREE.Mesh(berryGeometry, berryMaterial);
            berry.position.set(x, 0.2, z);
            berry.castShadow = true;
            
            this.scene.add(berry);
            this.berries.push({
                mesh: berry,
                position: new THREE.Vector3(x, 0, z),
                collected: false
            });
        }
    }
    
    generateMushrooms(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            
            // Random mushroom type (color indicates poison chance)
            const isPoisonous = Math.random() < 0.3;
            const color = isPoisonous ? 0x9900ff : 0xffaa00;
            
            const mushroomGeometry = new THREE.ConeGeometry(0.15, 0.3, 6);
            const mushroomMaterial = new THREE.MeshStandardMaterial({ 
                color: color,
                emissive: isPoisonous ? 0x330033 : 0x332200
            });
            const mushroom = new THREE.Mesh(mushroomGeometry, mushroomMaterial);
            mushroom.position.set(x, 0.15, z);
            
            this.scene.add(mushroom);
            this.mushrooms.push({
                mesh: mushroom,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                poisonous: isPoisonous
            });
        }
    }
    
    setupFlashlight() {
        this.flashlight = new THREE.SpotLight(0xffffff, 3, 60, Math.PI / 6, 0.3, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
    }
    
    createParticleSystem() {
        // Create fog particles
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 400;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x88aadd,
            size: 2,
            transparent: true,
            opacity: 0.1
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        this.particleSystem = particleSystem;
    }
    
    generateRocks(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            
            const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 1, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(x, 0.5, z);
            rock.castShadow = true;
            
            this.scene.add(rock);
            this.rocks.push({
                mesh: rock,
                position: new THREE.Vector3(x, 0, z),
                radius: 0.8
            });
        }
    }
    
    generateWaterSources(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            
            // Create water plane
            const waterGeometry = new THREE.CircleGeometry(2, 8);
            const waterMaterial = new THREE.MeshStandardMaterial({
                color: 0x3366cc,
                transparent: true,
                opacity: 0.7,
                metalness: 0.9,
                roughness: 0.1
            });
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.set(x, -2.9, z);
            
            this.scene.add(water);
            this.waterSources.push({
                mesh: water,
                position: new THREE.Vector3(x, -3, z),
                radius: 2
            });
        }
    }
    
    generateCampfires(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            
            // Campfire base (logs)
            const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
            const logMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            
            for (let j = 0; j < 4; j++) {
                const log = new THREE.Mesh(logGeometry, logMaterial);
                log.position.set(x, -2.5, z);
                log.rotation.z = Math.PI / 4 * j;
                log.rotation.x = Math.PI / 2;
                this.scene.add(log);
            }
            
            this.campfires.push({
                position: new THREE.Vector3(x, -2.5, z),
                active: false,
                radius: 5
            });
        }
    }
    
    generateSticks(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 350;
            const z = (Math.random() - 0.5) * 350;
            
            const stickGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4);
            const stickMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            stick.position.set(x, -2.75, z);
            stick.rotation.x = Math.random() * Math.PI;
            stick.rotation.z = Math.random() * Math.PI;
            
            this.scene.add(stick);
            this.sticks.push({
                mesh: stick,
                position: new THREE.Vector3(x, -2.75, z),
                collected: false
            });
        }
    }
    
    createCave() {
        const caveX = 150;
        const caveZ = -150;
        
        // Cave entrance (simple hole in terrain)
        const caveGeometry = new THREE.CylinderGeometry(3, 4, 5, 16);
        const caveMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9
        });
        const cave = new THREE.Mesh(caveGeometry, caveMaterial);
        cave.position.set(caveX, -0.5, caveZ);
        
        this.scene.add(cave);
        this.cave = {
            mesh: cave,
            position: new THREE.Vector3(caveX, 0, caveZ),
            radius: 4,
            explored: false
        };
    }
    
    createHeartseedTree() {
        const treeX = -140;
        const treeZ = 140;
        
        // Unique glowing tree
        const trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 15, 12);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2e1f,
            emissive: 0x330000,
            roughness: 0.8
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(treeX, 4.5, treeZ);
        
        // Glowing leaves
        const leavesGeometry = new THREE.SphereGeometry(6, 12, 12);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x003300,
            transparent: true,
            opacity: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(treeX, 12, treeZ);
        
        this.scene.add(trunk);
        this.scene.add(leaves);
        
        this.heartseedTree = {
            trunk,
            leaves,
            position: new THREE.Vector3(treeX, 0, treeZ),
            radius: 8,
            found: false
        };
    }
    
    // ===============================
    // UI MANAGEMENT
    // ===============================
    
    initUI() {
        // Cache UI elements
        this.ui = {
            healthBar: document.getElementById('health-bar'),
            healthValue: document.getElementById('health-value'),
            hungerBar: document.getElementById('hunger-bar'),
            hungerValue: document.getElementById('hunger-value'),
            thirstBar: document.getElementById('thirst-bar'),
            thirstValue: document.getElementById('thirst-value'),
            tempBar: document.getElementById('temp-bar'),
            tempValue: document.getElementById('temp-value'),
            staminaBar: document.getElementById('stamina-bar'),
            staminaValue: document.getElementById('stamina-value'),
            fearBar: document.getElementById('fear-bar'),
            fearValue: document.getElementById('fear-value'),
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notification-text'),
            messageLog: document.getElementById('message-log'),
            dialogueChoices: document.getElementById('dialogue-choices'),
            dialogueQuestion: document.getElementById('dialogue-question'),
            dialogueOptions: document.querySelectorAll('.dialogue-option')
        };
    }
    
    updateUI() {
        // Update stat bars
        this.updateStatBar('health', this.player.health, this.player.maxHealth);
        this.updateStatBar('hunger', this.player.hunger, this.player.maxHunger);
        this.updateStatBar('thirst', this.player.thirst, this.player.maxThirst);
        this.updateStatBar('stamina', this.player.stamina, this.player.maxStamina);
        this.updateStatBar('fear', this.player.fear, this.player.maxFear);
        
        // Update temperature
        const tempPercent = ((this.player.temperature - 35) / 5) * 100;
        if (this.ui.tempBar) {
            this.ui.tempBar.style.width = tempPercent + '%';
        }
        if (this.ui.tempValue) {
            this.ui.tempValue.textContent = Math.round(this.player.temperature) + '°C';
            this.ui.tempValue.style.color = this.player.temperature < 36 ? '#ff4444' : 
                                          this.player.temperature > 38 ? '#ffaa00' : '#66cc66';
        }
        
        // Update inventory displays
        document.getElementById('inventory-medkits').textContent = this.inventory.medkits;
        document.getElementById('inventory-batteries').textContent = this.inventory.batteries;
        document.getElementById('inventory-berries').textContent = this.inventory.berries;
        document.getElementById('inventory-mushrooms').textContent = this.inventory.mushrooms;
        document.getElementById('inventory-sticks').textContent = this.inventory.sticks;
        document.getElementById('inventory-battery').textContent = Math.round(this.player.battery) + '%';
        
        // Update fear overlay
        const fearOverlay = document.getElementById('fear-overlay');
        if (fearOverlay) {
            fearOverlay.style.opacity = (this.player.fear / 100) * 0.4;
        }
    }
    
    updateStatBar(stat, value, max) {
        const bar = document.getElementById(`${stat}-bar`);
        const valueElement = document.getElementById(`${stat}-value`);
        
        if (bar) {
            const percent = (value / max) * 100;
            bar.style.width = percent + '%';
        }
        
        if (valueElement) {
            valueElement.textContent = Math.round(value);
            
            // Color coding
            if (value < 20) {
                valueElement.style.color = '#ff4444';
            } else if (value < 50) {
                valueElement.style.color = '#ffaa00';
            } else {
                valueElement.style.color = '#66cc66';
            }
        }
    }
    
    showNotification(text, duration = 3000) {
        if (this.ui.notification && this.ui.notificationText) {
            this.ui.notificationText.textContent = text;
            this.ui.notification.classList.add('show');
            
            setTimeout(() => {
                this.ui.notification.classList.remove('show');
            }, duration);
        }
    }
    
    addMessage(text) {
        if (!this.ui.messageLog) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = `[${this.formatTime(this.gameTime)}] ${text}`;
        
        this.messages.unshift(messageElement);
        if (this.messages.length > this.maxMessages) {
            const oldMessage = this.messages.pop();
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }
        
        this.ui.messageLog.innerHTML = '';
        this.messages.forEach(msg => {
            this.ui.messageLog.appendChild(msg.cloneNode(true));
        });
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    showDamageFlash() {
        const flash = document.getElementById('damage-flash');
        if (flash) {
            flash.style.background = 'rgba(255, 0, 0, 0.4)';
            setTimeout(() => {
                flash.style.background = 'rgba(255, 0, 0, 0)';
            }, 300);
        }
    }
    
    showDialogue(question, options) {
        if (this.ui.dialogueChoices && this.ui.dialogueQuestion) {
            this.ui.dialogueQuestion.textContent = question;
            
            this.dialogueOptions = options;
            const optionElements = this.ui.dialogueChoices.querySelectorAll('.dialogue-option');
            
            for (let i = 0; i < 3; i++) {
                if (optionElements[i]) {
                    optionElements[i].textContent = options[i] || '';
                    optionElements[i].style.display = options[i] ? 'block' : 'none';
                }
            }
            
            this.ui.dialogueChoices.style.display = 'block';
            this.isInCutscene = true;
        }
    }
    
    selectDialogue(index) {
        if (index < this.dialogueOptions.length) {
            const selected = this.dialogueOptions[index];
            
            if (this.ui.dialogueChoices) {
                this.ui.dialogueChoices.style.display = 'none';
            }
            
            this.isInCutscene = false;
            
            // Handle dialogue choices
            if (selected.includes("Listen")) {
                this.triggerSecretEnding();
            } else if (selected.includes("Touch")) {
                this.addMessage("The tree's energy flows through you...");
                this.player.fear += 30;
                this.player.health += 20;
            } else if (selected.includes("Run")) {
                this.addMessage("You run from the strange tree");
                this.player.fear += 10;
            }
        }
    }
    
    // ===============================
    // INPUT SYSTEM
    // ===============================
    
    initInput() {
        const canvas = document.getElementById('gameCanvas');
        
        // Pointer lock for mouse look
        canvas.addEventListener('click', () => {
            if (!this.isPaused && !this.isInCutscene) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        // Mouse look
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.isPaused || this.isInCutscene) return;
            
            this.cameraRotation.x += e.movementY * this.sensitivity;
            this.cameraRotation.y += e.movementX * this.sensitivity;
            
            // Limit vertical rotation
            this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.updateInput();
            
            if (this.isPaused || this.isInCutscene) {
                if (e.code === 'Escape' && this.isInCutscene) {
                    this.skipCutscene();
                }
                return;
            }
            
            switch(e.code) {
                case 'KeyF':
                    this.toggleFlashlight();
                    break;
                case 'KeyH':
                    this.useMedkit();
                    break;
                case 'KeyB':
                    this.useBattery();
                    break;
                case 'KeyE':
                    this.interact();
                    break;
                case 'KeyN':
                    this.eatBerries();
                    break;
                case 'KeyM':
                    this.eatMushroom();
                    break;
                case 'KeyR':
                    this.drinkWater();
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.updateInput();
        });
        
        // Audio toggle
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.audioEnabled = !this.audioEnabled;
            document.getElementById('audio-toggle').textContent = this.audioEnabled ? '🔊' : '🔇';
        });
    }
    
    updateInput() {
        this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'];
        this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
        this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'];
        this.input.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        this.input.crouch = this.keys['KeyC'];
    }
    
    // ===============================
    // AUDIO SYSTEM
    // ===============================
    
    initAudio() {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create audio nodes
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0.3;
        this.ambientGain.connect(this.audioContext.destination);
        
        // Start ambient sound
        this.playAmbientSound();
    }
    
    playAmbientSound() {
        // Create oscillator for ambient forest sounds
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 80;
        
        gainNode.gain.value = 0.05;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ambientGain);
        
        // Modulate frequency for natural sound
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(85, this.audioContext.currentTime + 2);
        
        oscillator.start();
        
        // Schedule changes
        setInterval(() => {
            const now = this.audioContext.currentTime;
            oscillator.frequency.cancelScheduledValues(now);
            oscillator.frequency.setValueAtTime(80 + Math.random() * 10, now);
            oscillator.frequency.exponentialRampToValueAtTime(85 + Math.random() * 10, now + 2);
        }, 2000);
    }
    
    playWolfHowl() {
        if (!this.audioEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        
        // Wolf howl frequency sweep
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 1);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 3);
    }
    
    // ===============================
    // GAME LOOP
    // ===============================
    
    startGame() {
        console.log("🎮 Game started!");
        this.isRunning = true;
        this.gameStarted = true;
        this.showNotification("You're lost in the forest. Find your way out!");
        this.addMessage("Game started - Survive and escape!");
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning || this.isInCutscene) return;
        
        const delta = this.clock.getDelta();
        this.gameTime += delta;
        
        // Update game state
        this.updatePlayer(delta);
        this.updateCamera();
        this.updateStats(delta);
        this.updateWolves(delta);
        this.updateWeather(delta);
        this.updateWorld(delta);
        this.checkEvents();
        this.updateUI();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer(delta) {
        // Update movement
        this.updateMovement(delta);
        
        // Update stats
        this.updatePlayerStats(delta);
        
        // Check collisions
        this.checkCollisions();
        
        // Update position
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Keep player in bounds
        const bounds = 190;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));
        this.player.position.y = Math.max(0, Math.min(50, this.player.position.y));
    }
    
    updateMovement(delta) {
        // Determine speed based on state
        let targetSpeed = this.player.movementSpeed;
        if (this.input.crouch) {
            targetSpeed = this.player.crouchSpeed;
            this.player.isCrouching = true;
        } else {
            this.player.isCrouching = false;
            if (this.input.sprint && this.player.stamina > 0 && !this.player.isExhausted) {
                targetSpeed = this.player.sprintSpeed;
                this.player.stamina -= 25 * delta;
            }
        }
        
        // Smooth speed transition
        this.player.currentSpeed += (targetSpeed - this.player.currentSpeed) * 10 * delta;
        
        // Get movement direction based on camera
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(this.camera.up, forward).normalize();
        
        // Reset velocity
        this.player.velocity.set(0, this.player.velocity.y, 0);
        
        // Apply movement input
        if (this.input.forward) this.player.velocity.addScaledVector(forward, this.player.currentSpeed);
        if (this.input.backward) this.player.velocity.addScaledVector(forward, -this.player.currentSpeed);
        if (this.input.left) this.player.velocity.addScaledVector(right, -this.player.currentSpeed);
        if (this.input.right) this.player.velocity.addScaledVector(right, this.player.currentSpeed);
        
        // Apply gravity
        if (!this.player.onGround) {
            this.player.velocity.y -= 20 * delta;
        }
        
        // Jump
        if (this.keys['Space'] && this.player.onGround && this.player.stamina > 10) {
            this.player.velocity.y = 8;
            this.player.onGround = false;
            this.player.stamina -= 10;
        }
        
        // Ground check
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
    }
    
    updatePlayerStats(delta) {
        // Hunger system
        this.player.hunger -= 0.5 * delta;
        if (this.input.sprint) this.player.hunger -= 0.2 * delta;
        if (this.player.hunger < 0) this.player.hunger = 0;
        
        // Thirst system
        this.player.thirst -= 0.8 * delta;
        if (this.input.sprint) this.player.thirst -= 0.3 * delta;
        if (this.player.thirst < 0) this.player.thirst = 0;
        
        // Temperature system
        this.updateTemperature(delta);
        
        // Stamina recovery
        if (!this.input.sprint && this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 15 * delta;
        }
        this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, this.player.stamina));
        
        // Exhaustion state
        this.player.isExhausted = this.player.stamina < 10;
        
        // Health effects
        if (this.player.hunger < 20) {
            this.player.health -= 0.5 * delta;
            if (Math.random() < 0.01) this.addMessage("You're starving!");
        }
        if (this.player.thirst < 20) {
            this.player.health -= 0.8 * delta;
            if (Math.random() < 0.01) this.addMessage("You're dehydrated!");
        }
        if (this.player.temperature < 36) {
            this.player.health -= 0.3 * delta;
            this.player.hypothermia = true;
            if (Math.random() < 0.01) this.addMessage("You're freezing!");
        } else {
            this.player.hypothermia = false;
        }
        if (this.player.poisoned) {
            this.player.health -= 2 * delta;
            if (Math.random() < 0.01) this.addMessage("The poison is spreading...");
        }
        
        // Fear system
        this.updateFear(delta);
        
        // Battery drain
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 6 * delta;
            if (this.flashlight) {
                const intensity = Math.max(0.1, this.player.battery / 100 * 3);
                this.flashlight.intensity = intensity;
                this.flashlight.distance = 30 + (this.player.battery / 100 * 30);
            }
        }
        if (this.player.battery <= 0) {
            this.input.flashlight = false;
            if (this.flashlight) this.flashlight.intensity = 0;
            this.addMessage("Flashlight battery dead!");
        }
        this.player.battery = Math.max(0, Math.min(this.player.maxBattery, this.player.battery));
        
        // Check death
        if (this.player.health <= 0) {
            this.triggerBadEnding();
        }
    }
    
    updateTemperature(delta) {
        // Base temperature from weather
        let targetTemp = this.weather.temperature;
        
        // Effects
        if (this.weather.isRaining) targetTemp -= 5;
        if (this.isNearCampfire()) targetTemp += 15;
        if (this.player.isCrouching) targetTemp += 1;
        if (this.input.sprint) targetTemp += 2;
        
        // Smooth temperature change
        this.player.temperature += (targetTemp - this.player.temperature) * 0.5 * delta;
        this.player.temperature = Math.max(
            this.player.minTemperature,
            Math.min(this.player.maxTemperature, this.player.temperature)
        );
    }
    
    updateFear(delta) {
        let fearIncrease = 0;
        
        // Base fear increase over time
        fearIncrease += 0.1;
        
        // Wolf proximity
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            if (distance < 30) {
                fearIncrease += (30 - distance) * 0.02;
            }
        }
        
        // Boss wolf proximity
        if (this.bossWolf) {
            const distance = this.player.position.distanceTo(this.bossWolf.position);
            if (distance < 50) {
                fearIncrease += (50 - distance) * 0.03;
            }
        }
        
        // Darkness fear
        if (!this.input.flashlight || this.player.battery < 30) {
            fearIncrease += 0.2;
        }
        
        // Low health fear
        if (this.player.health < 30) {
            fearIncrease += 0.3;
        }
        
        // Apply fear
        this.player.fear += fearIncrease * delta;
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Update fog based on fear
        this.weather.fogDensity = 0.015 + (this.player.fear / 100) * 0.03;
        if (this.scene.fog) {
            this.scene.fog.density = this.weather.fogDensity;
        }
    }
    
    updateCamera() {
        // Apply rotation to camera
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        
        // Apply position
        this.camera.position.copy(this.player.position);
        
        // Add head bobbing when moving
        if ((this.input.forward || this.input.backward || this.input.left || this.input.right) && this.player.onGround) {
            const time = this.gameTime * 10;
            const bobAmount = 0.05;
            this.camera.position.y += Math.sin(time) * bobAmount;
        }
    }
    
    updateStats(delta) {
        // Update weather
        this.weather.timeOfDay = (this.weather.timeOfDay + delta / 60) % 24;
        
        // Random weather changes
        if (Math.random() < 0.001) {
            this.weather.isRaining = !this.weather.isRaining;
            if (this.weather.isRaining) {
                this.addMessage("It starts to rain...");
                this.player.temperature -= 5;
            } else {
                this.addMessage("The rain stops");
            }
        }
        
        // Night time temperature drop
        if (this.weather.timeOfDay > 18 || this.weather.timeOfDay < 6) {
            this.weather.temperature = 15;
        } else {
            this.weather.temperature = 20;
        }
    }
    
    updateWolves(delta) {
        this.wolfEvents.timer += delta;
        
        // Timed wolf events
        if (!this.wolfEvents.firstChase && this.wolfEvents.timer > 180) { // 3 minutes
            this.wolfEvents.firstChase = true;
            this.triggerWolfEvent('firstChase');
        }
        if (!this.wolfEvents.packAttack && this.wolfEvents.timer > 300) { // 5 minutes
            this.wolfEvents.packAttack = true;
            this.triggerWolfEvent('packAttack');
        }
        if (!this.wolfEvents.hordeAttack && this.wolfEvents.timer > 600) { // 10 minutes
            this.wolfEvents.hordeAttack = true;
            this.triggerWolfEvent('hordeAttack');
        }
        
        // Update regular wolves
        for (const wolf of this.wolves) {
            const distanceToPlayer = this.player.position.distanceTo(wolf.position);
            
            // State machine
            switch (wolf.state) {
                case 'idle':
                    if (distanceToPlayer < 40) {
                        wolf.state = 'stalk';
                        wolf.lastHowl = this.gameTime;
                    }
                    break;
                    
                case 'stalk':
                    // Move toward player slowly
                    const direction = new THREE.Vector3()
                        .subVectors(this.player.position, wolf.position)
                        .normalize();
                    wolf.position.addScaledVector(direction, wolf.speed * 0.5 * delta);
                    wolf.mesh.position.copy(wolf.position);
                    
                    // Howl occasionally
                    if (this.gameTime - wolf.lastHowl > 10) {
                        wolf.lastHowl = this.gameTime;
                        this.addMessage("A wolf howls nearby...");
                        this.playWolfHowl();
                    }
                    
                    if (distanceToPlayer < 5) {
                        wolf.state = 'chase';
                    } else if (distanceToPlayer > 50) {
                        wolf.state = 'idle';
                    }
                    break;
                    
                case 'chase':
                    // Chase player aggressively
                    const chaseDirection = new THREE.Vector3()
                        .subVectors(this.player.position, wolf.position)
                        .normalize();
                    wolf.position.addScaledVector(chaseDirection, wolf.speed * delta);
                    wolf.mesh.position.copy(wolf.position);
                    
                    // Rotate to face player
                    wolf.mesh.lookAt(this.player.position);
                    
                    // Attack if close enough
                    if (distanceToPlayer < 2) {
                        wolf.attackCooldown -= delta;
                        if (wolf.attackCooldown <= 0) {
                            this.player.health -= 15;
                            wolf.attackCooldown = 2;
                            this.showDamageFlash();
                            this.addMessage("A wolf bites you!");
                            this.story.wolvesEncountered++;
                        }
                    }
                    
                    if (distanceToPlayer > 30) {
                        wolf.state = 'stalk';
                    }
                    break;
            }
            
            // Update wolf mesh position
            wolf.mesh.position.y = 0.4;
        }
        
        // Update boss wolf
        if (this.bossWolf) {
            const distanceToPlayer = this.player.position.distanceTo(this.bossWolf.position);
            
            if (distanceToPlayer < 60 && !this.story.bossDefeated) {
                // Boss chase
                const direction = new THREE.Vector3()
                    .subVectors(this.player.position, this.bossWolf.position)
                    .normalize();
                this.bossWolf.position.addScaledVector(direction, this.bossWolf.speed * delta);
                this.bossWolf.mesh.position.copy(this.bossWolf.position);
                
                // Roar occasionally
                if (this.gameTime - this.bossWolf.lastRoar > 15) {
                    this.bossWolf.lastRoar = this.gameTime;
                    this.addMessage("A deep roar echoes through the forest...");
                    this.player.fear += 10;
                    this.playWolfHowl();
                }
                
                // Attack if close
                if (distanceToPlayer < 3) {
                    this.player.health -= this.bossWolf.attackDamage * delta;
                    this.showDamageFlash();
                }
                
                // Check if boss is defeated
                if (this.bossWolf.health <= 0) {
                    this.story.bossDefeated = true;
                    this.addMessage("The alpha wolf falls!");
                }
            }
        }
    }
    
    triggerWolfEvent(eventType) {
        switch (eventType) {
            case 'firstChase':
                this.addMessage("A lone wolf begins stalking you...");
                this.player.fear += 10;
                break;
            case 'packAttack':
                this.addMessage("Multiple wolves surround you!");
                this.player.fear += 20;
                // Add more wolves
                this.generateWolves(2);
                break;
            case 'hordeAttack':
                this.addMessage("A horde of wolves closes in!");
                this.player.fear += 40;
                // Add many wolves
                this.generateWolves(5);
                break;
        }
    }
    
    updateWeather(delta) {
        // Update time of day
        this.weather.timeOfDay = (this.weather.timeOfDay + delta / 120) % 24;
        
        // Update lighting based on time
        const isNight = this.weather.timeOfDay > 18 || this.weather.timeOfDay < 6;
        this.sunLight.intensity = isNight ? 0.3 : 0.8;
        
        // Random weather changes
        if (Math.random() < 0.0005) {
            this.weather.isRaining = !this.weather.isRaining;
            if (this.weather.isRaining) {
                this.addMessage("It starts to rain...");
                this.player.temperature -= 5;
                this.weather.fogDensity += 0.01;
            } else {
                this.addMessage("The rain stops");
                this.weather.fogDensity = 0.015;
            }
            
            if (this.scene.fog) {
                this.scene.fog.density = this.weather.fogDensity;
            }
        }
    }
    
    updateWorld(delta) {
        // Rotate particle system for fog movement
        if (this.particleSystem) {
            this.particleSystem.rotation.y += 0.1 * delta;
        }
        
        // Update campfire effects
        this.updateCampfires(delta);
    }
    
    updateCampfires(delta) {
        // Campfires provide warmth when active
        for (const campfire of this.campfires) {
            if (campfire.active) {
                // Check if player is near
                const distance = this.player.position.distanceTo(campfire.position);
                if (distance < campfire.radius) {
                    this.player.temperature = Math.min(
                        this.player.maxTemperature,
                        this.player.temperature + 10 * delta
                    );
                }
                
                // Campfire burns out over time
                campfire.burnTime = (campfire.burnTime || 300) - delta;
                if (campfire.burnTime <= 0) {
                    campfire.active = false;
                    this.addMessage("The campfire burns out");
                }
            }
        }
    }
    
    checkCollisions() {
        // Check tree collisions
        for (const tree of this.trees) {
            const distance = this.player.position.distanceTo(tree.position);
            if (distance < tree.radius) {
                // Push player away from tree
                const direction = new THREE.Vector3()
                    .subVectors(this.player.position, tree.position)
                    .normalize();
                this.player.position.addScaledVector(direction, 0.1);
            }
        }
        
        // Check rock collisions
        for (const rock of this.rocks) {
            const distance = this.player.position.distanceTo(rock.position);
            if (distance < rock.radius) {
                // Push player away from rock
                const direction = new THREE.Vector3()
                    .subVectors(this.player.position, rock.position)
                    .normalize();
                this.player.position.addScaledVector(direction, 0.1);
            }
        }
    }
    
    checkEvents() {
        // Check for escape (edge of map)
        if (!this.story.escapeFound && 
            (Math.abs(this.player.position.x) > 180 || Math.abs(this.player.position.z) > 180)) {
            this.story.escapeFound = true;
            this.addMessage("You found the edge of the forest!");
            this.showNotification("Keep going to escape!");
        }
        
        // Check for complete escape
        if (this.story.escapeFound && 
            (Math.abs(this.player.position.x) > 195 || Math.abs(this.player.position.z) > 195)) {
            this.triggerGoodEnding();
        }
        
        // Check for cave exploration
        if (this.cave && !this.story.exploredCave) {
            const distance = this.player.position.distanceTo(this.cave.position);
            if (distance < this.cave.radius) {
                this.story.exploredCave = true;
                this.addMessage("You found a cave entrance...");
                this.showNotification("Enter the cave? (Be careful!)");
                this.player.fear += 20;
            }
        }
        
        // Check for Heartseed Tree
        if (this.heartseedTree && !this.heartseedTree.found) {
            const distance = this.player.position.distanceTo(this.heartseedTree.position);
            if (distance < this.heartseedTree.radius) {
                this.heartseedTree.found = true;
                this.story.foundHeartseed = true;
                this.addMessage("You found the ancient Heartseed Tree...");
                this.showDialogue(
                    "The tree pulses with strange energy...",
                    ["Listen to its whispers", "Touch the glowing bark", "Back away slowly"]
                );
            }
        }
        
        // Random jump scares (low chance)
        if (Math.random() < 0.0001 && this.player.fear > 50) {
            this.triggerJumpScare();
        }
    }
    
    // ===============================
    // GAME ACTIONS
    // ===============================
    
    toggleFlashlight() {
        this.input.flashlight = !this.input.flashlight;
        if (this.flashlight) {
            this.flashlight.intensity = this.input.flashlight && this.player.battery > 0 ? 
                Math.max(0.1, this.player.battery / 100 * 3) : 0;
        }
        this.showNotification(`Flashlight ${this.input.flashlight ? 'ON' : 'OFF'}`);
        this.addMessage(`Flashlight ${this.input.flashlight ? 'turned on' : 'turned off'}`);
    }
    
    useMedkit() {
        if (this.inventory.medkits > 0 && this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
            this.inventory.medkits--;
            this.showNotification("Used medkit: +40 health");
            this.addMessage("Applied medical treatment");
        } else if (this.inventory.medkits === 0) {
            this.showNotification("No medkits available!");
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 60);
            this.inventory.batteries--;
            this.showNotification("Used battery: +60%");
            this.addMessage("Flashlight recharged");
            
            // Auto-turn on flashlight if it was off due to dead battery
            if (!this.input.flashlight && this.player.battery > 0) {
                this.input.flashlight = true;
                if (this.flashlight) {
                    this.flashlight.intensity = Math.max(0.1, this.player.battery / 100 * 3);
                }
            }
        } else if (this.inventory.batteries === 0) {
            this.showNotification("No batteries available!");
        }
    }
    
    eatBerries() {
        if (this.inventory.berries > 0) {
            const berriesToEat = Math.min(3, this.inventory.berries);
            this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + berriesToEat * 15);
            this.inventory.berries -= berriesToEat;
            this.showNotification(`Ate ${berriesToEat} berries: +${berriesToEat * 15} hunger`);
            this.addMessage("Berries satisfy your hunger");
        } else {
            this.showNotification("No berries available!");
        }
    }
    
    eatMushroom() {
        if (this.inventory.mushrooms > 0) {
            this.inventory.mushrooms--;
            // 30% chance of poisoning
            if (Math.random() < 0.3) {
                this.player.poisoned = true;
                this.player.health -= 20;
                this.showNotification("Poisonous mushroom! -20 health");
                this.addMessage("You feel sick... it was poisonous!");
            } else {
                this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + 25);
                this.showNotification("Edible mushroom: +25 hunger");
                this.addMessage("The mushroom was safe to eat");
            }
        } else {
            this.showNotification("No mushrooms available!");
        }
    }
    
    drinkWater() {
        if (this.isNearWater()) {
            this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 40);
            this.showNotification("Drank water: +40 thirst");
            this.addMessage("Clean water refreshes you");
        } else if (this.inventory.water > 0) {
            this.inventory.water--;
            this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 30);
            this.showNotification("Drank collected water: +30 thirst");
            this.addMessage("Drank from your water supply");
        } else {
            this.showNotification("No water available!");
        }
    }
    
    interact() {
        // Check for nearby items
        this.checkNearbyItems();
    }
    
    checkNearbyItems() {
        const playerPos = this.player.position;
        
        // Check berries
        for (const berry of this.berries) {
            if (berry.collected) continue;
            const distance = playerPos.distanceTo(berry.position);
            if (distance < 2) {
                berry.collected = true;
                this.scene.remove(berry.mesh);
                const collectedCount = 2 + Math.floor(Math.random() * 3);
                this.inventory.berries += collectedCount;
                this.showNotification(`Collected ${collectedCount} berries!`);
                this.story.itemsCollected++;
                this.addMessage("Found some berries");
                return;
            }
        }
        
        // Check mushrooms
        for (const mushroom of this.mushrooms) {
            if (mushroom.collected) continue;
            const distance = playerPos.distanceTo(mushroom.position);
            if (distance < 2) {
                mushroom.collected = true;
                this.scene.remove(mushroom.mesh);
                this.inventory.mushrooms++;
                this.showNotification("Collected a mushroom");
                this.story.itemsCollected++;
                this.addMessage("Found a mushroom");
                return;
            }
        }
        
        // Check sticks
        for (const stick of this.sticks) {
            if (stick.collected) continue;
            const distance = playerPos.distanceTo(stick.position);
            if (distance < 2) {
                stick.collected = true;
                this.scene.remove(stick.mesh);
                this.inventory.sticks++;
                this.showNotification("Collected a stick");
                this.story.itemsCollected++;
                this.addMessage("Picked up a stick");
                return;
            }
        }
        
        // Check water sources
        for (const waterSource of this.waterSources) {
            const distance = playerPos.distanceTo(waterSource.position);
            if (distance < 3) {
                if (this.inventory.water < 3) {
                    this.inventory.water++;
                    this.showNotification("Collected water");
                    this.addMessage("Collected water from source");
                } else {
                    this.showNotification("Water container full!");
                }
                return;
            }
        }
        
        // Check campfires
        for (const campfire of this.campfires) {
            const distance = playerPos.distanceTo(campfire.position);
            if (distance < 3 && this.inventory.sticks >= 3) {
                campfire.active = true;
                campfire.burnTime = 300; // 5 minutes
                this.inventory.sticks -= 3;
                this.showNotification("Built campfire");
                this.addMessage("Built a campfire for warmth");
                return;
            } else if (distance < 3 && this.inventory.sticks < 3) {
                this.showNotification("Need 3 sticks to build campfire");
                return;
            }
        }
        
        // If nothing nearby
        this.showNotification("Nothing to interact with here");
    }
    
    isNearWater() {
        const playerPos = this.player.position;
        for (const waterSource of this.waterSources) {
            const distance = playerPos.distanceTo(waterSource.position);
            if (distance < 3) {
                return true;
            }
        }
        return false;
    }
    
    isNearCampfire() {
        const playerPos = this.player.position;
        for (const campfire of this.campfires) {
            if (!campfire.active) continue;
            const distance = playerPos.distanceTo(campfire.position);
            if (distance < campfire.radius) {
                return true;
            }
        }
        return false;
    }
    
    // ===============================
    // CUTSCENES
    // ===============================
    
    showCutscene(type) {
        this.isInCutscene = true;
        this.currentCutscene = type;
        
        const cutsceneElement = document.getElementById(`cutscene-${type}`);
        if (cutsceneElement) {
            cutsceneElement.style.display = 'flex';
            
            // Auto-advance after delay for start cutscene
            if (type === 'start') {
                setTimeout(() => {
                    this.skipCutscene();
                    this.startGame();
                }, 8000);
            }
        }
    }
    
    skipCutscene() {
        if (this.currentCutscene) {
            const cutsceneElement = document.getElementById(`cutscene-${this.currentCutscene}`);
            if (cutsceneElement) {
                cutsceneElement.style.display = 'none';
            }
            this.currentCutscene = null;
            this.isInCutscene = false;
            
            // Request pointer lock after skipping
            const canvas = document.getElementById('gameCanvas');
            if (canvas && !this.isPaused) {
                canvas.requestPointerLock();
            }
        }
    }
    
    triggerJumpScare() {
        const jumpScare = document.getElementById('jump-scare');
        const jumpScareContent = document.querySelector('.jump-scare-content');
        
        if (jumpScare && jumpScareContent) {
            jumpScareContent.textContent = "⚠️";
            jumpScare.style.display = 'flex';
            
            // Play scare sound if audio enabled
            if (this.audioEnabled) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }
            
            setTimeout(() => {
                jumpScare.style.display = 'none';
            }, 1000);
            
            this.player.fear += 20;
            this.addMessage("Something jumped out at you!");
        }
    }
    
    // ===============================
    // ENDINGS
    // ===============================
    
    triggerGoodEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "GOOD ENDING",
            "You escaped the forest! You and your friend celebrate at home, grateful to have survived the nightmare forest.",
            "#4CAF50"
        );
    }
    
    triggerBadEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "BAD ENDING",
            "The wolves were too many... They surrounded you and your friend. The last thing you heard were the screams...",
            "#f44336"
        );
    }
    
    triggerSecretEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "SECRET ENDING",
            "You found the Heartseed Tree... It spoke to you, showed you the forest's memories. You felt its pain, its loneliness. Slowly, you became one with the forest...",
            "#8BC34A"
        );
    }
    
    showEndingScreen(title, message, color) {
        const endScreen = document.getElementById('end-screen');
        const endTitle = document.getElementById('end-title');
        const endMessage = document.getElementById('end-message');
        const endStats = document.getElementById('end-stats');
        
        if (endScreen && endTitle && endMessage && endStats) {
            endTitle.textContent = title;
            endTitle.style.color = color;
            endMessage.textContent = message;
            
            // Generate stats
            const statsText = `
                Time survived: ${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}<br>
                Final health: ${Math.round(this.player.health)}<br>
                Final fear: ${Math.round(this.player.fear)}%<br>
                Items collected: ${this.story.itemsCollected}<br>
                Wolves encountered: ${this.story.wolvesEncountered}
            `;
            endStats.innerHTML = statsText;
            
            endScreen.style.display = 'flex';
        }
    }
    
    // ===============================
    // PAUSE MENU
    // ===============================
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseMenu = document.getElementById('pause-menu');
        const canvas = document.getElementById('gameCanvas');
        
        if (this.isPaused) {
            if (pauseMenu) pauseMenu.style.display = 'flex';
            document.exitPointerLock();
        } else {
            if (pauseMenu) pauseMenu.style.display = 'none';
            if (canvas && !this.isInCutscene) {
                canvas.requestPointerLock();
            }
        }
    }
    
    resumeGame() {
        this.togglePause();
    }
    
    restartGame() {
        location.reload();
    }
    
    quitToMenu() {
        // For now, just reload the page
        location.reload();
    }
}

// ===============================
// START GAME
// ===============================

// Create and start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new EarsOfTheForest();
    window.game = game; // Make accessible from console for debugging
    
    // Start initialization
    game.init();
});
