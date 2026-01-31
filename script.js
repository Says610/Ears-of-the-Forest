// ============================================
// ECHOES OF THE FOREST - GAME SCRIPT
// ============================================

// Game State
let gameState = {
    isPaused: false,
    isGameOver: false,
    isGameWon: false,
    currentScreen: 'loading',
    gameTime: 0,
    dayCount: 1,
    memoryFragments: 0,
    forestMood: 50,
    wolvesPacified: 0,
    sanity: 100,
    health: 100,
    hunger: 100,
    thirst: 100,
    temperature: 37,
    stamina: 100,
    inventory: [],
    discoveredAreas: new Set(['start']),
    distanceTraveled: 0,
    wolfEncounters: 0,
    achievements: new Set()
};

// Three.js Variables
let scene, camera, renderer;
let clock = new THREE.Clock();
let deltaTime = 0;

// Game Objects
let player = {
    mesh: null,
    height: 1.8,
    speed: 5,
    sprintSpeed: 8,
    jumpForce: 8,
    isSprinting: false,
    isCrouching: false,
    isGrounded: true,
    velocity: new THREE.Vector3(),
    flashlightOn: false,
    currentItem: 0
};

let wolves = [];
let memoryFragments = [];
let trees = [];
let plants = [];
let campfires = [];
let interactiveObjects = [];

// Input
let keys = {};
let mouse = { x: 0, y: 0, movementX: 0, movementY: 0 };
let isMouseLocked = false;

// Settings
let settings = {
    quality: 'medium',
    renderDistance: 500,
    shadows: true,
    particles: true,
    masterVolume: 80,
    sfxVolume: 100,
    musicVolume: 60,
    spatialAudio: true,
    mouseSensitivity: 5,
    fov: 90,
    autoSave: true,
    hints: true,
    invertY: false,
    toggleCrouch: false,
    keyboardLayout: 'qwerty'
};

// Memory Fragments Data
const memoryData = [
    { id: 1, title: "The Bus Ride", description: "The beginning of the school trip.", effect: "Increases sanity by 10" },
    { id: 2, title: "Lost Path", description: "The moment you realized you were alone.", effect: "Reveals nearby paths" },
    { id: 3, title: "First Howl", description: "The first wolf you heard in the distance.", effect: "Wolves become less aggressive" },
    { id: 4, title: "Forest Whispers", description: "Voices that seem to come from the trees.", effect: "Forest mood improves" },
    { id: 5, title: "Ancient Ruins", description: "Remnants of a civilization long gone.", effect: "Unlocks ancient knowledge" },
    { id: 6, title: "The Guardian", description: "A massive wolf that watches over the forest.", effect: "Wolf boss becomes neutral" },
    { id: 7, title: "River of Memories", description: "The river flows with forgotten stories.", effect: "Restores all stats" },
    { id: 8, title: "Night Terror", description: "Your worst fears manifested.", effect: "Increases sanity resistance" },
    { id: 9, title: "Dawn's Hope", description: "The first light after a long night.", effect: "Temperature stabilizes" },
    { id: 10, title: "Forest's Heart", description: "The core of the forest consciousness.", effect: "Unlifts forest communication" },
    { id: 11, title: "The Choice", description: "To fight or understand the forest.", effect: "Changes ending possibilities" },
    { id: 12, title: "Echoes", description: "All memories combined into understanding.", effect: "Unlocks true ending" }
];

// ============================================
// DOM READY - MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Show loading screen first
    showScreen('loading');
    
    // Initialize everything
    initGame();
});

async function initGame() {
    console.log('Starting game initialization...');
    
    // Load settings
    loadSettings();
    
    // Setup event listeners for UI
    setupUIListeners();
    
    // Initialize Three.js scene
    await initScene();
    
    // Simulate loading progress
    simulateLoading();
}

function simulateLoading() {
    const progressBar = document.querySelector('.progress');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Hide loading screen and show main menu
            setTimeout(() => {
                hideScreen('loading');
                showScreen('main-menu');
                console.log('Game ready!');
            }, 500);
        }
    }, 100);
}

