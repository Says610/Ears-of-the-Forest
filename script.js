/* =========================================================
   EARS OF THE FOREST - COMPLETE GAME WITH CUTSCENES
========================================================= */

// ===============================
// CUTSCENE SYSTEM
// ===============================
class CutsceneSystem {
    constructor() {
        this.currentCutscene = null;
        this.cutsceneTime = 0;
        this.dialogueIndex = 0;
        this.isPlaying = false;
        this.onComplete = null;
        
        // Cutscene definitions
        this.cutscenes = {
            opening: this.createOpeningCutscene(),
            goodEnding: this.createGoodEnding(),
            badEnding: this.createBadEnding(),
            secretEnding: this.createSecretEnding()
        };
        
        // Cutscene UI element
        this.cutsceneUI = this.createCutsceneUI();
    }
    
    createCutsceneUI() {
        const container = document.createElement('div');
        container.id = 'cutscene-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 10000;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Cinzel', serif;
            overflow: hidden;
        `;
        
        // Dialogue container
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'cutscene-dialogue';
        dialogueBox.style.cssText = `
            max-width: 800px;
            text-align: center;
            margin-bottom: 50px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            border: 2px solid rgba(76, 175, 80, 0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        `;
        
        const dialogueText = document.createElement('div');
        dialogueText.id = 'cutscene-text';
        dialogueText.style.cssText = `
            font-size: 1.8rem;
            line-height: 1.6;
            margin-bottom: 20px;
            min-height: 100px;
        `;
        
        const characterName = document.createElement('div');
        characterName.id = 'cutscene-character';
        characterName.style.cssText = `
            font-size: 1.2rem;
            color: #4CAF50;
            margin-top: 10px;
            font-style: italic;
        `;
        
        const continuePrompt = document.createElement('div');
        continuePrompt.id = 'cutscene-continue';
        continuePrompt.textContent = 'Click to continue...';
        continuePrompt.style.cssText = `
            font-size: 1rem;
            color: #888;
            margin-top: 20px;
            animation: pulse 1.5s infinite;
        `;
        
        dialogueBox.appendChild(dialogueText);
        dialogueBox.appendChild(characterName);
        dialogueBox.appendChild(continuePrompt);
        
        // Cinematic bars
        const topBar = document.createElement('div');
        topBar.className = 'cinematic-bar';
        topBar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0));
            z-index: 1;
        `;
        
        const bottomBar = document.createElement('div');
        bottomBar.className = 'cinematic-bar';
        bottomBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0));
            z-index: 1;
        `;
        
        container.appendChild(topBar);
        container.appendChild(bottomBar);
        container.appendChild(dialogueBox);
        document.body.appendChild(container);
        
        // Add click handler
        container.addEventListener('click', () => this.advanceDialogue());
        
        return container;
    }
    
    createOpeningCutscene() {
        return {
            name: "Field Trip",
            duration: 60,
            dialogues: [
                {
                    text: "Wake up, sleepyhead! Today's the big field trip to the national forest!",
                    character: "Alex",
                    delay: 1,
                    audio: "excited"
                },
                {
                    text: "Ugh... five more minutes...",
                    character: "You",
                    delay: 2,
                    audio: "groggy"
                },
                {
                    text: "No way! We're going to see the oldest trees in the state! I heard there's one over 500 years old!",
                    character: "Alex",
                    delay: 2,
                    audio: "excited"
                },
                {
                    text: "Alright, alright, I'm up. Did you pack extra snacks?",
                    character: "You",
                    delay: 2,
                    audio: "normal"
                },
                {
                    text: "Duh! And I brought my new hiking boots. Let's catch the bus before it leaves without us!",
                    character: "Alex",
                    delay: 2,
                    audio: "excited"
                },
                {
                    text: "The bus ride is bumpy but filled with laughter. You and Alex joke about school, teachers, and what you might find in the forest.",
                    character: "Narrator",
                    delay: 3,
                    effect: "fade"
                },
                {
                    text: "As you enter the forest, the trees tower overhead. The teacher gives instructions...",
                    character: "Teacher",
                    delay: 2,
                    audio: "serious"
                },
                {
                    text: "Stay on the marked paths, stay with your partner, and be back at the bus by 3 PM sharp. No exceptions!",
                    character: "Teacher",
                    delay: 3,
                    audio: "serious"
                },
                {
                    text: "You and Alex decide to explore a bit deeper, convinced you'll find something amazing...",
                    character: "Narrator",
                    delay: 3,
                    effect: "fade"
                },
                {
                    text: "Wait... which way did we come from?",
                    character: "Alex",
                    delay: 2,
                    audio: "worried"
                },
                {
                    text: "I thought you were keeping track!",
                    character: "You",
                    delay: 2,
                    audio: "nervous"
                },
                {
                    text: "The path disappears. The trees look the same in every direction. And it's getting darker...",
                    character: "Narrator",
                    delay: 4,
                    effect: "darken"
                },
                {
                    text: "You hear a distant howl. It's not just lost anymore...",
                    character: "Narrator",
                    delay: 3,
                    audio: "wolf_howl",
                    effect: "shock"
                },
                {
                    text: "Find your way out. Watch for wolves. Use your flashlight wisely.",
                    character: "Narrator",
                    delay: 4,
                    effect: "fade_out"
                }
            ],
            cameraPath: [
                { x: 0, y: 1.7, z: 10, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: 5, y: 2, z: 8, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: -5, y: 2, z: 8, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: 0, y: 3, z: 15, lookAt: { x: 0, y: 0, z: 0 } },
                { x: 0, y: 1.7, z: 5, lookAt: { x: 0, y: 1.7, z: 0 } }
            ],
            effects: [
                { time: 0, type: "fade_in", duration: 2 },
                { time: 55, type: "fade_out", duration: 5 }
            ]
        };
    }
    
    createGoodEnding() {
        return {
            name: "Safe Return",
            duration: 45,
            dialogues: [
                {
                    text: "You see it! The edge of the forest! The parking lot!",
                    character: "Alex",
                    delay: 2,
                    audio: "relieved"
                },
                {
                    text: "We made it... we actually made it!",
                    character: "You",
                    delay: 2,
                    audio: "exhausted"
                },
                {
                    text: "The teacher rushes over as you stumble out of the trees. Other students cheer and clap.",
                    character: "Narrator",
                    delay: 3,
                    effect: "brighten"
                },
                {
                    text: "We were so worried! The search party was about to go in after dark!",
                    character: "Teacher",
                    delay: 2,
                    audio: "relieved"
                },
                {
                    text: "Wolves... there were wolves...",
                    character: "Alex",
                    delay: 2,
                    audio: "traumatized"
                },
                {
                    text: "The ride home is quiet. Everyone is exhausted but safe.",
                    character: "Narrator",
                    delay: 3,
                    effect: "fade"
                },
                {
                    text: "Later that week, at Alex's house...",
                    character: "Narrator",
                    delay: 2,
                    effect: "scene_change"
                },
                {
                    text: "I still hear the howls in my sleep sometimes.",
                    character: "Alex",
                    delay: 2,
                    audio: "quiet"
                },
                {
                    text: "Me too. But we survived. That's what matters.",
                    character: "You",
                    delay: 2,
                    audio: "reflective"
                },
                {
                    text: "You both raise your hot chocolates in a silent toast. The nightmare is over.",
                    character: "Narrator",
                    delay: 4,
                    effect: "fade_out"
                },
                {
                    text: "GOOD ENDING: SURVIVAL",
                    character: "",
                    delay: 3,
                    effect: "title",
                    special: true
                },
                {
                    text: "You and Alex made it out alive.\nThe forest taught you the value of friendship\nand the will to survive against all odds.",
                    character: "",
                    delay: 5,
                    effect: "credits"
                }
            ],
            cameraPath: [
                { x: 0, y: 2, z: 10, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: 5, y: 1.5, z: 5, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: 0, y: 1.7, z: 3, lookAt: { x: 0, y: 1.7, z: 0 } }
            ],
            effects: [
                { time: 0, type: "fade_in", duration: 2 },
                { time: 40, type: "fade_out", duration: 5 }
            ]
        };
    }
    
    createBadEnding() {
        return {
            name: "The Pack's Feast",
            duration: 40,
            dialogues: [
                {
                    text: "There's too many of them... we're surrounded!",
                    character: "Alex",
                    delay: 2,
                    audio: "panicked"
                },
                {
                    text: "Just keep moving! Don't look back!",
                    character: "You",
                    delay: 2,
                    audio: "desperate"
                },
                {
                    text: "A snarl comes from the left. Then the right. Yellow eyes appear in the darkness.",
                    character: "Narrator",
                    delay: 3,
                    audio: "wolf_growl",
                    effect: "darken"
                },
                {
                    text: "I can't run anymore... my leg...",
                    character: "Alex",
                    delay: 2,
                    audio: "pain"
                },
                {
                    text: "Get up! Please, get up!",
                    character: "You",
                    delay: 2,
                    audio: "terrified"
                },
                {
                    text: "The wolves close in. Their breath is hot. Their eyes are hungry.",
                    character: "Narrator",
                    delay: 3,
                    audio: "wolf_snarls"
                },
                {
                    text: "I'm sorry... I'm so sorry...",
                    character: "Alex",
                    delay: 2,
                    audio: "final"
                },
                {
                    text: "NO!",
                    character: "You",
                    delay: 1,
                    audio: "scream",
                    effect: "shake"
                },
                {
                    text: "The forest falls silent after the feast.\nOnly the wind remains to tell the tale.",
                    character: "Narrator",
                    delay: 4,
                    effect: "blood",
                    audio: "wind"
                },
                {
                    text: "BAD ENDING: THE FEAST",
                    character: "",
                    delay: 3,
                    effect: "title_red",
                    special: true
                },
                {
                    text: "The forest claimed new victims.\nSome are lost to the woods forever,\ntheir stories ending with howls in the night.",
                    character: "",
                    delay: 5,
                    effect: "credits_red"
                }
            ],
            cameraPath: [
                { x: 0, y: 1.7, z: 5, lookAt: { x: 0, y: 1.7, z: 0 } },
                { x: 0, y: 1.2, z: 3, lookAt: { x: 0, y: 1, z: 0 } },
                { x: 0, y: 0.5, z: 2, lookAt: { x: 0, y: 0, z: 0 } }
            ],
            effects: [
                { time: 0, type: "fade_in_red", duration: 2 },
                { time: 35, type: "fade_out_red", duration: 5 }
            ]
        };
    }
    
    createSecretEnding() {
        return {
            name: "Heartseed Tree",
            duration: 60,
            dialogues: [
                {
                    text: "What... what is this place?",
                    character: "You",
                    delay: 2,
                    audio: "awe"
                },
                {
                    text: "Before you stands the most magnificent tree you've ever seen. Its bark glows with a soft light.",
                    character: "Narrator",
                    delay: 3,
                    effect: "glow"
                },
                {
                    text: "Welcome, child of the forest. I am the Heartseed.",
                    character: "Heartseed Tree",
                    delay: 2,
                    audio: "ancient",
                    effect: "pulse"
                },
                {
                    text: "You... you can talk?",
                    character: "You",
                    delay: 2,
                    audio: "astonished"
                },
                {
                    text: "I am the memory of this forest. The keeper of its stories. You have wandered far from your path.",
                    character: "Heartseed Tree",
                    delay: 4,
                    audio: "wise"
                },
                {
                    text: "Can you show us the way out?",
                    character: "You",
                    delay: 2,
                    audio: "hopeful"
                },
                {
                    text: "There is a way out. But there is also a way in. The forest chooses those who listen.",
                    character: "Heartseed Tree",
                    delay: 4,
                    audio: "mysterious"
                },
                {
                    text: "Its voice isn't just in your ears. It's in the ground beneath your feet, the air you breathe.",
                    character: "Narrator",
                    delay: 3,
                    effect: "vibrate"
                },
                {
                    text: "I hear it... I hear everything...",
                    character: "You",
                    delay: 2,
                    audio: "transcendent"
                },
                {
                    text: "Your friend calls your name, but the voice comes from far away. From another world.",
                    character: "Narrator",
                    delay: 3,
                    effect: "echo"
                },
                {
                    text: "The bark feels like skin. The leaves whisper secrets only you can understand.",
                    character: "Narrator",
                    delay: 3,
                    effect: "merge"
                },
                {
                    text: "I remember... I remember being a seed. I remember every rain. Every sunrise.",
                    character: "You",
                    delay: 3,
                    audio: "awakening"
                },
                {
                    text: "Roots emerge from the ground, wrapping gently around your feet. They don't trap you. They welcome you.",
                    character: "Narrator",
                    delay: 4,
                    effect: "roots"
                },
                {
                    text: "Goodbye, Alex. Tell them... tell them I found what I was looking for.",
                    character: "You",
                    delay: 3,
                    audio: "peaceful"
                },
                {
                    text: "Your body becomes bark. Your thoughts become leaves. Your heartbeat becomes the forest's rhythm.",
                    character: "Narrator",
                    delay: 5,
                    effect: "transform",
                    audio: "heartbeat_slow"
                },
                {
                    text: "SECRET ENDING: BECOMING",
                    character: "",
                    delay: 3,
                    effect: "title_green",
                    special: true
                },
                {
                    text: "Some don't escape the forest.\nThey become part of it.\nA new guardian watches over the trees,\nlistening with human ears and wooden heart.",
                    character: "",
                    delay: 6,
                    effect: "credits_green"
                }
            ],
            cameraPath: [
                { x: 0, y: 1.7, z: 10, lookAt: { x: 0, y: 5, z: 0 } },
                { x: 5, y: 3, z: 8, lookAt: { x: 0, y: 5, z: 0 } },
                { x: 0, y: 10, z: 15, lookAt: { x: 0, y: 0, z: 0 } },
                { x: 0, y: 20, z: 30, lookAt: { x: 0, y: 0, z: 0 } }
            ],
            effects: [
                { time: 0, type: "fade_in_green", duration: 3 },
                { time: 55, type: "fade_out_green", duration: 5 }
            ]
        };
    }
    
    play(cutsceneName, onComplete = null) {
        if (!this.cutscenes[cutsceneName]) {
            console.error(`Cutscene "${cutsceneName}" not found`);
            if (onComplete) onComplete();
            return;
        }
        
        this.currentCutscene = this.cutscenes[cutsceneName];
        this.cutsceneTime = 0;
        this.dialogueIndex = 0;
        this.isPlaying = true;
        this.onComplete = onComplete;
        
        // Show cutscene UI
        this.cutsceneUI.style.display = 'flex';
        
        // Pause game
        GameState.isInCutscene = true;
        GameState.isPaused = true;
        
        // Start cutscene
        this.nextDialogue();
        
        // Start camera animation
        this.startCameraAnimation();
        
        console.log(`Playing cutscene: ${this.currentCutscene.name}`);
    }
    
    nextDialogue() {
        if (!this.currentCutscene || this.dialogueIndex >= this.currentCutscene.dialogues.length) {
            this.endCutscene();
            return;
        }
        
        const dialogue = this.currentCutscene.dialogues[this.dialogueIndex];
        const textElement = document.getElementById('cutscene-text');
        const characterElement = document.getElementById('cutscene-character');
        
        // Hide dialogue box first
        const dialogueBox = document.getElementById('cutscene-dialogue');
        dialogueBox.style.opacity = '0';
        dialogueBox.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            // Update text
            textElement.textContent = dialogue.text;
            characterElement.textContent = dialogue.character;
            
            // Apply special formatting for titles
            if (dialogue.special) {
                textElement.style.fontSize = '2.5rem';
                textElement.style.color = dialogue.effect === 'title_red' ? '#ff4444' : 
                                         dialogue.effect === 'title_green' ? '#4CAF50' : '#ffffff';
                textElement.style.textShadow = '0 0 20px currentColor';
                characterElement.style.display = 'none';
            } else {
                textElement.style.fontSize = '1.8rem';
                textElement.style.color = '#ffffff';
                textElement.style.textShadow = 'none';
                characterElement.style.display = 'block';
            }
            
            // Show dialogue box with animation
            setTimeout(() => {
                dialogueBox.style.opacity = '1';
                dialogueBox.style.transform = 'translateY(0)';
            }, 50);
            
            // Play audio effect if specified
            if (dialogue.audio) {
                this.playAudioEffect(dialogue.audio);
            }
            
            // Apply visual effect
            if (dialogue.effect) {
                this.applyVisualEffect(dialogue.effect);
            }
            
            // Schedule next dialogue
            this.dialogueIndex++;
            setTimeout(() => this.nextDialogue(), dialogue.delay * 1000);
            
        }, 500);
    }
    
    startCameraAnimation() {
        if (!this.currentCutscene || !this.currentCutscene.cameraPath) return;
        
        const path = this.currentCutscene.cameraPath;
        const totalTime = this.currentCutscene.duration;
        const segmentTime = totalTime / path.length;
        let currentSegment = 0;
        
        const animateCamera = () => {
            if (!this.isPlaying || !GameState.camera) return;
            
            const progress = (this.cutsceneTime % segmentTime) / segmentTime;
            const currentPoint = path[currentSegment];
            const nextPoint = path[(currentSegment + 1) % path.length];
            
            // Interpolate position
            GameState.camera.position.x = THREE.MathUtils.lerp(
                currentPoint.x, 
                nextPoint.x, 
                progress
            );
            GameState.camera.position.y = THREE.MathUtils.lerp(
                currentPoint.y, 
                nextPoint.y, 
                progress
            );
            GameState.camera.position.z = THREE.MathUtils.lerp(
                currentPoint.z, 
                nextPoint.z, 
                progress
            );
            
            // Look at target
            const lookAt = new THREE.Vector3(
                currentPoint.lookAt.x,
                currentPoint.lookAt.y,
                currentPoint.lookAt.z
            );
            GameState.camera.lookAt(lookAt);
            
            // Move to next segment
            if (progress >= 0.99) {
                currentSegment = (currentSegment + 1) % path.length;
            }
            
            this.cutsceneTime += 0.016; // Assuming 60fps
            requestAnimationFrame(animateCamera);
        };
        
        animateCamera();
    }
    
    applyVisualEffect(effectType) {
        const container = this.cutsceneUI;
        
        switch(effectType) {
            case 'fade':
                container.style.animation = 'fadeEffect 2s';
                break;
            case 'darken':
                container.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
                break;
            case 'brighten':
                container.style.backgroundColor = 'rgba(30, 30, 20, 0.9)';
                break;
            case 'shake':
                container.style.animation = 'shakeEffect 0.5s';
                break;
            case 'blood':
                // Add blood overlay
                const bloodOverlay = document.createElement('div');
                bloodOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, transparent 30%, rgba(139, 0, 0, 0.7) 70%);
                    z-index: 2;
                    pointer-events: none;
                `;
                container.appendChild(bloodOverlay);
                break;
            case 'glow':
                container.style.boxShadow = 'inset 0 0 100px rgba(76, 175, 80, 0.3)';
                break;
            case 'pulse':
                container.style.animation = 'pulseEffect 2s infinite';
                break;
            case 'vibrate':
                container.style.animation = 'vibrateEffect 3s';
                break;
            case 'merge':
                // Add merging effect
                const mergeEffect = document.createElement('div');
                mergeEffect.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(45deg, transparent 40%, rgba(76, 175, 80, 0.2) 50%, transparent 60%);
                    z-index: 2;
                    pointer-events: none;
                    animation: mergeAnimation 5s linear infinite;
                `;
                container.appendChild(mergeEffect);
                break;
            case 'roots':
                // Add root pattern
                const rootPattern = document.createElement('div');
                rootPattern.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: radial-gradient(circle at 30% 70%, rgba(139, 69, 19, 0.1) 2px, transparent 2px);
                    background-size: 50px 50px;
                    z-index: 2;
                    pointer-events: none;
                    animation: rootGrow 10s linear;
                `;
                container.appendChild(rootPattern);
                break;
            case 'transform':
                // Transformation effect
                container.style.background = 'linear-gradient(45deg, #0a2f0a 0%, #1b5e20 50%, #0a2f0a 100%)';
                container.style.animation = 'transformEffect 10s';
                break;
        }
        
        // Reset animation after it completes
        setTimeout(() => {
            container.style.animation = '';
            container.style.boxShadow = '';
            container.style.backgroundColor = '#000';
        }, 3000);
    }
    
    playAudioEffect(soundName) {
        // In a real game, you would play actual audio files here
        console.log(`Playing audio: ${soundName}`);
        
        // Simulate audio with console and visual feedback
        switch(soundName) {
            case 'wolf_howl':
                // Would play wolf howl audio
                break;
            case 'wolf_growl':
                // Would play wolf growl audio
                break;
            case 'scream':
                // Would play scream audio
                break;
            case 'heartbeat_slow':
                // Would play slow heartbeat
                break;
        }
    }
    
    advanceDialogue() {
        // Skip to next dialogue on click
        this.nextDialogue();
    }
    
    endCutscene() {
        this.isPlaying = false;
        this.currentCutscene = null;
        
        // Hide cutscene UI
        this.cutsceneUI.style.display = 'none';
        
        // Clear any effects
        this.cutsceneUI.style.background = '#000';
        this.cutsceneUI.style.animation = '';
        
        // Remove any added effect elements
        const effects = this.cutsceneUI.querySelectorAll('div[id^="effect-"], div[style*="position: absolute"]');
        effects.forEach(effect => effect.remove());
        
        // Resume game
        GameState.isInCutscene = false;
        GameState.isPaused = false;
        
        // Call completion callback
        if (this.onComplete) {
            this.onComplete();
        }
        
        console.log("Cutscene ended");
    }
    
    update(delta) {
        if (!this.isPlaying) return;
        
        this.cutsceneTime += delta;
        
        // Check for timed effects
        if (this.currentCutscene && this.currentCutscene.effects) {
            this.currentCutscene.effects.forEach(effect => {
                if (Math.abs(this.cutsceneTime - effect.time) < delta) {
                    this.applyVisualEffect(effect.type);
                }
            });
        }
    }
}

