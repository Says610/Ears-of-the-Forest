/* =========================================================
   EARS OF THE FOREST - UI CONTROLLER
========================================================= */

class GameUI {
    constructor() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            howToPlay: document.getElementById('how-to-play'),
            settings: document.getElementById('settings-menu'),
            gameStart: document.getElementById('game-start'),
            pauseMenu: document.getElementById('pause-menu'),
            clickToPlay: document.getElementById('click-to-play'),
            gameUI: document.getElementById('game-ui'),
            gameContainer: document.getElementById('game-container')
        };
        
        this.loadingProgress = 0;
        this.loadingTips = [
            "Generating forest terrain...",
            "Loading wolf AI...",
            "Setting up lighting...",
            "Initializing audio system...",
            "Preparing survival mechanics...",
            "Loading story elements...",
            "Finalizing game world..."
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.startLoading();
    }
    
    bindEvents() {
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
            this.screens.pauseMenu.style.display = 'none';
        });
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        // Click to play screen
        this.screens.clickToPlay.addEventListener('click', () => this.startGamePlay());
        
        // Pause with ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.screens.gameUI.style.display === 'block') {
                this.togglePause();
            }
        });
    }
    
    startLoading() {
        this.showScreen('loading');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const loadingTip = document.getElementById('loading-tip');
        
        const interval = setInterval(() => {
            this.loadingProgress += Math.random() * 15;
            if (this.loadingProgress > 100) {
                this.loadingProgress = 100;
                clearInterval(interval);
                setTimeout(() => this.loadingComplete(), 500);
            }
            
            progressBar.style.width = `${this.loadingProgress}%`;
            progressText.textContent = `${Math.floor(this.loadingProgress)}%`;
            
            // Change tip every 20% progress
            if (this.loadingProgress % 20 < 15 && this.loadingProgress % 20 > 10) {
                const tipIndex = Math.floor(this.loadingProgress / 20);
                if (tipIndex < this.loadingTips.length) {
                    loadingTip.textContent = this.loadingTips[tipIndex];
                }
            }
        }, 200);
    }
    
    loadingComplete() {
        this.showScreen('mainMenu');
        this.playBackgroundMusic();
    }
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen && screen.style) {
                screen.style.display = 'none';
            }
        });
        
        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'flex';
        }
    }
    
    playBackgroundMusic() {
        // Background music would go here
        console.log("Background music started");
    }
    
    applySettings() {
        const settings = {
            quality: document.getElementById('quality').value,
            resolution: document.getElementById('resolution').value,
            shadows: document.getElementById('shadows').value,
            fov: document.getElementById('fov').value,
            masterVolume: document.getElementById('master-volume').value,
            musicVolume: document.getElementById('music-volume').value,
            sfxVolume: document.getElementById('sfx-volume').value,
            difficulty: document.getElementById('difficulty').value
        };
        
        console.log("Settings applied:", settings);
        this.showScreen('mainMenu');
    }
    
    startGame() {
        this.showScreen('clickToPlay');
    }
    
    startGamePlay() {
        this.showScreen('gameUI');
        this.screens.gameContainer.style.display = 'block';
        this.screens.clickToPlay.style.display = 'none';
        
        // Start the actual game here
        console.log("Game started!");
        
        // Initialize game logic
        this.initGame();
    }
    
    initGame() {
        // Update UI elements
        this.updateHealth(100);
        this.updateStamina(100);
        this.updateBattery(100);
        this.updateFear(5);
        this.updateTime("12:00 PM");
        this.updateObjective("Find your way out of the forest");
        
        // Show initial notification
        this.showNotification("You wake up in the forest...");
        
        // Start game loop simulation
        this.startGameLoop();
    }
    
    updateHealth(health) {
        const healthFill = document.getElementById('health-fill');
        const healthValue = document.getElementById('health-value');
        healthFill.style.width = `${health}%`;
        healthValue.textContent = health;
        
        // Update pause menu health
        document.getElementById('pause-health').textContent = health;
    }
    
    updateStamina(stamina) {
        const staminaFill = document.getElementById('stamina-fill');
        staminaFill.style.width = `${stamina}%`;
    }
    
    updateBattery(battery) {
        const batteryValue = document.getElementById('battery-value');
        const batteryIcon = document.getElementById('battery-icon');
        batteryValue.textContent = `${battery}%`;
        
        // Change icon based on battery level
        if (battery > 70) {
            batteryIcon.className = 'fas fa-battery-full';
        } else if (battery > 40) {
            batteryIcon.className = 'fas fa-battery-three-quarters';
        } else if (battery > 20) {
            batteryIcon.className = 'fas fa-battery-half';
        } else if (battery > 10) {
            batteryIcon.className = 'fas fa-battery-quarter';
        } else {
            batteryIcon.className = 'fas fa-battery-empty';
        }
    }
    
    updateFear(fear) {
        const fearFill = document.getElementById('fear-fill');
        const fearIcon = document.getElementById('fear-icon');
        fearFill.style.width = `${fear}%`;
        
        // Update pause menu fear
        document.getElementById('pause-fear').textContent = fear;
        
        // Change icon color based on fear
        if (fear > 80) {
            fearIcon.style.color = '#ff0000';
        } else if (fear > 60) {
            fearIcon.style.color = '#ff4444';
        } else if (fear > 40) {
            fearIcon.style.color = '#aa44ff';
        } else {
            fearIcon.style.color = '#aa44ff';
        }
    }
    
    updateTime(time) {
        document.getElementById('game-time').textContent = time;
    }
    
    updateObjective(objective) {
        document.getElementById('objective-text').textContent = objective;
    }
    
    showNotification(text) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        notificationText.textContent = text;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    showInteractionPrompt(text) {
        const prompt = document.getElementById('interaction-prompt');
        const promptText = document.getElementById('interaction-text');
        
        promptText.textContent = text;
        prompt.classList.add('show');
    }
    
    hideInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        prompt.classList.remove('show');
    }
    
    startGameLoop() {
        // Simulate game events
        let gameTime = 0;
        
        setInterval(() => {
            gameTime += 1;
            
            // Update time display
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            document.getElementById('pause-time').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Simulate game events
            if (gameTime === 30) {
                this.showNotification("You hear a wolf howl in the distance...");
            }
            
            if (gameTime === 60) {
                this.updateFear(30);
                this.showNotification("The forest feels darker...");
            }
            
            if (gameTime === 90) {
                this.updateBattery(75);
                this.showNotification("Flashlight battery at 75%");
            }
            
        }, 1000);
    }
    
    togglePause() {
        if (this.screens.pauseMenu.style.display === 'none') {
            this.showScreen('pauseMenu');
        } else {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.screens.pauseMenu.style.display = 'none';
        this.screens.gameUI.style.display = 'block';
        this.screens.gameContainer.style.display = 'block';
    }
    
    quitToMenu() {
        if (confirm("Are you sure you want to quit to main menu? Progress will be lost.")) {
            this.showScreen('mainMenu');
            this.screens.gameUI.style.display = 'none';
            this.screens.gameContainer.style.display = 'none';
            this.screens.pauseMenu.style.display = 'none';
        }
    }
    
    quitGame() {
        if (confirm("Are you sure you want to quit the game?")) {
            window.close();
        }
    }
}

// Start the UI when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GameUI();
});
