/* =========================================================
   EARS OF THE FOREST - COMPLETE GAME
========================================================= */

// ===============================
// GAME CONSTANTS & CONFIG
// ===============================
const CONFIG = {
    // Game settings
    VERSION: '1.0.0',
    GAME_TITLE: 'EARS OF THE FOREST',
    
    // Player settings
    PLAYER: {
        MAX_HEALTH: 100,
        MAX_STAMINA: 100,
        MAX_BATTERY: 100,
        MAX_FEAR: 100,
        WALK_SPEED: 8.0,
        SPRINT_SPEED: 14.0,
        JUMP_FORCE: 8.0,
        GRAVITY: 9.8
    },
    
    // Wolf settings
    WOLF: {
        NORMAL_SPEED: 3,
        BOSS_SPEED: 4,
        NORMAL_DAMAGE: 15,
        BOSS_DAMAGE: 25,
        STALK_DISTANCE: 30,
        CHASE_DISTANCE: 20,
        ATTACK_DISTANCE: 1.8
    },
    
    // Game events (in seconds)
    EVENTS: {
        FIRST_WOLF: 180,    // 3 minutes
        WOLF_PACK: 300,     // 5 minutes
        WOLF_HORDE: 600,    // 10 minutes
        BOSS_SPAWN: 450     // 7.5 minutes
    },
    
    // Inventory limits
    INVENTORY: {
        MAX_WEIGHT: 50,
        SLOTS: 20
    }
};

// ===============================
// GAME STATE
// ===============================
let GameState = {
    // Core Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    controls: null,
    
    // Player state
    player: {
        health: CONFIG.PLAYER.MAX_HEALTH,
        stamina: CONFIG.PLAYER.MAX_STAMINA,
        battery: CONFIG.PLAYER.MAX_BATTERY,
        fear: 5,
        position: new THREE.Vector3(0, 1.7, 5),
        rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        isGrounded: true
    },
    
    // Input state
    input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        jump: false,
        flashlight: true
    },
    
    // Game state
    gameTime: 0,
    realTime: 0,
    isPaused: false,
    isGameOver: false,
    isInCutscene: false,
    
    // Collections
    wolves: [],
    trees: [],
    obstacles: [],
    items: [],
    notes: [],
    
    // Story flags
    story: {
        helpedClassmate: false,
        exploredCave: false,
        foundSecret: false,
        bossDefeated: false,
        classmateLost: false
    },
    
    // Inventory
    inventory: {
        medkits: 1,
        batteries: 2,
        batteryPacks: 0,
        survivalKits: 0,
        collectedNotes: 0
    },
    
    // Events tracking
    events: {
        firstWolfSpawned: false,
        wolfPackSpawned: false,
        wolfHordeSpawned: false,
        bossSpawned: false
    },
    
    // UI references
    ui: {
        healthBar: null,
        staminaBar: null,
        batteryIcon: null,
        fearBar: null,
        timeDisplay: null,
        objectiveText: null,
        notification: null
    },
    
    // Audio
    audio: {
        listener: null,
        ambient: null,
        heartbeat: null,
        wolfHowl: null,
        footsteps: null,
        isMuted: false
    }
};

// ===============================
// WOLF CLASS
// ===============================
class Wolf {
    constructor(x, z, isBoss = false) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.isBoss = isBoss;
        this.position = new THREE.Vector3(x, isBoss ? 0.75 : 0.5, z);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3();
        
        // AI state
        this.state = 'idle'; // idle, stalk, circle, chase, retreat
        this.targetPosition = null;
        this.circleAngle = Math.random() * Math.PI * 2;
        this.attackCooldown = 0;
        this.fearLevel = 0;
        
        // Stats
        this.speed = isBoss ? CONFIG.WOLF.BOSS_SPEED : CONFIG.WOLF.NORMAL_SPEED;
        this.damage = isBoss ? CONFIG.WOLF.BOSS_DAMAGE : CONFIG.WOLF.NORMAL_DAMAGE;
        this.health = isBoss ? 200 : 100;
        this.stalkDistance = CONFIG.WOLF.STALK_DISTANCE * (isBoss ? 1.5 : 1);
        this.chaseDistance = CONFIG.WOLF.CHASE_DISTANCE * (isBoss ? 1.5 : 1);
        this.attackDistance = CONFIG.WOLF.ATTACK_DISTANCE * (isBoss ? 1.2 : 1);
        
