// =========================================================
// EARS OF THE FOREST - ENHANCED VERSION
// =========================================================

class EarsOfTheForest {
    constructor() {
        // Core game state
        this.isRunning = false;
        this.isPaused = false;
        this.isInCutscene = false;
        this.isInMenu = true;
        this.gameTime = 0;
        this.gameStarted = false;
        this.loadingComplete = false;
        
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
            poisoned: false,
            radiation: 0,
            maxRadiation: 100
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
        this.wolves = [];
        this.berries = [];
        this.mushrooms = [];
        this.sticks = [];
        this.rocks = [];
        this.flashlight = null;
        this.sunLight = null;
        this.rainParticles = [];
        
        // Weather system
        this.weather = {
            isRaining: false,
            temperature: 20,
            timeOfDay: 16,
            fogDensity: 0.015,
            rainIntensity: 0
        };
        
        // Inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            berries: 0,
            mushrooms: 0,
            sticks: 0,
            water: 0,
            survivalKit: false,
            compass: true,
            mapFragments: 0,
            totalFragments: 3
        };
        
        // Story flags
        this.story = {
            wolvesEncountered: 0,
            itemsCollected: 0,
            objectivesCompleted: 0,
            totalObjectives: 3,
            secretsFound: 0,
            totalSecrets: 5
        };
        
        // Wolf AI timers
        this.wolfEvents = {
            firstChase: false,
            timer: 0,
            howlTimer: 0,
            nextHowl: 30
        };
        
        // UI elements cache
        this.ui = {};
        
        // Audio
        this.audioEnabled = true;
        this.audioContext = null;
        this.sounds = {};
        
        // Messages
        this.messages = [];
        this.maxMessages = 10;
        
        // Cutscene state
        this.currentCutscene = null;
        
        // Loading state
        this.loadingProgress = 0;
        this.totalAssets = 10;
        this.loadedAssets = 0;
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.frameTimes = [];
        
        // Achievements
        this.achievements = {
            survived5min: false,
            killedWolf: false,
            foundSecret: false,
            collectedAll: false,
            escaped: false,
            noDamage: false,
            speedrun: false,
            pacifist: false,
            explorer: false,
            master: false
        };
        
        // Settings
        this.settings = {
            graphics: {
                quality: 'medium',
                shadows: true,
                particles: 80
            },
            audio: {
                master: 80,
                music: 60,
                sfx: 80,
                ambience: 70
            },
            controls: {
                sensitivity: 5,
                invertY: false
            }
        };
        
        // Save system
        this.saveSlots = [null, null, null];
        this.currentSaveSlot = 0;
        
        // Game time tracking
        this.startTime = 0;
        this.lastSaveTime = 0;
        
        // Emergency skip
        this.emergencySkipEnabled = false;
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    init() {
        console.log("🎮 Initializing Ears of the Forest...");
        
        // Show loading screen
        this.updateLoadingProgress("Checking dependencies...", 10);
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            this.updateLoadingProgress("ERROR: Three.js not loaded!", 100);
            this.showEmergencySkip();
            return;
        }
        
