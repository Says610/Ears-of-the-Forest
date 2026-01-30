// =========================================================
// EARS OF THE FOREST - 3D PROTOTYPE (Three.js + WebAudio)
// Prototype implementing core systems from design doc.
// =========================================================

class EarsOfTheForest {
  constructor() {
    console.log("🌲 Initializing Ears of the Forest...");

    // state
    this.gameState = {
      isRunning: false,
      isPaused: false,
      isInMemory: false,
      isInMenu: true,
      gameTime: 0,
      loadingComplete: false
    };

    // neural
    this.neural = {
      connections: 0,
      maxConnections: 1000,
      learningRate: 0.1,
      patterns: [],
      forestConsciousness: { awareness: 0, mood: "neutral", trust: 50, deceptionChance: 0.3 }
    };

    // player
    this.player = {
      pos: new THREE.Vector3(0, 1.7, 5),
      velocity: new THREE.Vector3(),
      rotation: { x: 0, y: 0 },
      health: 100,
      sanity: 100,
      stamina: 100,
      forestConnection: 0,
      memoryClarity: 0,
      soundAwareness: 25,
      wolfUnderstanding: 0,
      deceptionResistance: 0
    };

    // memory fragments (12)
    this.memorySystem = {
      fragments: [],
      totalFragments: 12,
      collected: 0,
      currentMemory: null
    };

    // wolves
    this.wolfSystem = { packs: [], totalWolves: 4, lastHowl: 0, nextHowl: 20 };

    // audio
    this.audio = { enabled: true, context: null, master: null, sources: [] };

    // threejs
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;

    // inputs
    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    this.isPointerLocked = false;

    // UI
    this.ui = {};

    // init
    this.init();
  }

  // -------------------------
  // Initialization sequence
  // -------------------------
  init() {
    this.cacheUI();
    this.updateLoadingProgress("Initializing neural network...", 5);

    if (typeof THREE === "undefined") {
      this.showError("Three.js not loaded!");
      return;
    }

    // staged loading for UX
    setTimeout(() => this.initThreeJS(), 200);
    setTimeout(() => this.initWorld(), 600);
    setTimeout(() => this.initAudio(), 900);
    setTimeout(() => { this.initUI(); this.initInput(); this.initMemoryData(); this.initWolves(); this.finishLoading(); }, 1200);
  }

  cacheUI() {
    this.ui = {
      loadingScreen: document.getElementById("loading-screen"),
      progressFill: document.getElementById("progress-fill"),
      progressText: document.getElementById("progress-text"),
      memoryIntegrity: document.getElementById("memory-integrity"),
      mainMenu: document.getElementById("main-menu"),
      newGameBtn: document.getElementById("new-game-btn"),
      continueBtn: document.getElementById("continue-btn"),
      settingsBtn: document.getElementById("settings-btn"),
      gameCanvas: document.getElementById("gameCanvas"),
      gameUI: document.getElementById("game-ui"),
      memoryGrid: document.getElementById("fragments-grid"),
      fragmentTip: document.getElementById("fragment-tip"),
      memoryInterface: document.getElementById("memory-interface"),
      memoryTitle: document.getElementById("memory-title"),
      memorySubtitle: document.getElementById("memory-subtitle"),
      sceneText: document.getElementById("scene-text"),
      narrativeText: document.getElementById("narrative-text"),
      narrativeProgress: document.getElementById("narrative-progress"),
      clarityValue: document.getElementById("clarity-value"),
      memoryExit: document.getElementById("memory-exit"),
      soundCompassNeedle: document.querySelector(".sound-compass .compass-needle"),
      memoryValue: document.getElementById("memory-value"),
      learningType: document.getElementById("learning-type"),
      sanityBar: document.getElementById("sanity-bar"),
      sanityValue: document.getElementById("sanity-value"),
      connectionBar: document.getElementById("connection-bar"),
      connectionValue: document.getElementById("connection-value"),
      pauseMenu: document.getElementById("pause-menu"),
      pauseResume: document.getElementById("pause-resume"),
      pauseQuit: document.getElementById("pause-quit"),
      emergencySkip: document.getElementById("emergency-skip"),
      fragmentQuote: document.getElementById("fragment-quote")
    };

    // Emergency skip handler if shown
    if (this.ui.emergencySkip) this.ui.emergencySkip.onclick = () => this.emergencyLoad();
  }