// ===============================
// UPDATED GAME ENGINE WITH CUTSCENES
// ===============================
class GameEngine {
    constructor() {
        this.ui = new UIController();
        this.cutscene = new CutsceneSystem();
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        this.fps = 60;
    }
    
    init() {
        // Start with opening cutscene
        this.cutscene.play('opening', () => {
            // After cutscene, initialize the game
            this.initializeGame();
        });
    }
    
    initializeGame() {
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
        this.ui.showNotification("You're lost in the forest... Find Alex and escape!");
    }
    
    // ... [rest of the GameEngine class remains the same as before, 
    // but with added ending triggers]
    
    checkEndings() {
        // Check for bad ending (player death)
        if (GameState.player.health <= 0) {
            this.triggerBadEnding();
            return;
        }
        
        // Check for good ending (escape with Alex)
        const escapePoint = new THREE.Vector3(200, 0, 200); // Example escape point
        const distanceToEscape = GameState.player.position.distanceTo(escapePoint);
        
        if (distanceToEscape < 20 && GameState.story.helpedClassmate) {
            this.triggerGoodEnding();
            return;
        }
        
        // Check for secret ending (find Heartseed Tree)
        const heartseedLocation = new THREE.Vector3(150, 0, 150); // Example location
        const distanceToHeartseed = GameState.player.position.distanceTo(heartseedLocation);
        
        if (distanceToHeartseed < 15 && GameState.player.fear > 70) {
            this.triggerSecretEnding();
            return;
        }
    }
    