        // Visual representation
        this.createMesh();
    }
    
    createMesh() {
        // Create body
        const bodyGeometry = new THREE.BoxGeometry(
            this.isBoss ? 2 : 1,
            this.isBoss ? 1.5 : 1,
            this.isBoss ? 3 : 2
        );
        
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.isBoss ? 0x550000 : 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        GameState.scene.add(this.mesh);
        
        // Create eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.6
        });
        
        this.eyeL = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.eyeR = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.eyeL.position.set(this.isBoss ? 0.3 : 0.2, 0.2, 0.1);
        this.eyeR.position.set(this.isBoss ? 0.3 : 0.2, 0.2, -0.1);
        this.mesh.add(this.eyeL);
        this.mesh.add(this.eyeR);
    }
    
    update(delta) {
        if (!this.mesh || this.health <= 0) return;
        
        const playerPos = GameState.player.position;
        const distance = this.position.distanceTo(playerPos);
        
        // Update AI state
        this.updateState(distance);
        
        // Apply behavior based on state
        switch(this.state) {
            case 'idle':
                this.idleBehavior(delta);
                break;
            case 'stalk':
                this.stalkBehavior(playerPos, delta);
                break;
            case 'circle':
                this.circleBehavior(playerPos, delta);
                break;
            case 'chase':
                this.chaseBehavior(playerPos, delta);
                break;
            case 'retreat':
                this.retreatBehavior(playerPos, delta);
                break;
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
        
        // Update visual position
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Keep on ground
        this.position.y = this.isBoss ? 0.75 : 0.5;
    }
    
    updateState(distance) {
        if (this.state === 'idle' && distance < this.stalkDistance) {
            this.state = 'stalk';
            if (!this.isBoss) {
                GameState.ui.showNotification('A wolf is stalking you...');
            }
        }
        
        if (this.state === 'stalk' && distance < this.chaseDistance) {
            this.state = 'circle';
        }
        
        if (this.state === 'circle' && distance < this.attackDistance * 2) {
            this.state = 'chase';
        }
        
        if (this.state === 'chase' && distance > this.chaseDistance) {
            this.state = 'stalk';
        }
        
        // Fear-based retreat
        if (GameState.player.fear > 80 && Math.random() < 0.01) {
            this.state = 'retreat';
        }
    }
    
    idleBehavior(delta) {
        // Random wandering
        this.circleAngle += delta * 0.5;
        this.position.x += Math.sin(this.circleAngle) * delta * 0.5;
        this.position.z += Math.cos(this.circleAngle) * delta * 0.5;
        
        // Look in movement direction
        const targetAngle = Math.atan2(
            Math.sin(this.circleAngle),
            Math.cos(this.circleAngle)
        );
        this.rotation.y = targetAngle;
    }
    
    stalkBehavior(playerPos, delta) {
        // Move toward player slowly
        const direction = new THREE.Vector3()
            .subVectors(playerPos, this.position)
            .normalize();
        
        this.position.add(direction.multiplyScalar(this.speed * 0.3 * delta));
        this.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    circleBehavior(playerPos, delta) {
        // Circle around player
        this.circleAngle += delta * 1.5;
        const radius = 8;
        
        const targetX = playerPos.x + Math.cos(this.circleAngle) * radius;
        const targetZ = playerPos.z + Math.sin(this.circleAngle) * radius;
        
        const direction = new THREE.Vector3(
            targetX - this.position.x,
            0,
            targetZ - this.position.z
        ).normalize();
        
        this.position.add(direction.multiplyScalar(this.speed * 0.5 * delta));
        this.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    chaseBehavior(playerPos, delta) {
        // Chase player directly
        const direction = new THREE.Vector3()
            .subVectors(playerPos, this.position)
            .normalize();
        
        this.position.add(direction.multiplyScalar(this.speed * delta));
        this.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Check for attack
        const distance = this.position.distanceTo(playerPos);
        if (distance < this.attackDistance && this.attackCooldown <= 0) {
            this.attack();
        }
    }
    
    retreatBehavior(playerPos, delta) {
        // Move away from player
        const direction = new THREE.Vector3()
            .subVectors(this.position, playerPos)
            .normalize();
        
        this.position.add(direction.multiplyScalar(this.speed * delta));
        this.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Return to idle after retreating
        if (this.position.distanceTo(playerPos) > 50) {
            this.state = 'idle';
        }
    }
    
    attack() {
        GameState.player.health -= this.damage;
        GameState.player.fear += this.isBoss ? 20 : 12;
        this.attackCooldown = 2.0;
        
        // Show damage effect
        GameState.ui.showDamageFlash();
        GameState.ui.showNotification(
            this.isBoss ? 'The boss wolf attacks!' : 'Wolf bites you!'
        );
        
        // Play attack sound
        if (GameState.audio.wolfAttack) {
            GameState.audio.wolfAttack.play();
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Remove from scene
        if (this.mesh) {
            GameState.scene.remove(this.mesh);
            
            // Create death effect
            const particles = new THREE.Group();
            for (let i = 0; i < 10; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1),
                    new THREE.MeshBasicMaterial({ color: 0x222222 })
                );
                particle.position.copy(this.position);
                particle.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                );
                particles.add(particle);
            }
            GameState.scene.add(particles);
            
            // Remove particles after 1 second
            setTimeout(() => {
                GameState.scene.remove(particles);
            }, 1000);
        }
        
        // Remove from wolves array
        GameState.wolves = GameState.wolves.filter(w => w.id !== this.id);
        
        // Update story if boss died
        if (this.isBoss) {
            GameState.story.bossDefeated = true;
            GameState.ui.showNotification('BOSS DEFEATED!');
        }
    }
}