// ============================================
// UI EVENT LISTENERS SETUP
// ============================================

function setupUIListeners() {
    console.log('Setting up UI listeners...');
    
    // Main Menu buttons
    const newGameBtn = document.getElementById('new-game');
    const continueBtn = document.getElementById('continue-game');
    const loadBtn = document.getElementById('load-game');
    const settingsBtn = document.getElementById('settings');
    const creditsBtn = document.getElementById('credits');
    const quitBtn = document.getElementById('quit');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', startNewGame);
        console.log('New Game button listener added');
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', continueGame);
        console.log('Continue button listener added');
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', showLoadScreen);
        console.log('Load Game button listener added');
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsScreen);
        console.log('Settings button listener added');
    }
    
    if (creditsBtn) {
        creditsBtn.addEventListener('click', showCreditsScreen);
        console.log('Credits button listener added');
    }
    
    if (quitBtn) {
        quitBtn.addEventListener('click', quitGame);
        console.log('Quit button listener added');
    }
    
    // Cutscene skip
    const skipBtn = document.getElementById('skip-cutscene');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipCutscene);
    }
    
    // Pause Menu buttons
    const resumeBtn = document.getElementById('resume-game');
    const saveBtn = document.getElementById('save-game');
    const loadMenuBtn = document.getElementById('load-game-menu');
    const settingsMenuBtn = document.getElementById('settings-menu');
    const quitMenuBtn = document.getElementById('quit-to-menu');
    
    if (resumeBtn) resumeBtn.addEventListener('click', togglePauseMenu);
    if (saveBtn) saveBtn.addEventListener('click', saveGame);
    if (loadMenuBtn) loadMenuBtn.addEventListener('click', showLoadScreen);
    if (settingsMenuBtn) settingsMenuBtn.addEventListener('click', showSettingsScreen);
    if (quitMenuBtn) quitMenuBtn.addEventListener('click', quitToMainMenu);
    
    // Death Screen buttons
    const retryBtn = document.getElementById('retry-game');
    const deathToMenuBtn = document.getElementById('death-to-menu');
    
    if (retryBtn) retryBtn.addEventListener('click', startNewGame);
    if (deathToMenuBtn) deathToMenuBtn.addEventListener('click', quitToMainMenu);
    
    // Win Screen buttons
    const newGamePlusBtn = document.getElementById('new-game-plus');
    const winToMenuBtn = document.getElementById('win-to-menu');
    
    if (newGamePlusBtn) newGamePlusBtn.addEventListener('click', startNewGamePlus);
    if (winToMenuBtn) winToMenuBtn.addEventListener('click', quitToMainMenu);
    
    // Memory Interface
    const closeMemoryBtn = document.getElementById('close-memory');
    const useMemoryBtn = document.getElementById('use-memory');
    
    if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', closeMemoryInterface);
    if (useMemoryBtn) useMemoryBtn.addEventListener('click', useMemory);
    
    // Settings Screen
    const applySettingsBtn = document.getElementById('apply-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');
    const backToMenuBtn = document.getElementById('back-to-menu');
    
    if (applySettingsBtn) applySettingsBtn.addEventListener('click', applySettings);
    if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', resetSettings);
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', backToMainMenu);
    
    // Load Screen
    const backFromLoadBtn = document.getElementById('back-from-load');
    const deleteSaveBtn = document.getElementById('delete-save');
    
    if (backFromLoadBtn) backFromLoadBtn.addEventListener('click', backFromLoadScreen);
    if (deleteSaveBtn) deleteSaveBtn.addEventListener('click', deleteSave);
    
    // Credits Screen
    const backFromCreditsBtn = document.getElementById('back-from-credits');
    if (backFromCreditsBtn) backFromCreditsBtn.addEventListener('click', backFromCredits);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mouse controls
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    
    console.log('All UI listeners setup complete');
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showScreen(screenId) {
    console.log(`Showing screen: ${screenId}`);
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        gameState.currentScreen = screenId.replace('-screen', '');
        if (screenId === 'game-screen') {
            startGameLoop();
        }
    } else {
        console.error(`Screen not found: ${screenId}`);
    }
}

function hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('hidden');
    }
}

function startNewGame() {
    console.log('Starting new game...');
    
    // Reset game state
    gameState = {
        isPaused: false,
        isGameOver: false,
        isGameWon: false,
        currentScreen: 'game',
        gameTime: 720,
        dayCount: 1,
        memoryFragments: 0,
        forestMood: 50,
        wolvesPacified: 0,
        sanity: 100,
        health: 100,
        hunger: 100,
        thirst: 100,
        temperature: 37,
        stamina: 100,
        inventory: [],
        discoveredAreas: new Set(['start']),
        distanceTraveled: 0,
        wolfEncounters: 0,
        achievements: new Set()
    };
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show game screen
    showScreen('game-screen');
    
    // Request pointer lock for mouse control
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.requestPointerLock();
    }
    
    // Initialize game objects
    initializeGameObjects();
    
    // Add welcome messages
    addMessage('You wake up in the forest. Find shelter and food.');
    addMessage('Listen for wolf howls. They hunt at night.');
    addMessage('Collect memory fragments to understand the forest.');
    
    console.log('New game started!');
}

function continueGame() {
    console.log('Continue game clicked');
    // For now, just start a new game
    startNewGame();
}

function showLoadScreen() {
    console.log('Show load screen');
    hideScreen('main-menu');
    showScreen('load-screen');
}

function showSettingsScreen() {
    console.log('Show settings screen');
    hideScreen('main-menu');
    showScreen('settings-screen');
}

function showCreditsScreen() {
    console.log('Show credits screen');
    hideScreen('main-menu');
    showScreen('credits-screen');
}

function quitGame() {
    console.log('Quit game');
    if (confirm('Are you sure you want to quit Echoes of the Forest?')) {
        window.close();
    }
}

function skipCutscene() {
    hideScreen('intro-cutscene');
    showScreen('game-screen');
}

function togglePauseMenu() {
    if (gameState.currentScreen === 'game') {
        gameState.isPaused = true;
        showScreen('pause-menu');
        document.exitPointerLock();
    } else if (gameState.currentScreen === 'pause') {
        gameState.isPaused = false;
        hideScreen('pause-menu');
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.requestPointerLock();
        }
    }
}

function quitToMainMenu() {
    console.log('Quit to main menu');
    
    // Hide all game screens
    hideScreen('pause-menu');
    hideScreen('death-screen');
    hideScreen('win-screen');
    hideScreen('game-screen');
    hideScreen('memory-interface');
    
    // Show main menu
    showScreen('main-menu');
    
    // Reset game state but keep settings
    gameState.currentScreen = 'menu';
    gameState.isPaused = false;
}

function startNewGamePlus() {
    console.log('Starting New Game+');
    startNewGame();
    
    // Add NG+ bonuses
    gameState.sanity = 120;
    gameState.health = 120;
    gameState.forestMood = 80;
    
    addMessage('New Game+ started! Enhanced abilities activated.');
    updateHUD();
}

function backToMainMenu() {
    hideScreen('settings-screen');
    showScreen('main-menu');
}

function backFromLoadScreen() {
    hideScreen('load-screen');
    showScreen('main-menu');
}

function backFromCredits() {
    hideScreen('credits-screen');
    showScreen('main-menu');
}

function closeMemoryInterface() {
    hideScreen('memory-interface');
    gameState.currentScreen = 'game';
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.requestPointerLock();
    }
}

function useMemory() {
    console.log('Using memory');
    // Memory usage logic here
    closeMemoryInterface();
}

function applySettings() {
    console.log('Applying settings');
    // Settings logic here
    backToMainMenu();
}

function resetSettings() {
    console.log('Resetting settings');
    if (confirm('Reset all settings to default?')) {
        // Reset settings logic
    }
}

function deleteSave() {
    console.log('Delete save');
    // Delete save logic here
}

// ============================================
// THREE.JS SCENE SETUP
// ============================================

