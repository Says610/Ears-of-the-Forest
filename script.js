/* =========================================================
   EARS OF THE FOREST - WORKING GAME ENGINE
========================================================= */

// ===============================
// CORE GAME OBJECT
// ===============================
const Game = {
    // Core Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    
    // Game state
    isRunning: false,
    isPaused: false,
    isInCutscene: false,
    gameTime: 0,
    
    // Player state
    player: {
        health: 100,
        stamina: 100,
        battery: 100,
        fear: 5,
        position: { x: 0, y: 1.7, z: 5 },
        rotation: { x: 0, y: 0, z: 0 }
    },
    
    // Input state
    input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        flashlight: true
    },
    
    // Inventory
    inventory: {
        medkits: 1,
        batteries: 2
    },
    
    // Systems
    cutscene: null,
    ui: null,
    
    // Initialization
    init() {
        console.log("Initializing game...");
        
        // First hide loading screen
        this.hideLoadingScreen();
        
        // Initialize systems
        this.initThreeJS();
        this.initUI();
        this.initCutscene();
        this.initWorld();
        this.initInput();
        
        // Start opening cutscene
        this.startOpeningCutscene();
        
        console.log("Game initialized successfully");
    },
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }
    },
    
    initThreeJS() {
        console.log("Initializing Three.js...");
        
        try {
            // Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            this.scene.fog = new THREE.Fog(0xcccccc, 20, 150); // Light fog
            
            // Camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 1.7, 5);
            
            // Renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: false
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Add canvas to container
            const container = document.getElementById('game-container');
            if (container) {
                container.appendChild(this.renderer.domElement);
            } else {
                document.body.appendChild(this.renderer.domElement);
            }
            
            // Clock
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            console.log("Three.js initialized successfully");
        } catch (error) {
            console.error("Three.js initialization failed:", error);
            this.showError("Failed to initialize graphics. Please refresh the page.");
        }
    },
    
    initUI() {
        console.log("Initializing UI...");
        
        // Create simple UI
        const uiHTML = `
            <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-family: Arial;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="color: #ff4444;">❤️</span>
                    <div style="width: 150px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                        <div id="health-bar" style="height: 100%; background: #ff4444; width: 100%;"></div>
                    </div>
                    <span id="health-text" style="font-weight: bold;">100</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="color: #ffaa00;">⚡</span>
                    <div style="width: 100px; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                        <div id="stamina-bar" style="height: 100%; background: #ffaa00; width: 100%;"></div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="color: #44aaff;">🔦</span>
                    <div style="width: 100px; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                        <div id="battery-bar" style="height: 100%; background: #44aaff; width: 100%;"></div>
                    </div>
                    <span id="battery-text" style="font-weight: bold;">100%</span>
                </div>
            </div>
            
            <div style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; color: white; font-family: Arial;">
                <div>Time: <span id="time-text">0:00</span></div>
                <div>Objective: <span id="objective-text">Find way out</span></div>
            </div>
            
            <div id="notification" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px 30px;
                border-radius: 10px;
                border: 2px solid #4CAF50;
                font-family: Arial;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            ">
                <span id="notification-text"></span>
            </div>
            
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <div style="width: 4px; height: 4px; background: white; border-radius: 50%; box-shadow: 0 0 5px black;"></div>
            </div>
        `;
        
        const uiContainer = document.getElementById('game-ui');
        if (uiContainer) {
            uiContainer.innerHTML = uiHTML;
            uiContainer.style.display = 'block';
        }
        
        console.log("UI initialized");
    },
    
    initCutscene() {
        console.log("Initializing cutscene system...");
        // Cutscene system will be handled separately
    },
    
    initWorld() {
        console.log("Building game world...");
        
        try {
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(100, 200, 100);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            
            // Ground
            const groundGeometry = new THREE.PlaneGeometry(200, 200);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x4f6b4f,
                roughness: 0.9
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -1;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Add some trees
            this.createTrees(30);
            
            // Add a path
            this.createPath();
            
            console.log("World built successfully");
        } catch (error) {
            console.error("World building failed:", error);
        }
    },
    
    createTrees(count) {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5f2f });
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Avoid center area
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            // Trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.6, 5, 8),
                trunkMat
            );
            trunk.position.set(x, 2.5, z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            
            // Leaves
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(2, 8, 8),
                leafMat
            );
            leaves.position.set(x, 6, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
        }
    },
    
    createPath() {
        const pathMat = new THREE.MeshStandardMaterial({
            color: 0x6b5a3a,
            roughness: 1
        });
        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 100),
            pathMat
        );
        path.rotation.x = -Math.PI / 2;
        path.position.y = -0.9;
        this.scene.add(path);
    },
    
    initInput() {
        console.log("Initializing input...");
        
        // Movement keys
        document.addEventListener('keydown', (e) => {
            if (this.isPaused || this.isInCutscene) return;
            
            switch(e.code) {
                case 'KeyW': this.input.forward = true; break;
                case 'KeyS': this.input.backward = true; break;
                case 'KeyA': this.input.left = true; break;
                case 'KeyD': this.input.right = true; break;
                case 'ShiftLeft': this.input.sprint = true; break;
                case 'KeyF': 
                    this.input.flashlight = !this.input.flashlight;
                    this.showNotification(`Flashlight ${this.input.flashlight ? 'ON' : 'OFF'}`);
                    break;
                case 'KeyH':
                    if (this.inventory.medkits > 0 && this.player.health < 100) {
                        this.player.health = Math.min(100, this.player.health + 40);
                        this.inventory.medkits--;
                        this.updateUI();
                        this.showNotification("Used medkit: +40 health");
                    }
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.input.forward = false; break;
                case 'KeyS': this.input.backward = false; break;
                case 'KeyA': this.input.left = false; break;
                case 'KeyD': this.input.right = false; break;
                case 'ShiftLeft': this.input.sprint = false; break;
            }
        });
        
        console.log("Input initialized");
    },
    
    startOpeningCutscene() {
        console.log("Starting opening cutscene...");
        
        // Create simple cutscene overlay
        const cutsceneHTML = `
            <div id="cutscene-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: Arial;
                text-align: center;
                padding: 20px;
            ">
                <div id="cutscene-text" style="
                    max-width: 800px;
                    font-size: 1.5rem;
                    line-height: 1.6;
                    margin-bottom: 20px;
                ">
                    You and your friend Alex are on a school field trip to the forest...
                </div>
                <div id="cutscene-character" style="
                    color: #4CAF50;
                    font-style: italic;
                    margin-bottom: 10px;
                ">
                    Alex
                </div>
                <div id="cutscene-continue" style="
                    color: #888;
                    margin-top: 20px;
                    animation: pulse 1.5s infinite;
                ">
                    Click to continue
                </div>
            </div>
        `;
        
        // Add cutscene overlay
        const overlay = document.createElement('div');
        overlay.innerHTML = cutsceneHTML;
        document.body.appendChild(overlay);
        
        const cutsceneTexts = [
            { text: "Wake up! Today's the field trip to the national forest!", character: "Alex" },
            { text: "We're going to see ancient trees over 500 years old!", character: "Alex" },
            { text: "The bus ride is bumpy but filled with laughter...", character: "Narrator" },
            { text: "Stay on the marked paths! Be back by 3 PM sharp!", character: "Teacher" },
            { text: "You and Alex decide to explore deeper...", character: "Narrator" },
            { text: "Wait... which way did we come from?", character: "Alex" },
            { text: "I thought you were keeping track!", character: "You" },
            { text: "The path disappears. It's getting darker...", character: "Narrator" },
            { text: "You hear a distant howl...", character: "Narrator" },
            { text: "Find your way out. Watch for wolves.", character: "Narrator" }
        ];
        
        let currentIndex = 0;
        
        const updateCutscene = () => {
            if (currentIndex < cutsceneTexts.length) {
                const textElem = document.getElementById('cutscene-text');
                const charElem = document.getElementById('cutscene-character');
                
                if (textElem && charElem) {
                    textElem.textContent = cutsceneTexts[currentIndex].text;
                    charElem.textContent = cutsceneTexts[currentIndex].character;
                    currentIndex++;
                }
            } else {
                // End cutscene
                document.body.removeChild(overlay);
                this.isInCutscene = false;
                this.startGame();
            }
        };
        
        // Click to advance
        overlay.addEventListener('click', updateCutscene);
        
        // Auto-advance every 4 seconds
        let autoAdvance = setInterval(updateCutscene, 4000);
        
        // Stop auto-advance when cutscene ends
        overlay.addEventListener('click', () => {
            clearInterval(autoAdvance);
            autoAdvance = setInterval(updateCutscene, 4000);
        });
        
        this.isInCutscene = true;
    },
    
    startGame() {
        console.log("Starting game loop...");
        this.isRunning = true;
        this.gameLoop();
        this.showNotification("You're lost in the forest. Find your way out!");
    },
    
    gameLoop() {
        if (!this.isRunning || this.isPaused || this.isInCutscene) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const delta = this.clock.getDelta();
        
        // Update game time
        this.gameTime += delta;
        
        // Update player movement
        this.updatePlayer(delta);
        
        // Update player stats
        this.updateStats(delta);
        
        // Update UI
        this.updateUI();
        
        // Check for events
        this.checkGameEvents();
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    },
    
    updatePlayer(delta) {
        const speed = this.input.sprint ? 10 : 5;
        
        // Move camera based on input
        if (this.input.forward) {
            this.camera.position.z -= speed * delta;
        }
        if (this.input.backward) {
            this.camera.position.z += speed * delta;
        }
        if (this.input.left) {
            this.camera.position.x -= speed * delta;
        }
        if (this.input.right) {
            this.camera.position.x += speed * delta;
        }
        
        // Update player position
        this.player.position.x = this.camera.position.x;
        this.player.position.y = this.camera.position.y;
        this.player.position.z = this.camera.position.z;
        
        // Simple collision with boundaries
        const bounds = 95;
        this.camera.position.x = Math.max(-bounds, Math.min(bounds, this.camera.position.x));
        this.camera.position.z = Math.max(-bounds, Math.min(bounds, this.camera.position.z));
    },
    
    updateStats(delta) {
        // Drain stamina when sprinting
        if (this.input.sprint && this.player.stamina > 0) {
            this.player.stamina -= 20 * delta;
        } else if (this.player.stamina < 100) {
            this.player.stamina += 10 * delta;
        }
        this.player.stamina = Math.max(0, Math.min(100, this.player.stamina));
        
        // Drain battery when flashlight on
        if (this.input.flashlight && this.player.battery > 0) {
            this.player.battery -= 5 * delta;
            if (this.player.battery <= 0) {
                this.input.flashlight = false;
                this.showNotification("Flashlight battery dead!");
            }
        }
        this.player.battery = Math.max(0, Math.min(100, this.player.battery));
        
        // Increase fear over time
        this.player.fear += 0.5 * delta;
        this.player.fear = Math.min(100, this.player.fear);
        
        // Random health drain (simulating dangers)
        if (Math.random() < 0.001) {
            this.player.health -= 5;
            this.showDamageFlash();
            if (this.player.health <= 0) {
                this.triggerBadEnding();
            }
        }
    },
    
    updateUI() {
        // Update health
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar) healthBar.style.width = `${this.player.health}%`;
        if (healthText) healthText.textContent = Math.round(this.player.health);
        
        // Update stamina
        const staminaBar = document.getElementById('stamina-bar');
        if (staminaBar) staminaBar.style.width = `${this.player.stamina}%`;
        
        // Update battery
        const batteryBar = document.getElementById('battery-bar');
        const batteryText = document.getElementById('battery-text');
        if (batteryBar) batteryBar.style.width = `${this.player.battery}%`;
        if (batteryText) batteryText.textContent = `${Math.round(this.player.battery)}%`;
        
        // Update time
        const timeText = document.getElementById('time-text');
        if (timeText) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = Math.floor(this.gameTime % 60);
            timeText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update objective based on position
        const objectiveText = document.getElementById('objective-text');
        if (objectiveText) {
            if (this.player.position.z < -80) {
                objectiveText.textContent = "You're getting close...";
            } else if (this.player.position.z < -40) {
                objectiveText.textContent = "Follow the path north";
            } else {
                objectiveText.textContent = "Find your way out";
            }
        }
    },
    
    checkGameEvents() {
        // First wolf event at 30 seconds
        if (this.gameTime > 30 && !this.firstWolfEvent) {
            this.firstWolfEvent = true;
            this.player.fear += 20;
            this.showNotification("You hear a wolf howl in the distance...");
        }
        
        // Wolf pack at 60 seconds
        if (this.gameTime > 60 && !this.wolfPackEvent) {
            this.wolfPackEvent = true;
            this.player.fear += 30;
            this.showNotification("Multiple wolves are nearby...");
        }
        
        // Check for good ending (reach far north)
        if (this.player.position.z < -90) {
            this.triggerGoodEnding();
        }
        
        // Check for secret ending (high fear and specific location)
        if (this.player.fear > 80 && this.player.position.x > 70) {
            this.triggerSecretEnding();
        }
    },
    
    showNotification(text, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;
        
        notificationText.textContent = text;
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    },
    
    showDamageFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,0,0,0.3);
            pointer-events: none;
            z-index: 99;
            animation: fadeOut 0.3s forwards;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    },
    
    triggerGoodEnding() {
        console.log("Good ending triggered!");
        this.isRunning = false;
        this.showEnding("GOOD ENDING", "You escaped the forest with Alex!", "#4CAF50");
    },
    
    triggerBadEnding() {
        console.log("Bad ending triggered!");
        this.isRunning = false;
        this.showEnding("BAD ENDING", "The wolves were too many...", "#f44336");
    },
    
    triggerSecretEnding() {
        console.log("Secret ending triggered!");
        this.isRunning = false;
        this.showEnding("SECRET ENDING", "You became one with the forest...", "#8BC34A");
    },
    
    showEnding(title, message, color) {
        const endingHTML = `
            <div id="ending-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: Arial;
                text-align: center;
            ">
                <h1 style="font-size: 3rem; margin-bottom: 20px; color: ${color}; text-shadow: 0 0 20px ${color}">
                    ${title}
                </h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px; max-width: 600px;">
                    ${message}
                </p>
                <p style="color: #888; margin-bottom: 40px;">
                    Time survived: ${Math.floor(this.gameTime)} seconds
                </p>
                <button id="restart-btn" style="
                    background: ${color};
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px;
                ">
                    Play Again
                </button>
                <button id="menu-btn" style="
                    background: #333;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px;
                ">
                    Main Menu
                </button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.innerHTML = endingHTML;
        document.body.appendChild(overlay);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            location.reload();
        });
    },
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    },
    
    showPauseMenu() {
        const pauseHTML = `
            <div id="pause-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: Arial;
            ">
                <h1 style="font-size: 3rem; margin-bottom: 20px; color: #4CAF50">
                    PAUSED
                </h1>
                <div style="margin-bottom: 30px; font-size: 1.2rem;">
                    <p>Health: ${Math.round(this.player.health)}</p>
                    <p>Time: ${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}</p>
                </div>
                <button id="resume-btn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px;
                ">
                    Resume Game
                </button>
                <button id="quit-btn" style="
                    background: #333;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin: 10px;
                ">
                    Quit to Menu
                </button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.innerHTML = pauseHTML;
        overlay.id = 'pause-overlay';
        document.body.appendChild(overlay);
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            location.reload();
        });
    },
    
    hidePauseMenu() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }
    },
    
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
                font-family: Arial;
                text-align: center;
                padding: 20px;
                z-index: 100000;
            ">
                <h1 style="color: #f44336; margin-bottom: 20px;">ERROR</h1>
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
                ">
                    Reload Page
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }
};

// ===============================
// START THE GAME WHEN PAGE LOADS
// ===============================
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game...");
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Start the game after a short delay
    setTimeout(() => {
        try {
            Game.init();
        } catch (error) {
            console.error("Game failed to start:", error);
            Game.showError("Game failed to load. Please check console for details.");
        }
    }, 1000);
});

// Make game accessible from console
window.Game = Game;