// ===============================
// UI CONTROLLER
// ===============================
class UIController {
    constructor() {
        this.elements = {};
        this.notificationQueue = [];
        this.isNotificationShowing = false;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updateAll();
    }
    
    cacheElements() {
        // Cache all UI elements for performance
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            howToPlay: document.getElementById('how-to-play'),
            settings: document.getElementById('settings-menu'),
            gameStart: document.getElementById('game-start'),
            pauseMenu: document.getElementById('pause-menu'),
            clickToPlay: document.getElementById('click-to-play'),
            gameUI: document.getElementById('game-ui'),
            
            // Health
            healthFill: document.getElementById('health-fill'),
            healthValue: document.getElementById('health-value'),
            
            // Stamina
            staminaFill: document.getElementById('stamina-fill'),
            
            // Battery
            batteryIcon: document.getElementById('battery-icon'),
            batteryValue: document.getElementById('battery-value'),
            
            // Fear
            fearIcon: document.getElementById('fear-icon'),
            fearFill: document.getElementById('fear-fill'),
            
            // Time
            gameTime: document.getElementById('game-time'),
            pauseTime: document.getElementById('pause-time'),
            
            // Objective
            objectiveText: document.getElementById('objective-text'),
            
            // Interaction
            interactionPrompt: document.getElementById('interaction-prompt'),
            interactionText: document.getElementById('interaction-text'),
            
            // Notification
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notification-text'),
            
            // Pause menu
            pauseHealth: document.getElementById('pause-health'),
            pauseFear: document.getElementById('pause-fear'),
            
            // Settings
            masterVolume: document.getElementById('master-volume'),
            musicVolume: document.getElementById('music-volume'),
            sfxVolume: document.getElementById('sfx-volume')
        };
    }
    
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.showScreen('gameStart'));
        document.getElementById('how-to-play-btn').addEventListener('click', () => this.showScreen('howToPlay'));
        document.getElementById('settings-btn').addEventListener('click', () => this.showScreen('settings'));
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        
        // Back buttons
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('back-to-menu2').addEventListener('click', () => this.showScreen('mainMenu'));
        
        // Settings
        document.getElementById('apply-settings').addEventListener('click', () => this.applySettings());
        
        // Game start
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        
        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('settings-pause-btn').addEventListener('click', () => {
            this.showScreen('settings');
            this.elements.pauseMenu.style.display = 'none';
        });
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        // Click to play screen
        this.elements.clickToPlay.addEventListener('click', () => this.startGamePlay());
        
        // Volume sliders
        if (this.elements.masterVolume) {
            this.elements.masterVolume.addEventListener('input', (e) => {
                this.updateVolumeDisplay('master-volume-value', e.target.value);
            });
        }
        
        if (this.elements.musicVolume) {
            this.elements.musicVolume.addEventListener('input', (e) => {
                this.updateVolumeDisplay('music-volume-value', e.target.value);
            });
        }
        
        if (this.elements.sfxVolume) {
            this.elements.sfxVolume.addEventListener('input', (e) => {
                this.updateVolumeDisplay('sfx-volume-value', e.target.value);
            });
        }
        
        // Field of view slider
        const fovSlider = document.getElementById('fov');
        if (fovSlider) {
            fovSlider.addEventListener('input', (e) => {
                document.getElementById('fov-value').textContent = `${e.target.value}°`;
            });
        }
        
        // Global ESC key for pause
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.gameUI.style.display === 'block') {
                this.togglePause();
            }
            
            // Debug keys
            if (e.key === 'F1' && e.ctrlKey) {
                this.toggleDebug();
            }
        });
    }
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.elements).forEach(element => {
            if (element && element.classList && element.classList.contains('screen')) {
                element.style.display = 'none';
            }
        });
        
        // Show requested screen
        if (this.elements[screenName]) {
            this.elements[screenName].style.display = 'flex';
        }
    }
    
    startLoading() {
        this.showScreen('loading');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const loadingTip = document.getElementById('loading-tip');
        
        const loadingTips = [
            "Generating forest terrain...",
            "Loading wolf AI...",
            "Setting up lighting system...",
            "Initializing audio engine...",
            "Preparing survival mechanics...",
            "Loading story elements...",
            "Finalizing game world..."
        ];
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => this.loadingComplete(), 500);
            }
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${Math.floor(progress)}%`;
            
            // Change tip every 20% progress
            if (loadingTip && progress % 20 < 15 && progress % 20 > 10) {
                const tipIndex = Math.floor(progress / 20);
                if (tipIndex < loadingTips.length) {
                    loadingTip.textContent = loadingTips[tipIndex];
                }
            }
        }, 200);
    }
    
    loadingComplete() {
        this.showScreen('mainMenu');
        this.playBackgroundMusic();
    }
    
    playBackgroundMusic() {
        // Background music initialization would go here
        console.log("Background music system ready");
    }
    
    startGame() {
        this.showScreen('clickToPlay');
    }
    
    startGamePlay() {
        this.showScreen('gameUI');
        this.elements.clickToPlay.style.display = 'none';
        
        // Initialize the game
        Game.init();
    }
    
    updateAll() {
        this.updateHealth();
        this.updateStamina();
        this.updateBattery();
        this.updateFear();
        this.updateTime();
    }
    
    updateHealth() {
        const health = GameState.player.health;
        const maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        const percentage = (health / maxHealth) * 100;
        
        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = `${percentage}%`;
        }
        
        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = Math.round(health);
        }
        
        if (this.elements.pauseHealth) {
            this.elements.pauseHealth.textContent = Math.round(health);
        }
        
        // Change color based on health
        if (this.elements.healthFill) {
            if (health > 70) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            } else if (health > 40) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
            } else if (health > 20) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #f44336, #ef5350)';
            } else {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #d32f2f, #f44336)';
                // Pulse effect for critical health
                this.elements.healthFill.style.animation = 'pulse 0.5s infinite';
            }
        }
    }
    
    updateStamina() {
        const stamina = GameState.player.stamina;
        const maxStamina = CONFIG.PLAYER.MAX_STAMINA;
        const percentage = (stamina / maxStamina) * 100;
        
        if (this.elements.staminaFill) {
            this.elements.staminaFill.style.width = `${percentage}%`;
            
            // Change color based on stamina
            if (stamina > 50) {
                this.elements.staminaFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
            } else if (stamina > 20) {
                this.elements.staminaFill.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
            } else {
                this.elements.staminaFill.style.background = 'linear-gradient(90deg, #f57c00, #ff9800)';
            }
        }
    }
    
    updateBattery() {
        const battery = GameState.player.battery;
        
        if (this.elements.batteryValue) {
            this.elements.batteryValue.textContent = `${Math.round(battery)}%`;
        }
        
        if (this.elements.batteryIcon) {
            if (battery > 70) {
                this.elements.batteryIcon.className = 'fas fa-battery-full';
                this.elements.batteryIcon.style.color = '#4CAF50';
            } else if (battery > 40) {
                this.elements.batteryIcon.className = 'fas fa-battery-three-quarters';
                this.elements.batteryIcon.style.color = '#ff9800';
            } else if (battery > 20) {
                this.elements.batteryIcon.className = 'fas fa-battery-half';
                this.elements.batteryIcon.style.color = '#ff9800';
            } else if (battery > 10) {
                this.elements.batteryIcon.className = 'fas fa-battery-quarter';
                this.elements.batteryIcon.style.color = '#f44336';
            } else {
                this.elements.batteryIcon.className = 'fas fa-battery-empty';
                this.elements.batteryIcon.style.color = '#d32f2f';
            }
        }
    }
    
    updateFear() {
        const fear = GameState.player.fear;
        const maxFear = CONFIG.PLAYER.MAX_FEAR;
        const percentage = (fear / maxFear) * 100;
        
        if (this.elements.fearFill) {
            this.elements.fearFill.style.width = `${percentage}%`;
        }
        
        if (this.elements.pauseFear) {
            this.elements.pauseFear.textContent = Math.round(fear);
        }
        
        if (this.elements.fearIcon) {
            // Change icon color based on fear
            if (fear > 80) {
                this.elements.fearIcon.style.color = '#d32f2f';
                this.elements.fearIcon.className = 'fas fa-skull-crossbones';
                this.elements.fearFill.style.background = 'linear-gradient(90deg, #d32f2f, #f44336)';
            } else if (fear > 60) {
                this.elements.fearIcon.style.color = '#f44336';
                this.elements.fearIcon.className = 'fas fa-skull';
                this.elements.fearFill.style.background = 'linear-gradient(90deg, #f44336, #ef5350)';
            } else if (fear > 40) {
                this.elements.fearIcon.style.color = '#aa44ff';
                this.elements.fearIcon.className = 'fas fa-ghost';
                this.elements.fearFill.style.background = 'linear-gradient(90deg, #aa44ff, #e040fb)';
            } else {
                this.elements.fearIcon.style.color = '#aa44ff';
                this.elements.fearIcon.className = 'fas fa-skull';
                this.elements.fearFill.style.background = 'linear-gradient(90deg, #aa44ff, #ff44ff)';
            }
        }
    }
    
    updateTime() {
        const gameMinutes = Math.floor(GameState.gameTime / 60);
        const gameSeconds = Math.floor(GameState.gameTime % 60);
        
        // Format time as HH:MM
        const hours = Math.floor(gameMinutes / 60);
        const minutes = gameMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        if (this.elements.gameTime) {
            this.elements.gameTime.textContent = timeString;
        }
        
        if (this.elements.pauseTime) {
            this.elements.pauseTime.textContent = `${gameMinutes}:${gameSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateObjective(text) {
        if (this.elements.objectiveText) {
            this.elements.objectiveText.textContent = text;
        }
    }
    
    showNotification(text, duration = 3000) {
        if (!this.elements.notification || !this.elements.notificationText) return;
        
        this.elements.notificationText.textContent = text;
        this.elements.notification.classList.add('show');
        
        // Remove after duration
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, duration);
        
        // Log to console for debugging
        console.log(`Notification: ${text}`);
    }
    
    showDamageFlash() {
        const flash = document.getElementById('damage-flash');
        if (!flash) return;
        
        flash.style.background = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => {
            flash.style.background = 'rgba(255, 0, 0, 0)';
        }, 300);
    }
    
    showInteractionPrompt(text) {
        if (!this.elements.interactionPrompt || !this.elements.interactionText) return;
        
        this.elements.interactionText.textContent = text;
        this.elements.interactionPrompt.classList.add('show');
    }
    
    hideInteractionPrompt() {
        if (!this.elements.interactionPrompt) return;
        this.elements.interactionPrompt.classList.remove('show');
    }
    
    togglePause() {
        if (GameState.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        GameState.isPaused = true;
        this.showScreen('pauseMenu');
        this.updateAll();
    }
    
    resumeGame() {
        GameState.isPaused = false;
        this.showScreen('gameUI');
    }
    
    quitToMenu() {
        if (confirm("Are you sure you want to quit to main menu? Progress will be lost.")) {
            this.showScreen('mainMenu');
            Game.reset();
        }
    }
    
    applySettings() {
        const settings = {
            quality: document.getElementById('quality').value,
            masterVolume: document.getElementById('master-volume').value,
            musicVolume: document.getElementById('music-volume').value,
            sfxVolume: document.getElementById('sfx-volume').value,
            difficulty: document.getElementById('difficulty').value,
            fov: document.getElementById('fov').value
        };
        
        // Apply FOV to camera
        if (GameState.camera) {
            GameState.camera.fov = parseInt(settings.fov);
            GameState.camera.updateProjectionMatrix();
        }
        
        // Save settings to localStorage
        localStorage.setItem('ears_of_forest_settings', JSON.stringify(settings));
        
        this.showScreen('mainMenu');
        this.showNotification('Settings saved!');
    }
    
    updateVolumeDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${value}%`;
        }
    }
    
    toggleDebug() {
        // Toggle debug mode
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) {
            this.createDebugInfo();
        } else {
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    createDebugInfo() {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            font-family: monospace;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(debugDiv);
        
        // Update debug info every frame
        setInterval(() => {
            if (debugDiv.style.display !== 'none') {
                debugDiv.innerHTML = `
                    FPS: ${Math.round(1/GameState.clock.getDelta())}<br>
                    Pos: ${GameState.player.position.x.toFixed(1)}, ${GameState.player.position.y.toFixed(1)}, ${GameState.player.position.z.toFixed(1)}<br>
                    Health: ${GameState.player.health.toFixed(0)}<br>
                    Fear: ${GameState.player.fear.toFixed(0)}<br>
                    Wolves: ${GameState.wolves.length}<br>
                    Time: ${GameState.gameTime.toFixed(0)}s
                `;
            }
        }, 100);
    }
    
    quitGame() {
        if (confirm("Are you sure you want to quit the game?")) {
            // Close window or navigate away
            window.close();
        }
    }
}

// ===============================
// GAME ENGINE
// ===============================
class GameEngine {
    constructor() {
        this.ui = new UIController();
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        this.fps = 60;
    }
    
    init() {
        // Initialize Three.js
        this.initThreeJS();
        
        // Setup game world
        this.setupWorld();
        
        // Setup input
        this.setupInput();
        
        // Setup audio
        this.setupAudio();
        
        // Start game loop
        this.startGameLoop();
        
        // Show initial objective
        this.ui.updateObjective("Find your way out of the forest");
        this.ui.showNotification("You wake up in the forest... Watch for wolves.");
    }
    
    initThreeJS() {
        // Scene
        GameState.scene = new THREE.Scene();
        GameState.scene.fog = new THREE.Fog(0xcccccc, 20, 150);
        
        // Camera
        GameState.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        GameState.camera.position.set(0, 1.7, 5);
        
        // Renderer
        GameState.renderer = new THREE.WebGLRenderer({ antialias: true });
        GameState.renderer.setSize(window.innerWidth, window.innerHeight);
        GameState.renderer.setPixelRatio(window.devicePixelRatio);
        GameState.renderer.shadowMap.enabled = true;
        GameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(GameState.renderer.domElement);
        
        // Clock
        GameState.clock = new THREE.Clock();
        
        // Controls
        GameState.controls = new THREE.PointerLockControls(GameState.camera, document.body);
        GameState.scene.add(GameState.controls.getObject());
        
        // Pointer lock events
        GameState.controls.addEventListener('lock', () => {
            console.log("Pointer locked - game controls active");
        });
        
        GameState.controls.addEventListener('unlock', () => {
            console.log("Pointer unlocked");
        });
        
        // Click to lock
        document.addEventListener('click', () => {
            if (!GameState.controls.isLocked && !GameState.isPaused) {
                GameState.controls.lock();
            }
        });
    }
    
    setupWorld() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        GameState.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        GameState.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(500, 500, 64, 64);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4f6b4f,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        GameState.scene.add(ground);
        
        // Add terrain variation
        const vertices = groundGeometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i);
            const z = vertices.getZ(i);
            const height = Math.sin(x * 0.05) * 1.5 + Math.cos(z * 0.05) * 1.5;
            vertices.setY(i, height);
        }
        groundGeometry.computeVertexNormals();
        
        // Add trees
        this.generateTrees(50);
        
        // Add rocks
        this.generateRocks(30);
        
        // Create cave
        this.createCave();
    }
    
    generateTrees(count) {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness: 1 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f5f2f, roughness: 0.9 });
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            
            // Avoid spawn area
            if (Math.abs