async function initScene() {
    console.log('Initializing Three.js scene...');
    
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, settings.renderDistance);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    
    // Create renderer
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = settings.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Setup lighting
    setupLighting();
    
    // Create terrain
    createTerrain();
    
    // Create basic forest
    createBasicForest();
    
    // Setup window resize handler
    window.addEventListener('resize', onWindowResize);
    
    console.log('Scene initialized successfully');
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffecd2, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = settings.shadows;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

function createTerrain() {
    // Create a simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a5f0b,
        roughness: 0.8
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add some height variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        vertices[i + 1] = Math.sin(x * 0.02) * 5 + Math.sin(z * 0.02) * 5;
    }
    groundGeometry.computeVertexNormals();
}

function createBasicForest() {
    // Create some trees
    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        createTree(x, 0, z);
    }
    
    // Create some memory fragments
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        createMemoryFragment(x, 2, z, i + 1);
    }
}

function createTree(x, y, z) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 2.5, z);
    trunk.castShadow = true;
    
    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, y + 7, z);
    leaves.castShadow = true;
    
    const tree = new THREE.Group();
    tree.add(trunk, leaves);
    scene.add(tree);
    trees.push(tree);
    
    return tree;
}

function createMemoryFragment(x, y, z, id) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0x9c27b0,
        emissive: 0x9c27b0,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const fragment = new THREE.Mesh(geometry, material);
    fragment.position.set(x, y, z);
    fragment.castShadow = true;
    
    fragment.userData = {
        type: 'memoryFragment',
        canInteract: true,
        id: id,
        collected: false
    };
    
    scene.add(fragment);
    memoryFragments.push(fragment);
    
    return fragment;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// GAME OBJECTS INITIALIZATION
// ============================================

function initializeGameObjects() {
    console.log('Initializing game objects...');
    
    // Setup player
    player.mesh = camera;
    
    // Create flashlight
    const flashlight = new THREE.SpotLight(0xffffff, 2, 30, Math.PI / 6, 0.5, 1);
    flashlight.position.set(0, 1.5, 0);
    flashlight.castShadow = true;
    camera.add(flashlight);
    player.flashlight = flashlight;
    
    // Add flashlight target
    const target = new THREE.Object3D();
    target.position.set(0, 0, -10);
    camera.add(target);
    flashlight.target = target;
    
    // Initialize HUD
    updateHUD();
    
    console.log('Game objects initialized');
}

// ============================================
// INPUT HANDLING
// ============================================

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    // Handle special keys
    switch(key) {
        case 'escape':
            e.preventDefault();
            if (gameState.currentScreen === 'game') {
                togglePauseMenu();
            } else if (gameState.currentScreen === 'pause') {
                togglePauseMenu();
            }
            break;
            
        case 'f':
            toggleFlashlight();
            break;
            
        case 'e':
            checkInteractions();
            break;
            
        case 'm':
            if (gameState.currentScreen === 'game') {
                openMemoryInterface();
            }
            break;
            
        case 'h':
            toggleControlsHelp();
            break;
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    if (!isMouseLocked) return;
    
    mouse.movementX = e.movementX || 0;
    mouse.movementY = e.movementY || 0;
}

function handleMouseClick() {
    if (gameState.currentScreen === 'game' && !isMouseLocked) {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.requestPointerLock();
        }
    }
}

// Pointer lock change handler
document.addEventListener('pointerlockchange', function() {
    const canvas = document.getElementById('gameCanvas');
    isMouseLocked = document.pointerLockElement === canvas;
});

function toggleFlashlight() {
    if (player.flashlight) {
        player.flashlightOn = !player.flashlightOn;
        player.flashlight.visible = player.flashlightOn;
        addMessage(player.flashlightOn ? 'Flashlight ON' : 'Flashlight OFF');
    }
}

function checkInteractions() {
    // Simple interaction check
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const intersects = raycaster.intersectObjects(memoryFragments, true);
    
    if (intersects.length > 0 && intersects[0].distance < 5) {
        const fragment = intersects[0].object;
        if (fragment.userData && !fragment.userData.collected) {
            fragment.userData.collected = true;
            gameState.memoryFragments++;
            fragment.visible = false;
            
            updateHUD();
            updateMemoryUI();
            addMessage(`Memory fragment collected! (${gameState.memoryFragments}/12)`);
        }
    }
}