        // Initialize loading sequence
        this.loadStep1();
    }
    
    loadStep1() {
        this.updateLoadingProgress("Initializing graphics engine...", 20);
        
        try {
            this.initThreeJS();
            setTimeout(() => this.loadStep2(), 300);
        } catch (error) {
            console.error("Graphics initialization failed:", error);
            this.updateLoadingProgress("Graphics initialization failed", 100);
            this.showEmergencySkip();
        }
    }
    
    loadStep2() {
        this.updateLoadingProgress("Creating 3D world...", 40);
        
        try {
            this.initWorld();
            setTimeout(() => this.loadStep3(), 300);
        } catch (error) {
            console.error("World creation failed:", error);
            this.updateLoadingProgress("World creation failed", 100);
            this.showEmergencySkip();
        }
    }
    
    loadStep3() {
        this.updateLoadingProgress("Setting up game systems...", 60);
        
        try {
            this.initUI();
            this.initAudio();
            setTimeout(() => this.loadStep4(), 300);
        } catch (error) {
            console.error("System setup failed:", error);
            this.updateLoadingProgress("System setup failed", 100);
            this.showEmergencySkip();
        }
    }
    
    loadStep4() {
        this.updateLoadingProgress("Configuring controls...", 80);
        
        try {
            this.initInput();
            this.initSettings();
            setTimeout(() => this.loadStep5(), 300);
        } catch (error) {
            console.error("Control configuration failed:", error);
            this.updateLoadingProgress("Control configuration failed", 100);
            this.showEmergencySkip();
        }
    }
    
    loadStep5() {
        this.updateLoadingProgress("Finalizing...", 95);
        
        try {
            setTimeout(() => {
                this.updateLoadingProgress("Ready to play!", 100);
                this.loadingComplete = true;
                
                // Start performance monitoring
                this.startPerformanceMonitor();
                
                // Show main menu after a short delay
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showMainMenu();
                }, 1000);
                
            }, 500);
        } catch (error) {
            console.error("Finalization failed:", error);
            this.updateLoadingProgress("Finalization failed", 100);
            this.showEmergencySkip();
        }
    }
    
    updateLoadingProgress(text, percent) {
        console.log(`📦 Loading: ${text} (${percent}%)`);
        
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingTip = document.getElementById('loading-tip');
        const assetCount = document.getElementById('asset-count');
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        // Show tips
        const tips = [
            "Press F to toggle flashlight",
            "Collect berries with E key",
            "Watch your hunger and thirst",
            "Listen for wolf howls",
            "Some mushrooms are poisonous",
            "Use H to heal, B for batteries",
            "Find your way out of the forest",
            "Check the map for your position",
            "Rain reduces your temperature",
            "Complete objectives to survive"
        ];
        
        if (loadingTip && percent % 25 === 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            loadingTip.textContent = `💡 Tip: ${randomTip}`;
        }
        
        if (assetCount) {
            assetCount.textContent = `${Math.floor(percent/10)}/${this.totalAssets}`;
        }
        
        this.loadingProgress = percent;
    }
    
    hideLoadingScreen() {
        console.log("🚀 Hiding loading screen...");
        
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    showEmergencySkip() {
        console.log("⚠️ Showing emergency skip button");
        
        const emergencyBtn = document.getElementById('emergency-skip');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'block';
            emergencyBtn.addEventListener('click', () => {
                this.emergencySkip();
            });
        }
    }
    
    emergencySkip() {
        console.log("🚨 Emergency skip activated!");
        
        this.emergencySkipEnabled = true;
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show main menu directly
        this.showMainMenu();
        
        // Show warning notification
        this.showNotification("Emergency mode activated. Some features may be limited.", 5000, 'warning');
    }
    
    // ===============================
    // THREE.JS INITIALIZATION
    // ===============================
    
    initThreeJS() {
        console.log("🎨 Initializing Three.js...");
        
        try {
            // Create scene with enhanced fog
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x001a00);
            this.scene.fog = new THREE.FogExp2(0x001a00, this.weather.fogDensity);
            
            // Create camera with improved settings
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.copy(this.player.position);
            
            // Create renderer with enhanced settings
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                throw new Error("Canvas element not found!");
            }
            
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            // Create clock for timing
            this.clock = new THREE.Clock();
            
            // Handle window resize with debouncing
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                    console.log("🔄 Window resized");
                }, 250);
            });
            
            console.log("✅ Three.js initialized successfully!");
            
        } catch (error) {
            console.error("❌ Three.js initialization error:", error);
            throw error;
        }
    }
    
    // ===============================
    // WORLD CREATION
    // ===============================
    
    initWorld() {
        console.log("🌍 Creating world...");
        
        try {
            // Enhanced lighting system
            this.createLighting();
            
            // Terrain and ground
            this.createTerrain();
            
            // Foliage and trees
            this.createFoliage();
            
            // Collectibles and items
            this.createCollectibles();
            
            // Wildlife and enemies
            this.createWildlife();
            
            // Environmental effects
            this.createEnvironment();
            
            console.log("✅ World created successfully!");
            
        } catch (error) {
            console.error("❌ World creation error:", error);
            throw error;
        }
    }
    
    createLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light (sun/moon)
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
        
        // Hemisphere light for natural outdoor look
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x006400, 0.4);
        this.scene.add(hemisphereLight);
    }
    
    createTerrain() {
        // Ground plane with texture
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Displace vertices for natural terrain
        const vertices = groundGeometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getY(i); // Note: PlaneGeometry uses XZ, not XY
            
            // Create gentle hills using multiple noise frequencies
            let height = 0;
            height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
            height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1;
            height += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 0.5;
            
            vertices.setZ(i, height);
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grass patches
        for (let i = 0; i < 50; i++) {
            const grass = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                new THREE.MeshBasicMaterial({
                    color: 0x3a7d34,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.3
                })
            );
            grass.rotation.x = -Math.PI / 2;
            grass.position.set(
                (Math.random() - 0.5) * 180,
                -1.8,
                (Math.random() - 0.5) * 180
            );
            this.scene.add(grass);
        }
    }
    
    createFoliage() {
        // Create diverse trees
        const treeTypes = [
            { height: 6, radius: 2, color: 0x2f5f2f },
            { height: 8, radius: 2.5, color: 0x3a7542 },
            { height: 5, radius: 1.5, color: 0x285028 }
        ];
        
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Skip trees near spawn area
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            
            const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            
            // Trunk with variation
            const trunkHeight = type.height * 0.6;
            const trunkRadius = 0.4 + Math.random() * 0.2;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8),
                new THREE.MeshStandardMaterial({ 
                    color: 0x4a2e1f,
                    roughness: 0.9
                })
            );
            trunk.position.set(x, trunkHeight / 2 - 1, z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            
            // Leaves with variation
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(type.radius, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: type.color,
                    roughness: 0.8,
                    transparent: true,
                    opacity: 0.9
                })
            );
            leaves.position.set(x, trunkHeight - 1, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
            
            this.trees.push({
                trunk,
                leaves,
                position: new THREE.Vector3(x, 0, z),
                type: type
            });
        }
        
        // Add bushes
        for (let i = 0; i < 20; i++) {
            const bush = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 6, 6),
                new THREE.MeshStandardMaterial({
                    color: 0x3a7d34,
                    roughness: 0.9
                })
            );
            bush.position.set(
                (Math.random() - 0.5) * 180,
                0,
                (Math.random() - 0.5) * 180
            );
            bush.castShadow = true;
            this.scene.add(bush);
        }
    }
    
    createCollectibles() {
        // Berries (health restoration)
        for (let i = 0; i < 12; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            
            const berry = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 6, 6),
                new THREE.MeshStandardMaterial({ 
                    color: 0xff4444,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.2
                })
            );
            berry.position.set(x, 0.2, z);
            berry.castShadow = true;
            
            // Add pulsing animation
            this.scene.add(berry);
            this.berries.push({
                mesh: berry,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                type: 'berry',
                value: 15
            });
        }
        
        // Mushrooms (risky food)
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const isPoisonous = Math.random() < 0.3;
            
            const mushroom = new THREE.Mesh(
                new THREE.ConeGeometry(0.2, 0.4, 6),
                new THREE.MeshStandardMaterial({ 
                    color: isPoisonous ? 0x9900ff : 0xffaa00,
                    emissive: isPoisonous ? 0x6600cc : 0xff8800,
                    emissiveIntensity: 0.3
                })
            );
            mushroom.position.set(x, 0.2, z);
            mushroom.castShadow = true;
            
            this.scene.add(mushroom);
            this.mushrooms.push({
                mesh: mushroom,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                poisonous: isPoisonous,
                type: 'mushroom',
                value: isPoisonous ? -20 : 25
            });
        }
        
        // Sticks (crafting material)
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            
            const stick = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            stick.position.set(x, 0.5, z);
            stick.rotation.x = Math.random() * Math.PI;
            stick.rotation.z = Math.random() * Math.PI;
            
            this.scene.add(stick);
            this.sticks.push({
                mesh: stick,
                position: new THREE.Vector3(x, 0, z),
                collected: false,
                type: 'stick',
                value: 1
            });
        }
        
        // Map fragments (secret collectibles)
        for (let i = 0; i < this.inventory.totalFragments; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            const fragment = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.05, 0.3),
                new THREE.MeshStandardMaterial({ 
                    color: 0x4CAF50,
                    emissive: 0x4CAF50,
                    emissiveIntensity: 0.5
                })
            );
            fragment.position.set(x, 0.15, z);
            
            this.scene.add(fragment);
        }
    }
    
    createWildlife() {
        // Wolves (enemies)
        for (let i = 0; i < 4; i++) {
            const x = (Math.random() - 0.5) * 120;
            const z = (Math.random() - 0.5) * 120;
            
            // Create wolf body
            const body = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.4, 1.2, 4, 8),
                new THREE.MeshStandardMaterial({ 
                    color: 0x333333,
                    roughness: 0.8
                })
            );
            body.position.set(x, 0.8, z);
            body.castShadow = true;
            
            // Create wolf head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            head.position.set(x, 1.1, z + 0.6);
            
            this.scene.add(body);
            this.scene.add(head);
            
            this.wolves.push({
                body,
                head,
                position: new THREE.Vector3(x, 0, z),
                target: new THREE.Vector3(x, 0, z),
                speed: 2 + Math.random(),
                health: 50,
                attackCooldown: 0,
                detectionRange: 25,
                attackRange: 2,
                state: 'idle', // idle, chasing, attacking
                lastHowl: 0
            });
        }
    }
    
    createEnvironment() {
        // Create flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 3, 50, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.flashlight.castShadow = true;
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Create rain particles if enabled
        if (this.settings.graphics.particles > 0) {
            this.createRain();
        }
    }
    
    createRain() {
        const rainCount = Math.floor(this.settings.graphics.particles / 2);
        
        for (let i = 0; i < rainCount; i++) {
            const rain = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3),
                new THREE.MeshBasicMaterial({ color: 0x6699ff })
            );
            
            rain.position.set(
                (Math.random() - 0.5) * 200,
                50 + Math.random() * 50,
                (Math.random() - 0.5) * 200
            );
            
            this.scene.add(rain);
            this.rainParticles.push({
                mesh: rain,
                speed: 20 + Math.random() * 10,
                resetY: 50
            });
        }
    }
    
    // ===============================
    // UI INITIALIZATION
    // ===============================
    
    initUI() {
        console.log("🖥️ Initializing UI...");
        
        try {
            // Cache all UI elements
            this.cacheUIElements();
            
            // Initialize UI interactions
            this.initUIInteractions();
            
            // Initialize mini-map
            this.initMiniMap();
            
            // Initialize objective tracker
            this.initObjectives();
            
            console.log("✅ UI initialized successfully!");
            
        } catch (error) {
            console.error("❌ UI initialization error:", error);
            throw error;
        }
    }
    
    cacheUIElements() {
        this.ui = {
            // Stats elements
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
            timeBar: document.getElementById('time-bar'),
            timeValue: document.getElementById('time-value'),
            
            // Inventory elements
            inventoryBattery: document.getElementById('inventory-battery'),
            inventoryMedkits: document.getElementById('inventory-medkits'),
            inventoryBatteries: document.getElementById('inventory-batteries'),
            inventoryBerries: document.getElementById('inventory-berries'),
            inventoryMushrooms: document.getElementById('inventory-mushrooms'),
            inventorySticks: document.getElementById('inventory-sticks'),
            
            // Notification elements
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notification-text'),
            notificationIcon: document.getElementById('notification-icon'),
            notificationProgress: document.getElementById('notification-progress'),
            
            // Message log elements
            messageLog: document.getElementById('message-log'),
            logContent: document.getElementById('log-content'),
            logClear: document.getElementById('log-clear'),
            
            // Menu elements
            mainMenu: document.getElementById('main-menu'),
            settingsMenu: document.getElementById('settings-menu'),
            creditsScreen: document.getElementById('credits-screen'),
            pauseMenu: document.getElementById('pause-menu'),
            endScreen: document.getElementById('end-screen'),
            
            // Button elements
            statsToggle: document.getElementById('stats-toggle'),
            inventoryToggle: document.getElementById('inventory-toggle'),
            audioToggle: document.getElementById('audio-toggle'),
            emergencySkip: document.getElementById('emergency-skip'),
            
            // Performance elements
            perfFps: document.getElementById('perf-fps'),
            perfMs: document.getElementById('perf-ms'),
            perfMem: document.getElementById('perf-mem'),
            
            // Achievement elements
            achievementPopup: document.getElementById('achievement-popup'),
            achievementTitle: document.getElementById('achievement-title'),
            achievementDesc: document.getElementById('achievement-desc'),
            
            // Tooltip
            tooltip: document.getElementById('tooltip')
        };
    }
    
    initUIInteractions() {
        // Stats panel toggle
        if (this.ui.statsToggle) {
            this.ui.statsToggle.addEventListener('click', () => {
                const content = document.getElementById('stats-content');
                const icon = this.ui.statsToggle.querySelector('i');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.className = 'fas fa-chevron-down';
                } else {
                    content.style.display = 'none';
                    icon.className = 'fas fa-chevron-up';
                }
            });
        }
        
        // Inventory panel toggle
        if (this.ui.inventoryToggle) {
            this.ui.inventoryToggle.addEventListener('click', () => {
                const content = document.getElementById('inventory-content');
                const icon = this.ui.inventoryToggle.querySelector('i');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.className = 'fas fa-chevron-down';
                } else {
                    content.style.display = 'none';
                    icon.className = 'fas fa-chevron-up';
                }
            });
        }
        
        // Clear log button
        if (this.ui.logClear) {
            this.ui.logClear.addEventListener('click', () => {
                this.clearMessageLog();
            });
        }
        
        // Audio toggle
        if (this.ui.audioToggle) {
            this.ui.audioToggle.addEventListener('click', () => {
                this.toggleAudio();
            });
        }
        
        // Action slot clicks
        document.querySelectorAll('.action-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const key = slot.getAttribute('data-key');
                this.useActionSlot(key);
            });
        });
        
        // Inventory slot clicks
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const item = slot.getAttribute('data-item');
                this.useInventoryItem(item);
            });
        });
    }
    
    initMiniMap() {
        const mapCanvas = document.getElementById('map-canvas');
        if (mapCanvas) {
            this.mapContext = mapCanvas.getContext('2d');
            this.mapRadius = 70;
        }
    }
    
    initObjectives() {
        // Initialize objective completion tracking
        const objectives = document.querySelectorAll('.objective');
        objectives.forEach(obj => {
            obj.addEventListener('click', () => {
                const id = obj.getAttribute('data-id');
                this.toggleObjective(id);
            });
        });
    }
    
    // ===============================
    // AUDIO INITIALIZATION
    // ===============================
    
    initAudio() {
        console.log("🔊 Initializing audio...");
        
        try {
            // Create Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Initialize sound pool
            this.sounds = {
                // Ambient sounds
                forest: this.createSound('sine', 200, 0.1),
                wind: this.createSound('noise', 0.2, 0.05),
                rain: this.createSound('noise', 0.5, 0.1),
                
                // Game sounds
                pickup: this.createSound('square', 800, 0.3),
                damage: this.createSound('sawtooth', 300, 0.5),
                heal: this.createSound('sine', 600, 0.3),
                
                // UI sounds
                click: this.createSound('square', 1000, 0.2),
                hover: this.createSound('sine', 1200, 0.1)
            };
            
            console.log("✅ Audio initialized successfully!");
            
        } catch (error) {
            console.warn("⚠️ Audio initialization failed:", error);
            this.audioEnabled = false;
        }
    }
    
    createSound(type, frequency, duration) {
        if (!this.audioEnabled || !this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        return { oscillator, gainNode };
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const icon = this.ui.audioToggle.querySelector('i');
        
        if (this.audioEnabled) {
            icon.className = 'fas fa-volume-up';
            this.showNotification("Audio enabled", 2000, 'info');
            
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } else {
            icon.className = 'fas fa-volume-mute';
            this.showNotification("Audio disabled", 2000, 'info');
        }
    }
    
    // ===============================
    // INPUT INITIALIZATION
    // ===============================
    
    initInput() {
        console.log("🎮 Initializing input...");
        
        try {
            const canvas = document.getElementById('gameCanvas');
            
            // Pointer lock for mouse look
            canvas.addEventListener('click', () => {
                if (!this.isPaused && !this.isInCutscene && !this.isInMenu) {
                    canvas.requestPointerLock();
                }
            });
            
            document.addEventListener('pointerlockchange', () => {
                this.isPointerLocked = document.pointerLockElement === canvas;
                console.log("Mouse lock:", this.isPointerLocked ? "🔒 ON" : "🔓 OFF");
            });
            
            // Mouse movement for camera control
            document.addEventListener('mousemove', (e) => {
                if (!this.isPointerLocked || this.isPaused || this.isInCutscene || this.isInMenu) return;
                
                let deltaX = e.movementX * this.sensitivity;
                let deltaY = e.movementY * this.sensitivity;
                
                // Apply inversion if enabled
                if (this.settings.controls.invertY) {
                    deltaY = -deltaY;
                }
                
                // Apply sensitivity setting
                deltaX *= this.settings.controls.sensitivity / 5;
                deltaY *= this.settings.controls.sensitivity / 5;
                
                this.cameraRotation.x += deltaY;
                this.cameraRotation.y += deltaX;
                
                // Clamp vertical rotation
                this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
            });
            
            // Keyboard input handling
            document.addEventListener('keydown', (e) => {
                this.keys[e.code] = true;
                this.updateInput();
                
                // Handle global keys (work in any state)
                switch(e.code) {
                    case 'Escape':
                        this.handleEscapeKey();
                        break;
                    case 'Tab':
                        if (!this.isInMenu && !this.isInCutscene) {
                            e.preventDefault();
                            this.toggleMap();
                        }
                        break;
                }
                
                // Only handle game keys if in game
                if (this.isPaused || this.isInCutscene || this.isInMenu) return;
                
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
                    case 'KeyC':
                        this.toggleCrouch();
                        break;
                    case 'Space':
                        this.jump();
                        break;
                    case 'Digit1':
                    case 'Digit2':
                    case 'Digit3':
                    case 'Digit4':
                    case 'Digit5':
                        this.useActionSlot(e.code.replace('Digit', ''));
                        break;
                }
            });
            
            document.addEventListener('keyup', (e) => {
                this.keys[e.code] = false;
                this.updateInput();
            });
            
            // Mobile touch controls
            this.initTouchControls();
            
            // Gamepad support
            window.addEventListener("gamepadconnected", (e) => {
                console.log("🎮 Gamepad connected:", e.gamepad.id);
                this.gamepadIndex = e.gamepad.index;
            });
            
            window.addEventListener("gamepaddisconnected", () => {
                console.log("🎮 Gamepad disconnected");
                this.gamepadIndex = null;
            });
            
            console.log("✅ Input initialized successfully!");
            
        } catch (error) {
            console.error("❌ Input initialization error:", error);
            throw error;
        }
    }
    
    initTouchControls() {
        // Virtual joystick for mobile
        const canvas = document.getElementById('gameCanvas');
        
        canvas.addEventListener('touchstart', (e) => {
            if (this.isInMenu || this.isInCutscene) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStart = { x: touch.clientX, y: touch.clientY };
            this.isTouching = true;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            if (!this.isTouching || this.isInMenu || this.isInCutscene) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStart.x;
            const deltaY = touch.clientY - this.touchStart.y;
            
            // Camera control
            this.cameraRotation.x += deltaY * 0.01;
            this.cameraRotation.y += deltaX * 0.01;
            
            this.touchStart = { x: touch.clientX, y: touch.clientY };
        });
        
        canvas.addEventListener('touchend', (e) => {
            this.isTouching = false;
        });
    }
    
    updateInput() {
        this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'];
        this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
        this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'];
        this.input.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        this.input.crouch = this.keys['KeyC'];
        
        // Gamepad input
        if (this.gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                // Left stick for movement
                if (Math.abs(gamepad.axes[0]) > 0.1) this.input.right = gamepad.axes[0] > 0;
                if (Math.abs(gamepad.axes[0]) > 0.1) this.input.left = gamepad.axes[0] < 0;
                if (Math.abs(gamepad.axes[1]) > 0.1) this.input.forward = gamepad.axes[1] < 0;
                if (Math.abs(gamepad.axes[1]) > 0.1) this.input.backward = gamepad.axes[1] > 0;
                
                // Right stick for camera
                if (Math.abs(gamepad.axes[2]) > 0.1) {
                    this.cameraRotation.y += gamepad.axes[2] * 0.05;
                }
                if (Math.abs(gamepad.axes[3]) > 0.1) {
                    this.cameraRotation.x += gamepad.axes[3] * 0.05 * (this.settings.controls.invertY ? -1 : 1);
                }
                
                // Buttons
                if (gamepad.buttons[0].pressed) this.jump(); // A button
                if (gamepad.buttons[1].pressed) this.interact(); // B button
                if (gamepad.buttons[2].pressed) this.useMedkit(); // X button
                if (gamepad.buttons[3].pressed) this.useBattery(); // Y button
                if (gamepad.buttons[4].pressed) this.toggleFlashlight(); // LB
                if (gamepad.buttons[5].pressed) this.toggleCrouch(); // RB
                if (gamepad.buttons[7].pressed) this.togglePause(); // Start
                if (gamepad.buttons[6].pressed) this.showMap(); // Select
            }
        }
    }
    
    handleEscapeKey() {
        if (this.isInCutscene) {
            this.skipCutscene();
        } else if (this.isInMenu) {
            // Handle menu navigation
            if (this.ui.settingsMenu.style.display === 'flex') {
                this.hideSettings();
            } else if (this.ui.creditsScreen.style.display === 'flex') {
                this.hideCredits();
            } else {
                this.hideMainMenu();
                this.startGame();
            }
        } else {
            this.togglePause();
        }
    }
    
    // ===============================
    // SETTINGS INITIALIZATION
    // ===============================
    
    initSettings() {
        console.log("⚙️ Initializing settings...");
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Initialize settings UI
        this.initSettingsUI();
        
        // Apply settings
        this.applySettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('earsOfTheForest_settings');
            if (saved) {
                this.settings = JSON.parse(saved);
                console.log("📂 Settings loaded from storage");
            }
        } catch (error) {
            console.warn("⚠️ Failed to load settings:", error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('earsOfTheForest_settings', JSON.stringify(this.settings));
            console.log("💾 Settings saved to storage");
        } catch (error) {
            console.warn("⚠️ Failed to save settings:", error);
        }
    }
    
    initSettingsUI() {
        // Graphics settings
        const qualitySelect = document.getElementById('quality-select');
        const shadowsToggle = document.getElementById('shadows-toggle');
        const particlesSlider = document.getElementById('particles-slider');
        
        if (qualitySelect) qualitySelect.value = this.settings.graphics.quality;
        if (shadowsToggle) shadowsToggle.checked = this.settings.graphics.shadows;
        if (particlesSlider) particlesSlider.value = this.settings.graphics.particles;
        
        // Audio settings
        const masterVolume = document.getElementById('master-volume');
        const musicVolume = document.getElementById('music-volume');
        const sfxVolume = document.getElementById('sfx-volume');
        const ambienceVolume = document.getElementById('ambience-volume');
        
        if (masterVolume) masterVolume.value = this.settings.audio.master;
        if (musicVolume) musicVolume.value = this.settings.audio.music;
        if (sfxVolume) sfxVolume.value = this.settings.audio.sfx;
        if (ambienceVolume) ambienceVolume.value = this.settings.audio.ambience;
        
        // Control settings
        const sensitivitySlider = document.getElementById('sensitivity-slider');
        const invertYToggle = document.getElementById('invert-y-toggle');
        
        if (sensitivitySlider) sensitivitySlider.value = this.settings.controls.sensitivity;
        if (invertYToggle) invertYToggle.checked = this.settings.controls.invertY;
        
        // Settings buttons
        const saveBtn = document.getElementById('save-settings-btn');
        const backBtn = document.getElementById('back-settings-btn');
        const resetBtn = document.getElementById('reset-settings-btn');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettingsFromUI());
        if (backBtn) backBtn.addEventListener('click', () => this.hideSettings());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings());
    }
    
    applySettings() {
        // Apply graphics settings
        if (this.renderer) {
            this.renderer.shadowMap.enabled = this.settings.graphics.shadows;
            
            // Adjust quality settings
            switch(this.settings.graphics.quality) {
                case 'low':
                    this.renderer.setPixelRatio(1);
                    break;
                case 'medium':
                    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                    break;
                case 'high':
                    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    break;
                case 'ultra':
                    this.renderer.setPixelRatio(window.devicePixelRatio);
                    break;
            }
        }
        
        // Apply control settings
        this.sensitivity = 0.002 * (this.settings.controls.sensitivity / 5);
    }
    
    saveSettingsFromUI() {
        // Get values from UI
        this.settings.graphics.quality = document.getElementById('quality-select').value;
        this.settings.graphics.shadows = document.getElementById('shadows-toggle').checked;
        this.settings.graphics.particles = parseInt(document.getElementById('particles-slider').value);
        
        this.settings.audio.master = parseInt(document.getElementById('master-volume').value);
        this.settings.audio.music = parseInt(document.getElementById('music-volume').value);
        this.settings.audio.sfx = parseInt(document.getElementById('sfx-volume').value);
        this.settings.audio.ambience = parseInt(document.getElementById('ambience-volume').value);
        
        this.settings.controls.sensitivity = parseInt(document.getElementById('sensitivity-slider').value);
        this.settings.controls.invertY = document.getElementById('invert-y-toggle').checked;
        
        // Save and apply
        this.saveSettings();
        this.applySettings();
        
        this.showNotification("Settings saved", 2000, 'success');
        this.hideSettings();
    }
    
    resetSettings() {
        if (confirm("Reset all settings to default?")) {
            this.settings = {
                graphics: {
                    quality: 'medium',
                    shadows: true,
                    particles: 80
                },
                audio: {
                    master: 80,
                    music: 60,
                    sfx: 80,
                    ambience: 70
                },
                controls: {
                    sensitivity: 5,
                    invertY: false
                }
            };
            
            this.saveSettings();
            this.applySettings();
            this.initSettingsUI();
            
            this.showNotification("Settings reset to default", 2000, 'success');
        }
    }
    
    // ===============================
    // MENU SYSTEM
    // ===============================
    
    showMainMenu() {
        console.log("🏠 Showing main menu");
        
        this.isInMenu = true;
        this.ui.mainMenu.style.display = 'flex';
        
        // Initialize menu buttons
        this.initMenuButtons();
    }
    
    hideMainMenu() {
        this.isInMenu = false;
        this.ui.mainMenu.style.display = 'none';
    }
    
    initMenuButtons() {
        // New Game button
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        
        // Continue button (disabled if no save)
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.disabled = this.saveSlots[0] === null;
            continueBtn.addEventListener('click', () => {
                if (!continueBtn.disabled) {
                    this.loadGame(0);
                }
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Credits button
        const creditsBtn = document.getElementById('credits-btn');
        if (creditsBtn) {
            creditsBtn.addEventListener('click', () => {
                this.showCredits();
            });
        }
        
        // Quit button
        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to quit?")) {
                    window.close();
                }
            });
        }
    }
    
    showSettings() {
        this.ui.settingsMenu.style.display = 'flex';
    }
    
    hideSettings() {
        this.ui.settingsMenu.style.display = 'none';
    }
    
    showCredits() {
        this.ui.creditsScreen.style.display = 'flex';
    }
    
    hideCredits() {
        this.ui.creditsScreen.style.display = 'none';
    }
    
    // ===============================
    // GAME LOOP & UPDATES
    // ===============================
    
    startNewGame() {
        console.log("🎮 Starting new game...");
        
        this.hideMainMenu();
        this.resetGameState();
        this.startGame();
    }
    
    startGame() {
        console.log("🚀 Game started!");
        
        // Show game elements
        const canvas = document.getElementById('gameCanvas');
        const gameUI = document.getElementById('game-ui');
        
        if (canvas) canvas.style.display = 'block';
        if (gameUI) gameUI.style.display = 'block';
        
        // Start game systems
        this.isRunning = true;
        this.gameStarted = true;
        this.startTime = Date.now();
        
        // Show initial notifications
        this.showNotification("You're lost in the forest. Find your way out!", 5000, 'warning');
        this.addMessage("Game started - Survive and escape the forest!");
        
        // Start the game loop
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const delta = this.clock.getDelta();
        this.gameTime += delta;
        
        // Update performance monitoring
        this.updatePerformance(delta);
        
        // Update game systems if not paused
        if (!this.isPaused && !this.isInCutscene && !this.isInMenu) {
            this.updatePlayer(delta);
            this.updateCamera();
            this.updateStats(delta);
            this.updateWolves(delta);
            this.updateWorld(delta);
            this.updateEnvironment(delta);
            this.checkEvents();
            this.updateUI();
            
            // Update mini-map
            this.updateMiniMap();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePerformance(delta) {
        // Calculate FPS
        this.frameCount++;
        const now = performance.now();
        
        if (now >= this.lastFpsUpdate + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            // Update performance display
            if (this.ui.perfFps) {
                this.ui.perfFps.textContent = this.fps;
                this.ui.perfFps.style.color = this.fps > 50 ? '#4CAF50' : this.fps > 30 ? '#ffaa00' : '#ff4444';
            }
            
            if (this.ui.perfMs) {
                const ms = (1000 / this.fps).toFixed(1);
                this.ui.perfMs.textContent = ms;
                this.ui.perfMs.style.color = ms < 20 ? '#4CAF50' : ms < 33 ? '#ffaa00' : '#ff4444';
            }
        }
        
        // Update memory usage (approximate)
        if (this.frameCount % 60 === 0) {
            if (this.ui.perfMem && performance.memory) {
                const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                this.ui.perfMem.textContent = `${usedMB}MB`;
                this.ui.perfMem.style.color = usedMB < 200 ? '#4CAF50' : usedMB < 400 ? '#ffaa00' : '#ff4444';
            }
        }
    }
    
    startPerformanceMonitor() {
        // Update loading stats
        setInterval(() => {
            const memoryUsage = document.getElementById('memory-usage');
            const fpsCounter = document.getElementById('fps-counter');
            
            if (memoryUsage && performance.memory) {
                memoryUsage.textContent = `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`;
            }
            
            if (fpsCounter) {
                fpsCounter.textContent = this.fps;
            }
        }, 1000);
    }
    
    // ===============================
    // PLAYER & CAMERA UPDATES
    // ===============================
    
    updatePlayer(delta) {
        // Update movement speed based on state
        let targetSpeed = this.player.movementSpeed;
        
        if (this.input.crouch) {
            targetSpeed = this.player.crouchSpeed;
            this.player.isCrouching = true;
        } else {
            this.player.isCrouching = false;
            if (this.input.sprint && this.player.stamina > 0 && 
                (this.input.forward || this.input.backward || this.input.left || this.input.right)) {
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
        
        // Reset velocity and apply movement
        this.player.velocity.set(0, 0, 0);
        
        if (this.input.forward) this.player.velocity.addScaledVector(forward, this.player.currentSpeed);
        if (this.input.backward) this.player.velocity.addScaledVector(forward, -this.player.currentSpeed);
        if (this.input.left) this.player.velocity.addScaledVector(right, -this.player.currentSpeed);
        if (this.input.right) this.player.velocity.addScaledVector(right, this.player.currentSpeed);
        
        // Apply gravity
        if (!this.player.onGround) {
            this.player.velocity.y -= 20 * delta;
        }
        
        // Apply movement
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Ground collision
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // World bounds
        const bounds = 95;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));
    }
    
    updateCamera() {
        // Apply rotation to camera
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        
        // Update camera position to follow player
        this.camera.position.copy(this.player.position);
        
        // Add bobbing effect when moving
        if ((this.input.forward || this.input.backward || this.input.left || this.input.right) && this.player.onGround) {
            const time = this.gameTime * 8;
            this.camera.position.y += Math.sin(time) * 0.05;
        }
    }
    
    jump() {
        if (this.player.onGround && this.player.stamina > 10) {
            this.player.velocity.y = 8;
            this.player.onGround = false;
            this.player.stamina -= 10;
            this.playSound('jump');
        }
    }
    
    toggleCrouch() {
        this.input.crouch = !this.input.crouch;
        this.showNotification(this.input.crouch ? "Crouching" : "Standing", 1000, 'info');
    }
    
    // ===============================
    // STATS & STATUS UPDATES
    // ===============================
    
    updateStats(delta) {
        // Stamina management
        if (this.input.sprint && this.player.stamina > 0 && 
            (this.input.forward || this.input.backward || this.input.left || this.input.right)) {
            this.player.stamina -= 20 * delta;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 10 * delta;
        }
        this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, this.player.stamina));
        
        // Battery for flashlight
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 5 * delta;
            if (this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 3);
            }
            if (this.player.battery <= 0) {
                this.input.flashlight = false;
                if (this.flashlight) this.flashlight.intensity = 0;
                this.showNotification("Flashlight battery dead!", 3000, 'warning');
            }
        }
        this.player.battery = Math.max(0, Math.min(this.player.maxBattery, this.player.battery));
        
        // Hunger system
        this.player.hunger -= 0.2 * delta;
        if (this.input.sprint) this.player.hunger -= 0.1 * delta;
        this.player.hunger = Math.max(0, this.player.hunger);
        
        // Thirst system
        this.player.thirst -= 0.3 * delta;
        if (this.input.sprint) this.player.thirst -= 0.2 * delta;
        this.player.thirst = Math.max(0, this.player.thirst);
        
        // Temperature system
        this.player.temperature -= 0.05 * delta;
        if (this.weather.isRaining) this.player.temperature -= 0.1 * delta;
        if (this.weather.timeOfDay < 6 || this.weather.timeOfDay > 20) {
            this.player.temperature -= 0.05 * delta; // Colder at night
        }
        this.player.temperature = Math.max(35, Math.min(40, this.player.temperature));
        
        // Fear system
        this.player.fear += 0.5 * delta;
        
        // Increase fear in darkness
        if (this.weather.timeOfDay < 6 || this.weather.timeOfDay > 20) {
            this.player.fear += 0.2 * delta;
        }
        
        // Increase fear when wolves are nearby
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            if (distance < 30) {
                this.player.fear += (30 - distance) * 0.05 * delta;
            }
        }
        
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Health effects from other stats
        if (this.player.hunger < 20) {
            this.player.health -= 0.3 * delta;
        }
        if (this.player.thirst < 20) {
            this.player.health -= 0.5 * delta;
        }
        if (this.player.temperature < 36) {
            this.player.health -= 0.3 * delta;
            this.player.hypothermia = true;
        } else {
            this.player.hypothermia = false;
        }
        if (this.player.poisoned) {
            this.player.health -= 1 * delta;
        }
        if (this.player.fear > 80) {
            this.player.health -= 0.2 * delta;
        }
        
        // Check for death
        if (this.player.health <= 0) {
            this.triggerBadEnding();
        }
        
        // Check for achievements
        this.checkAchievements();
    }
    
    // ===============================
    // WOLF AI UPDATES
    // ===============================
    
    updateWolves(delta) {
        this.wolfEvents.timer += delta;
        this.wolfEvents.howlTimer += delta;
        
        // Random wolf howls
        if (this.wolfEvents.howlTimer > this.wolfEvents.nextHowl) {
            this.wolfEvents.howlTimer = 0;
            this.wolfEvents.nextHowl = 20 + Math.random() * 40;
            
            // Only howl if player is far enough
            let closeWolf = false;
            for (const wolf of this.wolves) {
                if (this.player.position.distanceTo(wolf.position) < 50) {
                    closeWolf = true;
                    break;
                }
            }
            
            if (!closeWolf) {
                this.addMessage("A wolf howls in the distance...");
                this.player.fear += 5;
            }
        }
        
        // First wolf encounter
        if (!this.wolfEvents.firstChase && this.wolfEvents.timer > 60) {
            this.wolfEvents.firstChase = true;
            this.addMessage("You hear growling nearby... wolves are hunting.");
            this.showNotification("Wolves detected in the area!", 4000, 'danger');
        }
        
        // Update each wolf
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            
            // Update wolf state
            if (distance < wolf.detectionRange) {
                if (wolf.state !== 'chasing' && wolf.state !== 'attacking') {
                    wolf.state = 'chasing';
                    this.addMessage("A wolf spots you and starts chasing!");
                }
            } else if (wolf.state === 'chasing' && distance > wolf.detectionRange * 1.5) {
                wolf.state = 'idle';
            }
            
            // Wolf behavior based on state
            switch(wolf.state) {
                case 'chasing':
                    // Chase player
                    const direction = new THREE.Vector3()
                        .subVectors(this.player.position, wolf.position)
                        .normalize();
                    
                    wolf.position.addScaledVector(direction, wolf.speed * delta);
                    
                    // Update visual position
                    wolf.body.position.copy(wolf.position);
                    wolf.body.position.y = 0.8;
                    wolf.head.position.copy(wolf.position);
                    wolf.head.position.y = 1.1;
                    wolf.head.position.z += 0.6;
                    
                    // Rotate wolf to face player
                    const angle = Math.atan2(direction.x, direction.z);
                    wolf.body.rotation.y = angle;
                    wolf.head.rotation.y = angle;
                    
                    // Check for attack range
                    if (distance < wolf.attackRange) {
                        wolf.state = 'attacking';
                    }
                    break;
                    
                case 'attacking':
                    wolf.attackCooldown -= delta;
                    if (wolf.attackCooldown <= 0) {
                        // Deal damage
                        this.player.health -= 15;
                        wolf.attackCooldown = 2;
                        
                        // Visual effects
                        this.showDamageFlash();
                        this.showNotification("Wolf attacks!", 2000, 'danger');
                        this.addMessage("A wolf bites you!");
                        
                        // Play sound
                        this.playSound('damage');
                        
                        // Track encounter
                        this.story.wolvesEncountered++;
                        
                        // Check for wolf kill achievement
                        if (this.player.health <= 0) {
                            this.unlockAchievement('killedWolf');
                        }
                    }
                    
                    // Return to chasing if player moves away
                    if (distance > wolf.attackRange * 1.5) {
                        wolf.state = 'chasing';
                    }
                    break;
                    
                case 'idle':
                    // Random wandering
                    if (Math.random() < 0.01) {
                        wolf.target.x = wolf.position.x + (Math.random() - 0.5) * 20;
                        wolf.target.z = wolf.position.z + (Math.random() - 0.5) * 20;
                    }
                    
                    // Move towards target
                    const wanderDirection = new THREE.Vector3()
                        .subVectors(wolf.target, wolf.position)
                        .normalize();
                    
                    wolf.position.addScaledVector(wanderDirection, wolf.speed * 0.5 * delta);
                    
                    // Update visual position
                    wolf.body.position.copy(wolf.position);
                    wolf.body.position.y = 0.8;
                    wolf.head.position.copy(wolf.position);
                    wolf.head.position.y = 1.1;
                    wolf.head.position.z += 0.6;
                    break;
            }
        }
    }
    
    // ===============================
    // WORLD & ENVIRONMENT UPDATES
    // ===============================
    
    updateWorld(delta) {
        // Update day/night cycle
        this.weather.timeOfDay = (this.weather.timeOfDay + delta / 600) % 24; // 10 minutes per day
        
        // Update sun/moon position
        const timeRad = (this.weather.timeOfDay / 24) * Math.PI * 2;
        const sunDistance = 200;
        
        this.sunLight.position.x = Math.cos(timeRad) * sunDistance;
        this.sunLight.position.y = Math.sin(timeRad) * sunDistance;
        this.sunLight.position.z = Math.cos(timeRad) * sunDistance * 0.5;
        
        // Adjust light intensity based on time
        if (this.weather.timeOfDay > 6 && this.weather.timeOfDay < 18) {
            // Daytime
            this.sunLight.intensity = 1.0;
            this.scene.fog.density = 0.01;
        } else {
            // Nighttime
            this.sunLight.intensity = 0.3;
            this.scene.fog.density = 0.03;
        }
        
        // Random weather changes
        if (Math.random() < 0.0005) { // Very low chance
            this.weather.isRaining = !this.weather.isRaining;
            this.weather.rainIntensity = this.weather.isRaining ? 0.5 + Math.random() * 0.5 : 0;
            
            if (this.weather.isRaining) {
                this.addMessage("It starts to rain...");
                this.showNotification("Rainfall detected", 3000, 'info');
            } else {
                this.addMessage("The rain stops");
            }
        }
        
        // Update collectible animations
        this.updateCollectibles(delta);
    }
    
    updateEnvironment(delta) {
        // Update rain particles
        if (this.weather.isRaining && this.rainParticles.length > 0) {
            const rainOverlay = document.getElementById('rain-overlay');
            if (rainOverlay) {
                rainOverlay.style.opacity = this.weather.rainIntensity * 0.3;
            }
            
            for (const rain of this.rainParticles) {
                rain.mesh.position.y -= rain.speed * delta;
                
                // Reset rain particle when it falls below ground
                if (rain.mesh.position.y < -10) {
                    rain.mesh.position.y = rain.resetY;
                    rain.mesh.position.x = (Math.random() - 0.5) * 200;
                    rain.mesh.position.z = (Math.random() - 0.5) * 200;
                }
            }
        }
        
        // Update fear overlay
        const fearOverlay = document.getElementById('fear-overlay');
        if (fearOverlay) {
            const fearIntensity = this.player.fear / 100;
            fearOverlay.style.opacity = fearIntensity * 0.4;
            
            // Add subtle shake at high fear
            if (fearIntensity > 0.7) {
                const shake = Math.sin(this.gameTime * 10) * fearIntensity * 2;
                fearOverlay.style.transform = `translate(${shake}px, ${shake}px)`;
            }
        }
        
        // Update night vision if active
        if (this.player.battery > 0 && this.input.flashlight) {
            const nightVision = document.getElementById('night-vision');
            if (nightVision) {
                nightVision.style.opacity = 0.1 * (this.player.battery / 100);
            }
        }
    }
    
    updateCollectibles(delta) {
        // Animate berries (gentle bobbing)
        for (const berry of this.berries) {
            if (!berry.collected) {
                berry.mesh.position.y = 0.2 + Math.sin(this.gameTime * 2 + berry.position.x) * 0.1;
                berry.mesh.rotation.y += delta;
            }
        }
        
        // Animate mushrooms (gentle rotation)
        for (const mushroom of this.mushrooms) {
            if (!mushroom.collected) {
                mushroom.mesh.rotation.y += delta * 0.5;
            }
        }
    }
    
    // ===============================
    // EVENT CHECKING
    // ===============================
    
    checkEvents() {
        // Escape condition (reach forest edge)
        if (this.player.position.z < -90) {
            this.triggerGoodEnding();
            return;
        }
        
        // Check for collectible pickup
        this.checkCollectibles();
        
        // Check for secret areas
        this.checkSecrets();
        
        // Check for objective completion
        this.checkObjectives();
        
        // Check for time-based events
        this.checkTimeEvents();
    }
    
    checkCollectibles() {
        const playerPos = this.player.position;
        
        // Check berries
        for (const berry of this.berries) {
            if (berry.collected) continue;
            
            const distance = playerPos.distanceTo(berry.position);
            if (distance < 2) {
                this.pickupCollectible(berry);
                return;
            }
        }
        
        // Check mushrooms
        for (const mushroom of this.mushrooms) {
            if (mushroom.collected) continue;
            
            const distance = playerPos.distanceTo(mushroom.position);
            if (distance < 2) {
                this.pickupCollectible(mushroom);
                return;
            }
        }
        
        // Check sticks
        for (const stick of this.sticks) {
            if (stick.collected) continue;
            
            const distance = playerPos.distanceTo(stick.position);
            if (distance < 2) {
                this.pickupCollectible(stick);
                return;
            }
        }
    }
    
    pickupCollectible(collectible) {
        collectible.collected = true;
        this.scene.remove(collectible.mesh);
        
        // Add to inventory
        switch(collectible.type) {
            case 'berry':
                this.inventory.berries += 2 + Math.floor(Math.random() * 3);
                this.showNotification(`Collected ${this.inventory.berries > 1 ? 'berries' : 'berry'}!`, 2000, 'success');
                this.addMessage("Found some edible berries");
                break;
                
            case 'mushroom':
                this.inventory.mushrooms++;
                const type = collectible.poisonous ? 'poisonous' : 'edible';
                this.showNotification(`Collected ${type} mushroom`, 2000, collectible.poisonous ? 'warning' : 'success');
                this.addMessage(`Found a ${type} mushroom`);
                break;
                
            case 'stick':
                this.inventory.sticks++;
                this.showNotification("Collected a stick", 2000, 'info');
                this.addMessage("Picked up a stick");
                break;
        }
        
        // Update story tracking
        this.story.itemsCollected++;
        
        // Play sound
        this.playSound('pickup');
        
        // Check for collection achievement
        if (this.story.itemsCollected >= 20) {
            this.unlockAchievement('collectedAll');
        }
    }
    
    checkSecrets() {
        // Check for secret areas based on player position
        const secrets = [
            { x: -80, z: -80, found: false, type: 'ancientTree' },
            { x: 80, z: 80, found: false, type: 'hiddenCave' },
            { x: 0, z: -150, found: false, type: 'waterfall' },
            { x: -150, z: 0, found: false, type: 'abandonedCamp' },
            { x: 150, z: -150, found: false, type: 'stoneCircle' }
        ];
        
        for (const secret of secrets) {
            if (!secret.found) {
                const distance = this.player.position.distanceTo(new THREE.Vector3(secret.x, 0, secret.z));
                if (distance < 10) {
                    secret.found = true;
                    this.story.secretsFound++;
                    this.showNotification(`Discovered: ${secret.type.replace(/([A-Z])/g, ' $1')}`, 4000, 'secret');
                    this.addMessage(`You found a secret ${secret.type}!`);
                    
                    // Unlock achievement for first secret
                    if (this.story.secretsFound === 1) {
                        this.unlockAchievement('foundSecret');
                    }
                    
                    // Unlock explorer achievement for all secrets
                    if (this.story.secretsFound === this.story.totalSecrets) {
                        this.unlockAchievement('explorer');
                    }
                }
            }
        }
    }
    
    checkObjectives() {
        // Objective 1: Survive 5 minutes
        if (this.gameTime > 300 && this.story.objectivesCompleted === 0) {
            this.completeObjective(1);
        }
        
        // Objective 2: Collect 10 items
        if (this.story.itemsCollected >= 10 && this.story.objectivesCompleted === 1) {
            this.completeObjective(2);
        }
        
        // Objective 3: Discover 3 secrets
        if (this.story.secretsFound >= 3 && this.story.objectivesCompleted === 2) {
            this.completeObjective(3);
        }
    }
    
    checkTimeEvents() {
        // Check for 5-minute survival achievement
        if (this.gameTime > 300 && !this.achievements.survived5min) {
            this.unlockAchievement('survived5min');
        }
        
        // Check for speedrun achievement (escape in under 10 minutes)
        if (this.gameTime < 600 && this.player.position.z < -90) {
            this.unlockAchievement('speedrun');
        }
        
        // Check for pacifist achievement (escape without killing wolves)
        if (this.story.wolvesEncountered === 0 && this.player.position.z < -90) {
            this.unlockAchievement('pacifist');
        }
    }
    
    // ===============================
    // UI UPDATES
    // ===============================
    
    updateUI() {
        // Update stat bars and values
        this.updateStatBar('health', this.player.health, this.player.maxHealth);
        this.updateStatBar('hunger', this.player.hunger, this.player.maxHunger);
        this.updateStatBar('thirst', this.player.thirst, this.player.maxThirst);
        this.updateStatBar('stamina', this.player.stamina, this.player.maxStamina);
        this.updateStatBar('fear', this.player.fear, this.player.maxFear);
        
        // Update temperature display
        const tempPercent = ((this.player.temperature - 35) / 5) * 100;
        if (this.ui.tempBar) {
            this.ui.tempBar.style.width = tempPercent + '%';
        }
        if (this.ui.tempValue) {
            this.ui.tempValue.textContent = Math.round(this.player.temperature) + '°C';
            this.ui.tempValue.style.color = this.player.temperature < 36 ? '#ff4444' : 
                                          this.player.temperature > 38 ? '#ffaa00' : '#66cc66';
        }
        
        // Update time display
        const timePercent = (this.weather.timeOfDay / 24) * 100;
        if (this.ui.timeBar) {
            this.ui.timeBar.style.width = timePercent + '%';
        }
        if (this.ui.timeValue) {
            const hours = Math.floor(this.weather.timeOfDay);
            const minutes = Math.floor((this.weather.timeOfDay % 1) * 60);
            this.ui.timeValue.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            this.ui.timeValue.style.color = this.weather.timeOfDay > 6 && this.weather.timeOfDay < 18 ? '#66cc66' : '#aa44ff';
        }
        
        // Update inventory displays
        if (this.ui.inventoryBattery) {
            this.ui.inventoryBattery.textContent = Math.round(this.player.battery) + '%';
        }
        if (this.ui.inventoryMedkits) {
            this.ui.inventoryMedkits.textContent = this.inventory.medkits;
        }
        if (this.ui.inventoryBatteries) {
            this.ui.inventoryBatteries.textContent = this.inventory.batteries;
        }
        if (this.ui.inventoryBerries) {
            this.ui.inventoryBerries.textContent = this.inventory.berries;
        }
        if (this.ui.inventoryMushrooms) {
            this.ui.inventoryMushrooms.textContent = this.inventory.mushrooms;
        }
        if (this.ui.inventorySticks) {
            this.ui.inventorySticks.textContent = this.inventory.sticks;
        }
        
        // Update action slots
        this.updateActionSlots();
        
        // Update objective tracker
        this.updateObjectiveTracker();
    }
    
    updateStatBar(stat, value, max) {
        const bar = document.getElementById(`${stat}-bar`);
        const valueElement = document.getElementById(`${stat}-value`);
        
        if (bar) {
            const percent = (value / max) * 100;
            bar.style.width = percent + '%';
            
            // Add pulse animation if critical
            if (value < 20) {
                bar.style.animation = 'pulse 1s infinite';
            } else {
                bar.style.animation = 'none';
            }
        }
        
        if (valueElement) {
            valueElement.textContent = Math.round(value);
            
            // Color coding based on value
            if (value < 20) {
                valueElement.style.color = '#ff4444';
            } else if (value < 50) {
                valueElement.style.color = '#ffaa00';
            } else {
                valueElement.style.color = '#66cc66';
            }
        }
    }
    
    updateMiniMap() {
        if (!this.mapContext) return;
        
        const ctx = this.mapContext;
        const center = this.mapRadius;
        const scale = 0.7; // Scale down the world for the map
        
        // Clear map
        ctx.clearRect(0, 0, this.mapRadius * 2, this.mapRadius * 2);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
        ctx.fillRect(0, 0, this.mapRadius * 2, this.mapRadius * 2);
        
        // Draw border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.mapRadius * 2, this.mapRadius * 2);
        
        // Draw player position
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(center, center, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction indicator
        const angle = -this.cameraRotation.y;
        const dirLength = 10;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.sin(angle) * dirLength,
            center + Math.cos(angle) * dirLength
        );
        ctx.stroke();
        
        // Draw trees on map
        ctx.fillStyle = '#2f5f2f';
        for (const tree of this.trees) {
            const x = center + (tree.position.x * scale);
            const z = center + (tree.position.z * scale);
            
            // Only draw if within map bounds
            if (x >= 0 && x <= this.mapRadius * 2 && z >= 0 && z <= this.mapRadius * 2) {
                ctx.beginPath();
                ctx.arc(x, z, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw wolves on map
        ctx.fillStyle = '#333333';
        for (const wolf of this.wolves) {
            const x = center + (wolf.position.x * scale);
            const z = center + (wolf.position.z * scale);
            
            // Only draw if within map bounds
            if (x >= 0 && x <= this.mapRadius * 2 && z >= 0 && z <= this.mapRadius * 2) {
                ctx.beginPath();
                ctx.arc(x, z, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    updateActionSlots() {
        const slots = document.querySelectorAll('.action-slot');
        slots.forEach(slot => {
            const key = slot.getAttribute('data-key');
            const count = this.getActionSlotCount(key);
            
            // Update slot appearance based on availability
            if (count > 0) {
                slot.classList.add('available');
                slot.classList.remove('empty');
            } else {
                slot.classList.remove('available');
                slot.classList.add('empty');
            }
        });
    }
    
    getActionSlotCount(key) {
        switch(key) {
            case '1': return this.inventory.medkits; // H key
            case '2': return this.inventory.batteries; // B key
            case '3': return this.inventory.berries; // N key
            case '4': return this.inventory.mushrooms; // M key
            case '5': return 1; // R key (always available for water)
            default: return 0;
        }
    }
    
    updateObjectiveTracker() {
        const objectives = document.querySelectorAll('.objective');
        objectives.forEach(obj => {
            const id = parseInt(obj.getAttribute('data-id'));
            
            if (id <= this.story.objectivesCompleted) {
                obj.classList.add('completed');
                obj.classList.remove('active');
                const icon = obj.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#4CAF50';
                }
            } else if (id === this.story.objectivesCompleted + 1) {
                obj.classList.add('active');
                obj.classList.remove('completed');
            } else {
                obj.classList.remove('active', 'completed');
            }
        });
    }
    
    // ===============================
    // NOTIFICATION & MESSAGE SYSTEM
    // ===============================
    
    showNotification(text, duration = 3000, type = 'info') {
        if (!this.ui.notification || !this.ui.notificationText || !this.ui.notificationIcon) return;
        
        // Set notification type
        let icon = 'fa-info-circle';
        let color = '#4CAF50';
        
        switch(type) {
            case 'warning':
                icon = 'fa-exclamation-triangle';
                color = '#ffaa00';
                break;
            case 'danger':
                icon = 'fa-skull-crossbones';
                color = '#ff4444';
                break;
            case 'success':
                icon = 'fa-check-circle';
                color = '#4CAF50';
                break;
            case 'secret':
                icon = 'fa-eye';
                color = '#aa44ff';
                break;
            case 'info':
            default:
                icon = 'fa-info-circle';
                color = '#3399ff';
        }
        
        // Update notification content
        this.ui.notificationText.textContent = text;
        this.ui.notificationIcon.className = `fas ${icon}`;
        this.ui.notification.style.borderColor = color;
        this.ui.notificationIcon.style.color = color;
        
        // Show notification
        this.ui.notification.classList.add('show');
        
        // Reset progress bar
        if (this.ui.notificationProgress) {
            this.ui.notificationProgress.style.width = '100%';
            this.ui.notificationProgress.style.animation = 'none';
            void this.ui.notificationProgress.offsetWidth; // Trigger reflow
            this.ui.notificationProgress.style.animation = `notificationProgress ${duration}ms linear`;
        }
        
        // Auto-hide after duration
        setTimeout(() => {
            this.ui.notification.classList.remove('show');
        }, duration);
    }
    
    addMessage(text) {
        if (!this.ui.logContent) return;
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = `[${this.getFormattedTime()}] ${text}`;
        
        // Add to messages array
        this.messages.unshift(messageElement);
        
        // Limit message count
        if (this.messages.length > this.maxMessages) {
            const oldMessage = this.messages.pop();
            if (oldMessage.parentNode) {
                oldMessage.parentNode.removeChild(oldMessage);
            }
        }
        
        // Update log display
        this.ui.logContent.innerHTML = '';
        this.messages.forEach(msg => {
            this.ui.logContent.appendChild(msg.cloneNode(true));
        });
        
        // Auto-scroll to top
        this.ui.logContent.scrollTop = 0;
    }
    
    clearMessageLog() {
        this.messages = [];
        if (this.ui.logContent) {
            this.ui.logContent.innerHTML = '';
        }
        this.showNotification("Log cleared", 2000, 'info');
    }
    
    getFormattedTime() {
        const totalSeconds = Math.floor(this.gameTime);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    
    // ===============================
    // PLAYER ACTIONS
    // ===============================
    
    toggleFlashlight() {
        this.input.flashlight = !this.input.flashlight;
        
        if (this.flashlight) {
            if (this.input.flashlight && this.player.battery > 0) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 3);
                this.showNotification("Flashlight ON", 1000, 'info');
                this.addMessage("Turned flashlight on");
            } else {
                this.flashlight.intensity = 0;
                this.showNotification("Flashlight OFF", 1000, 'info');
                this.addMessage("Turned flashlight off");
            }
        }
        
        this.playSound('click');
    }
    
    useMedkit() {
        if (this.inventory.medkits > 0 && this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
            this.inventory.medkits--;
            this.showNotification("Used medkit: +40 health", 2000, 'success');
            this.addMessage("Applied medical treatment");
            this.playSound('heal');
            
            // Check for no damage achievement
            if (this.player.health === this.player.maxHealth && this.gameTime > 60) {
                this.unlockAchievement('noDamage');
            }
        } else if (this.player.health >= this.player.maxHealth) {
            this.showNotification("Health already full", 2000, 'info');
        } else {
            this.showNotification("No medkits available", 2000, 'warning');
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 50);
            this.inventory.batteries--;
            this.showNotification("Used battery: +50% charge", 2000, 'success');
            this.addMessage("Flashlight recharged");
            this.playSound('pickup');
            
            // Turn flashlight back on if it was off due to dead battery
            if (this.player.battery > 0 && !this.input.flashlight) {
                this.input.flashlight = true;
                if (this.flashlight) {
                    this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 3);
                }
            }
        } else if (this.player.battery >= this.player.maxBattery) {
            this.showNotification("Battery already full", 2000, 'info');
        } else {
            this.showNotification("No batteries available", 2000, 'warning');
        }
    }
    
    eatBerries() {
        if (this.inventory.berries > 0) {
            const berriesToEat = Math.min(3, this.inventory.berries);
            this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + berriesToEat * 15);
            this.inventory.berries -= berriesToEat;
            this.showNotification(`Ate ${berriesToEat} berries: +${berriesToEat * 15} hunger`, 2000, 'success');
            this.addMessage("Berries satisfy your hunger");
            this.playSound('pickup');
        } else {
            this.showNotification("No berries available", 2000, 'warning');
        }
    }
    
    eatMushroom() {
        if (this.inventory.mushrooms > 0) {
            this.inventory.mushrooms--;
            
            // 30% chance of poisoning
            if (Math.random() < 0.3) {
                this.player.poisoned = true;
                this.player.health -= 20;
                this.showNotification("Poisonous mushroom! -20 health", 3000, 'danger');
                this.addMessage("You feel sick... it was poisonous!");
                this.playSound('damage');
                
                // Start poison effect timer
                setTimeout(() => {
                    this.player.poisoned = false;
                    this.showNotification("Poison effects have worn off", 3000, 'info');
                }, 10000);
            } else {
                this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + 25);
                this.showNotification("Edible mushroom: +25 hunger", 2000, 'success');
                this.addMessage("The mushroom was safe to eat");
                this.playSound('heal');
            }
        } else {
            this.showNotification("No mushrooms available", 2000, 'warning');
        }
    }
    
    drinkWater() {
        // Always available - represents drinking from streams or collected water
        this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 30);
        this.showNotification("Drank water: +30 thirst", 2000, 'success');
        this.addMessage("Water refreshes you");
        this.playSound('pickup');
    }
    
    interact() {
        const playerPos = this.player.position;
        
        // Check for nearby interactables
        let foundInteractable = false;
        
        // Check berries
        for (const berry of this.berries) {
            if (berry.collected) continue;
            const distance = playerPos.distanceTo(berry.position);
            if (distance < 2) {
                this.pickupCollectible(berry);
                foundInteractable = true;
                break;
            }
        }
        
        // Check mushrooms
        if (!foundInteractable) {
            for (const mushroom of this.mushrooms) {
                if (mushroom.collected) continue;
                const distance = playerPos.distanceTo(mushroom.position);
                if (distance < 2) {
                    this.pickupCollectible(mushroom);
                    foundInteractable = true;
                    break;
                }
            }
        }
        
        // Check sticks
        if (!foundInteractable) {
            for (const stick of this.sticks) {
                if (stick.collected) continue;
                const distance = playerPos.distanceTo(stick.position);
                if (distance < 2) {
                    this.pickupCollectible(stick);
                    foundInteractable = true;
                    break;
                }
            }
        }
        
        // No interactables found
        if (!foundInteractable) {
            this.showNotification("Nothing to interact with here", 2000, 'info');
        }
    }
    
    useActionSlot(key) {
        switch(key) {
            case '1': // H key
                this.useMedkit();
                break;
            case '2': // B key
                this.useBattery();
                break;
            case '3': // N key
                this.eatBerries();
                break;
            case '4': // M key
                this.eatMushroom();
                break;
            case '5': // R key
                this.drinkWater();
                break;
        }
        
        // Highlight the used slot
        const slot = document.getElementById(`slot-${key}`);
        if (slot) {
            slot.classList.add('active');
            setTimeout(() => {
                slot.classList.remove('active');
            }, 500);
        }
    }
    
    useInventoryItem(item) {
        switch(item) {
            case 'flashlight':
                this.toggleFlashlight();
                break;
            case 'medkit':
                this.useMedkit();
                break;
            case 'battery':
                this.useBattery();
                break;
            case 'berries':
                this.eatBerries();
                break;
            case 'mushroom':
                this.eatMushroom();
                break;
            default:
                this.showNotification(`${item} cannot be used directly`, 2000, 'info');
        }
    }
    
    // ===============================
    // CUTSCENE SYSTEM
    // ===============================
    
    showCutscene(type) {
        this.isInCutscene = true;
        this.currentCutscene = type;
        
        const cutsceneElement = document.getElementById(`cutscene-${type}`);
        if (cutsceneElement) {
            cutsceneElement.style.display = 'flex';
            
            // Initialize cutscene controls
            this.initCutsceneControls(type);
            
            // Auto-advance start cutscene
            if (type === 'start') {
                setTimeout(() => {
                    this.skipCutscene();
                }, 7000);
            }
        }
    }
    
    initCutsceneControls(type) {
        // Skip button
        const skipBtn = document.getElementById('cutscene-skip');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.skipCutscene();
            });
        }
        
        // Continue button
        const continueBtn = document.getElementById('cutscene-continue');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.skipCutscene();
            });
        }
        
        // Restart buttons for endings
        const restartBtns = [
            document.getElementById('good-restart-btn'),
            document.getElementById('bad-restart-btn'),
            document.getElementById('secret-restart-btn')
        ];
        
        restartBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.restartGame();
                });
            }
        });
    }
    
    skipCutscene() {
        const cutsceneElement = document.getElementById(`cutscene-${this.currentCutscene}`);
        if (cutsceneElement) {
            cutsceneElement.style.display = 'none';
        }
        
        this.isInCutscene = false;
        this.currentCutscene = null;
        
        // Start game if this was the start cutscene
        if (!this.gameStarted) {
            this.startGame();
        }
    }
    
    // ===============================
    // ENDING SYSTEM
    // ===============================
    
    triggerGoodEnding() {
        console.log("🎉 Good ending triggered!");
        
        this.isRunning = false;
        this.unlockAchievement('escaped');
        this.showEnding('good');
    }
    
    triggerBadEnding() {
        console.log("💀 Bad ending triggered!");
        
        this.isRunning = false;
        this.showEnding('bad');
    }
    
    triggerSecretEnding() {
        console.log("🔮 Secret ending triggered!");
        
        this.isRunning = false;
        this.showEnding('secret');
    }
    
    showEnding(type) {
        // Show appropriate cutscene
        this.showCutscene(type);
        
        // Update ending stats
        this.updateEndingStats(type);
        
        // Initialize ending buttons
        this.initEndingButtons();
    }
    
    updateEndingStats(type) {
        const statsElement = document.getElementById(`${type}-ending-stats`);
        if (!statsElement) return;
        
        const stats = `
            <div class="end-stat">
                <i class="fas fa-clock"></i>
                <span>Time Survived:</span>
                <strong>${this.getFormattedTime()}</strong>
            </div>
            <div class="end-stat">
                <i class="fas fa-heart"></i>
                <span>Final Health:</span>
                <strong>${Math.round(this.player.health)}</strong>
            </div>
            <div class="end-stat">
                <i class="fas fa-ghost"></i>
                <span>Final Fear:</span>
                <strong>${Math.round(this.player.fear)}%</strong>
            </div>
            <div class="end-stat">
                <i class="fas fa-box-open"></i>
                <span>Items Collected:</span>
                <strong>${this.story.itemsCollected}</strong>
            </div>
            <div class="end-stat">
                <i class="fas fa-wolf-pack-battalion"></i>
                <span>Wolves Encountered:</span>
                <strong>${this.story.wolvesEncountered}</strong>
            </div>
            <div class="end-stat">
                <i class="fas fa-secret"></i>
                <span>Secrets Found:</span>
                <strong>${this.story.secretsFound}/${this.story.totalSecrets}</strong>
            </div>
        `;
        
        statsElement.innerHTML = stats;
    }
    
    initEndingButtons() {
        // End screen restart button
        const endRestartBtn = document.getElementById('end-restart-btn');
        if (endRestartBtn) {
            endRestartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // End screen menu button
        const endMenuBtn = document.getElementById('end-menu-btn');
        if (endMenuBtn) {
            endMenuBtn.addEventListener('click', () => {
                this.quitToMenu();
            });
        }
        
        // End screen share button
        const endShareBtn = document.getElementById('end-share-btn');
        if (endShareBtn) {
            endShareBtn.addEventListener('click', () => {
                this.shareScore();
            });
        }
    }
    
    // ===============================
    // PAUSE MENU
    // ===============================
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }
    
    showPauseMenu() {
        if (this.ui.pauseMenu) {
            // Update pause menu stats
            document.getElementById('pause-time').textContent = this.getFormattedTime();
            document.getElementById('pause-health').textContent = Math.round(this.player.health);
            document.getElementById('pause-fear').textContent = Math.round(this.player.fear) + '%';
            
            // Show menu
            this.ui.pauseMenu.style.display = 'flex';
            
            // Initialize pause menu buttons
            this.initPauseMenuButtons();
            
            // Exit pointer lock
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
        }
    }
    
    hidePauseMenu() {
        if (this.ui.pauseMenu) {
            this.ui.pauseMenu.style.display = 'none';
        }
        
        // Re-enter pointer lock if in game
        if (!this.isInMenu && !this.isInCutscene) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.requestPointerLock();
            }
        }
    }
    
    initPauseMenuButtons() {
        // Resume button
        const resumeBtn = document.getElementById('pause-resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('pause-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Save button
        const saveBtn = document.getElementById('pause-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }
        
        // Load button
        const loadBtn = document.getElementById('pause-load-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadGame(0); // Load from first slot
            });
        }
        
        // Restart button
        const restartBtn = document.getElementById('pause-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (confirm("Restart game? Progress will be lost.")) {
                    this.restartGame();
                }
            });
        }
        
        // Quit button
        const quitBtn = document.getElementById('pause-quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                if (confirm("Quit to main menu? Progress will be saved.")) {
                    this.saveGame();
                    this.quitToMenu();
                }
            });
        }
    }
    
    // ===============================
    // GAME MANAGEMENT
    // ===============================
    
    restartGame() {
        location.reload();
    }
    
    quitToMenu() {
        this.isRunning = false;
        this.isInMenu = true;
        
        // Hide game elements
        const canvas = document.getElementById('gameCanvas');
        const gameUI = document.getElementById('game-ui');
        
        if (canvas) canvas.style.display = 'none';
        if (gameUI) gameUI.style.display = 'none';
        
        // Hide any open menus
        this.hidePauseMenu();
        
        // Show main menu
        this.showMainMenu();
    }
    
    saveGame() {
        try {
            const saveData = {
                player: this.player,
                inventory: this.inventory,
                story: this.story,
                gameTime: this.gameTime,
                achievements: this.achievements,
                timestamp: Date.now()
            };
            
            this.saveSlots[this.currentSaveSlot] = saveData;
            localStorage.setItem('earsOfTheForest_save', JSON.stringify(this.saveSlots));
            
            this.showNotification("Game saved", 2000, 'success');
            console.log("💾 Game saved successfully");
            
        } catch (error) {
            console.error("❌ Failed to save game:", error);
            this.showNotification("Failed to save game", 3000, 'danger');
        }
    }
    
    loadGame(slot) {
        try {
            const saved = localStorage.getItem('earsOfTheForest_save');
            if (!saved) {
                this.showNotification("No save file found", 3000, 'warning');
                return;
            }
            
            const saveSlots = JSON.parse(saved);
            const saveData = saveSlots[slot];
            
            if (!saveData) {
                this.showNotification("No save data in slot", 3000, 'warning');
                return;
            }
            
            // Load game data
            this.player = saveData.player;
            this.inventory = saveData.inventory;
            this.story = saveData.story;
            this.gameTime = saveData.gameTime;
            this.achievements = saveData.achievements;
            
            // Update player position in Three.js
            this.player.position = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y,
                this.player.position.z
            );
            
            this.showNotification("Game loaded", 2000, 'success');
            console.log("📂 Game loaded successfully");
            
            // Start the game
            this.hideMainMenu();
            this.startGame();
            
        } catch (error) {
            console.error("❌ Failed to load game:", error);
            this.showNotification("Failed to load game", 3000, 'danger');
        }
    }
    
    resetGameState() {
        // Reset player stats
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
            poisoned: false,
            radiation: 0,
            maxRadiation: 100
        };
        
        // Reset inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            berries: 0,
            mushrooms: 0,
            sticks: 0,
            water: 0,
            survivalKit: false,
            compass: true,
            mapFragments: 0,
            totalFragments: 3
        };
        
        // Reset story
        this.story = {
            wolvesEncountered: 0,
            itemsCollected: 0,
            objectivesCompleted: 0,
            totalObjectives: 3,
            secretsFound: 0,
            totalSecrets: 5
        };
        
        // Reset game time
        this.gameTime = 0;
        this.startTime = Date.now();
        
        // Reset wolf events
        this.wolfEvents = {
            firstChase: false,
            timer: 0,
            howlTimer: 0,
            nextHowl: 30
        };
        
        // Clear messages
        this.messages = [];
        if (this.ui.logContent) {
            this.ui.logContent.innerHTML = '';
        }
        
        // Reset camera
        this.cameraRotation = { x: 0, y: 0 };
        
        // Reset collectibles in scene
        this.resetCollectibles();
        
        // Reset wolves positions
        this.resetWolves();
        
        console.log("🔄 Game state reset");
    }
    
    resetCollectibles() {
        // Remove all collectibles from scene
        for (const berry of this.berries) {
            if (berry.collected) {
                berry.collected = false;
                this.scene.add(berry.mesh);
            }
        }
        
        for (const mushroom of this.mushrooms) {
            if (mushroom.collected) {
                mushroom.collected = false;
                this.scene.add(mushroom.mesh);
            }
        }
        
        for (const stick of this.sticks) {
            if (stick.collected) {
                stick.collected = false;
                this.scene.add(stick.mesh);
            }
        }
    }
    
    resetWolves() {
        // Reset wolf positions and states
        for (const wolf of this.wolves) {
            wolf.position.set(
                (Math.random() - 0.5) * 120,
                0,
                (Math.random() - 0.5) * 120
            );
            
            wolf.target.copy(wolf.position);
            wolf.state = 'idle';
            wolf.attackCooldown = 0;
            
            // Update visual positions
            wolf.body.position.copy(wolf.position);
            wolf.body.position.y = 0.8;
            wolf.head.position.copy(wolf.position);
            wolf.head.position.y = 1.1;
            wolf.head.position.z += 0.6;
        }
    }
    
    // ===============================
    // ACHIEVEMENT SYSTEM
    // ===============================
    
    unlockAchievement(achievementKey) {
        if (this.achievements[achievementKey]) return; // Already unlocked
        
        const achievements = {
            survived5min: {
                title: "Survivor",
                description: "Survive for 5 minutes in the forest"
            },
            killedWolf: {
                title: "Wolf Hunter",
                description: "Successfully defend against a wolf attack"
            },
            foundSecret: {
                title: "Explorer",
                description: "Discover your first secret area"
            },
            collectedAll: {
                title: "Collector",
                description: "Collect 20 items"
            },
            escaped: {
                title: "Escape Artist",
                description: "Successfully escape the forest"
            },
            noDamage: {
                title: "Untouched",
                description: "Reach full health without taking damage"
            },
            speedrun: {
                title: "Speed Runner",
                description: "Escape the forest in under 10 minutes"
            },
            pacifist: {
                title: "Pacifist",
                description: "Escape without encountering wolves"
            },
            explorer: {
                title: "Master Explorer",
                description: "Discover all secret areas"
            },
            master: {
                title: "Forest Master",
                description: "Unlock all achievements"
            }
        };
        
        const achievement = achievements[achievementKey];
        if (!achievement) return;
        
        // Unlock achievement
        this.achievements[achievementKey] = true;
        
        // Show achievement popup
        this.showAchievementPopup(achievement.title, achievement.description);
        
        console.log(`🏆 Achievement unlocked: ${achievement.title}`);
        
        // Check for master achievement
        this.checkMasterAchievement();
    }
    
    showAchievementPopup(title, description) {
        if (!this.ui.achievementPopup || !this.ui.achievementTitle || !this.ui.achievementDesc) return;
        
        // Update popup content
        this.ui.achievementTitle.textContent = title;
        this.ui.achievementDesc.textContent = description;
        
        // Show popup
        this.ui.achievementPopup.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.ui.achievementPopup.classList.remove('show');
        }, 5000);
    }
    
    checkAchievements() {
        // Check achievements based on current game state
        // (Some are checked in other functions)
    }
    
    checkMasterAchievement() {
        // Check if all achievements are unlocked
        const allUnlocked = Object.values(this.achievements).every(value => value === true);
        if (allUnlocked && !this.achievements.master) {
            this.unlockAchievement('master');
        }
    }
    
    // ===============================
    // UTILITY FUNCTIONS
    // ===============================
    
    playSound(soundName) {
        if (!this.audioEnabled || !this.audioContext || !this.sounds[soundName]) return;
        
        try {
            // Clone the sound to allow overlapping
            const sound = this.sounds[soundName];
            const newOscillator = this.audioContext.createOscillator();
            const newGainNode = this.audioContext.createGain();
            
            newOscillator.connect(newGainNode);
            newGainNode.connect(this.audioContext.destination);
            
            newOscillator.type = sound.oscillator.type;
            newOscillator.frequency.setValueAtTime(sound.oscillator.frequency.value, this.audioContext.currentTime);
            
            newGainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            newGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            newOscillator.start(this.audioContext.currentTime);
            newOscillator.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn("⚠️ Failed to play sound:", error);
        }
    }
    
    toggleMap() {
        const miniMap = document.getElementById('mini-map');
        if (miniMap) {
            if (miniMap.style.display === 'none' || miniMap.style.display === '') {
                miniMap.style.display = 'block';
                this.showNotification("Map opened", 1000, 'info');
            } else {
                miniMap.style.display = 'none';
                this.showNotification("Map closed", 1000, 'info');
            }
        }
    }
    
    showMap() {
        const miniMap = document.getElementById('mini-map');
        if (miniMap) {
            miniMap.style.display = 'block';
            setTimeout(() => {
                miniMap.style.display = 'none';
            }, 3000);
        }
    }
    
    shareScore() {
        const score = {
            time: this.getFormattedTime(),
            health: Math.round(this.player.health),
            items: this.story.itemsCollected,
            secrets: this.story.secretsFound,
            wolves: this.story.wolvesEncountered,
            achievements: Object.values(this.achievements).filter(v => v).length
        };
        
        const message = `I survived ${score.time} in Ears of the Forest! ` +
                       `Health: ${score.health}% | Items: ${score.items} | ` +
                       `Secrets: ${score.secrets} | Wolves: ${score.wolves} | ` +
                       `Achievements: ${score.achievements}/10`;
        
        // Try to use Web Share API
        if (navigator.share) {
            navigator.share({
                title: 'Ears of the Forest Score',
                text: message,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(message).then(() => {
                this.showNotification("Score copied to clipboard!", 3000, 'success');
            }).catch(() => {
                this.showNotification("Share not supported on this device", 3000, 'warning');
            });
        }
    }
    
    completeObjective(id) {
        this.story.objectivesCompleted++;
        this.showNotification(`Objective ${id} completed!`, 3000, 'success');
        
        // Update objective in UI
        const objective = document.querySelector(`.objective[data-id="${id}"]`);
        if (objective) {
            objective.classList.add('completed');
            const icon = objective.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check-circle';
                icon.style.color = '#4CAF50';
            }
        }
    }
    
    toggleObjective(id) {
        // This allows players to manually track objectives
        const objective = document.querySelector(`.objective[data-id="${id}"]`);
        if (objective) {
            if (objective.classList.contains('completed')) {
                objective.classList.remove('completed');
                const icon = objective.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-circle';
                    icon.style.color = '#ff6400';
                }
            } else {
                objective.classList.add('completed');
                const icon = objective.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#4CAF50';
                }
            }
        }
    }
    
    showTooltip(text, x, y) {
        if (!this.ui.tooltip) return;
        
        this.ui.tooltip.textContent = text;
        this.ui.tooltip.style.left = x + 'px';
        this.ui.tooltip.style.top = y + 'px';
        this.ui.tooltip.style.opacity = '1';
        
        // Position tooltip to not go off screen
        const tooltipRect = this.ui.tooltip.getBoundingClientRect();
        if (x + tooltipRect.width > window.innerWidth) {
            this.ui.tooltip.style.left = (x - tooltipRect.width) + 'px';
        }
        if (y + tooltipRect.height > window.innerHeight) {
            this.ui.tooltip.style.top = (y - tooltipRect.height) + 'px';
        }
    }
    
    hideTooltip() {
        if (!this.ui.tooltip) return;
        this.ui.tooltip.style.opacity = '0';
    }
}

