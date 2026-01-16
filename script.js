// =========================================================
// EARS OF THE FOREST - COMPLETE GAME SCRIPT
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
        this.waterSources = [];
        this.campfires = [];
        this.flashlight = null;
        this.sunLight = null;
        this.cave = null;
        this.heartseedTree = null;
        this.bossWolf = null;
        
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
        
        // Messages
        this.messages = [];
        this.maxMessages = 10;
        
        // Cutscene state
        this.currentCutscene = null;
        
        // Dialogue system
        this.dialogueOptions = [];
        this.onDialogueSelect = null;
        this.isInDialogue = false;
    }
    
    // ===============================
    // INITIALIZATION
    // ===============================
    
    init() {
        console.log("🎮 Starting Ears of the Forest...");
        this.updateLoadingProgress("Initializing game engine...", 10);
        
        // Start loading sequence
        this.startLoadingSequence();
    }
    
    startLoadingSequence() {
        const loadingSteps = [
            { text: "Initializing graphics...", progress: 20 },
            { text: "Creating 3D world...", progress: 40 },
            { text: "Setting up survival systems...", progress: 60 },
            { text: "Loading AI and story...", progress: 80 },
            { text: "Finalizing...", progress: 95 }
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
                this.updateLoadingProgress("Ready to play!", 100);
                
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showCutscene('start');
                }, 500);
            }
        };
        
        setTimeout(loadStep, 100);
    }
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingTip = document.getElementById('loading-tip');
        
        if (progressBar) progressBar.style.width = percent + '%';
        if (loadingText) loadingText.textContent = text;
        
        // Show random tips
        if (Math.random() < 0.3) {
            const tips = [
                "Press C to craft Survival Kit from battery + medkit",
                "Some mushrooms are poisonous!",
                "Build campfires with 3 sticks",
                "Collect water from streams",
                "Find the Heartseed Tree for secret ending"
            ];
            if (loadingTip && tips.length > 0) {
                loadingTip.textContent = "Tip: " + tips[Math.floor(Math.random() * tips.length)];
            }
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
                canvas: document.getElementById('gameCanvas'),
                antialias: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            
            // Clock
            this.clock = new THREE.Clock();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
        } catch (error) {
            console.error("Graphics error:", error);
            this.showError("Graphics error. Try Chrome or Firefox.");
        }
    }
    
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
        for (let i = 0; i < 40; i++) {
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
        for (let i = 0; i < 15; i++) {
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
        for (let i = 0; i < 12; i++) {
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
        
        // Sticks
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            
            const stickGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4);
            const stickMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const stick = new THREE.Mesh(stickGeometry, stickMaterial);
            stick.position.set(x, 0.25, z);
            stick.rotation.x = Math.random() * Math.PI;
            
            this.scene.add(stick);
            this.sticks.push({
                mesh: stick,
                position: new THREE.Vector3(x, 0, z),
                collected: false
            });
        }
        
        // Water sources (streams)
        for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            
            const waterGeometry = new THREE.PlaneGeometry(3, 10);
            const waterMaterial = new THREE.MeshStandardMaterial({
                color: 0x3366cc,
                transparent: true,
                opacity: 0.7
            });
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2;
            water.position.set(x, -0.95, z);
            
            this.scene.add(water);
            this.waterSources.push({
                mesh: water,
                position: new THREE.Vector3(x, -1, z),
                radius: 2
            });
        }
        
        // Campfire spots
        for (let i = 0; i < 4; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            
            // Campfire base (stones)
            const stoneGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
            const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const stones = new THREE.Mesh(stoneGeometry, stoneMaterial);
            stones.position.set(x, -0.9, z);
            this.scene.add(stones);
            
            this.campfires.push({
                position: new THREE.Vector3(x, -0.9, z),
                active: false,
                radius: 3,
                stones: stones
            });
        }
        
        // Wolves
        for (let i = 0; i < 4; i++) {
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
                state: 'idle',
                health: 50,
                attackCooldown: 0,
                lastHowl: 0
            });
        }
        
        // Create cave (at fixed location)
        this.createCave();
        
        // Create Heartseed Tree
        this.createHeartseedTree();
        
        // Create boss wolf in cave
        this.createBossWolf();
        
        // Flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 1.5, 0);
        this.flashlight.target.position.set(0, 0, -10);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
    }
    
    createCave() {
        const caveX = 80;
        const caveZ = 80;
        
        // Cave entrance (simple hole)
        const caveGeometry = new THREE.CylinderGeometry(3, 4, 4, 16);
        const caveMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const cave = new THREE.Mesh(caveGeometry, caveMaterial);
        cave.position.set(caveX, 0, caveZ);
        cave.castShadow = true;
        
        this.scene.add(cave);
        this.cave = {
            mesh: cave,
            position: new THREE.Vector3(caveX, 0, caveZ),
            radius: 4,
            explored: false
        };
    }
    
    createHeartseedTree() {
        const treeX = -80;
        const treeZ = -80;
        
        // Unique glowing tree
        const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 10, 12);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2e1f,
            emissive: 0x330000
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(treeX, 5, treeZ);
        
        // Glowing leaves
        const leavesGeometry = new THREE.SphereGeometry(4, 12, 12);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x003300,
            transparent: true,
            opacity: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(treeX, 11, treeZ);
        
        this.scene.add(trunk);
        this.scene.add(leaves);
        
        this.heartseedTree = {
            trunk,
            leaves,
            position: new THREE.Vector3(treeX, 0, treeZ),
            radius: 6,
            found: false
        };
    }
    
    createBossWolf() {
        const x = 85;
        const z = 85;
        
        const bossGeometry = new THREE.BoxGeometry(2.5, 1.2, 3.5);
        const bossMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x330000
        });
        const bossWolf = new THREE.Mesh(bossGeometry, bossMaterial);
        bossWolf.position.set(x, 0.6, z);
        bossWolf.castShadow = true;
        
        this.scene.add(bossWolf);
        
        this.bossWolf = {
            mesh: bossWolf,
            position: new THREE.Vector3(x, 0, z),
            target: new THREE.Vector3(x, 0, z),
            speed: 2.5,
            state: 'idle',
            health: 150,
            attackDamage: 25,
            lastRoar: 0
        };
    }
    
    // ===============================
    // UI MANAGEMENT
    // ===============================
    
    initUI() {
        // Add coordinates and compass panel
        const coordsHTML = `
            <div class="coords-panel">
                <div class="coords-title">POSITION</div>
                <div id="coords">X: 0, Z: 0</div>
                <div id="compass">N</div>
            </div>
            
            <div class="dialogue-choices" id="dialogue-choices">
                <div class="dialogue-question" id="dialogue-question"></div>
                <div class="dialogue-option" id="dialogue-option-0"></div>
                <div class="dialogue-option" id="dialogue-option-1"></div>
                <div class="dialogue-option" id="dialogue-option-2"></div>
            </div>
        `;
        
        document.getElementById('game-ui').innerHTML += coordsHTML;
        
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
            coords: document.getElementById('coords'),
            compass: document.getElementById('compass'),
            dialogueChoices: document.getElementById('dialogue-choices'),
            dialogueQuestion: document.getElementById('dialogue-question'),
            dialogueOptions: [
                document.getElementById('dialogue-option-0'),
                document.getElementById('dialogue-option-1'),
                document.getElementById('dialogue-option-2')
            ]
        };
        
        // Add CSS for coordinates panel
        const style = document.createElement('style');
        style.textContent = `
            .coords-panel {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                padding: 10px 15px;
                border-radius: 8px;
                border: 1px solid rgba(76, 175, 80, 0.3);
                backdrop-filter: blur(10px);
                text-align: center;
                min-width: 120px;
            }
            .coords-title {
                color: #8BC34A;
                font-size: 0.8rem;
                margin-bottom: 5px;
                font-weight: bold;
            }
            #coords {
                color: white;
                font-size: 0.9rem;
                margin-bottom: 3px;
            }
            #compass {
                color: #4CAF50;
                font-size: 1.2rem;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
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
        
        // Update coordinates and compass
        if (this.ui.coords) {
            this.ui.coords.textContent = `X: ${Math.round(this.player.position.x)}, Z: ${Math.round(this.player.position.z)}`;
        }
        if (this.ui.compass) {
            const angle = this.camera.rotation.y * (180/Math.PI);
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const index = Math.round((((angle % 360) + 360) % 360) / 45) % 8;
            this.ui.compass.textContent = directions[index];
        }
        
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
    // DIALOGUE SYSTEM
    // ===============================
    
    showDialogue(question, options, callback) {
        this.isInDialogue = true;
        this.onDialogueSelect = callback;
        
        if (this.ui.dialogueChoices && this.ui.dialogueQuestion) {
            this.ui.dialogueQuestion.textContent = question;
            
            for (let i = 0; i < 3; i++) {
                if (this.ui.dialogueOptions[i]) {
                    if (options[i]) {
                        this.ui.dialogueOptions[i].textContent = options[i];
                        this.ui.dialogueOptions[i].style.display = 'block';
                        this.ui.dialogueOptions[i].onclick = () => this.selectDialogue(i);
                    } else {
                        this.ui.dialogueOptions[i].style.display = 'none';
                    }
                }
            }
            
            this.ui.dialogueChoices.style.display = 'block';
        }
    }
    
    selectDialogue(index) {
        if (this.ui.dialogueChoices) {
            this.ui.dialogueChoices.style.display = 'none';
        }
        
        this.isInDialogue = false;
        
        if (this.onDialogueSelect) {
            this.onDialogueSelect(index);
        }
    }
    
    // ===============================
    // INPUT SYSTEM
    // ===============================
    
    initInput() {
        const canvas = document.getElementById('gameCanvas');
        
        // Pointer lock
        canvas.addEventListener('click', () => {
            if (!this.isPaused && !this.isInCutscene && !this.isInDialogue) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        // Mouse look
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.isPaused || this.isInCutscene || this.isInDialogue) return;
            
            this.cameraRotation.x += e.movementY * this.sensitivity;
            this.cameraRotation.y += e.movementX * this.sensitivity;
            
            this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.updateInput();
            
            if (this.isPaused || this.isInCutscene || this.isInDialogue) {
                if (e.code === 'Escape') {
                    if (this.isInCutscene) this.skipCutscene();
                    else if (this.isInDialogue) {
                        this.ui.dialogueChoices.style.display = 'none';
                        this.isInDialogue = false;
                    }
                    else this.togglePause();
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
                case 'KeyC':
                    this.craftSurvivalKit();
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
        
        // Pause menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        // End screen buttons
        document.getElementById('end-restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('end-menu-btn').addEventListener('click', () => this.quitToMenu());
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
        this.addMessage("Game started - Survive and escape!");
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        this.gameTime += delta;
        
        if (!this.isPaused && !this.isInCutscene && !this.isInDialogue) {
            this.updatePlayer(delta);
            this.updateCamera();
            this.updateStats(delta);
            this.updateWolves(delta);
            this.updateBossWolf(delta);
            this.updateWeather(delta);
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
        
        // Exhaustion
        this.player.isExhausted = this.player.stamina < 10;
        
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
        
        // Check for campfire warmth
        if (this.isNearActiveCampfire()) {
            this.player.temperature += 0.3 * delta;
        }
        
        this.player.temperature = Math.max(35, Math.min(40, this.player.temperature));
        
        // Fear
        this.player.fear += 0.5 * delta;
        this.player.fear = Math.min(this.player.maxFear, this.player.fear);
        
        // Health effects
        if (this.player.hunger < 20) {
            this.player.health -= 0.3 * delta;
            if (Math.random() < 0.01) this.addMessage("You're starving!");
        }
        if (this.player.thirst < 20) {
            this.player.health -= 0.5 * delta;
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
            this.player.health -= 1 * delta;
            if (Math.random() < 0.01) this.addMessage("The poison is spreading...");
        }
        
        // Survival kit bonus
        if (this.inventory.survivalKit) {
            // Slow down hunger/thirst depletion
            this.player.hunger += 0.05 * delta;
            this.player.thirst += 0.05 * delta;
        }
        
        if (this.player.health <= 0) {
            this.triggerBadEnding();
        }
    }
    
    updateWolves(delta) {
        this.wolfEvents.timer += delta;
        
        // Timed wolf events
        if (!this.wolfEvents.firstChase && this.wolfEvents.timer > 60) {
            this.wolfEvents.firstChase = true;
            this.addMessage("A wolf howls in the distance...");
        }
        if (!this.wolfEvents.packAttack && this.wolfEvents.timer > 180) {
            this.wolfEvents.packAttack = true;
            this.addMessage("Multiple wolves surround you!");
            this.player.fear += 20;
        }
        if (!this.wolfEvents.hordeAttack && this.wolfEvents.timer > 300) {
            this.wolfEvents.hordeAttack = true;
            this.addMessage("A horde of wolves closes in!");
            this.player.fear += 30;
        }
        
        for (const wolf of this.wolves) {
            const distance = this.player.position.distanceTo(wolf.position);
            
            if (distance < 25) {
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
    
    updateBossWolf(delta) {
        if (!this.bossWolf || this.story.bossDefeated) return;
        
        const distance = this.player.position.distanceTo(this.bossWolf.position);
        
        if (distance < 40 && !this.story.exploredCave) {
            // Boss chases if player hasn't explored cave yet
            const direction = new THREE.Vector3()
                .subVectors(this.player.position, this.bossWolf.position)
                .normalize();
            
            this.bossWolf.position.addScaledVector(direction, this.bossWolf.speed * delta);
            this.bossWolf.mesh.position.copy(this.bossWolf.position);
            this.bossWolf.mesh.position.y = 0.6;
            
            // Roar occasionally
            if (this.gameTime - this.bossWolf.lastRoar > 10) {
                this.bossWolf.lastRoar = this.gameTime;
                this.addMessage("A terrifying roar echoes from the cave!");
                this.player.fear += 15;
            }
            
            // Attack
            if (distance < 3) {
                this.player.health -= this.bossWolf.attackDamage * delta;
                this.showDamageFlash();
            }
        }
    }
    
    updateWeather(delta) {
        // Update time
        this.weather.timeOfDay = (this.weather.timeOfDay + delta / 120) % 24;
        
        // Random weather changes
        if (Math.random() < 0.001) {
            this.weather.isRaining = !this.weather.isRaining;
            this.addMessage(this.weather.isRaining ? "It starts to rain..." : "The rain stops");
            if (this.weather.isRaining) {
                this.player.temperature -= 2;
            }
        }
    }
    
    updateWorld(delta) {
        // Update active campfires
        this.updateCampfires(delta);
    }
    
    updateCampfires(delta) {
        for (const campfire of this.campfires) {
            if (campfire.active && campfire.fire) {
                // Flicker effect
                campfire.fire.intensity = 1 + Math.sin(this.gameTime * 5) * 0.3;
                
                // Burn time
                campfire.burnTime -= delta;
                if (campfire.burnTime <= 0) {
                    this.extinguishCampfire(campfire);
                }
            }
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
        } else if (this.inventory.medkits === 0) {
            this.showNotification("No medkits available!");
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
        if (this.inventory.water > 0) {
            this.inventory.water--;
            this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 40);
            this.showNotification("Drank water: +40 thirst");
            this.addMessage("Water refreshes you");
        } else {
            this.showNotification("No water collected!");
        }
    }
    
    craftSurvivalKit() {
        if (this.inventory.batteries >= 1 && this.inventory.medkits >= 1) {
            this.inventory.batteries--;
            this.inventory.medkits--;
            this.inventory.survivalKit = true;
            this.showNotification("Crafted Survival Kit!");
            this.addMessage("Combined battery and medkit into survival kit");
            this.story.foundSecret = true;
        } else {
            this.showNotification("Need 1 battery and 1 medkit to craft!");
        }
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
                    this.addMessage("Collected water from stream");
                } else {
                    this.showNotification("Water container full!");
                }
                return;
            }
        }
        
        // Check campfires
        for (const campfire of this.campfires) {
            const distance = playerPos.distanceTo(campfire.position);
            if (distance < 3) {
                if (!campfire.active) {
                    if (this.inventory.sticks >= 3) {
                        this.buildCampfire(campfire);
                    } else {
                        this.showNotification("Need 3 sticks to build campfire");
                    }
                } else {
                    this.showNotification("Campfire is already burning");
                }
                return;
            }
        }
        
        // Check cave
        if (this.cave && !this.story.exploredCave) {
            const distance = playerPos.distanceTo(this.cave.position);
            if (distance < 5) {
                this.showDialogue(
                    "You found a dark cave entrance. Do you want to explore it?",
                    ["Enter the cave", "Stay outside", "Throw a stone inside"],
                    (choice) => this.handleCaveChoice(choice)
                );
                return;
            }
        }
        
        // Check Heartseed Tree
        if (this.heartseedTree && !this.heartseedTree.found) {
            const distance = playerPos.distanceTo(this.heartseedTree.position);
            if (distance < 8) {
                this.heartseedTree.found = true;
                this.showDialogue(
                    "The Heartseed Tree pulses with ancient energy. What do you do?",
                    ["Touch the glowing bark", "Listen to its whispers", "Run away"],
                    (choice) => this.handleTreeChoice(choice)
                );
                return;
            }
        }
        
        this.showNotification("Nothing to interact with here");
    }
    
    buildCampfire(campfire) {
        this.inventory.sticks -= 3;
        campfire.active = true;
        campfire.burnTime = 300; // 5 minutes
        
        // Create fire light
        const fireLight = new THREE.PointLight(0xff6600, 2, 15);
        fireLight.position.set(campfire.position.x, campfire.position.y + 1, campfire.position.z);
        this.scene.add(fireLight);
        
        // Create fire particles
        const fireGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const fireMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.8
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.set(campfire.position.x, campfire.position.y + 0.5, campfire.position.z);
        this.scene.add(fire);
        
        campfire.fire = fire;
        campfire.light = fireLight;
        
        this.showNotification("Built campfire!");
        this.addMessage("Campfire provides warmth and light");
    }
    
    extinguishCampfire(campfire) {
        campfire.active = false;
        if (campfire.fire) {
            this.scene.remove(campfire.fire);
        }
        if (campfire.light) {
            this.scene.remove(campfire.light);
        }
        this.addMessage("The campfire burns out");
    }
    
    isNearActiveCampfire() {
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
    
    handleCaveChoice(choice) {
        switch(choice) {
            case 0: // Enter cave
                this.story.exploredCave = true;
                this.story.helpedClassmate = true;
                this.addMessage("You bravely enter the cave...");
                this.showNotification("You explore the dark cave");
                this.player.fear += 20;
                // Spawn boss wolf if not already
                if (!this.wolfEvents.bossSpawned) {
                    this.wolfEvents.bossSpawned = true;
                    this.addMessage("Something large moves in the darkness...");
                }
                break;
                
            case 1: // Stay outside
                this.addMessage("You decide to stay outside the cave");
                this.showNotification("Better safe than sorry");
                break;
                
            case 2: // Throw stone
                this.addMessage("You throw a stone into the cave");
                this.showNotification("You hear something stirring inside...");
                this.player.fear += 10;
                break;
        }
    }
    
    handleTreeChoice(choice) {
        switch(choice) {
            case 0: // Touch bark
                this.addMessage("The tree's energy flows through you...");
                this.showNotification("You feel connected to the forest");
                this.player.health += 30;
                this.player.fear -= 20;
                this.story.foundHeartseed = true;
                break;
                
            case 1: // Listen to whispers
                this.triggerSecretEnding();
                break;
                
            case 2: // Run away
                this.addMessage("You run from the strange tree");
                this.showNotification("The tree's whispers fade away");
                this.player.fear += 10;
                break;
        }
    }
    
    checkEvents() {
        // Escape condition (reach edge of map)
        if (Math.abs(this.player.position.x) > 90 || Math.abs(this.player.position.z) > 90) {
            if (!this.story.escapeFound) {
                this.story.escapeFound = true;
                this.addMessage("You found the edge of the forest!");
            }
            
            // Trigger appropriate ending
            if (this.story.foundHeartseed) {
                this.triggerSecretEnding();
            } else if (this.story.exploredCave && this.story.helpedClassmate) {
                this.triggerGoodEnding();
            } else {
                this.triggerBadEnding();
            }
        }
        
        // Random jump scare
        if (Math.random() < 0.0005 && this.player.fear > 50) {
            this.triggerJumpScare();
        }
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
    
    triggerJumpScare() {
        const jumpScare = document.getElementById('jump-scare');
        if (jumpScare) {
            jumpScare.style.display = 'flex';
            
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
                Wolves encountered: ${this.story.wolvesEncountered}<br>
                Cave explored: ${this.story.exploredCave ? 'Yes' : 'No'}<br>
                Survival kit crafted: ${this.inventory.survivalKit ? 'Yes' : 'No'}
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
    
    showError(message) {
        this.updateLoadingProgress(message, 100);
        setTimeout(() => {
            this.hideLoadingScreen();
            alert(message);
        }, 2000);
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