function openMemoryInterface() {
    if (gameState.memoryFragments === 0) {
        addMessage('No memory fragments collected yet.');
        return;
    }
    
    gameState.currentScreen = 'memory';
    document.exitPointerLock();
    showScreen('memory-interface');
}

function toggleControlsHelp() {
    const help = document.getElementById('controls-help');
    if (help) {
        help.classList.toggle('hidden');
    }
}

// ============================================
// GAME LOOP
// ============================================

function startGameLoop() {
    console.log('Starting game loop...');
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    deltaTime = clock.getDelta();
    
    // Don't update if game is paused or not in game screen
    if (gameState.isPaused || gameState.isGameOver || gameState.isGameWon || 
        gameState.currentScreen !== 'game') {
        return;
    }
    
    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Update memory fragments (rotation)
    memoryFragments.forEach(fragment => {
        if (!fragment.userData.collected) {
            fragment.rotation.y += deltaTime;
        }
    });
    
    // Update survival stats
    updateSurvivalStats(deltaTime);
    
    // Update day/night cycle
    updateDayNightCycle(deltaTime);
    
    // Update sanity effects
    updateSanityEffects();
    
    // Render scene
    renderer.render(scene, camera);
}

function updatePlayerMovement(deltaTime) {
    if (!isMouseLocked) return;
    
    // Update camera rotation based on mouse movement
    const sensitivity = settings.mouseSensitivity * 0.002;
    camera.rotation.y -= mouse.movementX * sensitivity;
    camera.rotation.x -= mouse.movementY * sensitivity * (settings.invertY ? -1 : 1);
    
    // Clamp vertical rotation
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    
    // Reset mouse movement
    mouse.movementX = 0;
    mouse.movementY = 0;
    
    // Calculate movement direction
    const moveVector = new THREE.Vector3();
    
    if (keys['w']) moveVector.z -= 1;
    if (keys['s']) moveVector.z += 1;
    if (keys['a']) moveVector.x -= 1;
    if (keys['d']) moveVector.x += 1;
    
    if (moveVector.length() > 0) {
        moveVector.normalize();
        
        // Handle sprinting
        if (keys['shift'] && gameState.stamina > 0) {
            player.isSprinting = true;
            moveVector.multiplyScalar(player.sprintSpeed * deltaTime);
            gameState.stamina -= 20 * deltaTime;
        } else {
            player.isSprinting = false;
            moveVector.multiplyScalar(player.speed * deltaTime);
            
            // Regenerate stamina when not sprinting
            if (gameState.stamina < 100) {
                gameState.stamina += 10 * deltaTime;
            }
        }
        
        // Apply movement relative to camera direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
        
        const moveDirection = forward.multiplyScalar(moveVector.z)
            .add(right.multiplyScalar(moveVector.x));
        
        // Update camera position
        camera.position.add(moveDirection);
    } else {
        player.isSprinting = false;
        
        // Regenerate stamina when standing still
        if (gameState.stamina < 100) {
            gameState.stamina += 15 * deltaTime;
        }
    }
    
    // Handle jumping
    if (keys[' '] && player.isGrounded) {
        player.velocity.y = player.jumpForce;
        player.isGrounded = false;
        keys[' '] = false;
    }
    
    // Apply gravity
    player.velocity.y -= 9.8 * deltaTime;
    camera.position.y += player.velocity.y * deltaTime;
    
    // Ground collision (simple)
    if (camera.position.y < 2) {
        camera.position.y = 2;
        player.velocity.y = 0;
        player.isGrounded = true;
    }
    
    // Update flashlight
    if (player.flashlight) {
        player.flashlight.position.copy(camera.position);
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        player.flashlight.target.position.copy(camera.position).add(forward.multiplyScalar(10));
    }
}

// ============================================
// GAME SYSTEMS
// ============================================

