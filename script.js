/* =========================================================
   EARS OF THE FOREST - WORKING CUTSCENES
========================================================= */

// ===============================
// CUTSCENE SYSTEM (FIXED)
// ===============================
class CutsceneSystem {
    constructor() {
        this.currentCutscene = null;
        this.cutsceneTime = 0;
        this.dialogueIndex = 0;
        this.isPlaying = false;
        this.onComplete = null;
        this.visuals = [];
        this.dialogueTimeout = null;
        
        // Store CSS styles
        this.addCutsceneStyles();
        
        // Create UI
        this.createCutsceneUI();
    }
    
    addCutsceneStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.5); }
                50% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.8); }
            }
            
            #cutscene-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: #000 !important;
                z-index: 9999 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                font-family: 'Arial', sans-serif !important;
            }
            
            #cutscene-dialogue {
                max-width: 800px;
                text-align: center;
                padding: 30px;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 10px;
                border: 2px solid #4CAF50;
                animation: fadeIn 0.5s ease-out;
            }
            
            #cutscene-text {
                font-size: 1.8rem;
                color: white;
                margin-bottom: 20px;
                line-height: 1.5;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            
            #cutscene-character {
                font-size: 1.2rem;
                color: #4CAF50;
                font-style: italic;
                margin-bottom: 10px;
            }
            
            #cutscene-continue {
                font-size: 1rem;
                color: #888;
                animation: pulse 1.5s infinite;
                margin-top: 20px;
            }
            
            .cinematic-bar {
                position: absolute;
                left: 0;
                width: 100%;
                height: 100px;
                background: rgba(0,0,0,0.8);
                z-index: 1;
            }
            
            .cinematic-bar.top {
                top: 0;
                background: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
            }
            
            .cinematic-bar.bottom {
                bottom: 0;
                background: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
            }
            
            .cutscene-effect {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    createCutsceneUI() {
        // Remove existing
        const existing = document.getElementById('cutscene-container');
        if (existing) existing.remove();
        
        // Create container
        const container = document.createElement('div');
        container.id = 'cutscene-container';
        document.body.appendChild(container);
        
        // Add click handler
        container.addEventListener('click', () => this.advanceDialogue());
    }
    
    play(cutsceneName, onComplete = null) {
        console.log(`Starting cutscene: ${cutsceneName}`);
        
        // Define cutscenes
        const cutscenes = {
            opening: {
                name: "Field Trip",
                dialogues: [
                    {
                        text: "Wake up, sleepyhead! Today's the big field trip to the national forest!",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "Ugh... five more minutes...",
                        character: "You",
                        delay: 2
                    },
                    {
                        text: "No way! We're going to see the oldest trees in the state! I heard there's one over 500 years old!",
                        character: "Alex",
                        delay: 4
                    },
                    {
                        text: "Alright, alright, I'm up. Did you pack extra snacks?",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "Duh! And I brought my new hiking boots. Let's catch the bus before it leaves without us!",
                        character: "Alex",
                        delay: 4
                    },
                    {
                        text: "The bus ride is bumpy but filled with laughter. You and Alex joke about school and what you might find.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "As you enter the forest, the teacher gives instructions...",
                        character: "Narrator",
                        delay: 3
                    },
                    {
                        text: "Stay on the marked paths, stay with your partner, and be back by 3 PM sharp!",
                        character: "Teacher",
                        delay: 4
                    },
                    {
                        text: "You and Alex decide to explore deeper, convinced you'll find something amazing...",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "Wait... which way did we come from?",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "I thought you were keeping track!",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "The path disappears. The trees look the same in every direction. And it's getting darker...",
                        character: "Narrator",
                        delay: 5
                    },
                    {
                        text: "You hear a distant howl. It's not just lost anymore...",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "Find your way out. Watch for wolves. Use your flashlight wisely.",
                        character: "Narrator",
                        delay: 4
                    }
                ]
            },
            goodEnding: {
                name: "Safe Return",
                dialogues: [
                    {
                        text: "You see it! The edge of the forest! The parking lot!",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "We made it... we actually made it!",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "The teacher rushes over as you stumble out of the trees.",
                        character: "Narrator",
                        delay: 3
                    },
                    {
                        text: "We were so worried! The search party was about to go in after dark!",
                        character: "Teacher",
                        delay: 4
                    },
                    {
                        text: "Wolves... there were wolves...",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "The ride home is quiet. Everyone is exhausted but safe.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "GOOD ENDING: SURVIVAL",
                        character: "",
                        delay: 4
                    },
                    {
                        text: "You and Alex made it out alive.",
                        character: "",
                        delay: 3
                    }
                ]
            },
            badEnding: {
                name: "The Feast",
                dialogues: [
                    {
                        text: "There's too many of them... we're surrounded!",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "Just keep moving! Don't look back!",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "A snarl comes from the left. Then the right. Yellow eyes appear.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "I can't run anymore... my leg...",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "Get up! Please, get up!",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "The wolves close in. Their breath is hot. Their eyes are hungry.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "I'm sorry... I'm so sorry...",
                        character: "Alex",
                        delay: 3
                    },
                    {
                        text: "NO!",
                        character: "You",
                        delay: 2
                    },
                    {
                        text: "BAD ENDING: THE FEAST",
                        character: "",
                        delay: 4
                    },
                    {
                        text: "The forest claimed new victims.",
                        character: "",
                        delay: 3
                    }
                ]
            },
            secretEnding: {
                name: "Heartseed Tree",
                dialogues: [
                    {
                        text: "What... what is this place?",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "Before you stands a magnificent tree. Its bark glows with soft light.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "Welcome, child of the forest. I am the Heartseed.",
                        character: "Heartseed Tree",
                        delay: 4
                    },
                    {
                        text: "You... you can talk?",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "I am the memory of this forest. You have wandered far.",
                        character: "Heartseed Tree",
                        delay: 4
                    },
                    {
                        text: "The tree's voice isn't just in your ears. It's in everything.",
                        character: "Narrator",
                        delay: 4
                    },
                    {
                        text: "I hear it... I hear everything...",
                        character: "You",
                        delay: 3
                    },
                    {
                        text: "Goodbye, Alex. Tell them I found what I was looking for.",
                        character: "You",
                        delay: 4
                    },
                    {
                        text: "SECRET ENDING: BECOMING",
                        character: "",
                        delay: 4
                    },
                    {
                        text: "You became part of the forest.",
                        character: "",
                        delay: 3
                    }
                ]
            }
        };
        
        if (!cutscenes[cutsceneName]) {
            console.error(`Cutscene "${cutsceneName}" not found`);
            if (onComplete) onComplete();
            return;
        }
        
        this.currentCutscene = cutscenes[cutsceneName];
        this.cutsceneTime = 0;
        this.dialogueIndex = 0;
        this.isPlaying = true;
        this.onComplete = onComplete;
        
        // Show container
        const container = document.getElementById('cutscene-container');
        container.style.display = 'flex';
        
        // Set background based on cutscene
        if (cutsceneName === 'badEnding') {
            container.style.background = 'linear-gradient(45deg, #330000, #000000)';
        } else if (cutsceneName === 'secretEnding') {
            container.style.background = 'linear-gradient(45deg, #0a2f0a, #000000)';
        } else {
            container.style.background = '#000';
        }
        
        // Add cinematic bars
        this.addCinematicBars();
        
        // Start first dialogue
        this.showDialogue();
        
        // Update game state
        GameState.isInCutscene = true;
        GameState.isPaused = true;
        
        console.log("Cutscene started successfully");
    }
    
    addCinematicBars() {
        const container = document.getElementById('cutscene-container');
        
        // Remove existing bars
        const existingBars = container.querySelectorAll('.cinematic-bar');
        existingBars.forEach(bar => bar.remove());
        
        // Add top bar
        const topBar = document.createElement('div');
        topBar.className = 'cinematic-bar top';
        container.appendChild(topBar);
        
        // Add bottom bar
        const bottomBar = document.createElement('div');
        bottomBar.className = 'cinematic-bar bottom';
        container.appendChild(bottomBar);
    }
    
    showDialogue() {
        if (!this.currentCutscene || this.dialogueIndex >= this.currentCutscene.dialogues.length) {
            this.endCutscene();
            return;
        }
        
        const dialogue = this.currentCutscene.dialogues[this.dialogueIndex];
        const container = document.getElementById('cutscene-container');
        
        // Clear previous dialogue
        const existingDialogue = container.querySelector('#cutscene-dialogue');
        if (existingDialogue) existingDialogue.remove();
        
        // Create new dialogue box
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'cutscene-dialogue';
        
        const dialogueText = document.createElement('div');
        dialogueText.id = 'cutscene-text';
        dialogueText.textContent = dialogue.text;
        
        const characterName = document.createElement('div');
        characterName.id = 'cutscene-character';
        characterName.textContent = dialogue.character;
        
        const continuePrompt = document.createElement('div');
        continuePrompt.id = 'cutscene-continue';
        continuePrompt.textContent = 'CLICK TO CONTINUE';
        
        dialogueBox.appendChild(dialogueText);
        if (dialogue.character) {
            dialogueBox.appendChild(characterName);
        }
        dialogueBox.appendChild(continuePrompt);
        
        container.appendChild(dialogueBox);
        
        // Apply special effects for titles
        if (dialogue.text.includes('ENDING:')) {
            dialogueText.style.fontSize = '2.5rem';
            dialogueText.style.color = dialogue.text.includes('GOOD') ? '#4CAF50' : 
                                     dialogue.text.includes('BAD') ? '#ff4444' : 
                                     dialogue.text.includes('SECRET') ? '#8BC34A' : '#ffffff';
            dialogueText.style.textShadow = '0 0 20px currentColor';
            dialogueText.style.animation = 'glow 2s infinite';
        }
        
        // Clear any previous timeout
        if (this.dialogueTimeout) {
            clearTimeout(this.dialogueTimeout);
        }
        
        // Auto-advance after delay
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, dialogue.delay * 1000);
        
        this.dialogueIndex++;
    }
    
    advanceDialogue() {
        if (this.dialogueTimeout) {
            clearTimeout(this.dialogueTimeout);
            this.dialogueTimeout = null;
        }
        this.showDialogue();
    }
    
    endCutscene() {
        console.log("Ending cutscene");
        
        this.isPlaying = false;
        this.currentCutscene = null;
        
        // Hide container
        const container = document.getElementById('cutscene-container');
        container.style.display = 'none';
        
        // Clear contents
        container.innerHTML = '';
        
        // Remove any visual effects
        const effects = document.querySelectorAll('.cutscene-effect');
        effects.forEach(effect => effect.remove());
        
        // Resume game
        GameState.isInCutscene = false;
        GameState.isPaused = false;
        
        // Call completion callback
        if (this.onComplete) {
            console.log("Calling completion callback");
            setTimeout(() => this.onComplete(), 100);
        }
    }
}