  updateLoadingProgress(text, percent) {
    if (this.ui.progressFill) this.ui.progressFill.style.width = percent + "%";
    if (this.ui.progressText) this.ui.progressText.textContent = text;
    if (this.ui.memoryIntegrity) this.ui.memoryIntegrity.textContent = percent + "%";

    if (this.ui.fragmentQuote && percent % 10 === 0) {
      const quotes = [
        "The forest has a memory of its own.",
        "Some trees grow from forgotten stories.",
        "What you hear is not always what is said.",
        "The wolves remember every path you take.",
        "Your footsteps change the forest forever.",
        "Listen closely to the spaces between sounds.",
        "The past is buried but not gone.",
        "Every choice rewrites the memory.",
        "The forest learns from your fear.",
        "Truth and deception grow from the same root."
      ];
      const idx = Math.min(quotes.length - 1, Math.floor(percent / 10));
      this.ui.fragmentQuote.textContent = `"${quotes[idx]}"`;
    }
  }

  showError(msg) {
    console.error(msg);
    if (this.ui.progressText) this.ui.progressText.textContent = "ERROR: " + msg;
    if (this.ui.emergencySkip) this.ui.emergencySkip.style.display = "flex";
  }

  emergencyLoad() {
    // create a minimal scene and continue
    console.warn("Emergency load - minimal scene");
    this.initThreeJS(true);
    this.initWorld(true);
    this.finishLoading();
  }

  finishLoading() {
    this.updateLoadingProgress("Ready to enter the forest...", 100);
    setTimeout(() => {
      this.ui.loadingScreen.classList.remove("screen-visible");
      this.ui.loadingScreen.classList.add("screen-hidden");
      this.ui.mainMenu.classList.remove("screen-hidden");
      this.gameState.loadingComplete = true;
      this.bindMenuButtons();
    }, 700);
  }

  // -------------------------
  // THREE.JS SETUP
  // -------------------------
  initThreeJS(minimal = false) {
    console.log("Initializing Three.js...");
    const canvas = this.ui.gameCanvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000511);
    this.scene.fog = new THREE.FogExp2(0x000511, 0.01);

    // camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.copy(this.player.pos);

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // lighting
    let hemi = new THREE.HemisphereLight(0x667788, 0x111122, 0.6);
    this.scene.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(100, 200, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sunLight);

    // small neural ambient lights (decor)
    for (let i=0;i<6;i++){
      const pl = new THREE.PointLight(0x00ff88, 0.15, 30);
      pl.position.set((Math.random()-0.5)*200, 3 + Math.random()*6, (Math.random()-0.5)*200);
      this.scene.add(pl);
    }

    this.clock = new THREE.Clock();
    window.addEventListener("resize", () => this.onWindowResize());
    console.log("Three.js ready");
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // -------------------------
  // WORLD GENERATION
  // -------------------------
  initWorld(minimal = false) {
    console.log("Creating world...");

    // TERRAIN: plane with vertex displacement (low-poly for browser)
    const size = 300;
    const segments = 80;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geometry.attributes.position;
    for (let i=0;i<pos.count;i++){
      const x = pos.getX(i), y = pos.getY(i);
      const height = Math.sin(x*0.05)*Math.cos(y*0.05)*2 + (Math.random()-0.5)*0.6;
      pos.setZ(i, height);
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color:0x123a1f, roughness:0.95, metalness:0.02 });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI/2;
    terrain.receiveShadow = true;
    terrain.position.y = -2;
    this.scene.add(terrain);
    this.terrain = terrain;