function updateHUD() {
    // Update stat bars
    const stats = ['health', 'sanity', 'hunger', 'thirst', 'temp', 'stamina'];
    stats.forEach(stat => {
        const bar = document.getElementById(`${stat}-bar`);
        const value = document.getElementById(`${stat}-value`);
        
        if (bar && value) {
            const currentValue = gameState[stat] || 0;
            bar.style.width = `${currentValue}%`;
            
            if (stat === 'temp') {
                value.textContent = `${Math.floor(currentValue)}°C`;
            } else {
                value.textContent = Math.floor(currentValue);
            }
        }
    });
    
    // Update time and day
    const hours = Math.floor(gameState.gameTime / 60) % 24;
    const minutes = gameState.gameTime % 60;
    const timeDisplay = document.getElementById('time-display');
    const dayCount = document.getElementById('day-count');
    
    if (timeDisplay) timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (dayCount) dayCount.textContent = `Day ${gameState.dayCount}`;
    
    // Update forest mood
    const moodValue = document.getElementById('forest-mood');
    const moodBar = document.getElementById('mood-bar');
    
    if (moodValue && moodBar) {
        let moodText;
        if (gameState.forestMood > 70) moodText = 'Friendly';
        else if (gameState.forestMood > 30) moodText = 'Neutral';
        else if (gameState.forestMood > -30) moodText = 'Wary';
        else if (gameState.forestMood > -70) moodText = 'Hostile';
        else moodText = 'Vengeful';
        
        moodValue.textContent = moodText;
        moodBar.style.width = `${(gameState.forestMood + 100) / 2}%`;
    }
    
    // Update weight
    const weightValue = document.getElementById('weight-value');
    if (weightValue) {
        const totalWeight = gameState.inventory.reduce((sum, item) => sum + (item.weight || 0), 0);
        weightValue.textContent = `${totalWeight}/50`;
    }
}

function updateMemoryUI() {
    const fragmentSlots = document.querySelectorAll('.fragment-slot');
    fragmentSlots.forEach((slot, index) => {
        if (index < gameState.memoryFragments) {
            slot.classList.add('collected');
        } else {
            slot.classList.remove('collected');
        }
    });
    
    const memoryCount = document.querySelector('.memory-count');
    if (memoryCount) {
        memoryCount.textContent = `${gameState.memoryFragments}/12`;
    }
}

function addMessage(text) {
    const messageLog = document.getElementById('message-log');
    if (!messageLog) return;
    
    const message = document.createElement('div');
    message.className = 'message';
    message.innerHTML = `<i class="fas fa-info-circle"></i><span>${text}</span>`;
    messageLog.appendChild(message);
    
    // Keep only last 5 messages
    while (messageLog.children.length > 5) {
        messageLog.removeChild(messageLog.firstChild);
    }
    
    // Auto scroll to bottom
    messageLog.scrollTop = messageLog.scrollHeight;
}

function updateSurvivalStats(deltaTime) {
    // Hunger and thirst decay
    gameState.hunger -= 0.2 * deltaTime;
    gameState.thirst -= 0.3 * deltaTime;
    
    // Temperature changes
    const timeOfDay = (gameState.gameTime % 1440) / 1440;
    const isNight = timeOfDay > 0.75 || timeOfDay < 0.25;
    
    if (isNight) {
        gameState.temperature -= 0.5 * deltaTime;
    } else {
        gameState.temperature += 0.2 * deltaTime;
    }
    
    // Sanity effects
    if (gameState.sanity < 50) {
        gameState.sanity -= 0.1 * deltaTime;
    } else {
        gameState.sanity += 0.05 * deltaTime;
    }
    
    // Health effects
    if (gameState.hunger <= 0 || gameState.thirst <= 0) {
        gameState.health -= 2 * deltaTime;
    }
    
    if (gameState.temperature < 20 || gameState.temperature > 40) {
        gameState.health -= 2 * deltaTime;
    }
    
    // Check for death
    if (gameState.health <= 0) {
        gameOver('Succumbed to the elements');
    }
    
    // Clamp values
    gameState.hunger = Math.max(0, Math.min(100, gameState.hunger));
    gameState.thirst = Math.max(0, Math.min(100, gameState.thirst));
    gameState.temperature = Math.max(0, Math.min(100, gameState.temperature));
    gameState.health = Math.max(0, Math.min(100, gameState.health));
    gameState.sanity = Math.max(0, Math.min(100, gameState.sanity));
    gameState.stamina = Math.max(0, Math.min(100, gameState.stamina));
    
    // Update HUD
    updateHUD();
}

