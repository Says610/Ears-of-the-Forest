/* =========================================================
   EARS OF THE FOREST - COMPLETE GAME
========================================================= */

class EarsOfTheForest {
    constructor() {
        // Core Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isInCutscene = false;
        this.gameTime = 0;
        this.timeOfDay = 0.25; // 6 AM
        this.weather = {
            type: 'clear',
            intensity: 0,
            fogIntensity: 0.01
        };
        
        // Camera controls
        this.cameraRotation = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        this.pointerLockElement = null;
        
        // Player state
        this.player = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            battery: 100,
            maxBattery: 100,
            fear: 5,
            maxFear: 100,
            position: new THREE.Vector3(0, 1.7, 5),
            rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
            onGround: true,
            jumpForce: 7,
            movementSpeed: 5,
            sprintSpeed: 10,
            crouchSpeed: 2,
            currentSpeed: 5,
            stealth: {
                noiseLevel: 0,
                visibility: 0,
                isCrouching: false,
                isHiding: false
            }
        };
        
        // Input state
        this.keys = {};
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            flashlight: true,
            crouch: false,
            jump: false
        };
        
        // Story flags
        this.story = {
            helpedClassmate: false,
            exploredCave: false,
            foundSecret: false,
            bossDefeated: false,
            heartseedFound: false,
            hasFlashlight: true,
            hasCompass: false,
            wolfEventsTriggered: {
                firstSighting: false,
                packEvent: false,
                hordeEvent: false
            }
        };
        
        // Inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            sticks: 0,
            cloth: 0,
            vines: 0,
            leaves: 0,
            survivalKits: 0
        };
        
        // Crafting recipes
        this.craftingRecipes = {
            torch: { sticks: 1, cloth: 1 },
            bandage: { cloth: 2 },
            trap: { sticks: 3, vines: 2 },
            shelter: { sticks: 10, leaves: 20 },
            survivalKit: { battery: 1, medkit: 1 }
        };
        
        // World objects
        this.trees = [];
        this.rocks = [];
        this.logs = [];
        this.wolves = [];
        this.bossWolf = null;
        this.interactables = [];
        this.particles = [];
        this.flashlight = null;
        this.fog = null;
        this.ground = null;
        this.cave = null;
        this.heartseedTree = null;
        
        // Audio system
        this.audio = {
            enabled: true,
            masterVolume: 0.7,
            sounds: {},
            groups: {},
            positionalAudio: [],
            currentFootstep: 0,
            heartbeatInterval: null,
            visualizerBars: []
        };
        
        // UI elements cache
        this.ui = {
            healthFill: null,
            staminaFill: null,
            fearFill: null,
            batteryText: null,
            timeText: null,
            objectiveText: null,
            inventoryItems: {},
            notification: null,
            crosshair: null
        };
        
        // Game events
        this.timedEvents = [
            { time: 180, triggered: false, type: 'firstWolf' },      // 3 minutes
            { time: 300, triggered: false, type: 'wolfPack' },       // 5 minutes
            { time: 600, triggered: false, type: 'wolfHorde' },      // 10 minutes
            { time: 900, triggered: false, type: 'bossWolf' }        // 15 minutes
        ];
        
        // Cutscene data
        this.cutscenes = {
            opening: [
                { text: "Wake up! Today's the field trip to the national forest!", character: "Alex", duration: 4000 },
                { text: "We're going to see ancient trees over 500 years old!", character: "Alex", duration: 4000 },
                { text: "The bus ride is bumpy but filled with laughter...", character: "Narrator", duration: 4000 },
                { text: "Stay on the marked paths! Be back by 3 PM sharp!", character: "Teacher", duration: 4000 },
                { text: "You and Alex decide to explore deeper...", character: "Narrator", duration: 4000 },
                { text: "Wait... which way did we come from?", character: "Alex", duration: 4000 },
                { text: "I thought you were keeping track!", character: "You", duration: 4000 },
                { text: "The path disappears. It's getting darker...", character: "Narrator", duration: 4000 },
                { text: "You hear a distant howl...", character: "Narrator", duration: 4000 },
                { text: "Find your way out. Watch for wolves.", character: "Narrator", duration: 4000 }
            ],
            goodEnding: [
                { text: "After hours of wandering, you see the edge of the forest!", character: "Narrator", duration: 4000 },
                { text: "There's the bus! We made it!", character: "Alex", duration: 4000 },
                { text: "You both run toward the safety of the school group...", character: "Narrator", duration: 4000 },
                { text: "That was too close. Never wandering off again!", character: "You", duration: 4000 },
                { text: "But we have quite the story to tell!", character: "Alex", duration: 4000 }
            ],
            badEnding: [
                { text: "The wolves surround you, their eyes glowing in the dark...", character: "Narrator", duration: 4000 },
                { text: "Run! There's too many of them!", character: "Alex", duration: 4000 },
                { text: "But there's nowhere to run. The forest has claimed you...", character: "Narrator", duration: 4000 },
                { text: "The last thing you hear is Alex's scream...", character: "Narrator", duration: 4000 },
                { text: "The forest is silent once more.", character: "Narrator", duration: 5000 }
            ],
            secretEnding: [
                { text: "You find a massive, glowing tree in a hidden clearing...", character: "Narrator", duration: 4000 },
                { text: "The Heartseed Tree... it's real!", character: "Alex", duration: 4000 },
                { text: "Welcome, child of the forest...", character: "Tree", duration: 4000 },
                { text: "The tree's voice resonates in your mind...", character: "Narrator", duration: 4000 },
                { text: "You feel your consciousness merging with the forest...", character: "Narrator", duration: 4000 },
                { text: "You become one with the trees, the animals, the earth...", character: "Narrator", duration: 4000 },
                { text: "The forest welcomes its new guardian.", character: "Tree", duration: 5000 }
            ]
        };
        
        // Dialogue options
        this.dialogues = {
            foundAlex: [
                { text: "Alex! I found you!", options: [
                    { text: "Are you hurt?", next: "alexHurt" },
                    { text: "We need to get out of here!", next: "escape" }
                ]},
                { text: "My ankle... I twisted it. I can't walk fast.", character: "Alex", options: [
                    { text: "Lean on me, we'll go together.", next: "helpAlex", flag: "helpedClassmate" },
                    { text: "I'll go find help.", next: "leaveAlex" }
                ]}
            ]
        };
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    async init() {
        console.log("🎮 Initializing Ears of the Forest...");
        
        try {
            // Step 1: Show loading progress
            this.updateLoadingProgress("Initializing horror systems...", 10);
            
            // Step 2: Initialize Three.js
            await this.initThreeJS();
            this.updateLoadingProgress("Setting up 3D graphics...", 30);
            
            // Step 3: Initialize audio
            await this.initAudio();
            this.updateLoadingProgress("Loading audio system...", 50);
            
            // Step 4: Build game world
            await this.initWorld();
            this.updateLoadingProgress("Building game world...", 70);
            
            // Step 5: Initialize UI
            await this.initUI();
            this.updateLoadingProgress("Creating user interface...", 85);
            
            // Step 6: Initialize input
            await this.initInput();
            this.updateLoadingProgress("Setting up controls...", 95);
            
            // Step 7: Start the game
            setTimeout(() => {
                this.hideLoadingScreen();
                this.startOpeningCutscene();
                console.log("✅ Game initialized successfully");
                this.updateLoadingProgress("Ready to play!", 100);
            }, 1000);
            
        } catch (error) {
            console.error("❌ Game initialization failed:", error);
            this.showError("Failed to load game. Please refresh the page.");
        }
    }
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        // Update tips based on progress
        const tips = [
            "Tip: Listen carefully. The forest hears everything.",
            "Tip: Wolves hunt by sound. Move quietly.",
            "Tip: Your flashlight battery is limited. Use it wisely.",
            "Tip: Crouch (C) to move silently and avoid detection.",
            "Tip: Find resources to craft survival items.",
            "Tip: Some endings are only found by exploring deeply."
        ];
        
        const tipIndex = Math.floor(percent / 20);
        if (tipIndex < tips.length) {
            document.getElementById('loading-tip').textContent = tips[tipIndex];
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show game canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
    }
    
    showError(message) {
        const errorHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: 'Courier New', monospace;
                text-align: center;
                padding: 20px;
                z-index: 100000;
            ">
                <h1 style="color: #f44336; margin-bottom: 20px; font-size: 3rem;">❌ ERROR</h1>
                <p style="font-size: 1.2rem; margin-bottom: 30px; max-width: 600px;">
                    ${message}
                </p>
                <button onclick="location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: inherit;
                ">
                    Reload Page
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }
    
    // ===============================
    // THREE.JS INITIALIZATION
    // ===============================
    
    async initThreeJS() {
        console.log("🌲 Initializing Three.js...");
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x001a00);
            this.scene.fog = new THREE.FogExp2(0x001a00, 0.01);
            this.fog = this.scene.fog;
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.copy(this.player.position);
            this.camera.rotation.copy(this.player.rotation);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('game-canvas'),
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            // Create clock
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            console.log("✅ Three.js initialized successfully");
        } catch (error) {
            console.error("❌ Three.js initialization failed:", error);
            throw error;
        }
    }
    
    // ===============================
    // AUDIO INITIALIZATION
    // ===============================
    
    async initAudio() {
        console.log("🎵 Initializing audio system...");
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio nodes
            this.audio.masterGain = this.audioContext.createGain();
            this.audio.masterGain.gain.value = this.audio.masterVolume;
            this.audio.masterGain.connect(this.audioContext.destination);
            
            // Create sound groups
            this.audio.groups = {
                ambient: this.audioContext.createGain(),
                effects: this.audioContext.createGain(),
                music: this.audioContext.createGain(),
                voice: this.audioContext.createGain()
            };
            
            // Connect groups to master
            Object.values(this.audio.groups).forEach(group => {
                group.connect(this.audio.masterGain);
            });
            
            // Set group volumes
            this.audio.groups.ambient.gain.value = 0.3;
            this.audio.groups.effects.gain.value = 0.6;
            this.audio.groups.music.gain.value = 0.4;
            this.audio.groups.voice.gain.value = 0.8;
            
            // Create oscillator for heartbeat
            this.audio.heartbeatOscillator = this.audioContext.createOscillator();
            this.audio.heartbeatOscillator.type = 'sine';
            this.audio.heartbeatOscillator.frequency.value = 60;
            
            this.audio.heartbeatGain = this.audioContext.createGain();
            this.audio.heartbeatGain.gain.value = 0;
            
            this.audio.heartbeatOscillator.connect(this.audio.heartbeatGain);
            this.audio.heartbeatGain.connect(this.audio.groups.effects);
            this.audio.heartbeatOscillator.start();
            
            // Create oscillator for wind
            this.audio.windOscillator = this.audioContext.createOscillator();
            this.audio.windOscillator.type = 'sawtooth';
            this.audio.windOscillator.frequency.value = 80;
            
            this.audio.windGain = this.audioContext.createGain();
            this.audio.windGain.gain.value = 0.1;
            
            this.audio.windOscillator.connect(this.audio.windGain);
            this.audio.windGain.connect(this.audio.groups.ambient);
            this.audio.windOscillator.start();
            
            // Create oscillator for ambient forest sounds
            this.audio.forestOscillator = this.audioContext.createOscillator();
            this.audio.forestOscillator.type = 'triangle';
            this.audio.forestOscillator.frequency.value = 200;
            
            this.audio.forestGain = this.audioContext.createGain();
            this.audio.forestGain.gain.value = 0.05;
            
            this.audio.forestFilter = this.audioContext.createBiquadFilter();
            this.audio.forestFilter.type = 'lowpass';
            this.audio.forestFilter.frequency.value = 500;
            
            this.audio.forestOscillator.connect(this.audio.forestFilter);
            this.audio.forestFilter.connect(this.audio.forestGain);
            this.audio.forestGain.connect(this.audio.groups.ambient);
            this.audio.forestOscillator.start();
            
            // Setup audio toggle
            const audioToggle = document.getElementById('audio-toggle');
            if (audioToggle) {
                audioToggle.addEventListener('click', () => {
                    this.audio.enabled = !this.audio.enabled;
                    this.audio.masterGain.gain.value = this.audio.enabled ? this.audio.masterVolume : 0;
                    audioToggle.textContent = this.audio.enabled ? '🔊' : '🔇';
                });
            }
            
            console.log("✅ Audio system initialized successfully");
        } catch (error) {
            console.error("❌ Audio initialization failed:", error);
            // Continue without audio
            this.audio.enabled = false;
        }
    }
    
    // ===============================
    // GAME WORLD INITIALIZATION
    // ===============================
    
    async initWorld() {
        console.log("🌍 Building game world...");
        
        try {
            // Create lighting
            this.createLighting();
            
            // Create ground
            this.createGround();
            
            // Create trees
            this.createTrees(200);
            
            // Create rocks and logs (collision obstacles)
            this.createObstacles(50);
            
            // Create path
            this.createPath();
            
            // Create cave
            this.createCave();
            
            // Create Heartseed Tree (hidden)
            this.createHeartseedTree();
            
            // Create wolves
            this.createWolves(10);
            this.createBossWolf();
            
            // Create interactables
            this.createInteractables();
            
            // Create flashlight
            this.createFlashlight();
            
            // Create particle systems
            this.createParticleSystems();
            
            console.log("✅ Game world built successfully");
        } catch (error) {
            console.error("❌ World building failed:", error);
            throw error;
        }
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Hemisphere light for sky/ground lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4f6b4f, 0.3);
        this.scene.add(hemisphereLight);
        
        // Directional light (sun/moon)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(100, 200, 100);
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
        
        // Fog
        this.scene.fog = new THREE.FogExp2(0x001a00, 0.01);
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
        
        // Create displacement for terrain
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            const distance = Math.sqrt(x * x + z * z);
            const noise = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
            vertices[i + 1] = noise * (1 - Math.min(distance / 250, 1));
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -5;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }
    
    createTrees(count) {
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2e1f,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x2f5f2f,
            roughness: 0.9,
            metalness: 0
        });
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 40 + Math.random() * 180;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Skip center area
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            // Create trunk
            const trunkHeight = 4 + Math.random() * 3;
            const trunkRadius = 0.3 + Math.random() * 0.3;
            
            const trunkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 0.8,
                trunkRadius,
                trunkHeight,
                8
            );
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, trunkHeight / 2 - 5, z);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            
            // Create leaves
            const leavesRadius = 1.5 + Math.random() * 1.5;
            const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 6, 6);
            const leaves = new THREE.Mesh(leavesGeometry, leafMaterial);
            leaves.position.set(x, trunkHeight + leavesRadius * 0.5 - 5, z);
            leaves.castShadow = true;
            
            // Store tree data
            const tree = {
                trunk,
                leaves,
                position: new THREE.Vector3(x, 0, z),
                collisionRadius: trunkRadius * 2
            };
            
            this.trees.push(tree);
            this.scene.add(trunk);
            this.scene.add(leaves);
        }
    }
    
    createObstacles(count) {
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.2
        });
        
        const logMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 30 + Math.random() * 150;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            if (Math.random() > 0.5) {
                // Create rock
                const rockSize = 0.5 + Math.random() * 1.5;
                const rockGeometry = new THREE.BoxGeometry(rockSize, rockSize, rockSize);
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.set(x, rockSize / 2 - 5, z);
                rock.castShadow = true;
                rock.receiveShadow = true;
                
                this.rocks.push({
                    mesh: rock,
                    position: new THREE.Vector3(x, 0, z),
                    collisionRadius: rockSize * 0.8
                });
                this.scene.add(rock);
            } else {
                // Create log
                const logLength = 2 + Math.random() * 3;
                const logRadius = 0.3 + Math.random() * 0.3;
                const logGeometry = new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8);
                const log = new THREE.Mesh(logGeometry, logMaterial);
                
                // Random rotation
                log.rotation.x = Math.random() * Math.PI;
                log.rotation.z = Math.random() * Math.PI;
                
                log.position.set(x, logRadius - 5, z);
                log.castShadow = true;
                log.receiveShadow = true;
                
                this.logs.push({
                    mesh: log,
                    position: new THREE.Vector3(x, 0, z),
                    collisionRadius: logRadius * 1.5
                });
                this.scene.add(log);
            }
        }
    }
    
    createPath() {
        const pathMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b5a3a,
            roughness: 1.0,
            metalness: 0
        });
        
        // Create winding path
        const pathPoints = [];
        const segments = 50;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Math.sin(t * Math.PI * 4) * 40;
            const z = -100 * t;
            pathPoints.push(new THREE.Vector3(x, -4.9, z));
        }
        
        // Create path geometry
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const path = new THREE.Line(pathGeometry, new THREE.LineBasicMaterial({ color: 0x8B4513 }));
        this.scene.add(path);
        
        // Create actual walkable path mesh
        const pathWidth = 3;
        const pathShape = new THREE.Shape();
        
        for (let i = 0; i < pathPoints.length; i++) {
            const point = pathPoints[i];
            const nextPoint = pathPoints[Math.min(i + 1, pathPoints.length - 1)];
            const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            if (i === 0) {
                const leftPoint = new THREE.Vector3().copy(point).addScaledVector(perpendicular, -pathWidth);
                pathShape.moveTo(leftPoint.x, leftPoint.z);
                
                const rightPoint = new THREE.Vector3().copy(point).addScaledVector(perpendicular, pathWidth);
                pathShape.lineTo(rightPoint.x, rightPoint.z);
            }
        }
        
        const pathMeshGeometry = new THREE.ShapeGeometry(pathShape);
        const pathMesh = new THREE.Mesh(pathMeshGeometry, pathMaterial);
        pathMesh.position.y = -5;
        pathMesh.rotation.x = -Math.PI / 2;
        pathMesh.receiveShadow = true;
        this.scene.add(pathMesh);
    }
    
    createCave() {
        const caveMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 1.0,
            metalness: 0,
            side: THREE.BackSide
        });
        
        // Create cave entrance
        const caveEntranceGeometry = new THREE.CylinderGeometry(8, 5, 20, 16, 1, true);
        const caveEntrance = new THREE.Mesh(caveEntranceGeometry, caveMaterial);
        caveEntrance.position.set(80, -10, 80);
        caveEntrance.rotation.x = Math.PI / 2;
        this.scene.add(caveEntrance);
        
        // Create cave tunnel
        const caveTunnelGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(80, -10, 80),
                new THREE.Vector3(85, -15, 90),
                new THREE.Vector3(90, -20, 100),
                new THREE.Vector3(95, -25, 110)
            ]),
            64,
            6,
            8,
            false
        );
        
        const caveTunnel = new THREE.Mesh(caveTunnelGeometry, caveMaterial);
        this.scene.add(caveTunnel);
        
        // Create cave interior lighting
        const caveLight = new THREE.PointLight(0x202020, 0.5, 50);
        caveLight.position.set(95, -20, 110);
        this.scene.add(caveLight);
        
        this.cave = {
            entrance: caveEntrance,
            tunnel: caveTunnel,
            light: caveLight,
            position: new THREE.Vector3(80, -10, 80),
            interiorPosition: new THREE.Vector3(95, -20, 110)
        };
    }
    
    createHeartseedTree() {
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B0000,
            emissive: 0x330000,
            emissiveIntensity: 0.2,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF1493,
            emissive: 0x660033,
            emissiveIntensity: 0.3,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create massive trunk
        const trunkGeometry = new THREE.CylinderGeometry(3, 5, 30, 12);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(-150, 10, -150);
        trunk.castShadow = true;
        
        // Create glowing leaves
        const leavesGeometry = new THREE.SphereGeometry(8, 10, 10);
        const leaves = new THREE.Mesh(leavesGeometry, leafMaterial);
        leaves.position.set(-150, 25, -150);
        leaves.castShadow = true;
        
        // Add pulsing glow
        this.heartseedTree = {
            trunk,
            leaves,
            position: new THREE.Vector3(-150, 0, -150),
            glowIntensity: 0.3
        };
        
        // Don't add to scene yet - only appears when found
    }
    
    createWolves(count) {
        const wolfMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 50 + Math.random() * 100;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create wolf body
            const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2.5);
            const body = new THREE.Mesh(bodyGeometry, wolfMaterial);
            body.position.set(x, 0.4 - 5, z);
            body.castShadow = true;
            
            // Create wolf head
            const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
            const head = new THREE.Mesh(headGeometry, wolfMaterial);
            head.position.set(x, 0.8 - 5, z + 1.2);
            
            // Create wolf legs
            const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
            const legs = [];
            
            for (let j = 0; j < 4; j++) {
                const leg = new THREE.Mesh(legGeometry, wolfMaterial);
                const legX = x + (j < 2 ? -0.4 : 0.4);
                const legZ = z + (j % 2 ? -0.8 : 0.8);
                leg.position.set(legX, 0 - 5, legZ);
                legs.push(leg);
                this.scene.add(leg);
            }
            
            this.scene.add(body);
            this.scene.add(head);
            
            const wolf = {
                body,
                head,
                legs,
                position: new THREE.Vector3(x, 0, z),
                targetPosition: new THREE.Vector3(x, 0, z),
                speed: 2 + Math.random() * 3,
                detectionRange: 20,
                attackRange: 2,
                attackDamage: 10,
                health: 30,
                state: 'idle', // idle, stalk, chase, retreat
                lastHowlTime: 0,
                howlCooldown: 10 + Math.random() * 20
            };
            
            this.wolves.push(wolf);
        }
    }
    
    createBossWolf() {
        const bossMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            emissive: 0x660000,
            emissiveIntensity: 0.2,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create larger wolf body
        const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 4);
        const body = new THREE.Mesh(bodyGeometry, bossMaterial);
        body.position.set(95, 0.75 - 20, 110); // Inside cave
        body.castShadow = true;
        
        // Create wolf head with glowing eyes
        const headGeometry = new THREE.BoxGeometry(1.2, 1, 1.2);
        const head = new THREE.Mesh(headGeometry, bossMaterial);
        head.position.set(95, 1.5 - 20, 112);
        
        // Create eye glows
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.8
        });
        
        const leftEyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const leftEye = new THREE.Mesh(leftEyeGeometry, eyeMaterial);
        leftEye.position.set(95.4, 1.5 - 20, 112.4);
        
        const rightEyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const rightEye = new THREE.Mesh(rightEyeGeometry, eyeMaterial);
        rightEye.position.set(94.6, 1.5 - 20, 112.4);
        
        this.scene.add(body);
        this.scene.add(head);
        this.scene.add(leftEye);
        this.scene.add(rightEye);
        
        this.bossWolf = {
            body,
            head,
            eyes: [leftEye, rightEye],
            position: new THREE.Vector3(95, -20, 110),
            targetPosition: new THREE.Vector3(95, -20, 110),
            speed: 4,
            detectionRange: 30,
            attackRange: 3,
            attackDamage: 25,
            health: 100,
            state: 'idle',
            isBoss: true
        };
    }
    
    createInteractables() {
        // Create battery packs
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 30 + Math.random() * 100;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const batteryGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.1);
            const batteryMaterial = new THREE.MeshStandardMaterial({
                color: 0x44aaff,
                emissive: 0x0044aa,
                emissiveIntensity: 0.3,
                roughness: 0.3,
                metalness: 0.7
            });
            
            const battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
            battery.position.set(x, 0.3 - 5, z);
            battery.castShadow = true;
            this.scene.add(battery);
            
            this.interactables.push({
                type: 'battery',
                mesh: battery,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                interactionRadius: 1.5
            });
        }
        
        // Create medkits
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Math.PI / 3;
            const radius = 40 + Math.random() * 80;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const medkitGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.3);
            const medkitMaterial = new THREE.MeshStandardMaterial({
                color: 0xff4444,
                roughness: 0.5,
                metalness: 0.3
            });
            
            const medkit = new THREE.Mesh(medkitGeometry, medkitMaterial);
            medkit.position.set(x, 0.1 - 5, z);
            medkit.castShadow = true;
            this.scene.add(medkit);
            
            this.interactables.push({
                type: 'medkit',
                mesh: medkit,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                interactionRadius: 1.5
            });
        }
        
        // Create resource nodes
        const resources = ['stick', 'cloth', 'vine', 'leaves'];
        resources.forEach((type, index) => {
            const count = 4;
            for (let i = 0; i < count; i++) {
                const angle = ((index * count + i) / (resources.length * count)) * Math.PI * 2;
                const radius = 50 + Math.random() * 120;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                let geometry, color;
                switch(type) {
                    case 'stick':
                        geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
                        color = 0x8B4513;
                        break;
                    case 'cloth':
                        geometry = new THREE.PlaneGeometry(0.3, 0.3);
                        color = 0xFFFFFF;
                        break;
                    case 'vine':
                        geometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 6);
                        color = 0x2E8B57;
                        break;
                    case 'leaves':
                        geometry = new THREE.SphereGeometry(0.3, 6, 6);
                        color = 0x32CD32;
                        break;
                }
                
                const material = new THREE.MeshStandardMaterial({ color });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0.5 - 5, z);
                mesh.castShadow = true;
                this.scene.add(mesh);
                
                this.interactables.push({
                    type,
                    mesh,
                    position: new THREE.Vector3(x, 0, z),
                    collected: false,
                    interactionRadius: 1.5
                });
            }
        });
    }
    
    createFlashlight() {
        // Create flashlight beam
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.flashlight.shadow.camera.near = 0.5;
        this.flashlight.shadow.camera.far = 50;
        
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Add flashlight casing
        const casingGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
        const casingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        const casing = new THREE.Mesh(casingGeometry, casingMaterial);
        casing.position.set(0.3, -0.5, -0.5);
        this.camera.add(casing);
        
        // Add lens
        const lensGeometry = new THREE.CircleGeometry(0.08, 8);
        const lensMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.5
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(0.3, -0.5, -0.65);
        lens.rotation.y = Math.PI / 2;
        this.camera.add(lens);
    }
    
    createParticleSystems() {
        // Create fireflies
        const fireflyCount = 30;
        const fireflyGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const fireflyMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < fireflyCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 80;
            const height = 2 + Math.random() * 5;
            
            const firefly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
            firefly.position.set(
                Math.cos(angle) * radius,
                height - 5,
                Math.sin(angle) * radius
            );
            
            this.particles.push({
                mesh: firefly,
                basePosition: firefly.position.clone(),
                speed: 0.5 + Math.random() * 1,
                timeOffset: Math.random() * Math.PI * 2
            });
            
            this.scene.add(firefly);
        }
        
        // Create floating leaves
        const leafCount = 50;
        const leafGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < leafCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 120;
            const height = 5 + Math.random() * 15;
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(
                Math.cos(angle) * radius,
                height - 5,
                Math.sin(angle) * radius
            );
            
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI;
            
            this.particles.push({
                mesh: leaf,
                basePosition: leaf.position.clone(),
                speed: 0.2 + Math.random() * 0.5,
                timeOffset: Math.random() * Math.PI * 2,
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.02 - 0.01,
                    Math.random() * 0.02 - 0.01,
                    Math.random() * 0.02 - 0.01
                )
            });
            
            this.scene.add(leaf);
        }
    }
    
    // ===============================
    // UI INITIALIZATION
    // ===============================
    
    async initUI() {
        console.log("🎨 Initializing UI...");
        
        try {
            const uiHTML = `
                <!-- Health Display -->
                <div class="health-container">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #ff4444; font-size: 1.2rem;">❤️</span>
                        <span style="font-weight: bold; color: white;">HEALTH</span>
                    </div>
                    <div class="health-bar">
                        <div class="health-fill" id="health-fill"></div>
                    </div>
                    <div id="health-text" style="text-align: center; margin-top: 5px; font-weight: bold; color: #ff4444;">100</div>
                </div>
                
                <!-- Stamina Display -->
                <div class="stamina-container">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #ffaa00; font-size: 1.2rem;">⚡</span>
                        <span style="font-weight: bold; color: white;">STAMINA</span>
                    </div>
                    <div class="stamina-bar">
                        <div class="stamina-fill" id="stamina-fill"></div>
                    </div>
                </div>
                
                <!-- Fear Display -->
                <div class="fear-container">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #aa44ff; font-size: 1.2rem;">😨</span>
                        <span style="font-weight: bold; color: white;">FEAR</span>
                    </div>
                    <div class="fear-bar">
                        <div class="fear-fill" id="fear-fill"></div>
                    </div>
                </div>
                
                <!-- Battery Display -->
                <div class="battery-container">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                        <span style="font-weight: bold; color: white;">FLASHLIGHT</span>
                        <span style="color: #44aaff; font-size: 1.2rem;">🔦</span>
                    </div>
                    <div id="battery-text" style="font-size: 1.5rem; font-weight: bold; color: #44aaff; margin-top: 5px;">100%</div>
                    <div style="color: #888; font-size: 0.9rem; margin-top: 2px;">Press F to toggle</div>
                </div>
                
                <!-- Time Display -->
                <div class="time-container">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                        <span style="font-weight: bold; color: white;">TIME</span>
                        <span style="color: #4CAF50; font-size: 1.2rem;">🕐</span>
                    </div>
                    <div id="time-text" style="font-size: 1.5rem; font-weight: bold; color: #4CAF50; margin-top: 5px;">00:00</div>
                    <div id="time-of-day" style="color: #888; font-size: 0.9rem; margin-top: 2px;">Day</div>
                </div>
                
                <!-- Inventory Display -->
                <div class="inventory-container">
                    <div style="color: #ffaa44; font-weight: bold; margin-bottom: 10px;">INVENTORY</div>
                    <div class="inventory-item">
                        <span>Medkits</span>
                        <span id="inventory-medkits" style="color: #ff4444; font-weight: bold;">1</span>
                    </div>
                    <div class="inventory-item">
                        <span>Batteries</span>
                        <span id="inventory-batteries" style="color: #44aaff; font-weight: bold;">2</span>
                    </div>
                    <div class="inventory-item">
                        <span>Sticks</span>
                        <span id="inventory-sticks" style="color: #8B4513; font-weight: bold;">0</span>
                    </div>
                    <div class="inventory-item">
                        <span>Cloth</span>
                        <span id="inventory-cloth" style="color: white; font-weight: bold;">0</span>
                    </div>
                    <div class="inventory-item">
                        <span>Vines</span>
                        <span id="inventory-vines" style="color: #2E8B57; font-weight: bold;">0</span>
                    </div>
                    <div class="inventory-item">
                        <span>Leaves</span>
                        <span id="inventory-leaves" style="color: #32CD32; font-weight: bold;">0</span>
                    </div>
                    <div class="inventory-item" style="border-top: 2px solid #4CAF50; margin-top: 10px; padding-top: 10px;">
                        <span>Survival Kits</span>
                        <span id="inventory-kits" style="color: #4CAF50; font-weight: bold;">0</span>
                    </div>
                </div>
                
                <!-- Objective Display -->
                <div class="objective-container">
                    <span class="objective-label">OBJECTIVE:</span>
                    <span class="objective-text" id="objective-text">Find your way out of the forest</span>
                </div>
                
                <!-- Crosshair -->
                <div class="crosshair">
                    <div class="crosshair-dot"></div>
                    <div class="crosshair-line horizontal"></div>
                    <div class="crosshair-line vertical"></div>
                </div>
                
                <!-- Notification -->
                <div class="notification" id="notification">
                    <div class="notification-text" id="notification-text"></div>
                </div>
                
                <!-- Dialogue Container -->
                <div class="dialogue-container" id="dialogue-container">
                    <div class="dialogue-text" id="dialogue-text"></div>
                    <div class="dialogue-options" id="dialogue-options"></div>
                </div>
            `;
            
            const uiContainer = document.getElementById('game-ui');
            if (uiContainer) {
                uiContainer.innerHTML = uiHTML;
                
                // Cache UI elements
                this.ui.healthFill = document.getElementById('health-fill');
                this.ui.staminaFill = document.getElementById('stamina-fill');
                this.ui.fearFill = document.getElementById('fear-fill');
                this.ui.batteryText = document.getElementById('battery-text');
                this.ui.timeText = document.getElementById('time-text');
                this.ui.objectiveText = document.getElementById('objective-text');
                this.ui.notification = document.getElementById('notification');
                this.ui.notificationText = document.getElementById('notification-text');
                this.ui.dialogueContainer = document.getElementById('dialogue-container');
                this.ui.dialogueText = document.getElementById('dialogue-text');
                this.ui.dialogueOptions = document.getElementById('dialogue-options');
                
                this.ui.inventoryItems = {
                    medkits: document.getElementById('inventory-medkits'),
                    batteries: document.getElementById('inventory-batteries'),
                    sticks: document.getElementById('inventory-sticks'),
                    cloth: document.getElementById('inventory-cloth'),
                    vines: document.getElementById('inventory-vines'),
                    leaves: document.getElementById('inventory-leaves'),
                    kits: document.getElementById('inventory-kits')
                };
            }
            
            // Create cutscene container
            const cutsceneHTML = `
                <div class="cutscene-container" id="cutscene-container">
                    <div class="cinematic-bars">
                        <div class="cinematic-bar top"></div>
                        <div class="cinematic-bar bottom"></div>
                    </div>
                    <div class="cutscene-text" id="cutscene-text"></div>
                    <div class="cutscene-character" id="cutscene-character"></div>
                    <div class="cutscene-continue" id="cutscene-continue">Click to continue</div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', cutsceneHTML);
            
            // Create pause menu
            const pauseHTML = `
                <div class="pause-menu" id="pause-menu">
                    <h1 class="pause-title">PAUSED</h1>
                    <button class="pause-button" id="resume-btn">RESUME GAME</button>
                    <button class="pause-button secondary" id="restart-btn">RESTART GAME</button>
                    <button class="pause-button secondary" id="menu-btn">MAIN MENU</button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', pauseHTML);
            
            // Create end screen
            const endHTML = `
                <div class="end-screen" id="end-screen">
                    <h1 class="end-title" id="end-title"></h1>
                    <div class="end-message" id="end-message"></div>
                    <div class="end-stats" id="end-stats"></div>
                    <button class="end-button" id="end-restart-btn">PLAY AGAIN</button>
                    <button class="end-button secondary" id="end-menu-btn">MAIN MENU</button>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', endHTML);
            
            console.log("✅ UI initialized successfully");
        } catch (error) {
            console.error("❌ UI initialization failed:", error);
            throw error;
        }
    }
    
    // ===============================
    // INPUT SYSTEM
    // ===============================
    
    async initInput() {
        console.log("🎮 Initializing input system...");
        
        try {
            // Setup pointer lock
            this.pointerLockElement = document.getElementById('game-canvas');
            
            // Request pointer lock on click
            this.pointerLockElement.addEventListener('click', () => {
                if (!this.isInCutscene && !this.isPaused) {
                    this.pointerLockElement.requestPointerLock();
                }
            });
            
            // Handle pointer lock change
            document.addEventListener('pointerlockchange', () => {
                if (document.pointerLockElement === this.pointerLockElement) {
                    this.isPointerLocked = true;
                    console.log("✅ Pointer locked");
                } else {
                    this.isPointerLocked = false;
                    console.log("❌ Pointer unlocked");
                }
            });
            
            // Handle mouse movement
            document.addEventListener('mousemove', (e) => {
                if (!this.isPointerLocked || this.isPaused || this.isInCutscene) return;
                
                this.cameraRotation.x += e.movementY * this.sensitivity;
                this.cameraRotation.y += e.movementX * this.sensitivity;
                
                // Clamp vertical rotation
                this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));
            });
            
            // Keyboard input
            document.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                
                // Update input state
                this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'];
                this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
                this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
                this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'];
                this.input.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
                this.input.crouch = this.keys['KeyC'];
                this.input.jump = this.keys['Space'];
                
                // Handle special keys
                if (!this.isPaused && !this.isInCutscene) {
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
                        case 'KeyV':
                            this.craftSurvivalKit();
                            break;
                        case 'KeyE':
                            this.interact();
                            break;
                    }
                }
                
                // Pause menu
                if (e.code === 'Escape') {
                    if (this.isInCutscene) {
                        this.skipCutscene();
                    } else {
                        this.togglePause();
                    }
                }
            });
            
            document.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
                
                // Update input state
                this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'];
                this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
                this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
                this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'];
                this.input.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
                this.input.crouch = this.keys['KeyC'];
                this.input.jump = this.keys['Space'];
            });
            
            // Skip cutscene button
            const skipButton = document.getElementById('skip-cutscene');
            if (skipButton) {
                skipButton.addEventListener('click', () => {
                    this.skipCutscene();
                });
            }
            
            // Pause menu buttons
            document.getElementById('resume-btn')?.addEventListener('click', () => {
                this.togglePause();
            });
            
            document.getElementById('restart-btn')?.addEventListener('click', () => {
                location.reload();
            });
            
            document.getElementById('menu-btn')?.addEventListener('click', () => {
                location.reload();
            });
            
            // End screen buttons
            document.getElementById('end-restart-btn')?.addEventListener('click', () => {
                location.reload();
            });
            
            document.getElementById('end-menu-btn')?.addEventListener('click', () => {
                location.reload();
            });
            
            console.log("✅ Input system initialized successfully");
        } catch (error) {
            console.error("❌ Input initialization failed:", error);
            throw error;
        }
    }
    
    // ===============================
    // CUTSCENE SYSTEM
    // ===============================
    
    startOpeningCutscene() {
        console.log("🎬 Starting opening cutscene...");
        
        this.isInCutscene = true;
        
        // Show cutscene container
        const cutsceneContainer = document.getElementById('cutscene-container');
        const skipButton = document.getElementById('skip-cutscene');
        
        if (cutsceneContainer) {
            cutsceneContainer.style.display = 'flex';
        }
        
        if (skipButton) {
            skipButton.style.display = 'block';
        }
        
        // Hide controls hint during cutscene
        document.getElementById('controls-hint').style.display = 'none';
        
        // Start cutscene
        this.playCutscene(this.cutscenes.opening, () => {
            this.endCutscene();
            this.startGame();
        });
    }
    
    playCutscene(scene, onComplete) {
        let currentIndex = 0;
        
        const showNextLine = () => {
            if (currentIndex >= scene.length) {
                onComplete();
                return;
            }
            
            const line = scene[currentIndex];
            const cutsceneText = document.getElementById('cutscene-text');
            const cutsceneCharacter = document.getElementById('cutscene-character');
            const cutsceneContinue = document.getElementById('cutscene-continue');
            
            if (cutsceneText) {
                cutsceneText.textContent = line.text;
                cutsceneText.style.animation = 'none';
                void cutsceneText.offsetWidth; // Trigger reflow
                cutsceneText.style.animation = 'textAppear 1s ease forwards';
            }
            
            if (cutsceneCharacter) {
                cutsceneCharacter.textContent = line.character || '';
                cutsceneCharacter.style.animation = 'none';
                void cutsceneCharacter.offsetWidth;
                cutsceneCharacter.style.animation = 'textAppear 1s ease 0.5s forwards';
            }
            
            if (cutsceneContinue) {
                cutsceneContinue.style.animation = 'none';
                void cutsceneContinue.offsetWidth;
                cutsceneContinue.style.animation = 'pulse 2s infinite 1s forwards';
            }
            
            currentIndex++;
            
            // Auto-advance after duration
            setTimeout(() => {
                if (currentIndex <= scene.length) {
                    showNextLine();
                }
            }, line.duration);
        };
        
        // Click to advance
        const advanceOnClick = () => {
            showNextLine();
        };
        
        cutsceneContainer.addEventListener('click', advanceOnClick);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                advanceOnClick();
            }
        });
        
        // Store references for cleanup
        this.cutsceneAdvance = advanceOnClick;
        
        // Start the cutscene
        showNextLine();
    }
    
    skipCutscene() {
        const cutsceneContainer = document.getElementById('cutscene-container');
        const skipButton = document.getElementById('skip-cutscene');
        
        if (cutsceneContainer) {
            cutsceneContainer.style.display = 'none';
        }
        
        if (skipButton) {
            skipButton.style.display = 'none';
        }
        
        // Show controls hint
        document.getElementById('controls-hint').style.display = 'block';
        
        // Cleanup event listeners
        if (this.cutsceneAdvance) {
            cutsceneContainer.removeEventListener('click', this.cutsceneAdvance);
            this.cutsceneAdvance = null;
        }
        
        this.isInCutscene = false;
        
        // If this was the opening cutscene, start the game
        if (!this.isRunning) {
            this.startGame();
        }
    }
    
    endCutscene() {
        const cutsceneContainer = document.getElementById('cutscene-container');
        const skipButton = document.getElementById('skip-cutscene');
        
        if (cutsceneContainer) {
            cutsceneContainer.style.display = 'none';
        }
        
        if (skipButton) {
            skipButton.style.display = 'none';
        }
        
        // Show controls hint
        document.getElementById('controls-hint').style.display = 'block';
        
        this.isInCutscene = false;
    }
    
    // ===============================
    // GAME LOOP
    // ===============================
    
    startGame() {
        console.log("🎮 Starting game...");
        
        this.isRunning = true;
        this.gameLoop();
        
        // Show notification
        this.showNotification("You're lost in the forest. Find your way out!");
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        
        // Update game time
        this.gameTime += delta;
        
        // Only update game logic if not paused or in cutscene
        if (!this.isPaused && !this.isInCutscene) {
            // Update camera rotation
            this.updateCamera(delta);
            
            // Update player movement
            this.updatePlayer(delta);
            
            // Update player stats
            this.updateStats(delta);
            
            // Update wolf AI
            this.updateWolves(delta);
            
            // Update boss wolf
            if (this.bossWolf) {
                this.updateBossWolf(delta);
            }
            
            // Update particles
            this.updateParticles(delta);
            
            // Update timed events
            this.updateTimedEvents();
            
            // Update audio
            this.updateAudio(delta);
            
            // Check for interactions
            this.checkInteractions();
            
            // Check for collisions
            this.checkCollisions();
            
            // Check for game events
            this.checkGameEvents();
            
            // Update UI
            this.updateUI();
        }
        
        // Update day/night cycle
        this.updateDayNightCycle(delta);
        
        // Update weather
        this.updateWeather(delta);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateCamera(delta) {
        // Apply camera rotation
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        
        // Update camera position from player
        this.camera.position.copy(this.player.position);
        
        // Add head bobbing when moving
        if ((this.input.forward || this.input.backward || this.input.left || this.input.right) && this.player.onGround) {
            const bobSpeed = this.input.sprint ? 15 : 10;
            const bobAmount = this.input.sprint ? 0.05 : 0.03;
            const bob = Math.sin(this.gameTime * bobSpeed) * bobAmount;
            this.camera.position.y += bob;
        }
    }
    
    updatePlayer(delta) {
        // Determine movement speed
        let targetSpeed = this.player.movementSpeed;
        
        if (this.input.crouch) {
            targetSpeed = this.player.crouchSpeed;
            this.player.stealth.isCrouching = true;
        } else {
            this.player.stealth.isCrouching = false;
            
            if (this.input.sprint && this.player.stamina > 0) {
                targetSpeed = this.player.sprintSpeed;
            }
        }
        
        // Smooth speed transition
        this.player.currentSpeed += (targetSpeed - this.player.currentSpeed) * 10 * delta;
        
        // Calculate movement direction
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(this.camera.up, forward).normalize();
        
        // Reset velocity
        this.player.velocity.x = 0;
        this.player.velocity.z = 0;
        
        // Apply movement input
        if (this.input.forward) {
            this.player.velocity.addScaledVector(forward, this.player.currentSpeed);
        }
        if (this.input.backward) {
            this.player.velocity.addScaledVector(forward, -this.player.currentSpeed);
        }
        if (this.input.left) {
            this.player.velocity.addScaledVector(right, -this.player.currentSpeed);
        }
        if (this.input.right) {
            this.player.velocity.addScaledVector(right, this.player.currentSpeed);
        }
        
        // Apply gravity
        if (!this.player.onGround) {
            this.player.velocity.y -= 9.8 * delta;
        }
        
        // Apply jumping
        if (this.input.jump && this.player.onGround) {
            this.player.velocity.y = this.player.jumpForce;
            this.player.onGround = false;
        }
        
        // Apply velocity
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Keep player above ground
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Update stealth based on movement
        this.updateStealth(delta);
    }
    
    updateStealth(delta) {
        // Calculate noise level based on movement
        let baseNoise = 0;
        if (this.player.velocity.length() > 0.1) {
            baseNoise = this.input.sprint ? 40 : 20;
            if (this.player.stealth.isCrouching) baseNoise *= 0.3;
        }
        
        // Environmental factors
        const terrainNoise = 10; // Base terrain noise
        const weatherNoise = this.weather.intensity * 30;
        
        this.player.stealth.noiseLevel = Math.min(100, baseNoise + terrainNoise + weatherNoise);
        
        // Calculate visibility based on light and cover
        const lightLevel = 50; // Base light level
        const cover = this.getNearbyCover();
        this.player.stealth.visibility = Math.min(100, lightLevel * (1 - cover));
        
        // Update fear effect based on stealth
        const fearEffect = document.getElementById('fear-overlay');
        if (fearEffect) {
            fearEffect.style.opacity = (this.player.fear / 100) * 0.3;
            fearEffect.style.filter = `blur(${(this.player.fear / 100) * 10}px)`;
        }
    }
    
    getNearbyCover() {
        // Simple cover calculation based on proximity to trees
        let cover = 0;
        const playerPos = this.player.position;
        
        for (const tree of this.trees) {
            const distance = playerPos.distanceTo(tree.position);
            if (distance < 5) {
                cover = Math.max(cover, (5 - distance) / 5);
            }
        }
        
        return Math.min(cover, 0.8);
    }
    
    updateStats(delta) {
        // Drain stamina when sprinting
        if (this.input.sprint && this.player.stamina > 0 && 
            (this.input.forward || this.input.backward || this.input.left || this.input.right)) {
            this.player.stamina -= 30 * delta;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 15 * delta;
        }
        
        this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, this.player.stamina));
        
        // Drain battery when flashlight is on
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 8 * delta;
            
            // Update flashlight intensity based on battery
            if (this.flashlight) {
                const intensity = Math.max(0.2, this.player.battery / 100 * 2);
                this.flashlight.intensity = intensity;
            }
            
            if (this.player.battery <= 0) {
                this.input.flashlight = false;
                if (this.flashlight) {
                    this.flashlight.intensity = 0;
                }
                this.showNotification("Flashlight battery dead!");
            }
        }
        
        this.player.battery = Math.max(0, Math.min(this.player.maxBattery, this.player.battery));
        
        // Increase fear over time
        this.player.fear += 0.8 * delta;
        
        // Increase fear faster in dark areas
        const lightLevel = this.getLightLevel();
        if (lightLevel < 0.3) {
            this.player.fear += 1.5 * delta;
        }
        
        // Increase fear when near wolves
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            if (distance < 15) {
                this.player.fear += (15 - distance) * 0.1 * delta;
            }
        }
        
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Random health drain from environmental hazards
        if (Math.random() < 0.001 * delta * 60) { // 0.1% chance per second
            this.player.health -= 5;
            this.showDamageFlash();
            
            if (this.player.health <= 0) {
                this.triggerBadEnding();
            }
        }
        
        // Check for low health warning
        if (this.player.health < 30 && !this.events.lowHealthWarning) {
            this.events.lowHealthWarning = true;
            this.showNotification("Warning: Health critical! Use H to heal.");
        }
        
        // Check for low battery warning
        if (this.player.battery < 20 && !this.events.lowBatteryWarning) {
            this.events.lowBatteryWarning = true;
            this.showNotification("Warning: Flashlight battery low! Find batteries.");
        }
        
        // Check for high fear warning
        if (this.player.fear > 70 && !this.events.highFearWarning) {
            this.events.highFearWarning = true;
            this.showNotification("Your fear is overwhelming... Find light!");
        }
    }
    
    getLightLevel() {
        // Simple light level calculation based on time of day and flashlight
        let lightLevel = 0.5 + Math.sin(this.timeOfDay * Math.PI * 2) * 0.5;
        
        if (this.input.flashlight && this.player.battery > 0) {
            lightLevel = Math.max(lightLevel, 0.8);
        }
        
        return lightLevel;
    }
    
    updateWolves(delta) {
        for (const wolf of this.wolves) {
            const distanceToPlayer = this.player.position.distanceTo(wolf.position);
            
            // Update wolf state based on distance and player stealth
            if (distanceToPlayer < wolf.detectionRange) {
                const detectionChance = (this.player.stealth.noiseLevel + this.player.stealth.visibility) / 200;
                
                if (detectionChance > 0.3 || distanceToPlayer < 5) {
                    wolf.state = 'chase';
                    wolf.targetPosition.copy(this.player.position);
                    
                    // Howl occasionally
                    const currentTime = this.gameTime;
                    if (currentTime - wolf.lastHowlTime > wolf.howlCooldown) {
                        wolf.lastHowlTime = currentTime;
                        this.playWolfHowl(wolf.position);
                    }
                } else if (distanceToPlayer < wolf.detectionRange * 0.7) {
                    wolf.state = 'stalk';
                    // Move toward player but more slowly
                    const direction = new THREE.Vector3().subVectors(this.player.position, wolf.position).normalize();
                    wolf.targetPosition.copy(wolf.position).addScaledVector(direction, wolf.speed * 0.5 * delta);
                } else {
                    wolf.state = 'idle';
                    // Wander randomly
                    if (Math.random() < 0.01) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 5 + Math.random() * 10;
                        wolf.targetPosition.x = wolf.position.x + Math.cos(angle) * distance;
                        wolf.targetPosition.z = wolf.position.z + Math.sin(angle) * distance;
                    }
                }
            } else {
                wolf.state = 'idle';
            }
            
            // Move wolf toward target
            const direction = new THREE.Vector3().subVectors(wolf.targetPosition, wolf.position);
            const distance = direction.length();
            
            if (distance > 0.1) {
                direction.normalize();
                const moveDistance = Math.min(distance, wolf.speed * delta);
                wolf.position.addScaledVector(direction, moveDistance);
                
                // Update mesh positions
                wolf.body.position.copy(wolf.position);
                wolf.head.position.set(wolf.position.x, wolf.position.y + 0.4, wolf.position.z + 1.2);
                
                // Update leg positions
                wolf.legs[0].position.set(wolf.position.x - 0.4, wolf.position.y, wolf.position.z - 0.8);
                wolf.legs[1].position.set(wolf.position.x - 0.4, wolf.position.y, wolf.position.z + 0.8);
                wolf.legs[2].position.set(wolf.position.x + 0.4, wolf.position.y, wolf.position.z - 0.8);
                wolf.legs[3].position.set(wolf.position.x + 0.4, wolf.position.y, wolf.position.z + 0.8);
                
                // Simple leg animation
                const legBob = Math.sin(this.gameTime * 10) * 0.1;
                wolf.legs.forEach((leg, index) => {
                    leg.position.y = wolf.position.y + legBob * (index % 2 === 0 ? 1 : -1);
                });
            }
            
            // Check for attack
            if (distanceToPlayer < wolf.attackRange && wolf.state === 'chase') {
                this.player.health -= wolf.attackDamage * delta;
                this.showDamageFlash();
                
                if (this.player.health <= 0) {
                    this.triggerBadEnding();
                }
            }
        }
    }
    
    updateBossWolf(delta) {
        if (!this.bossWolf) return;
        
        const distanceToPlayer = this.player.position.distanceTo(this.bossWolf.position);
        
        // Boss only activates if player is in cave
        const inCave = this.player.position.distanceTo(this.cave.interiorPosition) < 20;
        
        if (inCave && distanceToPlayer < this.bossWolf.detectionRange) {
            this.bossWolf.state = 'chase';
            this.bossWolf.targetPosition.copy(this.player.position);
            
            // Make eyes pulse
            const pulse = Math.sin(this.gameTime * 5) * 0.2 + 0.8;
            this.bossWolf.eyes.forEach(eye => {
                if (eye.material) {
                    eye.material.opacity = pulse;
                }
            });
        } else {
            this.bossWolf.state = 'idle';
            this.bossWolf.targetPosition.copy(this.cave.interiorPosition);
        }
        
        // Move boss wolf
        const direction = new THREE.Vector3().subVectors(this.bossWolf.targetPosition, this.bossWolf.position);
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            const moveDistance = Math.min(distance, this.bossWolf.speed * delta);
            this.bossWolf.position.addScaledVector(direction, moveDistance);
            
            // Update mesh positions
            this.bossWolf.body.position.copy(this.bossWolf.position);
            this.bossWolf.head.position.set(
                this.bossWolf.position.x,
                this.bossWolf.position.y + 1.5,
                this.bossWolf.position.z + 2
            );
            
            this.bossWolf.eyes[0].position.set(
                this.bossWolf.position.x + 0.4,
                this.bossWolf.position.y + 1.5,
                this.bossWolf.position.z + 2.4
            );
            
            this.bossWolf.eyes[1].position.set(
                this.bossWolf.position.x - 0.4,
                this.bossWolf.position.y + 1.5,
                this.bossWolf.position.z + 2.4
            );
        }
        
        // Boss attack
        if (distanceToPlayer < this.bossWolf.attackRange && this.bossWolf.state === 'chase') {
            this.player.health -= this.bossWolf.attackDamage * delta;
            this.showDamageFlash();
            
            // Shake camera
            this.camera.position.x += (Math.random() - 0.5) * 0.3;
            this.camera.position.y += (Math.random() - 0.5) * 0.3;
            
            if (this.player.health <= 0) {
                this.triggerBadEnding();
            }
        }
        
        // Check if boss is defeated
        if (this.bossWolf.health <= 0 && !this.story.bossDefeated) {
            this.story.bossDefeated = true;
            this.showNotification("The alpha wolf has been defeated!");
        }
    }
    
    updateParticles(delta) {
        // Update fireflies
        this.particles.forEach((particle, index) => {
            if (!particle.mesh) return;
            
            // Only update fireflies (small spheres)
            if (particle.mesh.geometry.type === 'SphereGeometry' && 
                particle.mesh.geometry.parameters.radius < 0.1) {
                
                const time = this.gameTime * particle.speed + particle.timeOffset;
                
                particle.mesh.position.x = particle.basePosition.x + Math.sin(time) * 2;
                particle.mesh.position.y = particle.basePosition.y + Math.cos(time * 1.3) * 1.5;
                particle.mesh.position.z = particle.basePosition.z + Math.sin(time * 0.7) * 2;
                
                // Pulsing glow
                const pulse = Math.sin(time * 2) * 0.2 + 0.8;
                particle.mesh.material.opacity = pulse * 0.8;
            }
            
            // Update leaves
            if (particle.mesh.geometry.type === 'PlaneGeometry') {
                const time = this.gameTime * particle.speed + particle.timeOffset;
                
                particle.mesh.position.y = particle.basePosition.y + Math.sin(time) * 0.5;
                
                // Gentle rotation
                if (particle.rotationSpeed) {
                    particle.mesh.rotation.x += particle.rotationSpeed.x;
                    particle.mesh.rotation.y += particle.rotationSpeed.y;
                    particle.mesh.rotation.z += particle.rotationSpeed.z;
                }
                
                // Drift slowly
                particle.mesh.position.x += Math.sin(time * 0.5) * 0.01;
                particle.mesh.position.z += Math.cos(time * 0.3) * 0.01;
            }
        });
    }
    
    updateTimedEvents() {
        this.timedEvents.forEach(event => {
            if (!event.triggered && this.gameTime >= event.time) {
                event.triggered = true;
                
                switch(event.type) {
                    case 'firstWolf':
                        this.story.wolfEventsTriggered.firstSighting = true;
                        this.showNotification("You hear a wolf howl in the distance...");
                        this.player.fear += 20;
                        break;
                        
                    case 'wolfPack':
                        this.story.wolfEventsTriggered.packEvent = true;
                        this.showNotification("Multiple wolves are closing in...");
                        this.player.fear += 30;
                        break;
                        
                    case 'wolfHorde':
                        this.story.wolfEventsTriggered.hordeEvent = true;
                        this.showNotification("A horde of wolves surrounds you!");
                        this.player.fear += 50;
                        break;
                        
                    case 'bossWolf':
                        this.showNotification("A deep growl echoes from the cave...");
                        break;
                }
            }
        });
    }
    
    updateAudio(delta) {
        if (!this.audio.enabled) return;
        
        // Update heartbeat based on fear and health
        const heartbeatRate = 60 + (this.player.fear / 100) * 40 + ((100 - this.player.health) / 100) * 40;
        this.audio.heartbeatOscillator.frequency.value = heartbeatRate;
        
        const heartbeatVolume = (this.player.fear / 100) * 0.5 + ((100 - this.player.health) / 100) * 0.3;
        this.audio.heartbeatGain.gain.value = Math.min(heartbeatVolume, 0.8);
        
        // Update wind based on weather
        const windVolume = 0.1 + this.weather.intensity * 0.2;
        const windPitch = 80 + this.weather.intensity * 40;
        
        this.audio.windGain.gain.value = windVolume;
        this.audio.windOscillator.frequency.value = windPitch;
        
        // Update forest ambient based on time of day
        const isNight = this.timeOfDay > 0.5;
        const forestVolume = isNight ? 0.08 : 0.05;
        const forestPitch = isNight ? 150 : 200;
        
        this.audio.forestGain.gain.value = forestVolume;
        this.audio.forestOscillator.frequency.value = forestPitch;
        this.audio.forestFilter.frequency.value = isNight ? 300 : 500;
        
        // Play footstep sounds
        if ((this.input.forward || this.input.backward || this.input.left || this.input.right) && 
            this.player.onGround && !this.isInCutscene) {
            
            const footstepInterval = this.input.sprint ? 0.3 : 0.5;
            const footstepVolume = this.input.sprint ? 0.4 : 0.2;
            
            if (this.gameTime % footstepInterval < delta) {
                // In a real game, you would play actual footstep sounds here
                console.log("Footstep sound would play here");
            }
        }
    }
    
    updateDayNightCycle(delta) {
        // Update time of day
        this.timeOfDay += delta * 0.00005; // 24 game minutes per real second
        
        if (this.timeOfDay >= 1) {
            this.timeOfDay = 0;
        }
        
        // Update lighting based on time
        const sunHeight = Math.sin(this.timeOfDay * Math.PI * 2);
        const isDay = sunHeight > 0;
        
        // Update sun/moon position
        const sunDistance = 200;
        const sunX = Math.cos(this.timeOfDay * Math.PI * 2) * sunDistance;
        const sunY = Math.sin(this.timeOfDay * Math.PI * 2) * sunDistance;
        
        this.sunLight.position.set(sunX, sunY, 100);
        
        // Update light intensity
        const dayIntensity = 1.0;
        const nightIntensity = 0.3;
        const transition = Math.abs(sunHeight);
        
        this.sunLight.intensity = nightIntensity + (dayIntensity - nightIntensity) * transition;
        
        // Update fog color and density
        const dayFogColor = new THREE.Color(0x87CEEB);
        const nightFogColor = new THREE.Color(0x0A0A2A);
        const fogColor = dayFogColor.clone().lerp(nightFogColor, (1 - transition) * 0.5);
        
        this.scene.background = fogColor;
        this.scene.fog.color = fogColor;
        this.scene.fog.density = 0.01 + (1 - transition) * 0.02;
        
        // Update time of day display
        const timeDisplay = document.getElementById('time-of-day');
        if (timeDisplay) {
            if (isDay) {
                timeDisplay.textContent = "Day";
                timeDisplay.style.color = "#ffcc00";
            } else {
                timeDisplay.textContent = "Night";
                timeDisplay.style.color = "#4444ff";
            }
        }
    }
    
    updateWeather(delta) {
        // Random weather changes
        if (Math.random() < 0.0001 * delta * 60) { // 0.01% chance per second
            const weatherTypes = ['clear', 'rainy', 'foggy'];
            const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            
            if (newWeather !== this.weather.type) {
                this.weather.type = newWeather;
                
                switch(newWeather) {
                    case 'rainy':
                        this.weather.intensity = 0.5 + Math.random() * 0.5;
                        this.showNotification("It starts to rain...");
                        break;
                    case 'foggy':
                        this.weather.intensity = 0.3 + Math.random() * 0.7;
                        this.showNotification("A thick fog rolls in...");
                        break;
                    default:
                        this.weather.intensity = 0;
                        this.showNotification("The weather clears...");
                }
            }
        }
        
        // Update fog based on weather
        const targetFogDensity = 0.01 + this.weather.intensity * 0.04;
        this.scene.fog.density += (targetFogDensity - this.scene.fog.density) * 0.1 * delta * 60;
    }
    
    checkInteractions() {
        const playerPos = this.player.position;
        let nearestInteractable = null;
        let nearestDistance = Infinity;
        
        // Find nearest interactable
        for (const interactable of this.interactables) {
            if (interactable.collected) continue;
            
            const distance = playerPos.distanceTo(interactable.position);
            if (distance < interactable.interactionRadius && distance < nearestDistance) {
                nearestDistance = distance;
                nearestInteractable = interactable;
            }
        }
        
        // Show interaction prompt
        if (nearestInteractable && nearestDistance < 2) {
            this.showInteractionPrompt(nearestInteractable.type);
        } else {
            this.hideInteractionPrompt();
        }
    }
    
    checkCollisions() {
        const playerPos = this.player.position;
        const playerRadius = 0.5;
        
        // Check tree collisions
        for (const tree of this.trees) {
            const distance = playerPos.distanceTo(tree.position);
            if (distance < playerRadius + tree.collisionRadius) {
                // Push player away from tree
                const direction = new THREE.Vector3().subVectors(playerPos, tree.position).normalize();
                const pushDistance = playerRadius + tree.collisionRadius - distance;
                playerPos.addScaledVector(direction, pushDistance * 1.1);
            }
        }
        
        // Check rock collisions
        for (const rock of this.rocks) {
            const distance = playerPos.distanceTo(rock.position);
            if (distance < playerRadius + rock.collisionRadius) {
                const direction = new THREE.Vector3().subVectors(playerPos, rock.position).normalize();
                const pushDistance = playerRadius + rock.collisionRadius - distance;
                playerPos.addScaledVector(direction, pushDistance * 1.1);
            }
        }
        
        // Check log collisions
        for (const log of this.logs) {
            const distance = playerPos.distanceTo(log.position);
            if (distance < playerRadius + log.collisionRadius) {
                const direction = new THREE.Vector3().subVectors(playerPos, log.position).normalize();
                const pushDistance = playerRadius + log.collisionRadius - distance;
                playerPos.addScaledVector(direction, pushDistance * 1.1);
            }
        }
        
        // Keep player within bounds
        const bounds = 240;
        playerPos.x = Math.max(-bounds, Math.min(bounds, playerPos.x));
        playerPos.z = Math.max(-bounds, Math.min(bounds, playerPos.z));
    }
    
    checkGameEvents() {
        // Check for good ending (escape forest)
        if (this.player.position.z < -220 && !this.isInCutscene) {
            this.triggerGoodEnding();
            return;
        }
        
        // Check for cave exploration
        const caveDistance = this.player.position.distanceTo(this.cave.position);
        if (caveDistance < 10 && !this.story.exploredCave) {
            this.story.exploredCave = true;
            this.showNotification("You found a cave entrance...");
        }
        
        // Check for secret ending (find Heartseed Tree)
        const treeDistance = this.player.position.distanceTo(new THREE.Vector3(-150, 0, -150));
        if (treeDistance < 15 && !this.story.heartseedFound) {
            this.story.heartseedFound = true;
            this.triggerSecretEnding();
            return;
        }
        
        // Check for boss wolf encounter
        if (this.bossWolf) {
            const bossDistance = this.player.position.distanceTo(this.bossWolf.position);
            if (bossDistance < 10 && !this.story.bossDefeated) {
                this.showNotification("An alpha wolf emerges from the darkness!");
            }
        }
        
        // Random jump scares
        if (Math.random() < 0.0005 * delta && this.player.fear > 30 && !this.isInCutscene) {
            this.triggerJumpScare();
        }
    }
    
    // ===============================
    // GAME MECHANICS
    // ===============================
    
    toggleFlashlight() {
        this.input.flashlight = !this.input.flashlight;
        
        if (this.flashlight) {
            this.flashlight.intensity = this.input.flashlight && this.player.battery > 0 ? 
                Math.max(0.2, this.player.battery / 100 * 2) : 0;
        }
        
        this.showNotification(`Flashlight ${this.input.flashlight ? 'ON' : 'OFF'}`);
    }
    
    useMedkit() {
        if (this.inventory.medkits > 0 && this.player.health < this.player.maxHealth) {
            const healAmount = 40;
            this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
            this.inventory.medkits--;
            this.updateUI();
            this.showNotification(`Used medkit: +${healAmount} health`);
        } else if (this.inventory.medkits <= 0) {
            this.showNotification("No medkits in inventory!");
        } else {
            this.showNotification("Health already full!");
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            const chargeAmount = 50;
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + chargeAmount);
            this.inventory.batteries--;
            this.updateUI();
            this.showNotification(`Used battery: +${chargeAmount}% charge`);
            
            // Update flashlight if it's on
            if (this.input.flashlight && this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
        } else if (this.inventory.batteries <= 0) {
            this.showNotification("No batteries in inventory!");
        } else {
            this.showNotification("Battery already full!");
        }
    }
    
    craftSurvivalKit() {
        const recipe = this.craftingRecipes.survivalKit;
        
        if (this.inventory.batteries >= 1 && this.inventory.medkits >= 1) {
            this.inventory.batteries -= 1;
            this.inventory.medkits -= 1;
            this.inventory.survivalKits += 1;
            
            this.updateUI();
            this.showNotification("Crafted Survival Kit!");
        } else {
            this.showNotification("Need 1 Battery and 1 Medkit to craft!");
        }
    }
    
    interact() {
        const playerPos = this.player.position;
        
        // Find nearest interactable
        for (const interactable of this.interactables) {
            if (interactable.collected) continue;
            
            const distance = playerPos.distanceTo(interactable.position);
            if (distance < 2) {
                this.collectItem(interactable);
                break;
            }
        }
    }
    
    collectItem(interactable) {
        interactable.collected = true;
        
        // Remove from scene
        this.scene.remove(interactable.mesh);
        
        // Add to inventory
        switch(interactable.type) {
            case 'battery':
                this.inventory.batteries++;
                this.showNotification("Found Battery Pack!");
                break;
            case 'medkit':
                this.inventory.medkits++;
                this.showNotification("Found Medkit!");
                break;
            case 'stick':
                this.inventory.sticks++;
                this.showNotification("Found Stick");
                break;
            case 'cloth':
                this.inventory.cloth++;
                this.showNotification("Found Cloth");
                break;
            case 'vine':
                this.inventory.vines++;
                this.showNotification("Found Vine");
                break;
            case 'leaves':
                this.inventory.leaves++;
                this.showNotification("Found Leaves");
                break;
        }
        
        this.updateUI();
    }
    
    // ===============================
    // UI UPDATES
    // ===============================
    
    updateUI() {
        // Update health
        if (this.ui.healthFill) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            this.ui.healthFill.style.width = `${healthPercent}%`;
            document.getElementById('health-text').textContent = Math.round(this.player.health);
        }
        
        // Update stamina
        if (this.ui.staminaFill) {
            const staminaPercent = (this.player.stamina / this.player.maxStamina) * 100;
            this.ui.staminaFill.style.width = `${staminaPercent}%`;
        }
        
        // Update fear
        if (this.ui.fearFill) {
            const fearPercent = (this.player.fear / this.player.maxFear) * 100;
            this.ui.fearFill.style.width = `${fearPercent}%`;
        }
        
        // Update battery
        if (this.ui.batteryText) {
            this.ui.batteryText.textContent = `${Math.round(this.player.battery)}%`;
            this.ui.batteryText.style.color = this.player.battery > 20 ? '#44aaff' : 
                                             this.player.battery > 5 ? '#ffaa00' : '#ff4444';
        }
        
        // Update time
        if (this.ui.timeText) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = Math.floor(this.gameTime % 60);
            this.ui.timeText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update objective
        if (this.ui.objectiveText) {
            let objective = "Find your way out of the forest";
            
            if (this.player.position.z < -80) {
                objective = "You're getting close to the edge...";
            } else if (this.player.position.z < -40) {
                objective = "Follow the path north";
            } else if (this.story.exploredCave) {
                objective = "Explore the cave or continue north";
            } else if (this.story.helpedClassmate) {
                objective = "Help Alex escape the forest";
            }
            
            this.ui.objectiveText.textContent = objective;
        }
        
        // Update inventory
        if (this.ui.inventoryItems) {
            this.ui.inventoryItems.medkits.textContent = this.inventory.medkits;
            this.ui.inventoryItems.batteries.textContent = this.inventory.batteries;
            this.ui.inventoryItems.sticks.textContent = this.inventory.sticks;
            this.ui.inventoryItems.cloth.textContent = this.inventory.cloth;
            this.ui.inventoryItems.vines.textContent = this.inventory.vines;
            this.ui.inventoryItems.leaves.textContent = this.inventory.leaves;
            this.ui.inventoryItems.kits.textContent = this.inventory.survivalKits;
        }
    }
    
    showNotification(text, duration = 3000) {
        if (!this.ui.notification || !this.ui.notificationText) return;
        
        this.ui.notificationText.textContent = text;
        this.ui.notification.classList.add('show');
        
        setTimeout(() => {
            this.ui.notification.classList.remove('show');
        }, duration);
    }
    
    showInteractionPrompt(itemType) {
        // In a real implementation, you would show an interaction prompt
        console.log(`Press E to pick up ${itemType}`);
    }
    
    hideInteractionPrompt() {
        // Hide interaction prompt
    }
    
    showDamageFlash() {
        const flash = document.getElementById('damage-flash');
        if (!flash) return;
        
        flash.style.background = 'rgba(255, 0, 0, 0.3)';
        flash.style.transition = 'background 0.3s';
        
        setTimeout(() => {
            flash.style.background = 'rgba(255, 0, 0, 0)';
        }, 300);
    }
    
    triggerJumpScare() {
        const jumpScare = document.getElementById('jump-scare');
        if (!jumpScare) return;
        
        // Create jump scare content
        jumpScare.innerHTML = '<div class="jump-scare-content">!</div>';
        jumpScare.style.display = 'flex';
        
        // Play sound if audio is enabled
        if (this.audio.enabled) {
            // Create a scary sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audio.groups.effects);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        }
        
        // Increase fear
        this.player.fear += 20;
        
        // Hide after 0.5 seconds
        setTimeout(() => {
            jumpScare.style.display = 'none';
        }, 500);
    }
    
    playWolfHowl(position) {
        if (!this.audio.enabled) return;
        
        // Create wolf howl sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audio.groups.effects);
        
        oscillator.type = 'sine';
        
        // Howl pattern
        const times = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
        const freqs = [150, 200, 180, 220, 190, 210, 150];
        const gains = [0, 0.3, 0.1, 0.4, 0.2, 0.5, 0];
        
        times.forEach((time, index) => {
            oscillator.frequency.setValueAtTime(freqs[index], this.audioContext.currentTime + time);
            gainNode.gain.setValueAtTime(gains[index], this.audioContext.currentTime + time);
        });
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
    }
    
    // ===============================
    // ENDINGS
    // ===============================
    
    triggerGoodEnding() {
        console.log("🎉 Good ending triggered!");
        this.isRunning = false;
        
        this.playCutscene(this.cutscenes.goodEnding, () => {
            this.showEndingScreen(
                "GOOD ENDING",
                "You escaped the forest with Alex! Back home, you celebrate your survival with hot chocolate and stories that will become legends among your classmates.",
                "#4CAF50"
            );
        });
    }
    
    triggerBadEnding() {
        console.log("💀 Bad ending triggered!");
        this.isRunning = false;
        
        this.playCutscene(this.cutscenes.badEnding, () => {
            this.showEndingScreen(
                "BAD ENDING",
                "The wolves were too many. Search parties find your belongings weeks later, scattered among the trees. The forest keeps its secrets.",
                "#f44336"
            );
        });
    }
    
    triggerSecretEnding() {
        console.log("🌳 Secret ending triggered!");
        this.isRunning = false;
        
        // Add Heartseed Tree to scene
        if (this.heartseedTree && !this.heartseedTree.addedToScene) {
            this.scene.add(this.heartseedTree.trunk);
            this.scene.add(this.heartseedTree.leaves);
            this.heartseedTree.addedToScene = true;
        }
        
        this.playCutscene(this.cutscenes.secretEnding, () => {
            this.showEndingScreen(
                "SECRET ENDING",
                "You become one with the forest, your consciousness merging with the ancient trees. You watch over the woods as its eternal guardian, understanding its secrets and protecting its balance.",
                "#8BC34A"
            );
        });
    }
    
    showEndingScreen(title, message, color) {
        const endScreen = document.getElementById('end-screen');
        const endTitle = document.getElementById('end-title');
        const endMessage = document.getElementById('end-message');
        const endStats = document.getElementById('end-stats');
        
        if (!endScreen || !endTitle || !endMessage || !endStats) return;
        
        // Set content
        endTitle.textContent = title;
        endTitle.style.color = color;
        
        endMessage.textContent = message;
        
        // Calculate stats
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const itemsFound = this.inventory.medkits + this.inventory.batteries + 
                          this.inventory.sticks + this.inventory.cloth + 
                          this.inventory.vines + this.inventory.leaves;
        
        endStats.innerHTML = `
            Time survived: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            Items collected: ${itemsFound}<br>
            Max fear reached: ${Math.round(this.player.fear)}%
        `;
        
        // Show end screen
        endScreen.style.display = 'flex';
    }
    
    // ===============================
    // PAUSE MENU
    // ===============================
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseMenu = document.getElementById('pause-menu');
        const controlsHint = document.getElementById('controls-hint');
        
        if (this.isPaused) {
            // Show pause menu
            if (pauseMenu) {
                pauseMenu.style.display = 'flex';
            }
            
            // Hide controls hint
            if (controlsHint) {
                controlsHint.style.display = 'none';
            }
            
            // Exit pointer lock
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        } else {
            // Hide pause menu
            if (pauseMenu) {
                pauseMenu.style.display = 'none';
            }
            
            // Show controls hint
            if (controlsHint) {
                controlsHint.style.display = 'block';
            }
            
            // Request pointer lock if not in cutscene
            if (!this.isInCutscene) {
                this.pointerLockElement.requestPointerLock();
            }
        }
    }
}

// ===============================
// START THE GAME
// ===============================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM loaded, starting game...");
    
    // Create game instance
    window.game = new EarsOfTheForest();
    
    // Start the game after a short delay
    setTimeout(() => {
        try {
            window.game.init();
        } catch (error) {
            console.error("❌ Game failed to start:", error);
            alert("Game failed to load. Please check console for details.");
        }
    }, 100);
});
