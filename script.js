// =========================================================
// EARS OF THE FOREST - FIXED LOADING VERSION
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
        this.wolves = [];
        this.berries = [];
        this.mushrooms = [];
        this.sticks = [];
        this.flashlight = null;
        this.sunLight = null;
        
        // Weather system
        this.weather = {
            isRaining: false,
            temperature: 20,
            timeOfDay: 16,
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
            wolvesEncountered: 0,
            itemsCollected: 0
        };
        
        // Wolf AI timers
        this.wolfEvents = {
            firstChase: false,
            timer: 0
        };
        
        // UI elements cache
        this.ui = {};
        
        // Audio
        this.audioEnabled = true;
        
        // Messages
        this.messages = [];
        this.maxMessages = 10;
        
        // Cutscene state
        this.currentCutscene = null;
        
        // Loading state
        this.loadingProgress = 0;
    }
    
    // ===============================
    // INITIALIZATION (FIXED LOADING)
    // ===============================
    
    init() {
        console.log("🎮 Starting game...");
        this.updateLoadingProgress("Checking dependencies...", 10);
        
        // First, check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            this.updateLoadingProgress("ERROR: Three.js not loaded!", 100);
            setTimeout(() => {
                alert("Three.js failed to load. Please check your internet connection and refresh.");
            }, 1000);
            return;
        }
        
        // Start loading in steps
        this.loadStep1();
    }
    
    loadStep1() {
        this.updateLoadingProgress("Initializing graphics engine...", 20);
        
        try {
            this.initThreeJS();
            setTimeout(() => this.loadStep2(), 300);
        } catch (error) {
            console.error("Step 1 failed:", error);
            this.updateLoadingProgress("Graphics initialization failed", 100);
        }
    }
    
    loadStep2() {
        this.updateLoadingProgress("Creating 3D world...", 40);
        
        try {
            this.initWorld();
            setTimeout(() => this.loadStep3(), 300);
        } catch (error) {
            console.error("Step 2 failed:", error);
            this.updateLoadingProgress("World creation failed", 100);
        }
    }
    
    loadStep3() {
        this.updateLoadingProgress("Setting up game systems...", 60);
        
        try {
            this.initUI();
            setTimeout(() => this.loadStep4(), 300);
        } catch (error) {
            console.error("Step 3 failed:", error);
            this.updateLoadingProgress("UI setup failed", 100);
        }
    }
    
    loadStep4() {
        this.updateLoadingProgress("Configuring controls...", 80);
        
        try {
            this.initInput();
            setTimeout(() => this.loadStep5(), 300);
        } catch (error) {
            console.error("Step 4 failed:", error);
            this.updateLoadingProgress("Input setup failed", 100);
        }
    }
    
    loadStep5() {
        this.updateLoadingProgress("Finalizing...", 95);
        
        try {
            setTimeout(() => {
                this.updateLoadingProgress("Ready to play!", 100);
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showCutscene('start');
                }, 500);
            }, 300);
        } catch (error) {
            console.error("Step 5 failed:", error);
            this.updateLoadingProgress("Finalization failed", 100);
        }
    }
    
    updateLoadingProgress(text, percent) {
        console.log(`Loading: ${text} (${percent}%)`);
        
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingTip = document.getElementById('loading-tip');
        
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
            "Find your way out of the forest"
        ];
        
        if (loadingTip && percent % 25 === 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            loadingTip.textContent = `Tip: ${randomTip}`;
        }
        
        this.loadingProgress = percent;
    }
    
    hideLoadingScreen() {
        console.log("Hiding loading screen...");
        
        const loadingScreen = document.getElementById('loading-screen');
        const canvas = document.getElementById('gameCanvas');
        const gameUI = document.getElementById('game-ui');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        if (canvas) {
            canvas.style.display = 'block';
        }
        
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }
    
    initThreeJS() {
        console.log("Initializing Three.js...");
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x001a00);
            this.scene.fog = new THREE.Fog(0x001a00, 10, 150);
            
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
            if (!canvas) {
                throw new Error("Canvas element not found!");
            }
            
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            
            // Create clock
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            console.log("Three.js initialized successfully!");
            
        } catch (error) {
            console.error("Three.js initialization error:", error);
            throw error;
        }
    }
    
    initWorld() {
        console.log("Creating world...");
        
        try {
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
            this.scene.add(ambientLight);
            
            this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
            this.sunLight.position.set(100, 200, 100);
            this.sunLight.castShadow = true;
            this.scene.add(this.sunLight);
            
            // Ground
            const groundGeometry = new THREE.PlaneGeometry(200, 200);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2d5a27,
                roughness: 0.9
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -1;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Trees
            for (let i = 0; i < 20; i++) {
                const x = (Math.random() - 0.5) * 180;
                const z = (Math.random() - 0.5) * 180;
                
                if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
                
                // Trunk
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.6, 5, 8),
                    new THREE.MeshStandardMaterial({ color: 0x4a2e1f })
                );
                trunk.position.set(x, 2.5, z);
                trunk.castShadow = true;
                this.scene.add(trunk);
                
                // Leaves
                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 8, 8),
                    new THREE.MeshStandardMaterial({ color: 0x2f5f2f })
                );
                leaves.position.set(x, 6, z);
                leaves.castShadow = true;
                this.scene.add(leaves);
                
                this.trees.push({ trunk, leaves, position: new THREE.Vector3(x, 0, z) });
            }
            
            // Berries
            for (let i = 0; i < 8; i++) {
                const x = (Math.random() - 0.5) * 150;
                const z = (Math.random() - 0.5) * 150;
                
                const berryGeometry = new THREE.SphereGeometry(0.2, 6, 6);
                const berryMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
                const berry = new THREE.Mesh(berryGeometry, berryMaterial);
                berry.position.set(x, 0.2, z);
                
                this.scene.add(berry);
                this.berries.push({
                    mesh: berry,
                    position: new THREE.Vector3(x, 0, z),
                    collected: false
                });
            }
            
            // Mushrooms
            for (let i = 0; i < 6; i++) {
                const x = (Math.random() - 0.5) * 150;
                const z = (Math.random() - 0.5) * 150;
                
                const mushroomGeometry = new THREE.ConeGeometry(0.15, 0.3, 6);
                const isPoisonous = Math.random() < 0.3;
                const mushroomMaterial = new THREE.MeshStandardMaterial({ 
                    color: isPoisonous ? 0x9900ff : 0xffaa00
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
            
            // Wolves
            for (let i = 0; i < 2; i++) {
                const x = (Math.random() - 0.5) * 100;
                const z = (Math.random() - 0.5) * 100;
                
                const wolfGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
                const wolfMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
                const wolf = new THREE.Mesh(wolfGeometry, wolfMaterial);
                wolf.position.set(x, 0.4, z);
                wolf.castShadow = true;
                
                this.scene.add(wolf);
                this.wolves.push({
                    mesh: wolf,
                    position: new THREE.Vector3(x, 0, z),
                    target: new THREE.Vector3(x, 0, z),
                    speed: 2,
                    health: 50,
                    attackCooldown: 0
                });
            }
            
            // Flashlight
            this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.5, 1);
            this.flashlight.position.set(0, 1.5, 0);
            this.flashlight.target.position.set(0, 0, -10);
            this.camera.add(this.flashlight);
            this.camera.add(this.flashlight.target);
            
            console.log("World created successfully!");
            
        } catch (error) {
            console.error("World creation error:", error);
            throw error;
        }
    }
    
    initUI() {
        console.log("Initializing UI...");
        
        try {
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
                messageLog: document.getElementById('message-log')
            };
            
            console.log("UI initialized successfully!");
            
        } catch (error) {
            console.error("UI initialization error:", error);
            throw error;
        }
    }
    
    initInput() {
        console.log("Initializing input...");
        
        try {
            const canvas = document.getElementById('gameCanvas');
            
            // Pointer lock
            canvas.addEventListener('click', () => {
                if (!this.isPaused && !this.isInCutscene) {
                    canvas.requestPointerLock();
                }
            });
            
            document.addEventListener('pointerlockchange', () => {
                this.isPointerLocked = document.pointerLockElement === canvas;
                console.log("Pointer lock:", this.isPointerLocked ? "ON" : "OFF");
            });
            
            // Mouse look
            document.addEventListener('mousemove', (e) => {
                if (!this.isPointerLocked || this.isPaused || this.isInCutscene) return;
                
                this.cameraRotation.x += e.movementY * this.sensitivity;
                this.cameraRotation.y += e.movementX * this.sensitivity;
                
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
            const audioToggle = document.getElementById('audio-toggle');
            if (audioToggle) {
                audioToggle.addEventListener('click', () => {
                    this.audioEnabled = !this.audioEnabled;
                    audioToggle.textContent = this.audioEnabled ? '🔊' : '🔇';
                });
            }
            
            // Pause menu buttons
            const resumeBtn = document.getElementById('resume-btn');
            const restartBtn = document.getElementById('restart-btn');
            const menuBtn = document.getElementById('menu-btn');
            
            if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeGame());
            if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
            if (menuBtn) menuBtn.addEventListener('click', () => this.quitToMenu());
            
            // End screen buttons
            const endRestartBtn = document.getElementById('end-restart-btn');
            const endMenuBtn = document.getElementById('end-menu-btn');
            
            if (endRestartBtn) endRestartBtn.addEventListener('click', () => this.restartGame());
            if (endMenuBtn) endMenuBtn.addEventListener('click', () => this.quitToMenu());
            
            console.log("Input initialized successfully!");
            
        } catch (error) {
            console.error("Input initialization error:", error);
            throw error;
        }
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
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        this.gameTime += delta;
        
        if (!this.isPaused && !this.isInCutscene) {
            this.updatePlayer(delta);
            this.updateCamera();
            this.updateStats(delta);
            this.updateWolves(delta);
            this.updateWorld(delta);
            this.checkEvents();
            this.updateUI();
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer(delta) {
        // Movement speed
        let targetSpeed = this.player.movementSpeed;
        if (this.input.crouch) {
            targetSpeed = this.player.crouchSpeed;
            this.player.isCrouching = true;
        } else {
            this.player.isCrouching = false;
            if (this.input.sprint && this.player.stamina > 0) {
                targetSpeed = this.player.sprintSpeed;
            }
        }
        
        this.player.currentSpeed += (targetSpeed - this.player.currentSpeed) * 10 * delta;
        
        // Movement direction
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(this.camera.up, forward).normalize();
        
        this.player.velocity.set(0, 0, 0);
        
        if (this.input.forward) this.player.velocity.addScaledVector(forward, this.player.currentSpeed);
        if (this.input.backward) this.player.velocity.addScaledVector(forward, -this.player.currentSpeed);
        if (this.input.left) this.player.velocity.addScaledVector(right, -this.player.currentSpeed);
        if (this.input.right) this.player.velocity.addScaledVector(right, this.player.currentSpeed);
        
        // Gravity
        if (!this.player.onGround) {
            this.player.velocity.y -= 20 * delta;
        }
        
        // Jump
        if (this.keys['Space'] && this.player.onGround && this.player.stamina > 10) {
            this.player.velocity.y = 8;
            this.player.onGround = false;
            this.player.stamina -= 10;
        }
        
        // Move player
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Ground check
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Keep in bounds
        const bounds = 95;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));
    }
    
    updateStats(delta) {
        // Stamina
        if (this.input.sprint && this.player.stamina > 0 && 
            (this.input.forward || this.input.backward || this.input.left || this.input.right)) {
            this.player.stamina -= 20 * delta;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 10 * delta;
        }
        this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, this.player.stamina));
        
        // Battery
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 5 * delta;
            if (this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
            if (this.player.battery <= 0) {
                this.input.flashlight = false;
                if (this.flashlight) this.flashlight.intensity = 0;
                this.showNotification("Flashlight dead!");
            }
        }
        this.player.battery = Math.max(0, Math.min(this.player.maxBattery, this.player.battery));
        
        // Hunger
        this.player.hunger -= 0.2 * delta;
        if (this.input.sprint) this.player.hunger -= 0.1 * delta;
        this.player.hunger = Math.max(0, this.player.hunger);
        
        // Thirst
        this.player.thirst -= 0.3 * delta;
        if (this.input.sprint) this.player.thirst -= 0.2 * delta;
        this.player.thirst = Math.max(0, this.player.thirst);
        
        // Temperature
        this.player.temperature -= 0.05 * delta;
        if (this.weather.isRaining) this.player.temperature -= 0.1 * delta;
        this.player.temperature = Math.max(35, Math.min(40, this.player.temperature));
        
        // Fear
        this.player.fear += 0.5 * delta;
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Health effects
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
        
        if (this.player.health <= 0) {
            this.triggerBadEnding();
        }
    }
    
    updateWolves(delta) {
        this.wolfEvents.timer += delta;
        
        // First wolf event at 1 minute
        if (!this.wolfEvents.firstChase && this.wolfEvents.timer > 60) {
            this.wolfEvents.firstChase = true;
            this.addMessage("You hear a wolf howl in the distance...");
        }
        
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            
            if (distance < 20) {
                // Chase player
                const direction = new THREE.Vector3()
                    .subVectors(this.player.position, wolf.position)
                    .normalize();
                
                wolf.position.addScaledVector(direction, wolf.speed * delta);
                wolf.mesh.position.copy(wolf.position);
                wolf.mesh.position.y = 0.4;
                
                // Attack
                if (distance < 2) {
                    wolf.attackCooldown -= delta;
                    if (wolf.attackCooldown <= 0) {
                        this.player.health -= 15;
                        wolf.attackCooldown = 2;
                        this.showDamageFlash();
                        this.addMessage("A wolf attacks you!");
                        this.story.wolvesEncountered++;
                    }
                }
            }
        }
    }
    
    updateWorld(delta) {
        // Update weather time
        this.weather.timeOfDay = (this.weather.timeOfDay + delta / 120) % 24;
        
        // Random weather changes
        if (Math.random() < 0.001) {
            this.weather.isRaining = !this.weather.isRaining;
            this.addMessage(this.weather.isRaining ? "It starts to rain..." : "The rain stops");
        }
    }
    
    checkEvents() {
        // Escape condition (reach edge of map)
        if (this.player.position.z < -90) {
            this.triggerGoodEnding();
        }
    }
    
    updateCamera() {
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        this.camera.position.copy(this.player.position);
    }
    
    // ===============================
    // UI UPDATES
    // ===============================
    
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
        const medkitsEl = document.getElementById('inventory-medkits');
        const batteriesEl = document.getElementById('inventory-batteries');
        const berriesEl = document.getElementById('inventory-berries');
        const mushroomsEl = document.getElementById('inventory-mushrooms');
        const sticksEl = document.getElementById('inventory-sticks');
        const batteryEl = document.getElementById('inventory-battery');
        
        if (medkitsEl) medkitsEl.textContent = this.inventory.medkits;
        if (batteriesEl) batteriesEl.textContent = this.inventory.batteries;
        if (berriesEl) berriesEl.textContent = this.inventory.berries;
        if (mushroomsEl) mushroomsEl.textContent = this.inventory.mushrooms;
        if (sticksEl) sticksEl.textContent = this.inventory.sticks;
        if (batteryEl) batteryEl.textContent = Math.round(this.player.battery) + '%';
        
        // Update fear overlay
        const fearOverlay = document.getElementById('fear-overlay');
        if (fearOverlay) {
            fearOverlay.style.opacity = (this.player.fear / 100) * 0.3;
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
        messageElement.textContent = text;
        
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
    // GAME ACTIONS
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
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
            this.inventory.medkits--;
            this.showNotification("Used medkit: +40 health");
            this.addMessage("Applied medical treatment");
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 50);
            this.inventory.batteries--;
            this.showNotification("Used battery: +50%");
            this.addMessage("Flashlight recharged");
            if (this.input.flashlight && this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
        }
    }
    
    eatBerries() {
        if (this.inventory.berries > 0) {
            const berriesToEat = Math.min(3, this.inventory.berries);
            this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + berriesToEat * 15);
            this.inventory.berries -= berriesToEat;
            this.showNotification(`Ate ${berriesToEat} berries: +${berriesToEat * 15} hunger`);
            this.addMessage("Berries satisfy your hunger");
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
        }
    }
    
    drinkWater() {
        this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 30);
        this.showNotification("Drank water: +30 thirst");
        this.addMessage("Water refreshes you");
    }
    
    interact() {
        const playerPos = this.player.position;
        
        // Check berries
        for (const berry of this.berries) {
            if (berry.collected) continue;
            const distance = playerPos.distanceTo(berry.position);
            if (distance < 2) {
                berry.collected = true;
                this.scene.remove(berry.mesh);
                const collectedCount = 2 + Math.floor(Math.random() * 2);
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
        
        this.showNotification("Nothing to interact with here");
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
                }, 7000);
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
    
    // ===============================
    // ENDINGS
    // ===============================
    
    triggerGoodEnding() {
        this.isRunning = false;
        this.showEnding("GOOD ENDING", "You escaped the forest! You and your friend celebrate at home, grateful to have survived the nightmare forest.", "#4CAF50");
    }
    
    triggerBadEnding() {
        this.isRunning = false;
        this.showEnding("BAD ENDING", "The wolves were too many... They surrounded you and your friend. The last thing you heard were the screams...", "#f44336");
    }
    
    triggerSecretEnding() {
        this.isRunning = false;
        this.showEnding("SECRET ENDING", "You found the Heartseed Tree... It spoke to you, showed you the forest's memories. You felt its pain, its loneliness. Slowly, you became one with the forest...", "#8BC34A");
    }
    
    showEnding(title, message, color) {
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
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
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
        location.reload();
    }
}

// ===============================
// START GAME
// ===============================

// Start when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game...");
    
    // Check if Three.js loaded
    if (typeof THREE === 'undefined') {
        console.error("Three.js not loaded!");
        document.getElementById('loading-text').textContent = "ERROR: Three.js failed to load!";
        document.getElementById('progress-bar').style.width = '100%';
        return;
    }
    
    // Create game instance
    try {
        const game = new EarsOfTheForest();
        window.game = game; // Make accessible
        
        // Start game
        game.init();
    } catch (error) {
        console.error("Game initialization failed:", error);
        document.getElementById('loading-text').textContent = "Game failed to start! Check console.";
        document.getElementById('progress-bar').style.width = '100%';
    }
});