    if (!minimal) this.createTrees(60);
    this.createMemoryCrystals();
  }

  createTrees(count = 40) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness:0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color:0x2f5f2f, roughness:0.7, transparent:true, opacity:0.95 });

    for (let i=0;i<count;i++){
      const x = (Math.random()-0.5)*260;
      const z = (Math.random()-0.5)*260;
      if (Math.hypot(x, z) < 15) continue; // skip near spawn

      const trunkH = 3 + Math.random()*3;
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, trunkH, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, trunkH/2 - 1, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const foliageGeo = new THREE.SphereGeometry(1.4 + Math.random()*1.3, 6, 6);
      const foliage = new THREE.Mesh(foliageGeo, leafMat);
      foliage.position.set(x, trunkH - 1, z);
      foliage.castShadow = true;
      this.scene.add(foliage);
    }
  }

  createMemoryCrystals() {
    // positions are pseudo-random but stable per session (seed by time)
    this.memorySystem.fragments = [];
    for (let i=0;i<this.memorySystem.totalFragments;i++){
      const angle = Math.random()*Math.PI*2;
      const radius = 20 + Math.random()*110;
      const px = Math.cos(angle)*radius;
      const pz = Math.sin(angle)*radius;
      const py = 0.5 + Math.random()*1.5;

      const geom = new THREE.OctahedronGeometry(0.8, 0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0044ff, transparent:true, opacity:0.8 });
      const crystal = new THREE.Mesh(geom, mat);
      crystal.position.set(px, py, pz);
      crystal.userData = { fragmentId: i };
      crystal.castShadow = true;

      this.scene.add(crystal);
      this.memorySystem.fragments.push({
        id: i,
        title: `Fragment ${i+1}`,
        position: crystal.position.clone(),
        crystal: crystal,
        clarity: 0,
        collected: false,
        sceneText: this.sampleMemoryText(i)
      });

      // pulse animation stored
      crystal._pulseOffset = Math.random()*10;
    }
  }

  sampleMemoryText(i) {
    // short text for memory scene
    const samples = [
      "You carved your initials into a tree, it felt warm.",
      "The first night, you held a flashlight and listened.",
      "A whisper by the stream: someone's name on the water.",
      "Scattered ashes beneath a collapsed stone circle.",
      "A child's toy caught in moss; laughter long gone.",
      "The heartbeat of the forest synchronized with yours.",
      "Footprints that weren't yours lead into the dark.",
      "An ancient tree hums; you hear distant chorus.",
      "The moon revealed a carving of an unknown sigil.",
      "A wolf paused and stared—then turned away.",
      "You dropped something important and could not find it.",
      "A warm, familiar voice calling you by another name."
    ];
    return samples[i % samples.length];
  }

  // -------------------------
  // AUDIO (WebAudio spatial basics)
  // -------------------------
  initAudio() {
    try {
      this.audio.context = new (window.AudioContext || window.webkitAudioContext)();
      this.audio.master = this.audio.context.createGain();
      this.audio.master.gain.value = 0.8;
      this.audio.master.connect(this.audio.context.destination);
      console.log("Audio context created");
    } catch (err) {
      console.warn("Audio not available:", err);
      this.audio.enabled = false;
    }
  }

  playSpatialSound(type, position, loop=false) {
    if (!this.audio.enabled) return;
    const ctx = this.audio.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createPanner();
    try {
      osc.type = 'sine';
      osc.frequency.value = type === 'wolf' ? 220 : type === 'memory' ? 880 : 440;
      gain.gain.value = 0.08;
      panner.setPosition(position.x, position.y || 0, position.z);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.audio.master);

      osc.start();
      if (!loop) osc.stop(ctx.currentTime + 0.6);
      // store short-lived sources
      this.audio.sources.push({ osc, gain, panner, started: ctx.currentTime });
      return { osc, gain, panner };
    } catch(e) {
      console.warn("sound failed", e);
    }
  }

  // -------------------------
  // UI & Input
  // -------------------------
  initUI() {
    // fragments grid
    if (this.ui.memoryGrid) {
      this.ui.memoryGrid.innerHTML = '';
      for (let i=0;i<this.memorySystem.totalFragments;i++){
        const slot = document.createElement('div');
        slot.className = 'fragment-slot';
        slot.setAttribute('data-id', i);
        slot.innerHTML = '<i class="fas fa-question"></i>';
        this.ui.memoryGrid.appendChild(slot);
      }
    }

    // pause buttons
    if (this.ui.pauseResume) this.ui.pauseResume.onclick = () => this.resumeGame();
    if (this.ui.pauseQuit) this.ui.pauseQuit.onclick = () => this.quitToMenu();
    if (this.ui.memoryExit) this.ui.memoryExit.onclick = () => this.exitMemoryMode();
  }

  bindMenuButtons() {
    if (!this.ui.newGameBtn) return;
    this.ui.newGameBtn.onclick = () => this.startNewGame();
    if (this.ui.settingsBtn) this.ui.settingsBtn.onclick = () => this.showNotification("Neural settings coming soon", 2000);
  }

  // -------------------------
  // INPUT & CONTROLS
  // -------------------------
  initInput() {
    // pointer lock
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (!this.gameState.isRunning || this.gameState.isPaused) return;
      canvas.requestPointerLock?.();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    // mouse move
    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.gameState.isPaused || this.gameState.isInMenu) return;
      const sens = 0.002;
      this.player.rotation.y -= e.movementX * sens;
      this.player.rotation.x -= e.movementY * sens;
      this.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.player.rotation.x));
    });

    // keys
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') this.handleEscape();
      if (e.code === 'KeyE') this.interact();
      if (e.code === 'KeyM') this.enterMemoryMode();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  handleEscape() {
    if (this.gameState.isInMemory) return this.exitMemoryMode();
    if (this.gameState.isPaused) this.resumeGame();
    else this.pauseGame();
  }

  // -------------------------
  // MEMORY / UI interactions
  // -------------------------
  initMemoryData() {
    // memorySystem.fragments already created via createMemoryCrystals
    // ensure collection flags exist
    this.memorySystem.fragments.forEach(f => { f.collected = !!f.collected; });
    this.updateMemoryGrid();
  }

  updateMemoryGrid() {
    const slots = this.ui.memoryGrid?.querySelectorAll('.fragment-slot') || [];
    slots.forEach((slot, i) => {
      const mem = this.memorySystem.fragments[i];
      if (mem && mem.collected) {
        slot.classList.add('collected');
        slot.innerHTML = '<i class="fas fa-brain"></i>';
      } else {
        slot.classList.remove('collected');
        slot.innerHTML = '<i class="fas fa-question"></i>';
      }
    });
    if (this.ui.fragmentTip) this.ui.fragmentTip.textContent = this.memorySystem.collected === 0 ? "Listen for whispers..." : "Memory echoes guide you.";
  }

  interact() {
    // raycast forward to see if near a fragment
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const rayOrigin = this.camera.position.clone();
    const raycaster = new THREE.Raycaster(rayOrigin, dir, 0, 4);
    const intersects = raycaster.intersectObjects(this.memorySystem.fragments.filter(f=>!f.collected).map(f=>f.crystal));
    if (intersects.length>0) {
      const hit = intersects[0].object;
      const fragId = hit.userData.fragmentId;
      const mem = this.memorySystem.fragments.find(m => m.id === fragId);
      if (mem) this.collectMemoryFragment(mem);
    }
  }

  collectMemoryFragment(memory) {
    if (memory.collected) return;
    console.log("Collected fragment:", memory.id);
    memory.collected = true;
    this.memorySystem.collected++;
    // remove crystal visually
    this.scene.remove(memory.crystal);
    this.neural.connections += Math.floor(this.neural.maxConnections / this.memorySystem.totalFragments);
    this.player.memoryClarity += 10;
    // spawn memory chime spatial sound
    this.playSpatialSound('memory', memory.position);
    this.updateMemoryGrid();
    this.updateNeuralHUD();
    // auto-enter memory mode
    setTimeout(()=>this.enterMemoryMode(memory), 800);
    // autosave
    this.saveGame();
  }

  enterMemoryMode(memory = null) {
    if (!memory) {
      const unviewed = this.memorySystem.fragments.find(f => f.collected && f.clarity < 100);
      if (!unviewed) return;
      memory = unviewed;
    }
    console.log("Entering memory:", memory.title);
    this.gameState.isInMemory = true;
    this.memorySystem.currentMemory = memory;
    // UI swap
    this.ui.memoryInterface.classList.remove('screen-hidden'); this.ui.memoryInterface.classList.add('screen-visible');
    this.ui.gameUI.classList.remove('screen-visible'); this.ui.gameUI.classList.add('screen-hidden');
    // populate memory UI
    if (this.ui.memoryTitle) this.ui.memoryTitle.textContent = memory.title;
    if (this.ui.memorySubtitle) this.ui.memorySubtitle.textContent = "Recollection";
    if (this.ui.sceneText) this.ui.sceneText.textContent = memory.sceneText;
    if (this.ui.narrativeText) this.ui.narrativeText.textContent = memory.sceneText;
    // start reconstruction process
    this.startMemoryReconstruction(memory);
  }

  startMemoryReconstruction(memory) {
    let clarity = memory.clarity || 0;
    const tick = () => {
      if (!this.gameState.isInMemory) return;
      clarity += 0.6 + this.player.forestConnection*0.02;
      memory.clarity = Math.min(clarity, 100);
      if (this.ui.clarityValue) this.ui.clarityValue.textContent = Math.floor(memory.clarity) + "%";
      if (this.ui.narrativeProgress) this.ui.narrativeProgress.style.width = memory.clarity + "%";
      if (memory.clarity < 100) requestAnimationFrame(tick);
      else {
        // integrate fragment benefits
        this.applyMemoryIntegration(memory);
      }
    };
    tick();
  }

  applyMemoryIntegration(memory) {
    // simple ability unlocks based on fragment id mapping
    const abilityMap = ["wolfUnderstanding","forestConnection","soundAwareness","deceptionResistance","memoryClarity","forestConnection","soundAwareness","wolfUnderstanding","memoryClarity","forestConnection","soundAwareness","deceptionResistance"];
    const ability = abilityMap[memory.id % abilityMap.length];
    switch(ability){
      case "wolfUnderstanding": this.player.wolfUnderstanding = Math.min(100, this.player.wolfUnderstanding + 15); break;
      case "forestConnection": this.player.forestConnection = Math.min(100, this.player.forestConnection + 20); break;
      case "soundAwareness": this.player.soundAwareness = Math.min(100, this.player.soundAwareness + 10); break;
      case "deceptionResistance": this.player.deceptionResistance = Math.min(100, this.player.deceptionResistance + 8); break;
      case "memoryClarity": this.player.memoryClarity = Math.min(100, this.player.memoryClarity + 12); break;
    }
    this.updateNeuralHUD();
  }

  exitMemoryMode() {
    console.log("Exiting memory mode");
    this.gameState.isInMemory = false;
    this.memorySystem.currentMemory = null;
    this.ui.memoryInterface.classList.remove('screen-visible'); this.ui.memoryInterface.classList.add('screen-hidden');
    this.ui.gameUI.classList.remove('screen-hidden'); this.ui.gameUI.classList.add('screen-visible');
  }

  // -------------------------
  // WOLVES (basic pack AI)
  // -------------------------
  initWolves() {
    for (let i=0;i<this.wolfSystem.totalWolves;i++){
      this.createWolf(i);
    }
  }

  createWolf(id) {
    const x = (Math.random()-0.5)*200;
    const z = (Math.random()-0.5)*200;
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color:0x222222, roughness:0.8 });
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(x, 0.5, z);
    body.castShadow = true;
    this.scene.add(body);
    const wolf = {
      id, body,
      pos: body.position.clone(),
      speed: 1.2 + Math.random()*0.8,
      state: "idle",
      detectionRange: 18 + Math.random()*12,
      attackRange: 1.6,
      lastSeen: 0
    };
    this.wolfSystem.packs.push(wolf);
    return wolf;
  }

  updateWolves(delta) {
    const playerPos = this.player.pos;
    this.wolfSystem.packs.forEach(w => {
      const dist = w.pos.distanceTo(playerPos);
      if (dist < w.attackRange) {
        // attack
        if (w.state !== 'attacking') {
          w.state = 'attacking';
          this.player.health -= 8;
          this.player.sanity -= 5;
          this.showDamageFlash();
        }
      } else if (dist < w.detectionRange) {
        // chase
        w.state = 'chasing';
        const dir = new THREE.Vector3().subVectors(playerPos, w.pos).normalize();
        w.pos.addScaledVector(dir, w.speed * delta);
      } else {
        // idle wander
        if (w.state === 'idle' && Math.random() < 0.01) {
          w._target = new THREE.Vector3(w.pos.x + (Math.random()-0.5)*15, 0, w.pos.z + (Math.random()-0.5)*15);
        }
        if (w._target) {
          const d = w.pos.distanceTo(w._target);
          if (d > 1) {
            const dir = new THREE.Vector3().subVectors(w._target, w.pos).normalize();
            w.pos.addScaledVector(dir, w.speed * 0.4 * delta);
          } else w._target = null;
        }
      }
      w.body.position.copy(w.pos);
    });

    // howling behavior (ambient)
    this.wolfSystem.lastHowl += delta;
    if (this.wolfSystem.lastHowl > this.wolfSystem.nextHowl) {
      this.wolfSystem.lastHowl = 0;
      this.wolfSystem.nextHowl = 20 + Math.random()*40;
      // pick a wolf far from player to howl
      const candidate = this.wolfSystem.packs.find(w => w.pos.distanceTo(this.player.pos) > 30) || this.wolfSystem.packs[0];
      if (candidate) {
        this.playSpatialSound('wolf', candidate.pos);
      }
    }
  }

  // -------------------------
  // GAME START/PAUSE/LOOP
  // -------------------------
  bindMenuButtons() {
    if (!this.ui.newGameBtn) return;
    this.ui.newGameBtn.addEventListener('click', () => this.startNewGame());
  }

  startNewGame() {
    console.log("Starting new game");
    this.ui.mainMenu.classList.remove('screen-visible'); this.ui.mainMenu.classList.add('screen-hidden');
    this.ui.gameUI.classList.remove('screen-hidden'); this.ui.gameUI.classList.add('screen-visible');
    this.gameState.isRunning = true;
    this.gameState.isInMenu = false;
    // pointer lock will be requested by click on canvas in initInput
    this.startTime = performance.now();
    this.gameLoop();
  }

  pauseGame() {
    console.log("Pause");
    this.gameState.isPaused = true;
    if (this.ui.pauseMenu) { this.ui.pauseMenu.classList.remove('screen-hidden'); this.ui.pauseMenu.classList.add('screen-visible'); }
    document.exitPointerLock?.();
  }

  resumeGame() {
    console.log("Resume");
    this.gameState.isPaused = false;
    if (this.ui.pauseMenu) { this.ui.pauseMenu.classList.remove('screen-visible'); this.ui.pauseMenu.classList.add('screen-hidden'); }
    this.renderer.domElement.requestPointerLock?.();
  }

  quitToMenu() {
    window.location.reload();
  }

  // -------------------------
  // GAME LOOP
  // -------------------------
  gameLoop() {
    if (!this.gameState.isRunning) return;
    const delta = Math.min(0.05, this.clock.getDelta());
    this.gameState.gameTime += delta;

    if (!this.gameState.isPaused && !this.gameState.isInMemory) {
      this.updatePlayer(delta);
      this.updateWolves(delta);
      this.updateNeuralNetwork(delta);
      this.updateUI();
      this.updateSoundCompass();
      // animate crystals
      this.memorySystem.fragments.forEach(f => {
        if (!f.collected && f.crystal) {
          const t = (this.gameState.gameTime + f.crystal._pulseOffset) * 2;
          const s = 1 + Math.sin(t) * 0.08;
          f.crystal.scale.setScalar(s);
          f.crystal.rotation.y += 0.01;
        }
      });
    }

    // render
    this.renderer.render(this.scene, this.camera);

    // continue
    requestAnimationFrame(()=>this.gameLoop());
  }

  updatePlayer(delta) {
    // movement
    const speed = this.keys['ShiftLeft'] ? 8 : 4;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const right = new THREE.Vector3().crossVectors(this.camera.up, dir).normalize();

    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.add(dir);
    if (this.keys['KeyS']) move.sub(dir);
    if (this.keys['KeyA']) move.add(right);
    if (this.keys['KeyD']) move.sub(right);

    if (move.lengthSq()>0) {
      move.normalize().multiplyScalar(speed * delta);
      this.player.pos.add(move);
      this.player.stamina = Math.max(0, this.player.stamina - 10 * delta);
      this.neural.forestConsciousness.awareness = Math.min(100, this.neural.forestConsciousness.awareness + 0.01);
    } else this.player.stamina = Math.min(100, this.player.stamina + 10*delta);

    // clamp to bounds
    const limit = 140;
    this.player.pos.x = Math.max(-limit, Math.min(limit, this.player.pos.x));
    this.player.pos.z = Math.max(-limit, Math.min(limit, this.player.pos.z));

    // camera follow
    this.camera.position.copy(this.player.pos);
    this.camera.rotation.x = - this.player.rotation.x;
    this.camera.rotation.y = - this.player.rotation.y;
  }

  // -------------------------
  // NEURAL / UI updates
  // -------------------------
  updateNeuralNetwork(delta) {
    // learning connections slowly
    if (Math.random() < this.neural.learningRate * delta) this.neural.connections = Math.min(this.neural.maxConnections, this.neural.connections + 1);

    // mood update
    if (this.player.sanity < 30) this.neural.forestConsciousness.mood = "aggressive";
    else if (this.player.forestConnection > 50) this.neural.forestConsciousness.mood = "friendly";
    else this.neural.forestConsciousness.mood = "neutral";
  }

  updateNeuralHUD() {
    const memPercent = Math.floor(this.neural.forestConsciousness.awareness);
    if (this.ui.memoryValue) this.ui.memoryValue.textContent = memPercent + "%";
    const learningPercent = Math.floor((this.neural.connections / this.neural.maxConnections) * 100);
    const circle = document.querySelector('.circle-value');
    if (circle) circle.textContent = learningPercent + "%";
    if (this.ui.learningType) {
      const types = ['Exploring','Learning','Adapting','Remembering','Understanding'];
      this.ui.learningType.textContent = types[Math.floor(this.gameState.gameTime/60)%types.length];
    }
  }

  updateUI() {
    // sanity/connection
    if (this.ui.sanityBar) this.ui.sanityBar.style.width = `${Math.floor(this.player.sanity)}%`;
    if (this.ui.sanityValue) this.ui.sanityValue.textContent = `${Math.floor(this.player.sanity)}%`;
    if (this.ui.connectionBar) this.ui.connectionBar.style.width = `${Math.floor(this.player.forestConnection)}%`;
    if (this.ui.connectionValue) this.ui.connectionValue.textContent = `${Math.floor(this.player.forestConnection)}%`;
    this.updateNeuralHUD();
    this.updateMemoryGrid();
  }

  updateSoundCompass() {
    if (!this.ui.soundCompassNeedle) return;
    // find loudest sound in audio.sources (spatial)
    let loudest = null;
    let loudVal = 0;
    for (const s of this.audio.sources) {
      if (!s.panner) continue;
      // approximate loudness by gain value (not perfect)
      const gain = s.gain?.gain?.value || 0.05;
      if (gain > loudVal) { loudVal = gain; loudest = s; }
    }
    // point needle roughly towards player's last heard; fallback to sway
    const angle = (loudest && loudest.panner && loudest.panner.positionX) ? (Math.sin(this.gameState.gameTime)*45) : Math.sin(this.gameState.gameTime*0.5)*30;
    this.ui.soundCompassNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  showDamageFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top='0'; flash.style.left='0'; flash.style.width='100%'; flash.style.height='100%';
    flash.style.background='rgba(255,0,0,0.25)'; flash.style.zIndex='9999'; flash.style.pointerEvents='none';
    document.body.appendChild(flash);
    setTimeout(()=>{ flash.style.opacity='0'; setTimeout(()=>flash.remove(),300); }, 120);
  }

  showNotification(text, duration=2500) {
    const n = document.createElement('div');
    n.style.position='fixed'; n.style.top='20px'; n.style.left='50%'; n.style.transform='translateX(-50%)';
    n.style.background='rgba(0,5,17,0.95)'; n.style.color='var(--neural-primary)'; n.style.padding='12px 20px';
    n.style.border='2px solid var(--neural-primary)'; n.style.borderRadius='10px'; n.style.zIndex='10001'; n.textContent=text;
    document.body.appendChild(n);
    setTimeout(()=>{ n.style.opacity='0'; setTimeout(()=>n.remove(),300); }, duration);
  }

  // -------------------------
  // SAVE / LOAD
  // -------------------------
  saveGame() {
    try {
      const save = {
        time: Date.now(),
        player: {
          pos: this.player.pos.toArray(),
          stats: { health:this.player.health, sanity:this.player.sanity, forestConnection:this.player.forestConnection }
        },
        neural: { connections: this.neural.connections },
        fragments: this.memorySystem.fragments.map(f => ({ id: f.id, collected: !!f.collected, clarity: f.clarity }))
      };
      localStorage.setItem('eotf_save', JSON.stringify(save));
      console.log("Game saved");
    } catch(e){ console.warn("Save failed", e); }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('eotf_save');
      if (!raw) return false;
      const save = JSON.parse(raw);
      if (save.player && save.player.pos) this.player.pos.fromArray(save.player.pos);
      if (save.neural) this.neural.connections = save.neural.connections;
      if (save.fragments) {
        save.fragments.forEach(s => {
          const f = this.memorySystem.fragments.find(ff=>ff.id===s.id);
          if (f) { f.collected = s.collected; f.clarity = s.clarity; if (f.collected && f.crystal) this.scene.remove(f.crystal); }
        });
      }
      this.updateMemoryGrid();
      console.log("Save loaded");
      return true;
    } catch(e){ console.warn("Load failed", e); return false; }
  }

  // -------------------------
  // Debug helpers (window.game)
  // -------------------------
  attachDebugAPI() {
    const self = this;
    window.game = window.game || {};
    window.game.spawnWolf = function(){ self.createWolf(self.wolfSystem.packs.length); };
    window.game.teleport = function(x,y,z){ self.player.pos.set(x,y,z); self.camera.position.copy(self.player.pos); };
    window.game.unlockAll = function(){ self.memorySystem.fragments.forEach(f=>{ if(!f.collected){ f.collected=true; self.scene.remove(f.crystal); }}); self.updateMemoryGrid(); };
    window.game.save = () => self.saveGame();
    window.game.load = () => self.loadGame();
    window.game.debug = { mode:false, godMode:false };
  }
}

// -------------------------
// Bootstrap
// -------------------------
window.addEventListener('load', () => {
  try {
    const game = new EarsOfTheForest();
    // attach debug after small delay so UI cached
    setTimeout(()=>game.attachDebugAPI(), 800);
    // show emergency skip button handler
    const em = document.getElementById('emergency-skip');
    if (em) em.addEventListener('click', ()=>game.emergencyLoad());
  } catch (e) {
    console.error("Game bootstrap failed:", e);
    const p = document.getElementById('progress-text');
    if (p) p.textContent = "Initialization failed: " + e.message;
  }
});

// Auto-pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.game && window.game.gameState && window.game.gameState.isRunning) {
    window.game.pauseGame();
  }
});