// ===============================
// SIMPLE GAME ENGINE
// ===============================
class GameEngine {
    constructor() {
        this.cutscene = new CutsceneSystem();
        this.ui = new SimpleUI();
        this.initialized = false;
    }
    
    init() {
        console.log("GameEngine initializing...");
        
        // Start with opening cutscene
        this.cutscene.play('opening', () => {
            console.log("Opening cutscene complete, starting game...");
            this.startGame();
        });
    }
    
    startGame() {
        console.log("Starting game...");
        
        // Initialize Three.js if not already
        if (!GameState.scene) {
            this.initThreeJS();
        }
        
        // Setup world
        this.setupWorld();
        
        // Setup input
        this.setupInput();
        
        // Show UI
        this.ui.show();
        
        // Start game loop
        this.startGameLoop();
        
        // Show initial message
        this.ui.showNotification("You're lost in the forest. Find your way out!");
        
        this.initialized = true;
    }
    
    initThreeJS() {
        console.log("Initializing Three.js...");
        
        // Scene
        GameState.scene = new THREE.Scene();
        GameState.scene.background = new THREE.Color(0x87CEEB);
        GameState.scene.fog = new THREE.Fog(0xCCCCCC, 20, 150);
        
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
        
        // Add canvas to game container
        const gameContainer = document.getElementById('game-container') || document.body;
        gameContainer.appendChild(GameState.renderer.domElement);
        
        // Show game container
        gameContainer.style.display = 'block';
        
        // Clock
        GameState.clock = new THREE.Clock();
        
        // Simple controls (no pointer lock for now)
        GameState.controls = {
            getObject: () => ({ position: GameState.camera.position })
        };
        
        // Handle window resize
        window.addEventListener('resize', () => {
            GameState.camera.aspect = window.innerWidth / window.innerHeight;
            GameState.camera.updateProjectionMatrix();
            GameState.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupWorld() {
        console.log("Setting up world...");
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        GameState.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        GameState.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4f6b4f,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        GameState.scene.add(ground);
        
        // Add some trees
        this.createTrees(20);
        
        // Add a path
        this.createPath();
        
        console.log("World setup complete");
    }
    
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
            GameState.scene.add(trunk);
            
            // Leaves
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(2, 8, 8),
                leafMat
            );
            leaves.position.set(x, 6, z);
            leaves.castShadow = true;
            GameState.scene.add(leaves);
        }
    }
    
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
        GameState.scene.add(path);
    }
    
    setupInput() {
        console.log("Setting up input...");
        
        // Movement keys
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': GameState.input.forward = true; break;
                case 'KeyS': GameState.input.backward = true; break;
                case 'KeyA': GameState.input.left = true; break;
                case 'KeyD': GameState.input.right = true; break;
                case 'ShiftLeft': GameState.input.sprint = true; break;
                case 'Space': GameState.input.jump = true; break;
                case 'KeyF': 
                    GameState.input.flashlight = !GameState.input.flashlight;
                    this.ui.showNotification(GameState.input.flashlight ? "Flashlight ON" : "Flashlight OFF");
                    break;
                case 'KeyH':
                    if (GameState.inventory.medkits > 0) {
                        GameState.player.health = Math.min(100, GameState.player.health + 40);
                        GameState.inventory.medkits--;
                        this.ui.updateAll();
                        this.ui.showNotification("Used Medkit: +40 Health");
                    }
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
                case 'KeyR':
                    // Test ending cutscenes
                    if (e.shiftKey) {
                        this.testEnding('goodEnding');
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': GameState.input.forward = false; break;
                case 'KeyS': GameState.input.backward = false; break;
                case 'KeyA': GameState.input.left = false; break;
                case 'KeyD': GameState.input.right = false; break;
                case 'ShiftLeft': GameState.input.sprint = false; break;
                case 'Space': GameState.input.jump = false; break;
            }
        });
        
        // Click to start movement
        document.addEventListener('click', () => {
            if (!GameState.isPaused && !GameState.isInCutscene) {
                // Start moving camera
                console.log("Game controls active");
            }
        });
    }
    
    updatePlayer(delta) {
        if (GameState.isPaused || GameState.isInCutscene) return;
        
        const speed = GameState.input.sprint ? 10 : 5;
        
        // Movement
        if (GameState.input.forward) {
            GameState.camera.position.z -= speed * delta;
        }
        if (GameState.input.backward) {
            GameState.camera.position.z += speed * delta;
        }
        if (GameState.input.left) {
            GameState.camera.position.x -= speed * delta;
        }
        if (GameState.input.right) {
            GameState.camera.position.x += speed * delta;
        }
        
        // Update player position
        GameState.player.position.copy(GameState.camera.position);
        
        // Update game time
        GameState.gameTime += delta;
        
        // Update UI
        this.ui.updateAll();
        
        // Check for endings (test)
        if (GameState.camera.position.z < -150) {
            this.triggerGoodEnding();
        }
        
        if (GameState.player.health <= 0) {
            this.triggerBadEnding();
        }
        
        // Simulate wolf encounter after 30 seconds
        if (GameState.gameTime > 30 && !GameState.events.firstWolfSpawned) {
            GameState.events.firstWolfSpawned = true;
            this.ui.showNotification("You hear a wolf howl in the distance...");
            GameState.player.fear += 20;
        }
    }
    
    startGameLoop() {
        console.log("Starting game loop...");
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            const delta = GameState.clock.getDelta();
            
            // Update player
            this.updatePlayer(delta);
            
            // Render scene
            if (GameState.renderer && GameState.scene && GameState.camera) {
                GameState.renderer.render(GameState.scene, GameState.camera);
            }
            
            // Update frame counter
            this.ui.frameCount++;
            if (this.ui.frameCount % 60 === 0) {
                this.ui.updateTime();
            }
        };
        
        animate();
    }
    
    togglePause() {
        GameState.isPaused = !GameState.isPaused;
        if (GameState.isPaused) {
            this.ui.showPauseMenu();
        } else {
            this.ui.hidePauseMenu();
        }
    }
    
    triggerGoodEnding() {
        console.log("Triggering good ending...");
        GameState.isPaused = true;
        this.cutscene.play('goodEnding', () => {
            this.showEndScreen('good');
        });
    }
    
    triggerBadEnding() {
        console.log("Triggering bad ending...");
        GameState.isPaused = true;
        this.cutscene.play('badEnding', () => {
            this.showEndScreen('bad');
        });
    }
    
    testEnding(ending) {
        console.log(`Testing ${ending}...`);
        GameState.isPaused = true;
        this.cutscene.play(ending, () => {
            this.showEndScreen(ending.replace('Ending', '').toLowerCase());
        });
    }
    
    showEndScreen(type) {
        const color = type === 'good' ? '#4CAF50' : 
                     type === 'bad' ? '#ff4444' : '#8BC34A';
        
        const title = type === 'good' ? 'GOOD ENDING' :
                     type === 'bad' ? 'BAD ENDING' : 'SECRET ENDING';
        
        const endScreen = document.createElement('div');
        endScreen.style.cssText = `
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
            font-family: Arial, sans-serif;
        `;
        
        endScreen.innerHTML = `
            <h1 style="font-size: 3rem; color: ${color}; margin-bottom: 2rem; text-shadow: 0 0 20px ${color}">
                ${title}
            </h1>
            <p style="font-size: 1.5rem; margin-bottom: 3rem; text-align: center; max-width: 600px">
                ${type === 'good' ? 'You escaped the forest with Alex!' : 
                 type === 'bad' ? 'The wolves were too many...' : 
                 'You became one with the forest.'}
            </p>
            <div style="margin-bottom: 3rem; font-size: 1.2rem; color: #888">
                Time Survived: ${Math.floor(GameState.gameTime)} seconds
            </div>
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
        `;
        
        document.body.appendChild(endScreen);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            endScreen.remove();
            GameState.isPaused = false;
            // Return to main menu would go here
        });
    }
}