function updateDayNightCycle(deltaTime) {
    // Update game time
    gameState.gameTime += deltaTime * 10;
    
    // Check for new day
    if (gameState.gameTime >= 1440) {
        gameState.gameTime = 0;
        gameState.dayCount++;
        addMessage(`Day ${gameState.dayCount} begins...`);
    }
    
    // Update lighting based on time of day
    const timeOfDay = (gameState.gameTime % 1440) / 1440;
    
    // Find directional light in scene
    scene.children.forEach(child => {
        if (child.isDirectionalLight) {
            const sunAngle = timeOfDay * Math.PI * 2;
            child.position.x = Math.cos(sunAngle) * 200;
            child.position.z = Math.sin(sunAngle) * 200;
            child.position.y = Math.sin(sunAngle) * 100 + 100;
            
            // Update light intensity
            if (timeOfDay > 0.75 || timeOfDay < 0.25) { // Night
                child.intensity = 0.1;
                scene.fog.color.setHex(0x0a0a2a);
            } else if (timeOfDay > 0.7 || timeOfDay < 0.3) { // Dawn/Dusk
                child.intensity = 0.5;
                scene.fog.color.setHex(0xffa07a);
            } else { // Day
                child.intensity = 0.8;
                scene.fog.color.setHex(0x87CEEB);
            }
        }
    });
}

function updateSanityEffects() {
    const overlay = document.getElementById('sanity-overlay');
    if (!overlay) return;
    
    if (gameState.sanity < 30) {
        overlay.style.opacity = (30 - gameState.sanity) / 30;
        
        // Add visual distortions
        if (Math.random() < 0.01) {
            camera.rotation.x += (Math.random() - 0.5) * 0.1;
            camera.rotation.y += (Math.random() - 0.5) * 0.1;
        }
        
        // Add whispers
        if (Math.random() < 0.005) {
            const whispers = [
                "The trees are watching...",
                "You're not alone here...",
                "They remember what you did...",
                "The forest whispers your name...",
                "Leave while you still can..."
            ];
            addMessage(whispers[Math.floor(Math.random() * whispers.length)]);
        }
    } else {
        overlay.style.opacity = 0;
    }
}

function gameOver(cause) {
    gameState.isGameOver = true;
    
    // Update death screen
    const deathCause = document.getElementById('death-cause');
    const deathTime = document.getElementById('death-time');
    const deathMemories = document.getElementById('death-memories');
    const deathDays = document.getElementById('death-days');
    
    if (deathCause) deathCause.textContent = cause;
    if (deathTime) {
        const hours = Math.floor(gameState.gameTime / 60);
        const minutes = gameState.gameTime % 60;
        deathTime.textContent = `${hours}h ${minutes}m`;
    }
    if (deathMemories) deathMemories.textContent = `${gameState.memoryFragments}/12`;
    if (deathDays) deathDays.textContent = gameState.dayCount;
    
    // Show death screen
    showScreen('death-screen');
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

function loadSettings() {
    const savedSettings = localStorage.getItem('echoesSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function saveGame() {
    const saveData = {
        gameState: gameState,
        timestamp: Date.now()
    };
    
    localStorage.setItem('echoesSave', JSON.stringify(saveData));
    addMessage('Game saved successfully!');
}

// Debug function to test the game
function debugTest() {
    console.log('Debug test running...');
    console.log('Game state:', gameState);
    console.log('Player:', player);
    console.log('Scene:', scene);
    console.log('Camera:', camera);
    console.log('Renderer:', renderer);
}

// Export for debugging
window.debugTest = debugTest;
window.gameState = gameState;
window.player = player;
