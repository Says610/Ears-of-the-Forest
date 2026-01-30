// =========================================================
// ECHOES OF THE FOREST - COMPLETE GAME LOGIC
// =========================================================

class EchoesOfTheForest {
    constructor() {
        console.log("🧠 Initializing Echoes of the Forest...");
        
        // Core State
        this.gameState = {
            isRunning: false,
            isPaused: false,
            isInMemory: false,
            isInMenu: true,
            gameTime: 0,
            memoryTime: 0,
            loadingComplete: false
        };
        
        // Neural Network System
        this.neural = {
            connections: 0,
            maxConnections: 1000,
            learningRate: 0.1,
            patterns: new Map(),
            memoryFragments: [],
            totalFragments: 12,
            forestConsciousness: {
                awareness: 0,
                mood: 'neutral',
                trust: 50,
                deceptionChance: 0.3,
                lastInteraction: 0
            }
        };
        
        // Player Stats
        this.player = {
            // Physical
            health: 100,
            sanity: 100,
            stamina: 100,
            hunger: 100,
            thirst: 100,
            
            // Enhanced
            forestConnection: 0,
            memoryClarity: 0,
            soundAwareness: 25,
            wolfUnderstanding: 0,
            deceptionResistance: 0,
            
            // Position & State
            position: new THREE.Vector3(0, 1.7, 5),
            velocity: new THREE.Vector3(),
            rotation: { x: 0, y: 0 },
            isMoving: false,
            isSprinting: false,
            isCrouching: false,
            isHidden: false
        };
        
        // Memory System
        this.memorySystem = {
            fragments: [],
            collectedFragments: 0,
            currentMemory: null,
            memoryScenes: [
                {
                    id: 0,
                    title: "The Carving",
                    subtitle: "First Memory",
                    scene: "You remember carving your initials on an ancient tree. The bark felt alive beneath your fingers.",
                    clarity: 0,
                    unlocked: false,
                    position: new THREE.Vector3(50, 1.5, 50),
                    ability: "wolfUnderstanding"
                },
                {
                    id: 1,
                    title: "The First Night",
                    subtitle: "Lost in Darkness",
                    scene: "The first night was the longest. Every sound echoed through the endless trees.",
                    clarity: 0,
                    unlocked: false,
                    position: new THREE.Vector3(-50, 1.5, -50),
                    ability: "forestConnection"
                },
                {
                    id: 2,
                    title: "The Whisper",
                    subtitle: "Voice in the Wind",
                    scene: "A whisper carried by the wind. It spoke of memories buried deep in the forest's roots.",
                    clarity: 0,
                    unlocked: false,
                    position: new THREE.Vector3(70, 1.5, -30),
                    ability: "soundAwareness"
                }
            ]
        };
        
        // Wolf System
        this.wolfSystem = {
            packs: [],
            totalWolves: 4,
            wolfIntelligence: 0.5,
            aggressionLevel: 0.3,
            lastHowl: 0,
            nextHowl: 30
        };
        
        // Audio System
        this.audio = {
            enabled: true,
            context: null,
            masterVolume: 0.8,
            currentSounds: new Map(),
            soundSources: []
        };
        
        // Three.js Components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Input System
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        // UI Cache
        this.ui = {};
        
        // Loading State
        this.loadingProgress = 0;
        this.totalAssets = 10;
        this.loadedAssets = 0;
        
        // Performance
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Initialize
        this.init();
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    init() {
        console.log("🚀 Starting initialization...");
        
        // Show loading screen
        this.updateLoadingProgress("Initializing neural network...", 10);
        
        // Check Three.js
        if (typeof THREE === 'undefined') {
            this.showError("Three.js not loaded!");
            return;
        }
        
        // Start loading sequence
        setTimeout(() => this.loadStep1(), 500);
    }
    
    loadStep1() {
        this.updateLoadingProgress("Initializing graphics engine...", 25);
        
        try {
            this.initThreeJS();
            setTimeout(() => this.loadStep2(), 300);
        } catch (error) {
            console.error("Graphics init failed:", error);
            this.showError("Graphics initialization failed");
        }
    }
    
    loadStep2() {
        this.updateLoadingProgress("Creating living forest...", 45);
        
        try {
            this.initWorld();
            setTimeout(() => this.loadStep3(), 300);
        } catch (error) {
            console.error("World creation failed:", error);
            this.showError("World creation failed");
        }
    }
    
    loadStep3() {
        this.updateLoadingProgress("Setting up neural systems...", 65);
        
        try {
            this.initAudio();
            this.initUI();
            setTimeout(() => this.loadStep4(), 300);
        } catch (error) {
            console.error("Systems setup failed:", error);
            this.showError("Systems setup failed");
        }
    }
    
    loadStep4() {
        this.updateLoadingProgress("Awakening forest consciousness...", 85);
        
        try {
            this.initInput();
            this.initMemoryFragments();
            this.initWolves();
            setTimeout(() => this.loadStep5(), 300);
        } catch (error) {
            console.error("Finalization failed:", error);
            this.showError("Finalization failed");
        }
    }
    
    loadStep5() {
        this.updateLoadingProgress("Ready to enter the forest...", 100);
        
        setTimeout(() => {
            console.log("✅ Loading complete!");
            this.loadingComplete = true;
            this.gameState.loadingComplete = true;
            
            // Show main menu
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showMainMenu();
            }, 1000);
            
        }, 500);
    }
    
    updateLoadingProgress(text, percent) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const memoryIntegrity = document.getElementById('memory-integrity');
        const fragmentQuote = document.getElementById('fragment-quote');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text;
        if (memoryIntegrity) memoryIntegrity.textContent = percent + '%';
        
        // Show quotes at milestones
        const quotes = [
            "The forest has a memory of its own.",
            "Some trees grow from forgotten stories.",
            "What you hear is not always what is said.",
            "The wolves remember every path you take.",
            "Your footsteps change the forest forever.",
            "Listen closely to the spaces between sounds.",
            "The past is buried but not gone.",
            "Every choice rewrites the memory.",
            "The forest learns from your fear.",
            "Truth and deception grow from the same root."
        ];
        
        if (percent % 10 === 0 && fragmentQuote) {
            const quoteIndex = Math.floor(percent / 10);
            if (quoteIndex < quotes.length) {
                fragmentQuote.textContent = `"${quotes[quoteIndex]}"`;
                fragmentQuote.style.opacity = '0';
                setTimeout(() => {
                    fragmentQuote.style.transition = 'opacity 1s';
                    fragmentQuote.style.opacity = '1';
                }, 100);
            }
        }
        
        this.loadingProgress = percent;
    }
    
    showError(message) {
        console.error("❌ Error:", message);
        
        const progressText = document.getElementById('progress-text');
        if (progressText) progressText.textContent = `ERROR: ${message}`;
        
        const emergencyBtn = document.getElementById('emergency-skip');
        if (emergencyBtn) {
            emergencyBtn.style.display = 'flex';
            emergencyBtn.addEventListener('click', () => this.emergencyLoad());
        }
    }
    
    emergencyLoad() {
        console.log("🚨 Emergency load activated");
        
        // Create minimal scene
        this.createMinimalScene();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show main menu
        this.showMainMenu();
    }
    
    createMinimalScene() {
        // Basic Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001100);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 5);
        
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Basic lighting
        const ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.5);
        directional.position.set(1, 1, 1);
        this.scene.add(directional);
        
        // Basic ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        this.scene.add(ground);
        
        this.clock = new THREE.Clock();
        this.gameState.isRunning = true;
        
        // Start game loop
        this.gameLoop();
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('screen-visible');
            loadingScreen.classList.add('screen-hidden');
        }
    }
    
    // ===============================
    // THREE.JS INITIALIZATION
    // ===============================
    
    initThreeJS() {
        console.log("🎨 Initializing Three.js...");
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000511);
        this.scene.fog = new THREE.FogExp2(0x000511, 0.015);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.player.position);
        
        // Create renderer
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Canvas not found");
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create clock
        this.clock = new THREE.Clock();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log("✅ Three.js initialized");
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // ===============================
    // WORLD CREATION
    // ===============================
    
    initWorld() {
        console.log("🌍 Creating world...");
        
        // Lighting
        this.createLighting();
        
        // Terrain
        this.createTerrain();
        
        // Trees
        this.createTrees();
        
        // Memory fragments
        this.createMemoryObjects();
        
        console.log("✅ World created");
    }
    
    createLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambient);
        
        // Directional light (sun/moon)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);
        
        // Neural lights
        for (let i = 0; i < 10; i++) {
            const light = new THREE.PointLight(0x00ff88, 0.3, 30);
            light.position.set(
                (Math.random() - 0.5) * 200,
                5 + Math.random() * 10,
                (Math.random() - 0.5) * 200
            );
            this.scene.add(light);
            
            // Add pulsing animation
            this.addLightPulse(light);
        }
    }
    
    addLightPulse(light) {
        const originalIntensity = light.intensity;
        let time = 0;
        
        const pulse = () => {
            if (!this.gameState.isRunning) return;
            
            time += 0.05;
            light.intensity = originalIntensity * (0.8 + Math.sin(time) * 0.2);
            
            requestAnimationFrame(pulse);
        };
        
        pulse();
    }
    
    createTerrain() {
        const size = 200;
        const geometry = new THREE.PlaneGeometry(size, size, 50, 50);
        
        // Displace vertices for hills
        const vertices = geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getY(i);
            
            let height = 0;
            height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
            height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1;
            
            vertices.setZ(i, height);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a3a1a,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -2;
        terrain.receiveShadow = true;
        this.scene.add(terrain);
    }
    
    createTrees() {
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Skip near spawn
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            // Trunk
            const trunkHeight = 4 + Math.random() * 3;
            const trunkRadius = 0.3 + Math.random() * 0.2;
            
            const trunkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 0.9,
                trunkRadius,
                trunkHeight,
                8
            );
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a2e1f,
                roughness: 0.8
            });
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, trunkHeight / 2 - 1, z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            
            // Foliage
            const foliageRadius = 1.5 + Math.random() * 1;
            const foliageGeometry = new THREE.SphereGeometry(foliageRadius, 8, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: 0x2f5f2f,
                roughness: 0.7,
                transparent: true,
                opacity: 0.9
            });
            
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(x, trunkHeight - 1, z);
            foliage.castShadow = true;
            this.scene.add(foliage);
        }
    }
    
    createMemoryObjects() {
        this.memorySystem.memoryScenes.forEach((memory, index) => {
            // Create crystal
            const geometry = new THREE.OctahedronGeometry(0.8);
            const material = new THREE.MeshStandardMaterial({
                color: 0x0088ff,
                emissive: 0x0088ff,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.7
            });
            
            const crystal = new THREE.Mesh(geometry, material);
            crystal.position.copy(memory.position);
            crystal.castShadow = true;
            
            // Store reference
            memory.crystal = crystal;
            memory.collected = false;
            
            this.scene.add(crystal);
            
            // Add pulsing animation
            this.addMemoryPulse(crystal);
        });
    }
    
    addMemoryPulse(crystal) {
        let time = 0;
        
        const pulse = () => {
            if (!this.gameState.isRunning) return;
            
            time += 0.03;
            crystal.scale.setScalar(1 + Math.sin(time) * 0.1);
            crystal.rotation.y += 0.01;
            
            requestAnimationFrame(pulse);
        };
        
        pulse();
    }
    
    // ===============================
    // AUDIO SYSTEM
    // ===============================
    
    initAudio() {
        console.log("🔊 Initializing audio...");
        
        try {
            this.audio.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log("✅ Audio context created");
        } catch (error) {
            console.warn("⚠️ Audio context creation failed:", error);
            this.audio.enabled = false;
        }
    }
    
    playSound(type, position = null) {
        if (!this.audio.enabled || !this.audio.context) return;
        
        try {
            const oscillator = this.audio.context.createOscillator();
            const gainNode = this.audio.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audio.context.destination);
            
            // Set frequency based on type
            let frequency = 440;
            switch(type) {
                case 'memory': frequency = 880; break;
                case 'wolf': frequency = 220; break;
                case 'ui': frequency = 660; break;
            }
            
            oscillator.frequency.setValueAtTime(frequency, this.audio.context.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audio.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audio.context.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audio.context.currentTime + 0.3);
            
        } catch (error) {
            console.warn("⚠️ Sound playback failed:", error);
        }
    }
    
    // ===============================
    // UI INITIALIZATION
    // ===============================
    
    initUI() {
        console.log("🖥️ Initializing UI...");
        
        // Cache UI elements
        this.cacheUIElements();
        
        // Initialize memory grid
        this.initMemoryGrid();
        
        // Update initial values
        this.updateUI();
        
        console.log("✅ UI initialized");
    }
    
    cacheUIElements() {
        this.ui = {
            // Loading
            loadingScreen: document.getElementById('loading-screen'),
            
            // Main menu
            mainMenu: document.getElementById('main-menu'),
            newGameBtn: document.getElementById('new-game-btn'),
            continueBtn: document.getElementById('continue-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            creditsBtn: document.getElementById('credits-btn'),
            
            // Game UI
            gameUI: document.getElementById('game-ui'),
            gameCanvas: document.getElementById('gameCanvas'),
            
            // Neural HUD
            memoryActivity: document.getElementById('memory-activity'),
            memoryValue: document.getElementById('memory-value'),
            learningCircle: document.getElementById('learning-circle'),
            circleValue: document.querySelector('.circle-value'),
            learningType: document.getElementById('learning-type'),
            
            // Memory fragments
            fragmentsGrid: document.getElementById('fragments-grid'),
            fragmentTip: document.getElementById('fragment-tip'),
            
            // Stats
            sanityBar: document.getElementById('sanity-bar'),
            sanityValue: document.getElementById('sanity-value'),
            connectionBar: document.getElementById('connection-bar'),
            connectionValue: document.getElementById('connection-value'),
            
            // Crosshair
            crosshairContext: document.getElementById('crosshair-context'),
            
            // Memory interface
            memoryInterface: document.getElementById('memory-interface'),
            memoryTitle: document.getElementById('memory-title'),
            memorySubtitle: document.getElementById('memory-subtitle'),
            sceneText: document.getElementById('scene-text'),
            narrativeText: document.getElementById('narrative-text'),
            narrativeProgress: document.getElementById('narrative-progress'),
            clarityValue: document.getElementById('clarity-value'),
            memoryExit: document.getElementById('memory-exit'),
            
            // Pause menu
            pauseMenu: document.getElementById('pause-menu'),
            pauseTime: document.getElementById('pause-time'),
            pauseNeural: document.getElementById('pause-neural'),
            pauseResume: document.getElementById('pause-resume'),
            pauseSettings: document.getElementById('pause-settings'),
            pauseQuit: document.getElementById('pause-quit')
        };
    }
    
    initMemoryGrid() {
        if (!this.ui.fragmentsGrid) return;
        
        this.ui.fragmentsGrid.innerHTML = '';
        
        for (let i = 0; i < this.memorySystem.totalFragments; i++) {
            const slot = document.createElement('div');
            slot.className = 'fragment-slot';
            slot.innerHTML = '<i class="fas fa-question"></i>';
            slot.setAttribute('data-id', i);
            this.ui.fragmentsGrid.appendChild(slot);
        }
    }
    
    updateMemoryGrid() {
        const slots = document.querySelectorAll('.fragment-slot');
        slots.forEach((slot, index) => {
            const memory = this.memorySystem.memoryScenes[index];
            if (memory && memory.collected) {
                slot.classList.add('collected');
                slot.innerHTML = '<i class="fas fa-brain"></i>';
            }
        });
        
        // Update tip
        if (this.ui.fragmentTip) {
            const collected = this.memorySystem.collectedFragments;
            const tips = [
                "Listen for whispers...",
                "Follow the blue glow...",
                "The forest remembers...",
                "Seek the ancient trees...",
                "Memory echoes in stillness..."
            ];
            
            const tipIndex = Math.min(collected, tips.length - 1);
            this.ui.fragmentTip.textContent = tips[tipIndex];
        }
    }
    
    updateUI() {
        if (!this.gameState.isRunning || this.gameState.isInMemory) return;
        
        // Update neural HUD
        this.updateNeuralHUD();
        
        // Update stats
        this.updateStats();
        
        // Update sound compass
        this.updateSoundCompass();
        
        // Update memory grid
        this.updateMemoryGrid();
    }
    
    updateNeuralHUD() {
        // Memory activity
        const memoryPercent = (this.neural.forestConsciousness.awareness / 100) * 100;
        if (this.ui.memoryActivity) {
            this.ui.memoryActivity.style.setProperty('--activity', `${memoryPercent}%`);
        }
        if (this.ui.memoryValue) {
            this.ui.memoryValue.textContent = `${Math.floor(memoryPercent)}%`;
        }
        
        // Learning progress
        const learningPercent = (this.neural.connections / this.neural.maxConnections) * 100;
        if (this.ui.learningCircle) {
            this.ui.learningCircle.style.setProperty('--progress', `${learningPercent}%`);
        }
        if (this.ui.circleValue) {
            this.ui.circleValue.textContent = `${Math.floor(learningPercent)}%`;
        }
        
        // Learning type
        if (this.ui.learningType) {
            const types = ['Exploring', 'Learning', 'Adapting', 'Remembering', 'Understanding'];
            const typeIndex = Math.floor(this.gameState.gameTime / 60) % types.length;
            this.ui.learningType.textContent = types[typeIndex];
        }
    }
    
    updateStats() {
        // Sanity
        if (this.ui.sanityBar) {
            this.ui.sanityBar.style.width = `${this.player.sanity}%`;
        }
        if (this.ui.sanityValue) {
            this.ui.sanityValue.textContent = `${Math.floor(this.player.sanity)}%`;
        }
        
        // Connection
        if (this.ui.connectionBar) {
            this.ui.connectionBar.style.width = `${this.player.forestConnection}%`;
        }
        if (this.ui.connectionValue) {
            this.ui.connectionValue.textContent = `${Math.floor(this.player.forestConnection)}%`;
        }
    }
    
    updateSoundCompass() {
        const compass = document.querySelector('.sound-compass');
        if (!compass) return;
        
        const needle = compass.querySelector('.compass-needle');
        if (!needle) return;
        
        // Random rotation for demo
        const angle = Math.sin(Date.now() * 0.001) * 180;
        needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
    
    // ===============================
    // INPUT SYSTEM
    // ===============================
    
    initInput() {
        console.log("🎮 Initializing input...");
        
        const canvas = this.ui.gameCanvas;
        
        // Pointer lock for mouse look
        canvas.addEventListener('click', () => {
            if (this.gameState.isRunning && !this.gameState.isPaused && !this.gameState.isInMenu) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.gameState.isPaused || this.gameState.isInMenu) return;
            
            const sensitivity = 0.002;
            this.player.rotation.y -= e.movementX * sensitivity;
            this.player.rotation.x -= e.movementY * sensitivity;
            
            // Clamp vertical rotation
            this.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.player.rotation.x));
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e.code, true);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyPress(e.code, false);
        });
        
        console.log("✅ Input initialized");
    }
    
    handleKeyPress(key, pressed) {
        // Global keys (work in any state)
        switch(key) {
            case 'Escape':
                this.handleEscapeKey();
                break;
        }
        
        // Only handle game keys if in game
        if (this.gameState.isPaused || this.gameState.isInMenu || !this.gameState.isRunning) return;
        
        switch(key) {
            case 'KeyW':
            case 'KeyS':
            case 'KeyA':
            case 'KeyD':
                this.player.isMoving = pressed;
                break;
            case 'ShiftLeft':
                this.player.isSprinting = pressed;
                break;
            case 'KeyC':
                if (pressed) this.player.isCrouching = !this.player.isCrouching;
                break;
            case 'KeyE':
                if (pressed) this.interact();
                break;
            case 'KeyM':
                if (pressed && this.memorySystem.collectedFragments > 0) {
                    this.enterMemoryMode();
                }
                break;
        }
    }
    
    handleEscapeKey() {
        if (this.gameState.isInMemory) {
            this.exitMemoryMode();
        } else if (this.gameState.isPaused) {
            this.resumeGame();
        } else if (this.gameState.isRunning) {
            this.pauseGame();
        }
    }
    
    // ===============================
    // MEMORY FRAGMENT SYSTEM
    // ===============================
    
    initMemoryFragments() {
        console.log("🧠 Initializing memory fragments...");
        
        // Initialize fragment data
        this.memorySystem.fragments = this.memorySystem.memoryScenes.map(memory => ({
            ...memory,
            collected: false,
            clarity: 0
        }));
        
        console.log(`✅ ${this.memorySystem.fragments.length} memory fragments initialized`);
    }
    
    collectMemoryFragment(memory) {
        if (memory.collected) return;
        
        console.log(`🎯 Collecting memory: ${memory.title}`);
        
        // Mark as collected
        memory.collected = true;
        this.memorySystem.collectedFragments++;
        
        // Remove crystal from scene
        if (memory.crystal) {
            this.scene.remove(memory.crystal);
        }
        
        // Update neural connections
        this.neural.connections += 83; // 1000/12 ≈ 83
        
        // Unlock ability
        this.unlockMemoryAbility(memory.ability);
        
        // Play sound
        this.playSound('memory');
        
        // Show notification
        this.showNotification(`Memory Fragment Collected: ${memory.title}`, 3000);
        
        // Update UI
        this.updateMemoryGrid();
        this.updateNeuralHUD();
        
        // Enter memory mode
        setTimeout(() => {
            this.enterMemoryMode(memory);
        }, 1000);
    }
    
    unlockMemoryAbility(ability) {
        switch(ability) {
            case 'wolfUnderstanding':
                this.player.wolfUnderstanding += 25;
                break;
            case 'forestConnection':
                this.player.forestConnection += 30;
                break;
            case 'soundAwareness':
                this.player.soundAwareness += 25;
                break;
        }
        
        console.log(`🔓 Ability unlocked: ${ability}`);
    }
    
    enterMemoryMode(memory = null) {
        if (!memory && this.memorySystem.collectedFragments > 0) {
            // Use first unviewed memory, or most recent
            const unviewed = this.memorySystem.fragments.filter(f => f.collected && f.clarity < 100);
            memory = unviewed[0] || this.memorySystem.fragments[0];
        }
        
        if (!memory) return;
        
        console.log(`🔮 Entering memory: ${memory.title}`);
        
        this.gameState.isInMemory = true;
        this.memorySystem.currentMemory = memory;
        
        // Update memory interface
        this.updateMemoryInterface(memory);
        
        // Show memory interface
        this.ui.memoryInterface.classList.remove('screen-hidden');
        this.ui.memoryInterface.classList.add('screen-visible');
        
        // Hide game UI
        this.ui.gameUI.classList.remove('screen-visible');
        this.ui.gameUI.classList.add('screen-hidden');
        
        // Start memory reconstruction
        this.startMemoryReconstruction(memory);
    }
    
    updateMemoryInterface(memory) {
        if (this.ui.memoryTitle) this.ui.memoryTitle.textContent = memory.title;
        if (this.ui.memorySubtitle) this.ui.memorySubtitle.textContent = memory.subtitle;
        if (this.ui.sceneText) this.ui.sceneText.textContent = memory.scene;
        if (this.ui.narrativeText) this.ui.narrativeText.textContent = memory.scene;
    }
    
    startMemoryReconstruction(memory) {
        let clarity = memory.clarity;
        const targetClarity = 100;
        const increment = 0.5;
        
        const reconstruct = () => {
            if (!this.gameState.isInMemory || clarity >= targetClarity) {
                if (this.ui.clarityValue) {
                    this.ui.clarityValue.textContent = '100%';
                }
                if (this.ui.narrativeProgress) {
                    this.ui.narrativeProgress.style.width = '100%';
                }
                memory.clarity = 100;
                return;
            }
            
            clarity += increment;
            memory.clarity = Math.min(clarity, targetClarity);
            
            if (this.ui.clarityValue) {
                this.ui.clarityValue.textContent = `${Math.floor(memory.clarity)}%`;
            }
            if (this.ui.narrativeProgress) {
                this.ui.narrativeProgress.style.width = `${memory.clarity}%`;
            }
            
            requestAnimationFrame(reconstruct);
        };
        
        reconstruct();
    }
    
    exitMemoryMode() {
        console.log("🚪 Exiting memory mode");
        
        this.gameState.isInMemory = false;
        this.memorySystem.currentMemory = null;
        
        // Hide memory interface
        this.ui.memoryInterface.classList.remove('screen-visible');
        this.ui.memoryInterface.classList.add('screen-hidden');
        
        // Show game UI
        if (this.gameState.isRunning && !this.gameState.isPaused) {
            this.ui.gameUI.classList.remove('screen-hidden');
            this.ui.gameUI.classList.add('screen-visible');
        }
    }
    
    // ===============================
    // WOLF SYSTEM
    // ===============================
    
    initWolves() {
        console.log("🐺 Initializing wolves...");
        
        for (let i = 0; i < this.wolfSystem.totalWolves; i++) {
            this.createWolf(i);
        }
        
        console.log(`✅ ${this.wolfSystem.totalWolves} wolves created`);
    }
    
    createWolf(id) {
        const x = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 150;
        
        // Create wolf body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(x, 0.5, z);
        body.castShadow = true;
        
        // Create wolf head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(x, 0.8, z + 0.4);
        
        this.scene.add(body);
        this.scene.add(head);
        
        // Store wolf data
        const wolf = {
            id: id,
            body: body,
            head: head,
            position: new THREE.Vector3(x, 0, z),
            target: new THREE.Vector3(x, 0, z),
            speed: 2 + Math.random(),
            health: 50,
            state: 'idle', // idle, chasing, attacking
            detectionRange: 20,
            attackRange: 2,
            lastHowl: 0
        };
        
        this.wolfSystem.packs.push(wolf);
        
        return wolf;
    }
    
    updateWolves(delta) {
        this.wolfSystem.packs.forEach(wolf => {
            this.updateWolfBehavior(wolf, delta);
        });
        
        // Random howls
        this.wolfSystem.lastHowl += delta;
        if (this.wolfSystem.lastHowl > this.wolfSystem.nextHowl) {
            this.wolfSystem.lastHowl = 0;
            this.wolfSystem.nextHowl = 20 + Math.random() * 40;
            
            // Only howl if player is far
            let closeWolf = false;
            this.wolfSystem.packs.forEach(wolf => {
                if (this.player.position.distanceTo(wolf.position) < 50) {
                    closeWolf = true;
                }
            });
            
            if (!closeWolf) {
                this.playSound('wolf');
            }
        }
    }
    
    updateWolfBehavior(wolf, delta) {
        const distance = this.player.position.distanceTo(wolf.position);
        
        // Update state based on distance
        if (distance < wolf.detectionRange) {
            if (wolf.state !== 'chasing' && wolf.state !== 'attacking') {
                wolf.state = 'chasing';
            }
        } else if (wolf.state === 'chasing' && distance > wolf.detectionRange * 1.5) {
            wolf.state = 'idle';
        }
        
        // Behavior based on state
        switch(wolf.state) {
            case 'chasing':
                this.wolfChaseBehavior(wolf, delta);
                break;
            case 'idle':
                this.wolfIdleBehavior(wolf, delta);
                break;
        }
        
        // Update visual position
        wolf.body.position.copy(wolf.position);
        wolf.body.position.y = 0.5;
        wolf.head.position.copy(wolf.position);
        wolf.head.position.y = 0.8;
        wolf.head.position.z += 0.4;
    }
    
    wolfChaseBehavior(wolf, delta) {
        const direction = new THREE.Vector3()
            .subVectors(this.player.position, wolf.position)
            .normalize();
        
        wolf.position.addScaledVector(direction, wolf.speed * delta);
        
        // Rotate to face player
        const angle = Math.atan2(direction.x, direction.z);
        wolf.body.rotation.y = angle;
        wolf.head.rotation.y = angle;
        
        // Check for attack range
        const distance = this.player.position.distanceTo(wolf.position);
        if (distance < 2) {
            // Attack player
            this.player.health -= 10;
            this.player.sanity -= 5;
            this.showDamageFlash();
            
            // Reset chase
            wolf.state = 'idle';
        }
    }
    
    wolfIdleBehavior(wolf, delta) {
        // Random wandering
        if (Math.random() < 0.01) {
            wolf.target.x = wolf.position.x + (Math.random() - 0.5) * 20;
            wolf.target.z = wolf.position.z + (Math.random() - 0.5) * 20;
        }
        
        // Move toward target
        const direction = new THREE.Vector3()
            .subVectors(wolf.target, wolf.position)
            .normalize();
        
        wolf.position.addScaledVector(direction, wolf.speed * 0.5 * delta);
    }
    
    // ===============================
    // GAMEPLAY SYSTEMS
    // ===============================
    
    interact() {
        const playerPos = this.player.position;
        
        // Check memory fragments
        this.memorySystem.fragments.forEach(memory => {
            if (memory.collected || !memory.position) return;
            
            const distance = playerPos.distanceTo(memory.position);
            if (distance < 3) {
                this.collectMemoryFragment(memory);
                return;
            }
        });
        
        // Update crosshair context
        this.updateCrosshairContext();
    }
    
    updateCrosshairContext() {
        const playerPos = this.player.position;
        let context = "";
        
        // Check for nearby memory fragments
        this.memorySystem.fragments.forEach(memory => {
            if (memory.collected || !memory.position) return;
            
            const distance = playerPos.distanceTo(memory.position);
            if (distance < 5) {
                context = "Memory Fragment Nearby";
            }
        });
        
        // Update crosshair
        if (this.ui.crosshairContext) {
            if (context) {
                this.ui.crosshairContext.textContent = context;
                this.ui.crosshairContext.classList.add('show');
            } else {
                this.ui.crosshairContext.classList.remove('show');
            }
        }
    }
    
    showDamageFlash() {
        // Create flash effect
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'rgba(255, 0, 0, 0.3)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '99';
        flash.style.transition = 'opacity 0.3s';
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 300);
        }, 100);
    }
    
    showNotification(text, duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.background = 'rgba(0, 5, 17, 0.9)';
        notification.style.color = 'var(--neural-primary)';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.border = '2px solid var(--neural-primary)';
        notification.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        notification.style.zIndex = '1001';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s';
        notification.textContent = text;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(10px)';
        }, 10);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // ===============================
    // PLAYER MOVEMENT & CAMERA
    // ===============================
    
    updatePlayer(delta) {
        // Calculate movement direction
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(this.camera.up, forward).normalize();
        
        // Reset velocity
        this.player.velocity.set(0, 0, 0);
        
        // Apply movement based on input
        let speed = 5;
        if (this.player.isSprinting && this.player.stamina > 0) {
            speed = 8;
            this.player.stamina -= 20 * delta;
        } else if (this.player.stamina < 100) {
            this.player.stamina += 10 * delta;
        }
        
        if (this.player.isCrouching) {
            speed = 2;
        }
        
        if (this.keys['KeyW']) this.player.velocity.addScaledVector(forward, speed);
        if (this.keys['KeyS']) this.player.velocity.addScaledVector(forward, -speed);
        if (this.keys['KeyA']) this.player.velocity.addScaledVector(right, -speed);
        if (this.keys['KeyD']) this.player.velocity.addScaledVector(right, speed);
        
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
        // Apply rotation
        this.camera.rotation.x = -this.player.rotation.x;
        this.camera.rotation.y = -this.player.rotation.y;
        
        // Update camera position
        this.camera.position.copy(this.player.position);
        
        // Add bobbing effect when moving
        if (this.player.isMoving && this.player.onGround) {
            const time = this.gameState.gameTime * 8;
            this.camera.position.y += Math.sin(time) * 0.05;
        }
    }
    
    // ===============================
    // STATS MANAGEMENT
    // ===============================
    
    updateStats(delta) {
        // Sanity depletion
        this.player.sanity -= 0.1 * delta;
        
        // Increase fear near wolves
        this.wolfSystem.packs.forEach(wolf => {
            const distance = this.player.position.distanceTo(wolf.position);
            if (distance < 30) {
                this.player.sanity -= (30 - distance) * 0.05 * delta;
            }
        });
        
        // Clamp values
        this.player.sanity = Math.max(0, Math.min(100, this.player.sanity));
        this.player.stamina = Math.max(0, Math.min(100, this.player.stamina));
        
        // Health effects
        if (this.player.sanity < 30) {
            this.player.health -= 0.1 * delta;
        }
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        console.log("💀 Game Over");
        
        this.showNotification("The forest claims another memory...", 5000);
        
        // Return to menu after delay
        setTimeout(() => {
            this.quitToMenu();
        }, 3000);
    }
    
    // ===============================
    // NEURAL NETWORK SYSTEM
    // ===============================
    
    updateNeuralNetwork(delta) {
        // Record player patterns
        if (this.player.isMoving) {
            this.recordPattern('moving');
        }
        
        if (this.player.isSprinting) {
            this.recordPattern('sprinting');
        }
        
        if (this.memorySystem.collectedFragments > 0) {
            this.recordPattern('memory_collector');
        }
        
        // Update forest consciousness
        this.updateForestConsciousness(delta);
        
        // Make neural connections
        if (Math.random() < this.neural.learningRate * delta) {
            this.makeNeuralConnection();
        }
    }
    
    recordPattern(pattern) {
        const now = Date.now();
        const recentPatterns = Array.from(this.neural.patterns.entries())
            .filter(([time, _]) => now - time < 60000); // Last minute
        
        const patternCount = recentPatterns.filter(([_, p]) => p === pattern).length;
        
        if (patternCount < 10) { // Prevent spam
            this.neural.patterns.set(now, pattern);
        }
    }
    
    updateForestConsciousness(delta) {
        // Increase awareness based on player activity
        if (this.player.isMoving) {
            this.neural.forestConsciousness.awareness += 0.01 * delta;
        }
        
        if (this.memorySystem.collectedFragments > 0) {
            this.neural.forestConsciousness.awareness += 0.05 * delta;
        }
        
        // Update mood
        if (this.player.sanity < 50) {
            this.neural.forestConsciousness.mood = 'aggressive';
        } else if (this.player.forestConnection > 50) {
            this.neural.forestConsciousness.mood = 'friendly';
        } else {
            this.neural.forestConsciousness.mood = 'neutral';
        }
        
        // Clamp values
        this.neural.forestConsciousness.awareness = Math.min(100, this.neural.forestConsciousness.awareness);
    }
    
    makeNeuralConnection() {
        if (this.neural.connections >= this.neural.maxConnections) return;
        
        this.neural.connections++;
        
        // Increase learning rate occasionally
        if (this.neural.connections % 100 === 0) {
            this.neural.learningRate += 0.01;
            console.log(`📈 Learning rate increased to ${this.neural.learningRate}`);
        }
    }
    
    // ===============================
    // GAME STATE MANAGEMENT
    // ===============================
    
    showMainMenu() {
        console.log("🏠 Showing main menu");
        
        this.gameState.isInMenu = true;
        this.ui.mainMenu.classList.remove('screen-hidden');
        this.ui.mainMenu.classList.add('screen-visible');
        
        // Initialize menu buttons
        this.initMenuButtons();
        
        // Update AI status
        if (this.ui.menuAiStatus) {
            this.ui.menuAiStatus.textContent = this.neural.forestConsciousness.mood;
        }
    }
    
    hideMainMenu() {
        this.gameState.isInMenu = false;
        this.ui.mainMenu.classList.remove('screen-visible');
        this.ui.mainMenu.classList.add('screen-hidden');
    }
    
    initMenuButtons() {
        // New Game
        if (this.ui.newGameBtn) {
            this.ui.newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        
        // Continue (disabled if no save)
        if (this.ui.continueBtn) {
            this.ui.continueBtn.disabled = true;
        }
        
        // Settings
        if (this.ui.settingsBtn) {
            this.ui.settingsBtn.addEventListener('click', () => {
                // For now, just show notification
                this.showNotification("Neural settings panel coming soon", 3000);
            });
        }
        
        // Credits
        if (this.ui.creditsBtn) {
            this.ui.creditsBtn.addEventListener('click', () => {
                this.showNotification("Echoes of the Forest - Created with Three.js", 3000);
            });
        }
    }
    
    startNewGame() {
        console.log("🎮 Starting new game...");
        
        this.hideMainMenu();
        
        // Reset game state
        this.resetGameState();
        
        // Start game
        this.startGame();
    }
    
    resetGameState() {
        // Reset player stats
        this.player = {
            health: 100,
            sanity: 100,
            stamina: 100,
            hunger: 100,
            thirst: 100,
            forestConnection: 0,
            memoryClarity: 0,
            soundAwareness: 25,
            wolfUnderstanding: 0,
            deceptionResistance: 0,
            position: new THREE.Vector3(0, 1.7, 5),
            velocity: new THREE.Vector3(),
            rotation: { x: 0, y: 0 },
            isMoving: false,
            isSprinting: false,
            isCrouching: false,
            isHidden: false
        };
        
        // Reset neural network
        this.neural = {
            connections: 0,
            maxConnections: 1000,
            learningRate: 0.1,
            patterns: new Map(),
            memoryFragments: [],
            totalFragments: 12,
            forestConsciousness: {
                awareness: 0,
                mood: 'neutral',
                trust: 50,
                deceptionChance: 0.3,
                lastInteraction: 0
            }
        };
        
        // Reset memory system
        this.memorySystem.collectedFragments = 0;
        this.memorySystem.fragments.forEach(memory => {
            memory.collected = false;
            memory.clarity = 0;
            
            // Re-add crystals to scene
            if (memory.crystal && !this.scene.getObjectById(memory.crystal.id)) {
                this.scene.add(memory.crystal);
            }
        });
        
        // Reset wolves
        this.wolfSystem.packs.forEach(wolf => {
            // Random new position
            wolf.position.set(
                (Math.random() - 0.5) * 150,
                0,
                (Math.random() - 0.5) * 150
            );
            wolf.state = 'idle';
        });
        
        // Reset time
        this.gameState.gameTime = 0;
        this.gameState.memoryTime = 0;
        
        console.log("🔄 Game state reset");
    }
    
    startGame() {
        console.log("🚀 Game started!");
        
        // Show game elements
        this.ui.gameCanvas.classList.add('active');
        this.ui.gameUI.classList.remove('screen-hidden');
        this.ui.gameUI.classList.add('screen-visible');
        
        // Start game systems
        this.gameState.isRunning = true;
        
        // Request pointer lock
        setTimeout(() => {
            if (this.ui.gameCanvas) {
                this.ui.gameCanvas.requestPointerLock();
            }
        }, 500);
        
        // Show welcome message
        this.showNotification("The forest awakens. It remembers...", 5000);
        this.playSound('ui');
        
        // Start game loop
        this.gameLoop();
    }
    
    pauseGame() {
        console.log("⏸️ Game paused");
        
        this.gameState.isPaused = true;
        
        // Update pause menu stats
        if (this.ui.pauseTime) {
            const minutes = Math.floor(this.gameState.gameTime / 60);
            const seconds = Math.floor(this.gameState.gameTime % 60);
            this.ui.pauseTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.ui.pauseNeural) {
            this.ui.pauseNeural.textContent = this.neural.connections;
        }
        
        // Show pause menu
        this.ui.pauseMenu.classList.remove('screen-hidden');
        this.ui.pauseMenu.classList.add('screen-visible');
        
        // Hide game UI
        this.ui.gameUI.classList.remove('screen-visible');
        this.ui.gameUI.classList.add('screen-hidden');
        
        // Exit pointer lock
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
        
        // Initialize pause menu buttons
        this.initPauseMenuButtons();
    }
    
    initPauseMenuButtons() {
        // Resume
        if (this.ui.pauseResume) {
            this.ui.pauseResume.onclick = () => this.resumeGame();
        }
        
        // Settings
        if (this.ui.pauseSettings) {
            this.ui.pauseSettings.onclick = () => {
                this.showNotification("Neural settings panel coming soon", 3000);
            };
        }
        
        // Quit
        if (this.ui.pauseQuit) {
            this.ui.pauseQuit.onclick = () => this.quitToMenu();
        }
    }
    
    resumeGame() {
        console.log("▶️ Resuming game");
        
        this.gameState.isPaused = false;
        
        // Hide pause menu
        this.ui.pauseMenu.classList.remove('screen-visible');
        this.ui.pauseMenu.classList.add('screen-hidden');
        
        // Show game UI
        this.ui.gameUI.classList.remove('screen-hidden');
        this.ui.gameUI.classList.add('screen-visible');
        
        // Request pointer lock
        if (this.ui.gameCanvas) {
            this.ui.gameCanvas.requestPointerLock();
        }
    }
    
    quitToMenu() {
        console.log("🚪 Quitting to menu");
        
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        this.gameState.isInMemory = false;
        
        // Hide all game screens
        this.ui.gameCanvas.classList.remove('active');
        this.ui.gameUI.classList.remove('screen-visible');
        this.ui.gameUI.classList.add('screen-hidden');
        this.ui.pauseMenu.classList.remove('screen-visible');
        this.ui.pauseMenu.classList.add('screen-hidden');
        this.ui.memoryInterface.classList.remove('screen-visible');
        this.ui.memoryInterface.classList.add('screen-hidden');
        
        // Show main menu
        this.showMainMenu();
    }
    
    // ===============================
    // GAME LOOP
    // ===============================
    
    gameLoop() {
        if (!this.gameState.isRunning) return;
        
        const delta = this.clock.getDelta();
        this.gameState.gameTime += delta;
        
        // Update performance monitoring
        this.updatePerformance(delta);
        
        // Update systems if not paused
        if (!this.gameState.isPaused && !this.gameState.isInMemory && !this.gameState.isInMenu) {
            // Update player
            this.updatePlayer(delta);
            this.updateCamera();
            
            // Update stats
            this.updateStats(delta);
            
            // Update wolves
            this.updateWolves(delta);
            
            // Update neural network
            this.updateNeuralNetwork(delta);
            
            // Update UI
            this.updateUI();
            
            // Check interactions
            this.updateCrosshairContext();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue loop
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
        }
    }
}

// ===============================
// GAME STARTUP
// ===============================

// Wait for everything to load
window.addEventListener('load', function() {
    console.log("🌲 Echoes of the Forest - Loading...");
    
    // Check for Three.js
    if (typeof THREE === 'undefined') {
        console.error("❌ Three.js not found!");
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = 'ERROR: Three.js library not loaded';
        }
        return;
    }
    
    // Initialize game
    setTimeout(function() {
        try {
            const game = new EchoesOfTheForest();
            window.game = game; // Make available for debugging
            
            // Add emergency button handler
            const emergencyBtn = document.getElementById('emergency-skip');
            if (emergencyBtn) {
                emergencyBtn.addEventListener('click', function() {
                    game.emergencyLoad();
                });
            }
            
        } catch (error) {
            console.error("❌ Game initialization failed:", error);
            const progressText = document.getElementById('progress-text');
            if (progressText) {
                progressText.textContent = 'Initialization failed: ' + error.message;
            }
        }
    }, 100);
});

// Handle page visibility
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.game) {
        // Auto-pause when tab loses focus
        if (window.game.gameState.isRunning && !window.game.gameState.isPaused) {
            window.game.pauseGame();
        }
    }
});
