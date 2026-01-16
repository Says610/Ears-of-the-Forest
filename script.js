/* =========================================================
   EARS OF THE FOREST - COMPLETE GAME (FAST LOADING)
========================================================= */

// Simple audio system without external dependencies
class SimpleAudio {
    constructor() {
        this.enabled = true;
        this.masterVolume = 0.7;
        this.context = null;
        this.sounds = {};
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log("✅ Simple audio system initialized");
        } catch (e) {
            console.log("⚠️ Web Audio API not supported, continuing without audio");
            this.enabled = false;
        }
        return this;
    }
    
    createSound(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return null;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = this.masterVolume;
        
        return { oscillator, gainNode, start: () => oscillator.start(), stop: () => oscillator.stop() };
    }
    
    playBeep(frequency = 440, duration = 0.1) {
        if (!this.enabled || !this.context) return;
        
        const sound = this.createSound(frequency, duration);
        if (sound) {
            sound.start();
            sound.oscillator.stop(this.context.currentTime + duration);
        }
    }
    
    playHeartbeat(rate = 60) {
        if (!this.enabled || !this.context) return null;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 60;
        
        // Create heartbeat pattern
        const interval = 60 / rate;
        
        const startHeartbeat = () => {
            const now = this.context.currentTime;
            
            // Beat pattern: two quick beats
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            
            gainNode.gain.setValueAtTime(0, now + 0.15);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
        };
        
        oscillator.start();
        
        // Schedule beats
        let timer = setInterval(startHeartbeat, interval * 1000);
        
        return {
            stop: () => {
                clearInterval(timer);
                oscillator.stop();
            },
            setRate: (newRate) => {
                clearInterval(timer);
                rate = newRate;
                interval = 60 / rate;
                timer = setInterval(startHeartbeat, interval * 1000);
            }
        };
    }
}