    triggerGoodEnding() {
        GameState.isGameOver = true;
        this.cutscene.play('goodEnding', () => {
            this.showEndScreen("good");
        });
    }
    
    triggerBadEnding() {
        GameState.isGameOver = true;
        this.cutscene.play('badEnding', () => {
            this.showEndScreen("bad");
        });
    }
    
    triggerSecretEnding() {
        GameState.isGameOver = true;
        this.cutscene.play('secretEnding', () => {
            this.showEndScreen("secret");
        });
    }
    
    showEndScreen(endingType) {
        const endScreen = document.createElement('div');
        endScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 20000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Cinzel', serif;
        `;
        
        let title = "";
        let color = "";
        let message = "";
        
        switch(endingType) {
            case "good":
                title = "GOOD ENDING - SAFE RETURN";
                color = "#4CAF50";
                message = "You and Alex escaped the forest. The nightmare is over, but you'll never forget what you heard in the darkness.";
                break;
            case "bad":
                title = "BAD ENDING - THE FEAST";
                color = "#f44336";
                message = "The forest claimed new victims. Some stories end not with a conclusion, but with silence.";
                break;
            case "secret":
                title = "SECRET ENDING - BECOMING";
                color = "#8BC34A";
                message = "You didn't escape the forest. You became part of it. A new guardian watches over the trees.";
                break;
        }
        
        endScreen.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 2rem; color: ${color}; text-shadow: 0 0 20px ${color}">
                ${title}
            </h1>
            <p style="font-size: 1.5rem; max-width: 600px; text-align: center; margin-bottom: 3rem; line-height: 1.6">
                ${message}
            </p>
            <div style="margin-bottom: 2rem; font-size: 1.2rem; color: #888">
                Time Survived: ${Math.floor(GameState.gameTime / 60)}:${Math.floor(GameState.gameTime % 60).toString().padStart(2, '0')}<br>
                Wolves Encountered: ${GameState.wolves.length}<br>
                Fear Level: ${Math.round(GameState.player.fear)}%
            </div>
            <div style="display: flex; gap: 20px;">
                <button id="restart-btn" style="
                    background: ${color};
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-family: inherit;
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
                    font-family: inherit;
                ">
                    Main Menu
                </button>
            </div>
        `;
        
        document.body.appendChild(endScreen);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            endScreen.remove();
            this.ui.showScreen('mainMenu');
            Game.reset();
        });
    }
    
    // ... [rest of the GameEngine methods remain the same]
}

// ===============================
// ADD CSS ANIMATIONS FOR CUTSCENES
// ===============================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeEffect {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    @keyframes shakeEffect {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    
    @keyframes pulseEffect {
        0%, 100% { box-shadow: inset 0 0 50px rgba(76, 175, 80, 0.3); }
        50% { box-shadow: inset 0 0 100px rgba(76, 175, 80, 0.6); }
    }
    
    @keyframes vibrateEffect {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-1px, -1px); }
        20% {
