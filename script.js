// =========================================================
// EARS OF THE FOREST - SIMPLE WORKING VERSION
// =========================================================

class EarsOfTheForest {
    constructor() {
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isInCutscene = false;
        this.gameTime = 0;
        
        // Core Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        // Camera
        this.cameraRotation = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        
        // Player
        this.player = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            battery: 100,
            maxBattery: 100,
            fear: 5,
            maxFear: 100,
            hunger: 100,
            maxHunger: 100,
            position: new THREE.Vector3(0, 1.7, 5),
            velocity: new THREE.Vector3(),
            onGround: true,
            movementSpeed: 5,
            sprintSpeed: 8,
            crouchSpeed: 2,
            currentSpeed: 5,
            isCrouching: false
        };
        
        // Input
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
        
        // World
        this.trees = [];
        this.wolves = [];
        this.berries = [];
        this.flashlight = null;
        this.sunLight = null;
        
        // Inventory
        this.inventory = {
            medkits: 1,
            batteries: 2,
            berries: 0,
            sticks: 0
        };
        
        // UI
        this.ui = {};
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    init() {
        console.log("🎮 Starting game...");
        
        // Quick load sequence
        this.updateLoadingProgress("Initializing...", 20);
        
        setTimeout(() => {
            this.initThreeJS();
            this.updateLoadingProgress("Creating world...", 50);
            
            setTimeout(() => {
                this.initWorld();
                this.updateLoadingProgress("Setting up UI...", 70);
                
                setTimeout(() => {
                    this.initUI();
                    this.initInput();
                    this.updateLoadingProgress("Starting game...", 90);
                    
                    setTimeout(() => {
                        this.hideLoadingScreen();
                        this.startGame();
                        console.log("✅ Game loaded!");
                    }, 300);
                }, 300);
            }, 300);
        }, 300);
    }
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (progressBar) progressBar.style.width = percent + '%';
        if (loadingText) loadingText.textContent = text;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const canvas = document.getElementById('game-canvas');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
    }
    
    // ===============================
    // THREE.JS
    // ===============================
    
    initThreeJS() {
        try {
            // Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x001a00);
            this.scene.fog = new THREE.Fog(0x001a00, 10, 150);
            
            // Camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.copy(this.player.position);
            
            // Renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('game-canvas'),
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            
            // Clock
            this.clock = new THREE.Clock();
            
            // Resize handler
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
        } catch (error) {
            console.error("Graphics error:", error);
            alert("Graphics error. Try Chrome or Firefox.");
        }
    }
    
    // ===============================
    // WORLD
    // ===============================
    
    initWorld() {
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
        for (let i = 0; i < 30; i++) {
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
        for (let i = 0; i < 10; i++) {
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
        
        // Wolves
        for (let i = 0; i < 3; i++) {
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
                speed: 2
            });
        }
        
        // Flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
    }
    
    // ===============================
    // UI
    // ===============================
    
    initUI() {
        const uiHTML = `
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
            
            <div class="stamina-container">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #ffaa00; font-size: 1rem;">⚡</span>
                    <span style="font-weight: bold; color: white;">STAMINA</span>
                </div>
                <div class="stamina-bar">
                    <div class="stamina-fill" id="stamina-fill"></div>
                </div>
            </div>
            
            <div class="fear-container">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #aa44ff; font-size: 1rem;">😨</span>
                    <span style="font-weight: bold; color: white;">FEAR</span>
                </div>
                <div class="fear-bar">
                    <div class="fear-fill" id="fear-fill"></div>
                </div>
            </div>
            
            <div class="battery-container">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <span style="font-weight: bold; color: white;">FLASHLIGHT</span>
                    <span style="color: #44aaff; font-size: 1rem;">🔦</span>
                </div>
                <div id="battery-text" style="font-size: 1.2rem; font-weight: bold; color: #44aaff; margin-top: 3px;">100%</div>
            </div>
            
            <div class="time-container">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <span style="font-weight: bold; color: white;">TIME</span>
                    <span style="color: #4CAF50; font-size: 1rem;">🕐</span>
                </div>
                <div id="time-text" style="font-size: 1.2rem; font-weight: bold; color: #4CAF50; margin-top: 3px;">00:00</div>
            </div>
            
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
                    <span>Berries</span>
                    <span id="inventory-berries" style="color: #ff4444; font-weight: bold;">0</span>
                </div>
            </div>
            
            <div class="objective-container">
                <span style="color: #4CAF50; font-weight: bold; margin-right: 5px;">OBJECTIVE:</span>
                <span id="objective-text" style="color: #eee;">Survive and find your way out</span>
            </div>
            
            <div class="crosshair">
                <div class="crosshair-dot"></div>
            </div>
            
            <div class="notification" id="notification">
                <div class="notification-text" id="notification-text"></div>
            </div>
        `;
        
        document.getElementById('game-ui').innerHTML = uiHTML;
        
        // Cache UI
        this.ui.healthFill = document.getElementById('health-fill');
        this.ui.staminaFill = document.getElementById('stamina-fill');
        this.ui.fearFill = document.getElementById('fear-fill');
        this.ui.batteryText = document.getElementById('battery-text');
        this.ui.timeText = document.getElementById('time-text');
        this.ui.notification = document.getElementById('notification');
        this.ui.notificationText = document.getElementById('notification-text');
    }
    
    // ===============================
    // INPUT
    // ===============================
    
    initInput() {
        const canvas = document.getElementById('game-canvas');
        
        // Pointer lock
        canvas.addEventListener('click', () => {
            if (!this.isPaused) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
            console.log("Pointer lock:", this.isPointerLocked ? "ON" : "OFF");
        });
        
        // Mouse look
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.isPaused) return;
            
            this.cameraRotation.x += e.movementY * this.sensitivity;
            this.cameraRotation.y += e.movementX * this.sensitivity;
            
            this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.updateInput();
            
            if (!this.isPaused) {
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
                    case 'Escape':
                        this.togglePause();
                        break;
                }
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
    // GAME LOOP
    // ===============================
    
    startGame() {
        console.log("🎮 Game started!");
        this.isRunning = true;
        this.showNotification("You're lost in the forest. Find your way out!");
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        this.gameTime += delta;
        
        if (!this.isPaused) {
            this.updateCamera();
            this.updatePlayer(delta);
            this.updateStats(delta);
            this.updateWolves(delta);
            this.updateUI();
            this.checkEvents();
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateCamera() {
        this.camera.rotation.x = -this.cameraRotation.x;
        this.camera.rotation.y = -this.cameraRotation.y;
        this.camera.position.copy(this.player.position);
    }
    
    updatePlayer(delta) {
        // Speed
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
        
        // Movement
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
        if (this.keys['Space'] && this.player.onGround) {
            this.player.velocity.y = 8;
            this.player.onGround = false;
            this.player.stamina -= 20;
        }
        
        // Move
        this.player.position.addScaledVector(this.player.velocity, delta);
        
        // Ground
        if (this.player.position.y < 1.7) {
            this.player.position.y = 1.7;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Bounds
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
        
        // Fear
        this.player.fear += 0.5 * delta;
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Health effects
        if (this.player.hunger < 20) {
            this.player.health -= 0.3 * delta;
        }
        
        // Random damage
        if (Math.random() < 0.001) {
            this.player.health -= 5;
            this.showDamageFlash();
        }
        
        if (this.player.health <= 0) {
            this.triggerBadEnding();
        }
    }
    
    updateWolves(delta) {
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            
            if (distance < 20) {
                // Chase player
                const direction = new THREE.Vector3()
                    .subVectors(this.player.position, wolf.position)
                    .normalize();
                
                wolf.position.addScaledVector(direction, wolf.speed * delta);
                wolf.mesh.position.copy(wolf.position);
                
                // Attack
                if (distance < 2) {
                    this.player.health -= 10 * delta;
                    this.showDamageFlash();
                }
            }
        }
    }
    
    updateUI() {
        // Health
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        this.ui.healthFill.style.width = healthPercent + '%';
        document.getElementById('health-text').textContent = Math.round(this.player.health);
        
        // Stamina
        const staminaPercent = (this.player.stamina / this.player.maxStamina) * 100;
        this.ui.staminaFill.style.width = staminaPercent + '%';
        
        // Fear
        const fearPercent = (this.player.fear / this.player.maxFear) * 100;
        this.ui.fearFill.style.width = fearPercent + '%';
        
        // Battery
        this.ui.batteryText.textContent = Math.round(this.player.battery) + '%';
        this.ui.batteryText.style.color = this.player.battery > 20 ? '#44aaff' : '#ff4444';
        
        // Time
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        this.ui.timeText.textContent = minutes.toString().padStart(2, '0') + ':' + 
                                      seconds.toString().padStart(2, '0');
        
        // Inventory
        document.getElementById('inventory-medkits').textContent = this.inventory.medkits;
        document.getElementById('inventory-batteries').textContent = this.inventory.batteries;
        document.getElementById('inventory-berries').textContent = this.inventory.berries;
        
        // Fear overlay
        const fearOverlay = document.getElementById('fear-overlay');
        fearOverlay.style.opacity = (this.player.fear / 100) * 0.3;
        
        // Objective
        const objective = document.getElementById('objective-text');
        if (this.player.position.z < -90) {
            objective.textContent = "Almost out! Keep going!";
        } else if (this.player.hunger < 30) {
            objective.textContent = "Find food! Look for red berries";
        } else {
            objective.textContent = "Find your way out";
        }
    }
    
    checkEvents() {
        // First wolf event
        if (this.gameTime > 60 && !this.firstWolfEvent) {
            this.firstWolfEvent = true;
            this.showNotification("You hear a wolf howl...");
            this.player.fear += 20;
        }
        
        // Escape
        if (this.player.position.z < -90) {
            this.triggerGoodEnding();
        }
        
        // Secret ending
        if (this.player.position.x > 70 && this.player.fear > 80) {
            this.triggerSecretEnding();
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
        }
    }
    
    useBattery() {
        if (this.inventory.batteries > 0 && this.player.battery < this.player.maxBattery) {
            this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 50);
            this.inventory.batteries--;
            this.showNotification("Used battery: +50%");
            if (this.input.flashlight && this.flashlight) {
                this.flashlight.intensity = Math.max(0.2, this.player.battery / 100 * 2);
            }
        }
    }
    
    interact() {
        const playerPos = this.player.position;
        
        // Check berries
        for (const berry of this.berries) {
            if (berry.collected) continue;
            
            const distance = playerPos.distanceTo(berry.position);
            if (distance < 1.5) {
                berry.collected = true;
                this.scene.remove(berry.mesh);
                this.inventory.berries += 3;
                this.showNotification("Collected 3 berries!");
                return;
            }
        }
    }
    
    eatBerries() {
        if (this.inventory.berries > 0) {
            const berriesToEat = Math.min(3, this.inventory.berries);
            this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + berriesToEat * 10);
            this.inventory.berries -= berriesToEat;
            this.showNotification(`Ate ${berriesToEat} berries: +${berriesToEat * 10} hunger`);
        }
    }
    
    showNotification(text, duration = 3000) {
        this.ui.notificationText.textContent = text;
        this.ui.notification.classList.add('show');
        setTimeout(() => this.ui.notification.classList.remove('show'), duration);
    }
    
    showDamageFlash() {
        const flash = document.getElementById('damage-flash');
        flash.style.background = 'rgba(255, 0, 0, 0.4)';
        setTimeout(() => flash.style.background = 'rgba(255, 0, 0, 0)', 300);
    }
    
    // ===============================
    // ENDINGS
    // ===============================
    
    triggerGoodEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "GOOD ENDING",
            "You escaped the forest! Safe and sound.",
            "#4CAF50"
        );
    }
    
    triggerBadEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "BAD ENDING",
            "The forest claimed you...",
            "#f44336"
        );
    }
    
    triggerSecretEnding() {
        this.isRunning = false;
        this.showEndingScreen(
            "SECRET ENDING",
            "You became one with the forest...",
            "#8BC34A"
        );
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
                Final health: ${Math.round(this.player.health)}<br>
                Final fear: ${Math.round(this.player.fear)}%
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
            document.getElementById('game-canvas').requestPointerLock();
        }
    }
    
    showPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'pause-menu';
        pauseMenu.style.display = 'flex';
        pauseMenu.innerHTML = `
            <h1 class="pause-title">PAUSED</h1>
            <button class="pause-button" id="resume-btn">RESUME</button>
            <button class="pause-button secondary" id="restart-btn">RESTART</button>
            <button class="pause-button secondary" id="menu-btn">MENU</button>
        `;
        
        document.body.appendChild(pauseMenu);
        
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('menu-btn').addEventListener('click', () => location.reload());
    }
    
    hidePauseMenu() {
        const pauseMenu = document.querySelector('.pause-menu');
        if (pauseMenu) pauseMenu.remove();
    }
}

// ===============================
// START GAME
// ===============================

// Start when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new EarsOfTheForest();
    window.game = game; // Make accessible
    
    // Start game
    game.init();
});