// Main Game Class
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
        this.timeOfDay = 0.25;
        
        // Camera controls
        this.cameraRotation = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        
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
            velocity: new THREE.Vector3(),
            onGround: true,
            movementSpeed: 5,
            sprintSpeed: 10,
            crouchSpeed: 2,
            currentSpeed: 5,
            isCrouching: false
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
            exploredCave: false,
            heartseedFound: false
        };
        
        // Inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            sticks: 0,
            cloth: 0
        };
        
        // World objects
        this.trees = [];
        this.wolves = [];
        this.flashlight = null;
        this.sunLight = null;
        
        // Audio
        this.audio = new SimpleAudio();
        this.heartbeatSound = null;
        
        // UI elements cache
        this.ui = {
            healthFill: null,
            staminaFill: null,
            fearFill: null,
            batteryText: null,
            timeText: null
        };
        
        // Game events
        this.timedEvents = [
            { time: 180, triggered: false, type: 'firstWolf' },
            { time: 300, triggered: false, type: 'wolfPack' }
        ];
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    async init() {
        console.log("🎮 Initializing Ears of the Forest...");
        
        // Quick loading - no delays
        this.updateLoadingProgress("Loading engine...", 20);
        
        // Initialize Three.js immediately
        this.initThreeJS();
        this.updateLoadingProgress("Creating world...", 40);
        
        // Initialize audio (non-blocking)
        setTimeout(() => this.audio.init(), 100);
        this.updateLoadingProgress("Setting up audio...", 60);
        
        // Build game world
        this.initWorld();
        this.updateLoadingProgress("Building environment...", 80);
        
        // Initialize UI
        this.initUI();
        this.updateLoadingProgress("Finalizing...", 95);
        
        // Initialize input
        this.initInput();
        
        // Start immediately
        setTimeout(() => {
            this.hideLoadingScreen();
            this.startOpeningCutscene();
            console.log("✅ Game loaded in under 3 seconds");
        }, 100);
    }
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (loadingText) loadingText.textContent = text;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const canvas = document.getElementById('game-canvas');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
    }
    
    // ===============================
    // THREE.JS INITIALIZATION
    // ===============================
    
    initThreeJS() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x001a00);
            this.scene.fog = new THREE.FogExp2(0x001a00, 0.01);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.copy(this.player.position);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('game-canvas'),
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Create clock
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
        } catch (error) {
            console.error("❌ Three.js initialization failed:", error);
        }
    }
    
    // ===============================
    // GAME WORLD
    // ===============================
    
    initWorld() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
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
        
        // Create trees
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
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
            
            this.trees.push({
                trunk,
                leaves,
                position: new THREE.Vector3(x, 0, z)
            });
        }
        
        // Create path
        const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5a3a });
        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 100),
            pathMaterial
        );
        path.rotation.x = -Math.PI / 2;
        path.position.y = -0.9;
        this.scene.add(path);
        
        // Create flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Create wolves
        this.createWolves(3);
    }
    
    createWolves(count) {
        const wolfMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.8, 2.5),
                wolfMaterial
            );
            body.position.set(x, 0.4, z);
            body.castShadow = true;
            this.scene.add(body);
            
            this.wolves.push({
                body,
                position: new THREE.Vector3(x, 0, z),
                speed: 2,
                state: 'idle'
            });
        }
    }
    
    // ===============================
    // UI INITIALIZATION
    // ===============================
    
    initUI() {
        const uiHTML = `
            <!-- Health Display -->
            <div class="health-container">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #ff4444; font-size: 1rem;">❤️</span>
                    <span style="font-weight: bold; color: white;">HEALTH</span>
                </div>
                <div class="health-bar">
                    <div class="health-fill" id="health-fill"></div>
                </div>
                <div id="health-text" style="text-align: center; margin-top: 3px; font-size: 0.9rem; color: #ff4444;">100</div>
            </div>
            
            <!-- Stamina Display -->
            <div class="stamina-container">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #ffaa00; font-size: 1rem;">⚡</span>
                    <span style="font-weight: bold; color: white;">STAMINA</span>
                </div>
                <div class="stamina-bar">
                    <div class="stamina-fill" id="stamina-fill"></div>
                </div>
            </div>
            
            <!-- Fear Display -->
            <div class="fear-container">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #aa44ff; font-size: 1rem;">😨</span>
                    <span style="font-weight: bold; color: white;">FEAR</span>
                </div>
                <div class="fear-bar">
                    <div class="fear-fill" id="fear-fill"></div>
                </div>
            </div>
            
            <!-- Battery Display -->
            <div class="battery-container">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <span style="font-weight: bold; color: white;">FLASHLIGHT</span>
                    <span style="color: #44aaff; font-size: 1rem;">🔦</span>
                </div>
                <div id="battery-text" style="font-size: 1.2rem; font-weight: bold; color: #44aaff; margin-top: 3px;">100%</div>
            </div>
            
            <!-- Time Display -->
            <div class="time-container">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <span style="font-weight: bold; color: white;">TIME</span>
                    <span style="color: #4CAF50; font-size: 1rem;">🕐</span>
                </div>
                <div id="time-text" style="font-size: 1.2rem; font-weight: bold; color: #4CAF50; margin-top: 3px;">00:00</div>
            </div>
            
            <!-- Inventory Display -->
            <div class="inventory-container">
                <div style="color: #ffaa44; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem;">INVENTORY</div>
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
            </div>
            
            <!-- Objective Display -->
            <div class="objective-container">
                <span style="color: #4CAF50; font-weight: bold; margin-right: 5px;">OBJECTIVE:</span>
                <span id="objective-text" style="color: #eee;">Find your way out</span>
            </div>
            
            <!-- Crosshair -->
            <div class="crosshair">
                <div class="crosshair-dot"></div>
            </div>
            
            <!-- Notification -->
            <div class="notification" id="notification">
                <div class="notification-text" id="notification-text"></div>
            </div>
        `;
        
        document.getElementById('game-ui').innerHTML = uiHTML;
        
        // Cache UI elements
        this.ui.healthFill = document.getElementById('health-fill');
        this.ui.staminaFill = document.getElementById('stamina-fill');
        this.ui.fearFill = document.getElementById('fear-fill');
        this.ui.batteryText = document.getElementById('battery-text');
        this.ui.timeText = document.getElementById('time-text');
        this.ui.notification = document.getElementById('notification');
        this.ui.notificationText = document.getElementById('notification-text');
    }
    
    // ===============================
    // INPUT SYSTEM
    // ===============================
    
    initInput() {
        const canvas = document.getElementById('game-canvas');
        
        // Pointer lock on click
        canvas.addEventListener('click', () => {
            if (!this.isInCutscene && !this.isPaused) {
                canvas.requestPointerLock();
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.isPaused || this.isInCutscene) return;
            
            this.cameraRotation.x += e.movementY * this.sensitivity;
            this.cameraRotation.y += e.movementX * this.sensitivity;
            
            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.updateInputState();
            
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
                    case 'Escape':
                        this.togglePause();
                        break;
                }
            }
            
            if (e.code === 'Escape' && this.isInCutscene) {
                this.skipCutscene();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.updateInputState();
        });
        
        // Audio toggle
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.audio.enabled = !this.audio.enabled;
            document.getElementById('audio-toggle').textContent = this.audio.enabled ? '🔊' : '🔇';
        });
    }
    
    updateInputState() {
        this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'];
        this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
        this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'];
        this.input.sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        this.input.crouch = this.keys['KeyC'];
        this.input.jump = this.keys['Space'];
    }
    
    // ===============================
    // CUTSCENE SYSTEM
    // ===============================
    
    startOpeningCutscene() {
        this.isInCutscene = true;
        
        const cutscenes = [
            { text: "The school bus arrives at the forest...", color: "#1a2980" },
            { text: "You and Alex are excited for the field trip!", color: "#4A00E0" },
            { text: "Ancient trees tower above you...", color: "#3a7bd5" },
            { text: "You wander off the path, exploring deeper...", color: "#f46b45" },
            { text: "The trees seem to watch you...", color: "#834d9b" },
            { text: "Wait... which way is back?", color: "#2c3e50" },
            { text: "It's getting darker...", color: "#1e3c72" },
            { text: "You hear a distant howl...", color: "#232526" },
            { text: "Find your way out. Watch for wolves.", color: "#000000" }
        ];
        
        this.playVisualCutscene(cutscenes, () => {
            this.endCutscene();
            this.startGame();
        });
    }
    
    playVisualCutscene(scenes, onComplete) {
        const container = document.getElementById('storyboard-container');
        const skipBtn = document.getElementById('skip-cutscene-btn');
        const progressBar = document.getElementById('storyboard-progress-bar');
        
        container.style.display = 'block';
        skipBtn.style.display = 'block';
        
        let currentScene = 0;
        
        const showScene = () => {
            if (currentScene >= scenes.length) {
                container.style.display = 'none';
                skipBtn.style.display = 'none';
                onComplete();
                return;
            }
            
            const scene = scenes[currentScene];
            
            container.innerHTML = `
                <div class="storyboard-scene active">
                    <div class="storyboard-image" style="background: ${scene.color};"></div>
                    <div class="storyboard-text">${scene.text}</div>
                    <div class="storyboard-continue">Click to continue</div>
                </div>
                ${container.innerHTML}
            `;
            
            // Update progress
            const progress = ((currentScene + 1) / scenes.length) * 100;
            progressBar.style.width = `${progress}%`;
            
            currentScene++;
            
            // Auto-advance after 3 seconds
            setTimeout(() => {
                if (currentScene <= scenes.length) {
                    showScene();
                }
            }, 3000);
        };
        
        // Click to advance
        container.addEventListener('click', showScene);
        
        // Skip button
        skipBtn.onclick = () => {
            container.style.display = 'none';
            skipBtn.style.display = 'none';
            onComplete();
        };
        
        // Start first scene
        showScene();
    }
    
    skipCutscene() {
        document.getElementById('storyboard-container').style.display = 'none';
        document.getElementById('skip-cutscene-btn').style.display = 'none';
        this.isInCutscene = false;
        
        if (!this.isRunning) {
            this.startGame();
        }
    }
    
    endCutscene() {
        this.isInCutscene = false;
    }
    
    // ===============================
    // GAME LOOP
    // ===============================
    
    startGame() {
        console.log("🎮 Starting game...");
        this.isRunning = true;
        
        // Start heartbeat sound
        if (this.audio.enabled) {
            this.heartbeatSound = this.audio.playHeartbeat(60);
        }
        
        this.showNotification("You're lost in the forest. Find your way out!");
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        
        // Update game time
        this.gameTime += delta;
        
        if (!this.isPaused && !this.isInCutscene) {
            // Update camera
            this.updateCamera(delta);
            
            // Update player
            this.updatePlayer(delta);
            
            // Update stats
            this.updateStats(delta);
            
            // Update wolves
            this.updateWolves(delta);
            
            // Update timed events
            this.updateTimedEvents();
            
            // Update UI
            this.updateUI();
        }
        
        // Update day/night cycle
        this.updateDayNightCycle(delta);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateCamera(delta) {
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        this.camera.position.copy(this.player.position);
    }
    
    updatePlayer(delta) {
        // Determine speed
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
        
        // Calculate movement
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(this.camera.up, forward).normalize();
        
        this.player.velocity.x = 0;
        this.player.velocity.z = 0;
        
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
        
        // Jump
        if (this.input.jump && this.player.onGround) {
            this.player.velocity.y = 7;
            this.player.onGround = false;
        }
        
        // Apply movement
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Keep above ground
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Keep within bounds
        const bounds = 95;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));
    }
    
    updateStats(delta) {
        // Stamina
        if (this.input.sprint && this.player.stamina > 0 && 
            (this.input.forward || this.input.backward || this.input.left || this.input.right)) {
            this.player.stamina -= 30 * delta;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 15 * delta;
        }
        this.player.stamina = Math.max(0, Math.min(this.player.maxStamina, this.player.stamina));
        
        // Battery
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 8 * delta;
            if (this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
            if (this.player.battery <= 0) {
                this.input.flashlight = false;
                if (this.flashlight) this.flashlight.intensity = 0;
                this.showNotification("Flashlight battery dead!");
            }
        }
        this.player.battery = Math.max(0, Math.min(this.player.maxBattery, this.player.battery));
        
        // Fear
        this.player.fear += 0.8 * delta;
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Update heartbeat
        if (this.heartbeatSound) {
            const heartbeatRate = 60 + (this.player.fear / 100) * 40;
            this.heartbeatSound.setRate(heartbeatRate);
        }
        
        // Random health drain
        if (Math.random() < 0.001 && this.player.health > 0) {
            this.player.health -= 5;
            this.showDamageFlash();
            if (this.player.health <= 0) {
                this.triggerBadEnding();
            }
        }
        
        // Check for escape (good ending)
        if (this.player.position.z < -90 && !this.isInCutscene) {
            this.triggerGoodEnding();
        }
        
        // Check for secret ending
        if (this.player.position.x > 70 && this.player.fear > 80 && !this.isInCutscene) {
            this.triggerSecretEnding();
        }
    }
    
    updateWolves(delta) {
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            
            if (distance < 20) {
                // Move toward player
                const direction = new THREE.Vector3().subVectors(this.player.position, wolf.position).normalize();
                wolf.position.addScaledVector(direction, wolf.speed * delta);
                wolf.body.position.copy(wolf.position);
            }
            
            // Attack if close
            if (distance < 2) {
                this.player.health -= 10 * delta;
                this.showDamageFlash();
                if (this.player.health <= 0) {
                    this.triggerBadEnding();
                }
            }
        }
    }
    
    updateTimedEvents() {
        this.timedEvents.forEach(event => {
            if (!event.triggered && this.gameTime >= event.time) {
                event.triggered = true;
                switch(event.type) {
                    case 'firstWolf':
                        this.showNotification("You hear a wolf howl in the distance...");
                        this.player.fear += 20;
                        this.audio.playBeep(200, 0.5);
                        break;
                    case 'wolfPack':
                        this.showNotification("Multiple wolves are nearby...");
                        this.player.fear += 30;
                        this.audio.playBeep(150, 0.8);
                        break;
                }
            }
        });
    }
    
    updateDayNightCycle(delta) {
        this.timeOfDay += delta * 0.00005;
        if (this.timeOfDay >= 1) this.timeOfDay = 0;
        
        const sunHeight = Math.sin(this.timeOfDay * Math.PI * 2);
        const sunX = Math.cos(this.timeOfDay * Math.PI * 2) * 200;
        const sunY = Math.sin(this.timeOfDay * Math.PI * 2) * 200;
        
        this.sunLight.position.set(sunX, sunY, 100);
        this.sunLight.intensity = 0.3 + Math.abs(sunHeight) * 0.7;
        
        // Update fog
        const isNight = sunHeight < 0;
        const fogColor = isNight ? 0x0A0A2A : 0x87CEEB;
        this.scene.background = new THREE.Color(fogColor);
        this.scene.fog.color = new THREE.Color(fogColor);
    }
    
    updateUI() {
        // Health
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        this.ui.healthFill.style.width = `${healthPercent}%`;
        document.getElementById('health-text').textContent = Math.round(this.player.health);
        
        // Stamina
        const staminaPercent = (this.player.stamina / this.player.maxStamina) * 100;
        this.ui.staminaFill.style.width = `${staminaPercent}%`;
        
        // Fear
        const fearPercent = (this.player.fear / this.player.maxFear) * 100;
        this.ui.fearFill.style.width = `${fearPercent}%`;
        
        // Battery
        this.ui.batteryText.textContent = `${Math.round(this.player.battery)}%`;
        this.ui.batteryText.style.color = this.player.battery > 20 ? '#44aaff' : 
                                         this.player.battery > 5 ? '#ffaa00' : '#ff4444';
        
        // Time
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        this.ui.timeText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Objective
        const objectiveText = document.getElementById('objective-text');
        if (this.player.position.z < -80) {
            objectiveText.textContent = "You're getting close...";
        } else if (this.player.position.z < -40) {
            objectiveText.textContent = "Follow the path north";
        } else {
            objectiveText.textContent = "Find your way out";
        }
        
        // Inventory
        document.getElementById('inventory-medkits').textContent = this.inventory.medkits;
        document.getElementById('inventory-batteries').textContent = this.inventory.batteries;
        document.getElementById('inventory-sticks').textContent = this.inventory.sticks;
        document.getElementById('inventory-cloth').textContent = this.inventory.cloth;
        
        // Fear overlay
        const fearOverlay = document.getElementById('fear-overlay');
        fearOverlay.style.opacity = (this.player.fear / 100) * 0.3;
        fearOverlay.style.filter = `blur(${(this.player.fear / 100) * 10}px)`;
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
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
            this.inventory.medkits--;
            this.showNotification(`Used medkit: +40 health`);
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 50);
            this.inventory.batteries--;
            this.showNotification(`Used battery: +50% charge`);
            if (this.input.flashlight && this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
        }
    }
    
    showNotification(text, duration = 3000) {
        this.ui.notificationText.textContent = text;
        this.ui.notification.classList.add('show');
        setTimeout(() => this.ui.notification.classList.remove('show'), duration);
    }
    
    showDamageFlash() {
        const flash = document.getElementById('damage-flash');
        flash.style.background = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => flash.style.background = 'rgba(255, 0, 0, 0)', 300);
    }
    
    // ===============================
    // ENDINGS
    // ===============================
    
    triggerGoodEnding() {
        this.isRunning = false;
        if (this.heartbeatSound) this.heartbeatSound.stop();
        
        const scenes = [
            { text: "You see the edge of the forest!", color: "#000428" },
            { text: "The school bus! We made it!", color: "#1a2a6c" },
            { text: "Safe and warm with hot chocolate...", color: "#3a7bd5" },
            { text: "You'll never wander off again!", color: "#4A00E0" },
            { text: "But what a story to tell!", color: "#00b09b" }
        ];
        
        this.playVisualCutscene(scenes, () => {
            this.showEndingScreen("GOOD ENDING", "You escaped the forest safely!", "#4CAF50");
        });
    }
    
    triggerBadEnding() {
        this.isRunning = false;
        if (this.heartbeatSound) this.heartbeatSound.stop();
        
        const scenes = [
            { text: "The wolves surround you...", color: "#23074d" },
            { text: "Their eyes glow in the dark...", color: "#42275a" },
            { text: "There's no escape...", color: "#2c3e50" },
            { text: "The forest claims you...", color: "#000000" }
        ];
        
        this.playVisualCutscene(scenes, () => {
            this.showEndingScreen("BAD ENDING", "The wolves were too many...", "#f44336");
        });
    }
    
    triggerSecretEnding() {
        this.isRunning = false;
        if (this.heartbeatSound) this.heartbeatSound.stop();
        
        const scenes = [
            { text: "You find the Heartseed Tree...", color: "#1a2a6c" },
            { text: "It glows with ancient energy...", color: "#3a1c71" },
            { text: "Welcome, child of the forest...", color: "#0F2027" },
            { text: "You become one with the trees...", color: "#4A00E0" },
            { text: "The forest has a new guardian.", color: "#00b09b" }
        ];
        
        this.playVisualCutscene(scenes, () => {
            this.showEndingScreen("SECRET ENDING", "You became one with the forest...", "#8BC34A");
        });
    }
    
    showEndingScreen(title, message, color) {
        const endScreen = document.createElement('div');
        endScreen.className = 'end-screen';
        endScreen.style.display = 'flex';
        endScreen.innerHTML = `
            <h1 class="end-title" style="color: ${color}">${title}</h1>
            <div class="end-message">${message}</div>
            <div class="end-stats">
                Time survived: ${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}<br>
                Max fear reached: ${Math.round(this.player.fear)}%
            </div>
            <button class="end-button" id="end-restart-btn">PLAY AGAIN</button>
            <button class="end-button secondary" id="end-menu-btn">MAIN MENU</button>
        `;
        
        document.body.appendChild(endScreen);
        
        document.getElementById('end-restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('end-menu-btn').addEventListener('click', () => location.reload());
    }
    
    // ===============================
    // PAUSE MENU
    // ===============================
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPauseMenu();
            document.exitPointerLock();
        } else {
            this.hidePauseMenu();
            if (!this.isInCutscene) {
                document.getElementById('game-canvas').requestPointerLock();
            }
        }
    }
    
    showPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'pause-menu';
        pauseMenu.style.display = 'flex';
        pauseMenu.innerHTML = `
            <h1 class="pause-title">PAUSED</h1>
            <button class="pause-button" id="resume-btn">RESUME GAME</button>
            <button class="pause-button secondary" id="restart-btn">RESTART GAME</button>
            <button class="pause-button secondary" id="menu-btn">MAIN MENU</button>
        `;
        
        document.body.appendChild(pauseMenu);
        
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('menu-btn').addEventListener('click', () => location.reload());
    }
    
    hidePauseMenu() {
        const pauseMenu = document.querySelector('.pause-menu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
    }
}

// ===============================
// START THE GAME
// ===============================

// Start immediately when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new EarsOfTheForest();
    window.game.init();
});
