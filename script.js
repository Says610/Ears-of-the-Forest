/* =========================================================
   EARS OF THE FOREST - ENHANCED GAME ENGINE
   with Camera Controls, Audio System, and Enhanced Features
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
    timeOfDay: 0.25, // 6 AM
    weather: {
        type: 'clear', // clear, rainy, foggy
        intensity: 0,
        fogIntensity: 0.01
    },
    
    // Camera controls
    cameraRotation: { x: 0, y: 0 },
    isPointerLocked: false,
    sensitivity: 0.002,
    
    // Player state
    player: {
        health: 100,
        stamina: 100,
        battery: 100,
        fear: 5,
        position: { x: 0, y: 1.7, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        stealth: {
            noiseLevel: 0,
            visibility: 0,
            isCrouching: false,
            isHiding: false
        },
        movementSpeed: 5,
        sprintSpeed: 10,
        crouchSpeed: 2,
        currentSpeed: 5
    },
    
    // Input state
    input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        flashlight: true,
        crouch: false
    },
    
    // Audio system
    audio: {
        initialized: false,
        masterVolume: 0.7,
        sounds: {},
        groups: {},
        positionalAudio: [],
        currentFootstep: 0,
        heartbeatInterval: null,
        visualizerBars: []
    },
    
    // Inventory & crafting
    inventory: {
        medkits: 1,
        batteries: 2,
        sticks: 0,
        cloth: 0,
        vines: 0,
        leaves: 0
    },
    
    craftingRecipes: {
        torch: { sticks: 1, cloth: 1 },
        bandage: { cloth: 2 },
        trap: { sticks: 3, vines: 2 },
        shelter: { sticks: 10, leaves: 20 }
    },
    
    // World objects
    trees: [],
    wolves: [],
    interactables: [],
    particles: [],
    
    // Systems
    cutscene: null,
    ui: null,
    
    // Game events
    events: {
        firstWolfSighting: false,
        wolfPackEvent: false,
        foundResources: false,
        lowBatteryWarning: false,
        highFearWarning: false
    },
    
    // Initialization
    init() {
        console.log("🎮 Initializing Ears of the Forest...");
        
        // Show loading progress
        this.updateLoadingProgress("Loading core systems...", 10);
        
        // Initialize systems
        this.initThreeJS();
        this.updateLoadingProgress("Setting up graphics...", 30);
        
        this.initAudio();
        this.updateLoadingProgress("Loading audio system...", 50);
        
        this.initUI();
        this.updateLoadingProgress("Creating user interface...", 70);
        
        this.initWorld();
        this.updateLoadingProgress("Building game world...", 85);
        
        this.initInput();
        this.updateLoadingProgress("Setting up controls...", 95);
        
        // Start opening cutscene
        setTimeout(() => {
            this.hideLoadingScreen();
            this.startOpeningCutscene();
            console.log("✅ Game initialized successfully");
        }, 1000);
    },
    
    updateLoadingProgress(text, percent) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById
