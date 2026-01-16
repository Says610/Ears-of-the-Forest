/* =========================================================
   EARS OF THE FOREST - FINAL INTEGRATED SCRIPT
========================================================= */

// ===============================
// GAME INITIALIZATION
// ===============================
window.addEventListener('DOMContentLoaded', () => {
    console.log("Starting Ears of the Forest...");
    
    // Hide loading screen after a moment
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Start the game
        const game = new Game();
        game.init();
    }, 1500);
});

// ===============================
// GAME CLASS
// ===============================
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.controls = null;
        
        this.player = {
            health: 100,
            stamina: 100,
            battery: 100,
            fear: 5,
            position: new THREE.Vector3(0, 1.7, 5),
            isGrounded: true
        };
        
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            flashlight: true
        };
        
        this.gameTime = 0;
        this.isPaused = false;
        this.isInCutscene = false;
        
        this.cutsceneSystem = new CutsceneSystem();
        this.ui = new UISystem();
        
        console.log("Game instance created");
    }
    
    init() {
        console.log("Initializing game...");
        
        // Setup Three.js
        this.setupThreeJS();
        
        // Setup world
        this.setupWorld();
        
        // Setup input
        this.setupInput();
        
        // Setup UI
        this.ui.init();
        
        // Start with opening cutscene
        this.cutsceneSystem.play('opening', () => {
            console.log("Cutscene complete, starting gameplay...");
            this.startGameplay();
        });
    }
    
    setupThreeJS() {
        console.log("Setting up Three.js...");
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0xcccccc, 20, 150);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add to container
        const container = document.getElementById('game-container');
        container.appendChild(this.renderer.domElement);
        
        // Clock
        this.clock = new THREE.Clock();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log("Three.js setup complete");
    }
    
    setupWorld() {
        console.log("Building world...");
        
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
        
        // Add trees
        this.addTrees(30);
        
        // Add a path
        this.addPath();
        
        console.log("World built");
    }
    
    addTrees(count) {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5f2f });
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
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
    }
    
    addPath() {
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
    }
    
    setupInput() {
        console.log("Setting up input...");
        
        // Movement
        document.addEventListener('keydown', (e) => {
            if (this.isInCutscene || this.isPaused) return;
            
            switch(e.code) {
                case 'KeyW': this.input.forward = true; break;
                case 'KeyS': this.input.backward = true; break;
                case 'KeyA': this.input.left = true; break;
                case 'KeyD': this.input.right = true; break;
                case 'ShiftLeft': this.input.sprint = true; break;
                case 'KeyF': 
                    this.input.flashlight = !this.input.flashlight;
                    this.ui.showNotification(`Flashlight ${this.input.flashlight ? 'ON' : 'OFF'}`);
                    break;
                case 'KeyH':
                    if (this.player.health < 100) {
                        this.player.health = Math.min(100, this.player.health + 40);
                        this.ui.updateHealth(this.player.health);
                        this.ui.showNotification("Used medkit: +40 health");
                    }
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
                case 'KeyR':
                    if (e.shiftKey) {
                        this.testEnding('goodEnding');
                    }
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
        
        // Mouse click for camera control
        document.addEventListener('click', () => {
            if (!this.isInCutscene && !this.isPaused) {
                this.camera.lookAt(0, 1.7, 0);
            }
        });
    }
    
    startGameplay() {
        console.log("Starting gameplay...");
        
        // Show game UI
        this.ui.show();
        
        // Start game loop
        this.startGameLoop();
        
        // Show welcome message
        this.ui.showNotification("You're lost in the forest. Find your way out!");
    }
    
    startGameLoop() {
        console.log("Starting game loop...");
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            const delta = this.clock.getDelta();
            
            if (!this.isPaused && !this.isInCutscene) {
                this.updateGame(delta);
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    updateGame(delta) {
        // Update game time
        this.gameTime += delta;
        
        // Update player movement
        this.updatePlayer(delta);
        
        // Update player stats
        this.updateStats(delta);
        
        // Update UI
        this.ui.updateAll(this.player, this.gameTime);
        
        // Check for events
        this.checkEvents();
        
        // Check for endings
        this.checkEndings();
    }
    
    updatePlayer(delta) {
        const speed = this.input.sprint ? 10 : 5;
        
        // Forward/backward
        if (this.input.forward) {
            this.camera.position.z -= speed * delta;
        }
        if (this.input.backward) {
            this.camera.position.z += speed * delta;
        }
        
        // Left/right
        if (this.input.left) {
            this.camera.position.x -= speed * delta;
        }
        if (this.input.right) {
            this.camera.position.x += speed * delta;
        }
        
        // Update player position
        this.player.position.copy(this.camera.position);
    }
    
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
                this.ui.showNotification("Flashlight battery dead!");
            }
        }
        this.player.battery = Math.max(0, Math.min(100, this.player.battery));
        
        // Increase fear over time
        this.player.fear += 0.5 * delta;
        this.player.fear = Math.min(100, this.player.fear);
        
        // Random health drain (simulating wolf attacks)
        if (Math.random() < 0.001) {
            this.player.health -= 5;
            this.ui.showDamageFlash();
        }
        this.player.health = Math.max(0, this.player.health);
    }
    
    checkEvents() {
        // First wolf at 30 seconds
        if (this.gameTime > 30 && !this.firstWolfEvent) {
            this.firstWolfEvent = true;
            this.player.fear += 20;
            this.ui.showNotification("You hear a wolf howl in the distance...");
        }
        
        // Wolf pack at 60 seconds
        if (this.gameTime > 60 && !this.wolfPackEvent) {
            this.wolfPackEvent = true;
            this.player.fear += 30;
            this.ui.showNotification("Multiple wolves are nearby...");
        }
    }
    
    checkEndings() {
        // Bad ending - player dies
        if (this.player.health <= 0) {
            this.triggerEnding('badEnding');
            return;
        }
        
        // Good ending - reach far north
        if (this.player.position.z < -150) {
            this.triggerEnding('goodEnding');
            return;
        }
        
        // Secret ending - high fear and specific location
        if (this.player.fear > 80 && this.player.position.x > 100 && this.player.position.z < -100) {
            this.triggerEnding('secretEnding');
            return;
        }
    }
    
    triggerEnding(ending) {
        console.log(`Triggering ${ending}...`);
        this.isPaused = true;
        this.cutsceneSystem.play(ending, () => {
            this.showEndScreen(ending);
        });
    }
    
    testEnding(ending) {
        this.triggerEnding(ending);
    }
    
    showEndScreen(ending) {
        const endScreen = document.createElement('div');
        endScreen.id = 'end-screen';
        
        const colors = {
            goodEnding: '#4CAF50',
            badEnding: '#f44336',
            secretEnding: '#8BC34A'
        };
        
        const titles = {
            goodEnding: 'GOOD ENDING - SAFE RETURN',
            badEnding: 'BAD ENDING - THE FEAST',
            secretEnding: 'SECRET ENDING - BECOMING'
        };
        
        const messages = {
            goodEnding: 'You and Alex escaped the forest together.',
            badEnding: 'The wolves were too many...',
            secretEnding: 'You became one with the forest.'
        };
        
        endScreen.innerHTML = `
            <h1 style="color: ${colors[ending]}">${titles[ending]}</h1>
            <p>${messages[ending]}</p>
            <p>Time survived: ${Math.floor(this.gameTime)} seconds</p>
            <div>
                <button id="restart-btn">Play Again</button>
                <button id="end-menu-btn">Main Menu</button>
            </div>
        `;
        
        document.body.appendChild(endScreen);
        endScreen.style.display = 'flex';
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('end-menu-btn').addEventListener('click', () => {
            endScreen.remove();
            this.isPaused = false;
            // Would return to main menu
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui.togglePauseMenu(this.isPaused);
    }
}

// ===============================
// CUTSCENE SYSTEM
// ===============================
class CutsceneSystem {
    constructor() {
        this.currentCutscene = null;
        this.isPlaying = false;
        this.dialogueIndex = 0;
        this.timeout = null;
    }
    
    play(cutsceneName, onComplete) {
        console.log(`Playing cutscene: ${cutsceneName}`);
        
        const cutscenes = {
            opening: [
                { text: "Wake up! Today's the field trip!", character: "Alex", delay: 3 },
                { text: "Ugh... five more minutes...", character: "You", delay: 2 },
                { text: "We're going to see ancient trees!", character: "Alex", delay: 3 },
                { text: "The bus ride is bumpy but fun.", character: "Narrator", delay: 3 },
                { text: "Stay on the paths! Be back by 3 PM!", character: "Teacher", delay: 3 },
                { text: "You explore deeper...", character: "Narrator", delay: 2 },
                { text: "Wait... which way back?", character: "Alex", delay: 3 },
                { text: "I thought you knew!", character: "You", delay: 2 },
                { text: "The path is gone. It's getting dark.", character: "Narrator", delay: 3 },
                { text: "A wolf howls in the distance...", character: "Narrator", delay: 3 },
                { text: "Find your way out. Watch for wolves.", character: "Narrator", delay: 3 }
            ],
            goodEnding: [
                { text: "The parking lot! We made it!", character: "Alex", delay: 3 },
                { text: "We actually survived!", character: "You", delay: 3 },
                { text: "GOOD ENDING: SAFE RETURN", character: "", delay: 4 },
                { text: "You escaped the forest with Alex.", character: "", delay: 3 }
            ],
            badEnding: [
                { text: "Too many wolves...", character: "Alex", delay: 3 },
                { text: "Keep moving!", character: "You", delay: 2 },
                { text: "I can't run anymore...", character: "Alex", delay: 3 },
                { text: "The wolves close in...", character: "Narrator", delay: 3 },
                { text: "BAD ENDING: THE FEAST", character: "", delay: 4 },
                { text: "The forest claimed new victims.", character: "", delay: 3 }
            ],
            secretEnding: [
                { text: "What is this place?", character: "You", delay: 3 },
                { text: "A glowing tree stands before you.", character: "Narrator", delay: 3 },
                { text: "Welcome. I am the Heartseed.", character: "Tree", delay: 3 },
                { text: "The tree's voice is in everything.", character: "Narrator", delay: 3 },
                { text: "I understand now...", character: "You", delay: 3 },
                { text: "SECRET ENDING: BECOMING", character: "", delay: 4 },
                { text: "You became part of the forest.", character: "", delay: 3 }
            ]
        };
        
        if (!cutscenes[cutsceneName]) {
            if (onComplete) onComplete();
            return;
        }
        
        this.currentCutscene = cutscenes[cutsceneName];
        this.onComplete = onComplete;
        this.isPlaying = true;
        this.dialogueIndex = 0;
        
        // Show cutscene container
        this.showCutsceneContainer();
        
        // Start first dialogue
        this.showDialogue();
    }
    
    showCutsceneContainer() {
        let container = document.getElementById('cutscene-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'cutscene-container';
            document.body.appendChild(container);
        }
        
        container.style.display = 'flex';
        
        // Set background color based on cutscene
        const bgColor = this.currentCutscene[0].character === 'Alex' ? '#000' :
                       this.currentCutscene[0].text.includes('BAD') ? '#330000' :
                       this.currentCutscene[0].text.includes('SECRET') ? '#0a2f0a' : '#000';
        container.style.background = bgColor;
    }
    
    showDialogue() {
        if (!this.currentCutscene || this.dialogueIndex >= this.currentCutscene.length) {
            this.endCutscene();
            return;
        }
        
        const dialogue = this.currentCutscene[this.dialogueIndex];
        const container = document.getElementById('cutscene-container');
        
        // Clear previous
        container.innerHTML = '';
        
        // Add cinematic bars
        const topBar = document.createElement('div');
        topBar.className = 'cinematic-bar top';
        container.appendChild(topBar);
        
        const bottomBar = document.createElement('div');
        bottomBar.className = 'cinematic-bar bottom';
        container.appendChild(bottomBar);
        
        // Add dialogue box
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'cutscene-dialogue';
        
        const text = document.createElement('div');
        text.id = 'cutscene-text';
        text.textContent = dialogue.text;
        
        if (dialogue.character) {
            const character = document.createElement('div');
            character.id = 'cutscene-character';
            character.textContent = dialogue.character;
            dialogueBox.appendChild(character);
        }
        
        const continueText = document.createElement('div');
        continueText.id = 'cutscene-continue';
        continueText.textContent = 'CLICK TO CONTINUE';
        
        dialogueBox.appendChild(text);
        dialogueBox.appendChild(continueText);
        container.appendChild(dialogueBox);
        
        // Auto-advance
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.advanceDialogue();
        }, dialogue.delay * 1000);
        
        this.dialogueIndex++;
    }
    
    advanceDialogue() {
        if (this.timeout) clearTimeout(this.timeout);
        this.showDialogue();
    }
    
    endCutscene() {
        console.log("Cutscene ending");
        
        this.isPlaying = false;
        this.currentCutscene = null;
        
        // Hide container
        const container = document.getElementById('cutscene-container');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
        
        // Call completion callback
        if (this.onComplete) {
            setTimeout(() => this.onComplete(), 100);
        }
    }
}

// ===============================
// UI SYSTEM
// ===============================
class UISystem {
    constructor() {
        this.uiContainer = null;
        this.notificationTimeout = null;
    }
    
    init() {
        this.createUI();
    }
    
    createUI() {
        // Create main UI container
        this.uiContainer = document.getElementById('game-ui');
        if (!this.uiContainer) {
            this.uiContainer = document.createElement('div');
            this.uiContainer.id = 'game-ui';
            document.body.appendChild(this.uiContainer);
        }
        
        this.uiContainer.innerHTML = `
            <!-- Health -->
            <div class="ui-health">
                <div class="health-bar">
                    <div class="health-fill" id="health-fill"></div>
                    <div class="health-value" id="health-value">100</div>
                </div>
            </div>
            
            <!-- Stamina -->
            <div class="ui-stamina">
                <div class="stamina-bar">
                    <div class="stamina-fill" id="stamina-fill"></div>
                </div>
            </div>
            
            <!-- Fear -->
            <div class="ui-fear">
                <div class="fear-bar">
                    <div class="fear-fill" id="fear-fill"></div>
                </div>
            </div>
            
            <!-- Battery -->
            <div class="ui-battery">
                <span id="battery-icon">🔦</span>
                <span class="battery-value" id="battery-value">100%</span>
            </div>
            
            <!-- Time -->
            <div class="ui-time">
                <span id="time-icon">🕐</span>
                <span id="time-text">0:00</span>
            </div>
            
            <!-- Inventory -->
            <div class="ui-inventory">
                <div>Medkits: <span id="medkit-count">1</span></div>
                <div>Batteries: <span id="battery-count">2</span></div>
            </div>
            
            <!-- Objective -->
            <div class="ui-objective">
                <span class="objective-label">Objective:</span>
                <span class="objective-text" id="objective-text">Find your way out</span>
            </div>
            
            <!-- Notification -->
            <div class="ui-notification" id="notification">
                <span id="notification-text"></span>
            </div>
            
            <!-- Crosshair -->
            <div class="ui-crosshair">
                <div class="crosshair-dot"></div>
            </div>
            
            <!-- Interaction -->
            <div class="ui-interaction" id="interaction">
                <span id="interaction-text">Press E to interact</span>
            </div>
        `;
        
        // Create pause menu
        this.createPauseMenu();
    }
    
    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.innerHTML = `
            <h1>PAUSED</h1>
            <div class="pause-stats">
                <p>Health: <span id="pause-health">100</span></p>
                <p>Time: <span id="pause-time">0:00</span></p>
            </div>
            <button id="resume-btn">Resume</button>
            <button id="menu-btn">Main Menu</button>
        `;
        
        document.body.appendChild(pauseMenu);
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            window.game.togglePause();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    show() {
        this.uiContainer.style.display = 'block';
    }
    
    hide() {
        this.uiContainer.style.display = 'none';
    }
    
    updateAll(player, gameTime) {
        this.updateHealth(player.health);
        this.updateStamina(player.stamina);
        this.updateFear(player.fear);
        this.updateBattery(player.battery);
        this.updateTime(gameTime);
    }
    
    updateHealth(health) {
        const fill = document.getElementById('health-fill');
        const value = document.getElementById('health-value');
        const pauseHealth = document.getElementById('pause-health');
        
        if (fill) fill.style.width = `${health}%`;
        if (value) value.textContent = Math.round(health);
        if (pauseHealth) pauseHealth.textContent = Math.round(health);
        
        // Color based on health
        if (fill) {
            if (health > 70) {
                fill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            } else if (health > 40) {
                fill.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #f44336, #ef5350)';
            }
        }
    }
    
    updateStamina(stamina) {
        const fill = document.getElementById('stamina-fill');
        if (fill) {
            fill.style.width = `${stamina}%`;
            fill.style.background = stamina > 30 ? 
                'linear-gradient(90deg, #ffaa00, #ffcc44)' :
                'linear-gradient(90deg, #f57c00, #ff9800)';
        }
    }
    
    updateFear(fear) {
        const fill = document.getElementById('fear-fill');
        if (fill) {
            fill.style.width = `${fear}%`;
            fill.style.background = fear > 70 ?
                'linear-gradient(90deg, #d32f2f, #f44336)' :
                'linear-gradient(90deg, #aa44ff, #e040fb)';
        }
    }
    
    updateBattery(battery) {
        const value = document.getElementById('battery-value');
        const icon = document.getElementById('battery-icon');
        
        if (value) value.textContent = `${Math.round(battery)}%`;
        if (icon) {
            icon.textContent = battery > 20 ? '🔦' : '🕯️';
            icon.style.color = battery > 20 ? '#44aaff' : '#ff4444';
        }
    }
    
    updateTime(gameTime) {
        const text = document.getElementById('time-text');
        const pauseTime = document.getElementById('pause-time');
        
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (text) text.textContent = timeStr;
        if (pauseTime) pauseTime.textContent = timeStr;
    }
    
    showNotification(text, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;
        
        notificationText.textContent = text;
        notification.classList.add('show');
        
        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
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
            document.body.removeChild(flash);
        }, 300);
    }
    
    togglePauseMenu(show) {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = show ? 'flex' : 'none';
        }
    }
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Make game accessible globally
window.game = null;
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.init();
});
