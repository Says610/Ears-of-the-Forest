// =========================================================
// EARS OF THE FOREST - MINIMAL WORKING VERSION
// =========================================================

class Game {
    constructor() {
        console.log("Game constructor called");
        this.loadingProgress = 0;
        this.isLoaded = false;
    }

    init() {
        console.log("Game.init() called");
        
        // Show emergency button after 3 seconds
        setTimeout(() => {
            const skipBtn = document.getElementById('emergency-skip');
            if (skipBtn) {
                skipBtn.style.display = 'block';
                skipBtn.addEventListener('click', () => {
                    console.log("Emergency skip clicked!");
                    this.emergencySkip();
                });
            }
        }, 3000);

        // Start loading sequence
        this.startLoading();
    }

    startLoading() {
        console.log("Starting loading sequence...");
        
        // Step 1: Check Three.js
        this.updateLoading("Checking Three.js...", 10);
        setTimeout(() => {
            if (typeof THREE === 'undefined') {
                this.updateLoading("ERROR: Three.js not loaded!", 100);
                return;
            }
            
            // Step 2: Load game
            this.updateLoading("Loading game...", 30);
            setTimeout(() => {
                this.updateLoading("Creating world...", 60);
                setTimeout(() => {
                    this.updateLoading("Almost ready...", 90);
                    setTimeout(() => {
                        this.updateLoading("Ready!", 100);
                        this.isLoaded = true;
                        
                        // Auto-start after 1 second
                        setTimeout(() => {
                            this.startGame();
                        }, 1000);
                        
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
    }

    updateLoading(text, percent) {
        console.log(`Loading: ${text} (${percent}%)`);
        
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        this.loadingProgress = percent;
    }

    emergencySkip() {
        console.log("EMERGENCY SKIP ACTIVATED!");
        
        // Force hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show game canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.backgroundColor = '#001a00';
            
            // Draw something on canvas to prove it's working
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                ctx.fillStyle = '#001a00';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#4CAF50';
                ctx.font = '48px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('GAME LOADED!', canvas.width/2, canvas.height/2);
                
                ctx.fillStyle = '#8BC34A';
                ctx.font = '24px Courier New';
                ctx.fillText('Emergency Mode Active', canvas.width/2, canvas.height/2 + 50);
                ctx.fillText('Press F5 to reload properly', canvas.width/2, canvas.height/2 + 100);
            }
        }
        
        // Try to initialize Three.js
        this.initializeThreeJS();
    }

    initializeThreeJS() {
        if (typeof THREE === 'undefined') {
            console.error("Three.js still not loaded!");
            return;
        }
        
        try {
            console.log("Initializing Three.js...");
            
            // Create basic Three.js scene
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvas });
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x001a00, 1);
            
            // Add a simple cube to show it's working
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color: 0x4CAF50 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            
            camera.position.z = 5;
            
            // Simple animation
            function animate() {
                requestAnimationFrame(animate);
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
            
            animate();
            
            console.log("Three.js initialized successfully!");
            
        } catch (error) {
            console.error("Failed to initialize Three.js:", error);
        }
    }

    startGame() {
        console.log("Starting game...");
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show game canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
        
        // Initialize Three.js
        this.initializeThreeJS();
    }
}

// ===============================
// START THE GAME WHEN PAGE LOADS
// ===============================

// Wait for page to fully load
window.addEventListener('load', function() {
    console.log("Page fully loaded, starting game...");
    
    // Create game instance
    window.game = new Game();
    
    // Start initialization
    window.game.init();
});

// Fallback: If DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log("DOM already loaded, starting game now...");
    window.game = new Game();
    window.game.init();
}

// Debug: Show what's happening
console.log("Script.js loaded successfully!");
console.log("Three.js available:", typeof THREE !== 'undefined');
console.log("Canvas element:", document.getElementById('gameCanvas'));
console.log("Loading screen element:", document.getElementById('loading-screen'));