// ===============================
// GAME STARTUP
// ===============================

// Create game instance when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM loaded, starting Ears of the Forest...");
    
    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
        console.error("❌ Three.js not loaded!");
        document.getElementById('loading-text').textContent = "ERROR: Three.js failed to load!";
        document.getElementById('progress-bar').style.width = '100%';
        
        // Show emergency button
        const emergencyBtn = document.getElementById('emergency-skip');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'block';
            emergencyBtn.addEventListener('click', () => {
                alert("Three.js failed to load. Please check your internet connection and refresh.");
                location.reload();
            });
        }
        return;
    }
    
    // Create game instance
    try {
        const game = new EarsOfTheForest();
        window.game = game; // Make accessible for debugging
        
        // Start the game initialization
        game.init();
        
    } catch (error) {
        console.error("❌ Game initialization failed:", error);
        document.getElementById('loading-text').textContent = "Game failed to start! Check console.";
        document.getElementById('progress-bar').style.width = '100%';
        
        // Show emergency button
        const emergencyBtn = document.getElementById('emergency-skip');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'block';
            emergencyBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.game) {
        // Auto-pause when tab loses focus
        if (window.game.isRunning && !window.game.isPaused && !window.game.isInMenu) {
            window.game.togglePause();
        }
    }
});

// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => {
    if (window.game && !window.game.isInMenu) {
        e.preventDefault();
    }
});

// Handle beforeunload to save game
window.addEventListener('beforeunload', (e) => {
    if (window.game && window.game.isRunning) {
        window.game.saveGame();
        
        // Show confirmation for unsaved changes
        e.preventDefault();
        e.returnValue = 'Your game progress will be saved. Are you sure you want to leave?';
    }
});