// ===============================
// SIMPLE UI
// ===============================
class SimpleUI {
    constructor() {
        this.frameCount = 0;
        this.createUI();
    }
    
    createUI() {
        // Remove existing UI
        const existing = document.getElementById('game-ui');
        if (existing) existing.remove();
        
        // Create UI container
        const ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            font-family: Arial, sans-serif;
            color: white;
            text-shadow: 1px 1px 2px black;
        `;
        
        // Health
        ui.innerHTML += `
            <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #ff4444; font-size: 1.5rem;">❤️</span>
                    <div style="width: 150px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                        <div id="health-bar" style="height: 100%; background: #ff4444; width: 100%;"></div>
                    </div>
                    <span id="health-text" style="font-weight: bold;">100</span>
                </div>
            </div>
        `;
        
        // Fear
        ui.innerHTML += `
            <div style="position: absolute; top: 70px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #aa44ff; font-size: 1.5rem;">😨</span>
                    <div style="width: 150px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                        <div id="fear-bar" style="height: 100%; background: #aa44ff; width: 5%;"></div>
                    </div>
                    <span id="fear-text" style="font-weight: bold;">5</span>
                </div>
            </div>
        `;
        
        // Battery
        ui.innerHTML += `
            <div style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #44aaff; font-size: 1.5rem;">🔦</span>
                    <span id="battery-text" style="font-weight: bold;">100%</span>
                </div>
            </div>
        `;
        
        // Time
        ui.innerHTML += `
            <div style="position: absolute; top: 70px; right: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #4CAF50; font-size: 1.5rem;">🕐</span>
                    <span id="time-text" style="font-weight: bold;">0:00</span>
                </div>
            </div>
        `;
        
        // Inventory
        ui.innerHTML += `
            <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px;">
                <div style="font-weight: bold; margin-bottom: 5px;">Inventory</div>
                <div>Medkits: <span id="medkit-count">1</span></div>
                <div>Batteries: <span id="battery-count">2</span></div>
            </div>
        `;
        
        // Notification
        ui.innerHTML += `
            <div id="notification" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                padding: 20px 40px;
                border-radius: 10px;
                border: 2px solid #4CAF50;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            ">
                <span id="notification-text"></span>
            </div>
        `;
        
        // Crosshair
        ui.innerHTML += `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <div style="width: 4px; height: 4px; background: white; border-radius: 50%; box-shadow: 0 0 5px black;"></div>
            </div>
        `;
        
        document.body.appendChild(ui);
        
        // Create pause menu
        this.createPauseMenu();
    }
    
    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        pauseMenu.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 2rem; color: #4CAF50">PAUSED</h1>
            <div style="margin-bottom: 2rem; font-size: 1.2rem;">
                <div>Health: ${GameState.player.health}</div>
                <div>Time: <span id="pause-time">0:00</span></div>
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
        `;
        
        document.body.appendChild(pauseMenu);
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            GameState.isPaused = false;
            pauseMenu.style.display = 'none';
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    show() {
        const ui = document.getElementById('game-ui');
        if (ui) ui.style.display = 'block';
    }
    
    hide() {
        const ui = document.getElementById('game-ui');
        if (ui) ui.style.display = 'none';
    }
    
    updateAll() {
        // Health
        const healthPercent = (GameState.player.health / 100) * 100;
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar) healthBar.style.width = `${healthPercent}%`;
        if (healthText) healthText.textContent = Math.round(GameState.player.health);
        
        // Fear
        const fearPercent = (GameState.player.fear / 100) * 100;
        const fearBar = document.getElementById('fear-bar');
        const fearText = document.getElementById('fear-text');
        if (fearBar) fearBar.style.width = `${fearPercent}%`;
        if (fearText) fearText.textContent = Math.round(GameState.player.fear);
        
        // Battery
        const batteryText = document.getElementById('battery-text');
        if (batteryText) batteryText.textContent = `${Math.round(GameState.player.battery)}%`;
        
        // Inventory
        const medkitCount = document.getElementById('medkit-count');
        const batteryCount = document.getElementById('battery-count');
        if (medkitCount) medkitCount.textContent = GameState.inventory.medkits;
        if (batteryCount) batteryCount.textContent = GameState.inventory.batteries;
        
        // Update pause time
        const pauseTime = document.getElementById('pause-time');
        if (pauseTime) {
            const minutes = Math.floor(GameState.gameTime / 60);
            const seconds = Math.floor(GameState.gameTime % 60);
            pauseTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateTime() {
        const timeText = document.getElementById('time-text');
        if (timeText) {
            const minutes = Math.floor(GameState.gameTime / 60);
            const seconds = Math.floor(GameState.gameTime % 60);
            timeText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    showNotification(text, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (notification && notificationText) {
            notificationText.textContent = text;
            notification.style.opacity = '1';
            
            setTimeout(() => {
                notification.style.opacity = '0';
            }, duration);
        }
    }
    
    showPauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'flex';
        }
    }
    
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
    }
}

// ===============================
// START THE GAME
// ===============================
let game;

window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game...");
    
    // Create game instance
    game = new GameEngine();
    
    // Start the game
    game.init();
});

// Make game accessible from console for testing
window.Game = game;
window.GameState = GameState;
