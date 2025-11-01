class UIManager {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'mainMenu'; // 'mainMenu', 'playerCustomize', 'levelSelect', 'playing', 'paused', 'gameOver'
        this.isPaused = false;
        this.selectedMenuItem = 0;
        this.menuItems = ['Start Game', 'How to Play', 'Settings'];
        this.settingsOpen = false;
        this.howToPlayOpen = false;
        
        // Player customization
        this.customizingPlayer = 1; // Which player is being customized (1 or 2)
        this.customizeField = 'name'; // 'name' or 'color'
        this.playerCustomization = {
            player1: {
                name: 'P1',
                color: '#0066ff',
                nameInput: 'P1'
            },
            player2: {
                name: 'P2',
                color: '#ff0000',
                nameInput: 'P2'
            }
        };
        this.colorPalette = [
            '#0066ff', '#ff0000', '#00ff00', '#ffff00', 
            '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
            '#ff0088', '#00ff88', '#888888', '#ffffff'
        ];
        this.selectedColorIndex = { player1: 0, player2: 1 };
        this.maxNameLength = 8;
        
        // Level selection
        this.selectedLevelIndex = 0;
        this.levelList = [];
        
        // Game Settings
        this.gameSettings = {
            matchDuration: 180,        // seconds (60-600)
            winScoreThreshold: 200,    // points needed to win (100-500)
            powerUpSpawnRate: 10,      // seconds between spawns (5-30)
            captureSpeed: 1.0,         // multiplier for zone capture speed (0.5-2.0)
            startingHealth: 100,       // player health (50-200)
            respawnTime: 3,            // seconds (1-10)
            maxPowerUps: 5,            // max power-ups on map (3-10)
            showFPS: false,
            projectileSpeed: 8,        // (5-15)
            playerSpeed: 5             // (3-10)
        };
        
        // Settings menu state
        this.settingsScreen = 'gameSettings'; // Will be used when settings open
        this.selectedSettingIndex = 0;
        this.settingsList = [
            { key: 'matchDuration', label: 'Match Duration', min: 60, max: 600, step: 30, suffix: 's' },
            { key: 'winScoreThreshold', label: 'Win Score', min: 100, max: 500, step: 50, suffix: ' pts' },
            { key: 'powerUpSpawnRate', label: 'Power-up Spawn Rate', min: 5, max: 30, step: 5, suffix: 's' },
            { key: 'captureSpeed', label: 'Capture Speed', min: 0.5, max: 2.0, step: 0.25, suffix: 'x' },
            { key: 'startingHealth', label: 'Starting Health', min: 50, max: 200, step: 25, suffix: 'HP' },
            { key: 'respawnTime', label: 'Respawn Time', min: 1, max: 10, step: 1, suffix: 's' },
            { key: 'maxPowerUps', label: 'Max Power-ups', min: 3, max: 10, step: 1, suffix: '' },
            { key: 'projectileSpeed', label: 'Projectile Speed', min: 5, max: 15, step: 1, suffix: '' },
            { key: 'playerSpeed', label: 'Player Speed', min: 3, max: 10, step: 1, suffix: '' },
            { key: 'showFPS', label: 'Show FPS', min: 0, max: 1, step: 1, suffix: '', type: 'boolean' }
        ];
        
        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        
        console.log('UIManager constructor - setting currentScreen to mainMenu');
        
        this.setupKeyboardControls();
        
        // Force set to main menu after a tiny delay to ensure it's not overridden
        setTimeout(() => {
            console.log('Timeout check - currentScreen:', this.currentScreen);
            if (this.currentScreen !== 'mainMenu') {
                console.warn('Screen was changed! Forcing back to mainMenu');
                this.currentScreen = 'mainMenu';
            }
        }, 100);
    }
    
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'Current screen:', this.currentScreen);
            
            // Prevent default for menu navigation keys
            if (this.currentScreen === 'mainMenu' || this.currentScreen === 'levelSelect') {
                if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
                    e.preventDefault();
                }
            }
            
            // Pause/Resume toggle
            if (e.key === 'Escape' && this.currentScreen === 'playing') {
                this.togglePause();
            } else if (e.key === 'Escape' && this.currentScreen === 'paused') {
                this.togglePause();
            } else if (e.key === 'Escape' && this.settingsOpen) {
                this.settingsOpen = false;
            } else if (e.key === 'Escape' && this.howToPlayOpen) {
                this.howToPlayOpen = false;
            }
            
            // Settings menu navigation
            if (this.settingsOpen) {
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    e.preventDefault();
                    this.selectedSettingIndex = Math.max(0, this.selectedSettingIndex - 1);
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    e.preventDefault();
                    this.selectedSettingIndex = Math.min(this.settingsList.length - 1, this.selectedSettingIndex + 1);
                }
                if (e.key === 'ArrowLeft' || e.key === 'a') {
                    e.preventDefault();
                    this.adjustSetting(-1);
                }
                if (e.key === 'ArrowRight' || e.key === 'd') {
                    e.preventDefault();
                    this.adjustSetting(1);
                }
                return; // Don't process other controls while in settings
            }
            
            // Return to menu from pause
            if (e.key === 'm' && this.currentScreen === 'paused') {
                this.returnToMenu();
            }
            
            // Menu navigation
            if (this.currentScreen === 'mainMenu' && !this.settingsOpen && !this.howToPlayOpen) {
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    this.selectedMenuItem = Math.max(0, this.selectedMenuItem - 1);
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    this.selectedMenuItem = Math.min(this.menuItems.length - 1, this.selectedMenuItem + 1);
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectMenuItem();
                    return; // Stop processing this key event
                }
            }
            
            // Level selection navigation
            else if (this.currentScreen === 'levelSelect') {
                if (e.key === 'ArrowLeft' || e.key === 'a') {
                    this.selectedLevelIndex = Math.max(0, this.selectedLevelIndex - 1);
                }
                if (e.key === 'ArrowRight' || e.key === 'd') {
                    this.selectedLevelIndex = Math.min(this.levelList.length - 1, this.selectedLevelIndex + 1);
                }
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    this.selectedLevelIndex = Math.max(0, this.selectedLevelIndex - 2);
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    this.selectedLevelIndex = Math.min(this.levelList.length - 1, this.selectedLevelIndex + 2);
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectLevel();
                    return; // Stop processing this key event
                }
                if (e.key === 'Escape') {
                    this.currentScreen = 'playerCustomize';
                    this.selectedMenuItem = 0;
                    return; // Stop processing this key event
                }
            }
            
            // Player customization navigation
            else if (this.currentScreen === 'playerCustomize') {
                // Tab or number keys to switch between players
                if (e.key === 'Tab' || e.key === '1') {
                    e.preventDefault();
                    this.customizingPlayer = 1;
                }
                if (e.key === '2') {
                    e.preventDefault();
                    this.customizingPlayer = 2;
                }
                
                // Arrow keys to change field or color
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    e.preventDefault();
                    this.customizeField = 'name';
                }
                if (e.key === 'ArrowDown' || e.key === 's') {
                    e.preventDefault();
                    this.customizeField = 'color';
                }
                
                // Color selection
                if (this.customizeField === 'color') {
                    const playerKey = `player${this.customizingPlayer}`;
                    if (e.key === 'ArrowLeft' || e.key === 'a') {
                        e.preventDefault();
                        this.selectedColorIndex[playerKey] = Math.max(0, this.selectedColorIndex[playerKey] - 1);
                        this.playerCustomization[playerKey].color = this.colorPalette[this.selectedColorIndex[playerKey]];
                    }
                    if (e.key === 'ArrowRight' || e.key === 'd') {
                        e.preventDefault();
                        this.selectedColorIndex[playerKey] = Math.min(this.colorPalette.length - 1, this.selectedColorIndex[playerKey] + 1);
                        this.playerCustomization[playerKey].color = this.colorPalette[this.selectedColorIndex[playerKey]];
                    }
                }
                
                // Name input
                if (this.customizeField === 'name') {
                    const playerKey = `player${this.customizingPlayer}`;
                    
                    // Backspace to delete
                    if (e.key === 'Backspace') {
                        e.preventDefault();
                        this.playerCustomization[playerKey].nameInput = 
                            this.playerCustomization[playerKey].nameInput.slice(0, -1);
                    }
                    // Letter/number input
                    else if (e.key.length === 1 && this.playerCustomization[playerKey].nameInput.length < this.maxNameLength) {
                        e.preventDefault();
                        this.playerCustomization[playerKey].nameInput += e.key;
                    }
                }
                
                // Enter to confirm and continue
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.finishPlayerCustomization();
                    return;
                }
                
                // Escape to go back
                if (e.key === 'Escape') {
                    this.currentScreen = 'mainMenu';
                    this.selectedMenuItem = 0;
                    return; // Stop processing this key event
                }
            }
        });
    }
    
    selectMenuItem() {
        console.log('=== SELECT MENU ITEM ===');
        console.log('Selected index:', this.selectedMenuItem);
        console.log('Menu item:', this.menuItems[this.selectedMenuItem]);
        
        switch(this.selectedMenuItem) {
            case 0: // Start Game
                console.log('CALLING showPlayerCustomize()');
                this.showPlayerCustomize();
                console.log('After showPlayerCustomize, currentScreen:', this.currentScreen);
                break;
            case 1: // How to Play
                this.howToPlayOpen = true;
                break;
            case 2: // Settings
                this.settingsOpen = true;
                break;
        }
    }
    
    showPlayerCustomize() {
        console.log('=== SHOW PLAYER CUSTOMIZE ===');
        this.currentScreen = 'playerCustomize';
        this.customizingPlayer = 1;
        this.customizeField = 'name';
        
        // Initialize with current player config
        this.playerCustomization.player1.name = this.game.player1Config.name;
        this.playerCustomization.player1.nameInput = this.game.player1Config.name;
        this.playerCustomization.player1.color = this.game.player1Config.color;
        
        this.playerCustomization.player2.name = this.game.player2Config.name;
        this.playerCustomization.player2.nameInput = this.game.player2Config.name;
        this.playerCustomization.player2.color = this.game.player2Config.color;
        
        // Find the color indices
        this.selectedColorIndex.player1 = this.colorPalette.indexOf(this.game.player1Config.color);
        this.selectedColorIndex.player2 = this.colorPalette.indexOf(this.game.player2Config.color);
        
        // Default to 0 if color not found in palette
        if (this.selectedColorIndex.player1 === -1) this.selectedColorIndex.player1 = 0;
        if (this.selectedColorIndex.player2 === -1) this.selectedColorIndex.player2 = 1;
    }
    
    finishPlayerCustomization() {
        // Apply customizations to actual players
        const p1 = this.playerCustomization.player1;
        const p2 = this.playerCustomization.player2;
        
        // Update names (trim and validate)
        p1.name = p1.nameInput.trim() || 'P1';
        p2.name = p2.nameInput.trim() || 'P2';
        
        // Store customization in game config (will be used when game restarts)
        this.game.player1Config.name = p1.name;
        this.game.player1Config.color = p1.color;
        this.game.player2Config.name = p2.name;
        this.game.player2Config.color = p2.color;
        
        // Also update the current player objects
        this.game.player1.name = p1.name;
        this.game.player1.color = p1.color;
        this.game.player2.name = p2.name;
        this.game.player2.color = p2.color;
        
        console.log('Player customization applied:', {
            p1: this.game.player1Config,
            p2: this.game.player2Config
        });
        
        // Continue to level selection
        this.showLevelSelect();
    }
    
    adjustSetting(direction) {
        const setting = this.settingsList[this.selectedSettingIndex];
        const key = setting.key;
        
        if (setting.type === 'boolean') {
            // Toggle boolean
            this.gameSettings[key] = !this.gameSettings[key];
        } else {
            // Adjust numeric value
            const currentValue = this.gameSettings[key];
            let newValue = currentValue + (direction * setting.step);
            
            // Clamp to min/max
            newValue = Math.max(setting.min, Math.min(setting.max, newValue));
            
            // Round to avoid floating point issues
            this.gameSettings[key] = Math.round(newValue * 100) / 100;
        }
    }
    
    showLevelSelect() {
        console.log('=== SHOW LEVEL SELECT ===');
        console.log('Setting currentScreen to levelSelect');
        this.currentScreen = 'levelSelect';
        this.levelList = this.game.levelManager.getLevelList();
        console.log('Level list:', this.levelList);
        console.log('Selected level index:', this.selectedLevelIndex);
        this.selectedLevelIndex = 0;
    }
    
    selectLevel() {
        const selectedLevel = this.levelList[this.selectedLevelIndex];
        this.game.levelManager.setLevel(selectedLevel.key);
        this.startGame();
    }
    
    startGame() {
        this.currentScreen = 'playing';
        // Settings will be applied in restart()
        this.game.restart();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.currentScreen = this.isPaused ? 'paused' : 'playing';
    }
    
    returnToMenu() {
        this.currentScreen = 'mainMenu';
        this.isPaused = false;
        this.selectedMenuItem = 0;
        // Don't call restart here - let them customize again if they want
        // this.game.restart();
    }
    
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    renderMainMenu(ctx) {
        const { width, height } = this.game;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 8;
        ctx.strokeText('ZONE', width / 2, 150);
        ctx.fillText('ZONE', width / 2, 150);
        
        ctx.font = 'bold 72px Arial';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 8;
        ctx.strokeText('WARS', width / 2, 220);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('WARS', width / 2, 220);
        
        // Menu items
        const menuY = 300;
        const itemSpacing = 60;
        
        this.menuItems.forEach((item, index) => {
            const y = menuY + (index * itemSpacing);
            const isSelected = index === this.selectedMenuItem;
            
            if (isSelected) {
                // Selected item highlight
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(width / 2 - 150, y - 35, 300, 50);
                
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 32px Arial';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                
                // Arrow indicators
                ctx.fillText('>', width / 2 - 120, y);
                ctx.fillText('<', width / 2 + 120, y);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = '28px Arial';
            }
            
            ctx.fillText(item, width / 2, y);
        });
        
        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '16px Arial';
        ctx.fillText('Use Arrow Keys or W/S to navigate', width / 2, height - 80);
        ctx.fillText('Press ENTER or SPACE to select', width / 2, height - 50);
        
        // Version
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Zone Wars v1.0', width - 20, height - 20);
        
        // Render settings overlay if open
        if (this.settingsOpen) {
            this.renderSettings(ctx);
        }
        
        // Render how to play overlay if open
        if (this.howToPlayOpen) {
            this.renderHowToPlay(ctx);
        }
    }
    
    renderSettings(ctx) {
        const { width, height } = this.game;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);
        
        // Settings panel
        const panelWidth = 700;
        const panelHeight = 550;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        // Panel background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME SETTINGS', width / 2, panelY + 50);
        
        // Settings list
        const startY = panelY + 100;
        const lineHeight = 45;
        
        this.settingsList.forEach((setting, index) => {
            const y = startY + (index * lineHeight);
            const isSelected = index === this.selectedSettingIndex;
            const value = this.gameSettings[setting.key];
            
            // Highlight selected
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.fillRect(panelX + 20, y - 28, panelWidth - 40, 38);
            }
            
            // Setting label
            ctx.textAlign = 'left';
            ctx.fillStyle = isSelected ? '#ffd700' : '#ffffff';
            ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial';
            ctx.fillText(setting.label, panelX + 40, y);
            
            // Setting value
            ctx.textAlign = 'right';
            let displayValue;
            if (setting.type === 'boolean') {
                displayValue = value ? 'ON' : 'OFF';
                ctx.fillStyle = value ? '#00ff00' : '#ff0000';
            } else {
                displayValue = value + setting.suffix;
                ctx.fillStyle = isSelected ? '#ffd700' : '#00ffff';
            }
            ctx.fillText(displayValue, panelX + panelWidth - 40, y);
            
            // Arrows for selected item
            if (isSelected && setting.type !== 'boolean') {
                ctx.fillStyle = '#ffd700';
                ctx.font = '16px Arial';
                ctx.fillText('◄', panelX + panelWidth - 180, y);
                ctx.fillText('►', panelX + panelWidth - 130, y);
            }
        });
        
        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↑/↓ or W/S: Navigate  |  ←/→ or A/D: Adjust', width / 2, panelY + panelHeight - 50);
        ctx.fillText('ESC: Close Settings', width / 2, panelY + panelHeight - 25);
    }
    
    renderHowToPlay(ctx) {
        const { width, height } = this.game;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);
        
        // Panel
        const panelWidth = 800;
        const panelHeight = 500;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        // Panel background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HOW TO PLAY', width / 2, panelY + 50);
        
        // Content
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        
        const content = [
            'OBJECTIVE:',
            '  • Capture and hold zones to earn points',
            '  • First to reach score threshold OR highest score when timer ends wins!',
            '',
            'PLAYER 1 CONTROLS:',
            '  • W/A/S/D - Move and Jump',
            '  • Left Shift - Shoot',
            '',
            'PLAYER 2 CONTROLS:',
            '  • Arrow Keys - Move and Jump',
            '  • Enter - Shoot',
            '',
            'GAMEPLAY:',
            '  • Stand in zones to capture them',
            '  • Eliminate opponents to control zones',
            '  • Collect power-ups for advantages',
            '  • Health regenerates over time'
        ];
        
        let y = panelY + 100;
        content.forEach(line => {
            if (line.startsWith('  •')) {
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(line, panelX + 60, y);
            } else if (line === '') {
                // Skip line
            } else {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(line, panelX + 40, y);
                ctx.font = '18px Arial';
            }
            y += 25;
        });
        
        // Close instruction
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC to close', width / 2, panelY + panelHeight - 25);
    }
    
    renderPlayerCustomize(ctx) {
        const { width, height } = this.game;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('CUSTOMIZE PLAYERS', width / 2, 80);
        ctx.fillText('CUSTOMIZE PLAYERS', width / 2, 80);
        
        // Player panels
        const panelWidth = 450;
        const panelHeight = 350;
        const panelY = 140;
        const leftPanelX = width / 2 - panelWidth - 30;
        const rightPanelX = width / 2 + 30;
        
        // Render both player panels
        this.renderPlayerPanel(ctx, 1, leftPanelX, panelY, panelWidth, panelHeight);
        this.renderPlayerPanel(ctx, 2, rightPanelX, panelY, panelWidth, panelHeight);
        
        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press 1 or 2 to switch between players', width / 2, height - 100);
        ctx.fillText('Use ↑/↓ to select Name or Color', width / 2, height - 70);
        ctx.fillText('Type to change name • Use ←/→ to change color', width / 2, height - 40);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Press ENTER to continue', width / 2, height - 10);
    }
    
    renderPlayerPanel(ctx, playerNum, x, y, w, h) {
        const playerKey = `player${playerNum}`;
        const player = this.playerCustomization[playerKey];
        const isActive = this.customizingPlayer === playerNum;
        
        // Panel background
        ctx.fillStyle = isActive ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y, w, h);
        
        // Panel border
        ctx.strokeStyle = isActive ? '#ffd700' : '#666';
        ctx.lineWidth = isActive ? 3 : 1;
        ctx.strokeRect(x, y, w, h);
        
        // Player label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`PLAYER ${playerNum}`, x + w / 2, y + 40);
        
        // Name field
        const nameY = y + 100;
        const fieldSelected = isActive && this.customizeField === 'name';
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Name:', x + w / 2, nameY);
        
        // Name input box
        ctx.fillStyle = fieldSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 50, nameY + 10, w - 100, 45);
        ctx.strokeStyle = fieldSelected ? '#ffd700' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 50, nameY + 10, w - 100, 45);
        
        // Name text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        const displayName = player.nameInput || '_';
        ctx.fillText(displayName, x + w / 2, nameY + 40);
        
        // Cursor blink when typing
        if (fieldSelected && Math.floor(Date.now() / 500) % 2 === 0) {
            const textWidth = ctx.measureText(displayName).width;
            ctx.fillRect(x + w / 2 + textWidth / 2 + 5, nameY + 20, 3, 25);
        }
        
        // Color field
        const colorY = y + 200;
        const colorSelected = isActive && this.customizeField === 'color';
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Color:', x + w / 2, colorY);
        
        // Color preview box
        const colorBoxSize = 80;
        const colorBoxX = x + w / 2 - colorBoxSize / 2;
        const colorBoxY = colorY + 10;
        
        ctx.fillStyle = player.color;
        ctx.fillRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
        ctx.strokeStyle = colorSelected ? '#ffd700' : '#fff';
        ctx.lineWidth = colorSelected ? 4 : 2;
        ctx.strokeRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
        
        // Color arrows when selected
        if (colorSelected) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 32px Arial';
            ctx.fillText('◄', colorBoxX - 40, colorBoxY + colorBoxSize / 2 + 10);
            ctx.fillText('►', colorBoxX + colorBoxSize + 40, colorBoxY + colorBoxSize / 2 + 10);
        }
        
        // Preview player sprite
        const spriteY = y + h - 80;
        ctx.fillStyle = player.color;
        ctx.fillRect(x + w / 2 - 15, spriteY, 30, 50);
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w / 2 - 8, spriteY + 15, 5, 5);
        ctx.fillRect(x + w / 2 - 8, spriteY + 25, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + w / 2 - 6, spriteY + 16, 2, 3);
        ctx.fillRect(x + w / 2 - 6, spriteY + 26, 2, 3);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(player.name, x + w / 2, spriteY - 10);
    }
    
    renderPauseMenu(ctx) {
        const { width, height } = this.game;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Pause text
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText('PAUSED', width / 2, height / 2 - 80);
        ctx.fillText('PAUSED', width / 2, height / 2 - 80);
        
        // Instructions
        ctx.fillStyle = '#fff';
        ctx.font = '28px Arial';
        ctx.fillText('Press ESC to resume', width / 2, height / 2);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '24px Arial';
        ctx.fillText('Press M to return to Main Menu', width / 2, height / 2 + 50);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '20px Arial';
        ctx.fillText('Press R to restart match', width / 2, height / 2 + 90);
        
        // Stats
        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const p1Score = this.game.player1.getDominationScoreInSeconds().toFixed(0);
        const p2Score = this.game.player2.getDominationScoreInSeconds().toFixed(0);
        ctx.fillText(`Current Score: ${p1Score} - ${p2Score}`, width / 2, height / 2 + 140);
        
        const minutes = Math.floor(this.game.matchTimeRemaining / 60);
        const seconds = Math.floor(this.game.matchTimeRemaining % 60);
        ctx.fillText(`Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`, width / 2, height / 2 + 170);
    }
    
    renderFPS(ctx) {
        if (!this.gameSettings.showFPS) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 80, 30);
        
        ctx.fillStyle = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.fps}`, 15, 32);
    }
    
    render(ctx) {
        this.updateFPS();
        
        console.log('UIManager.render() - currentScreen:', this.currentScreen);
        
        if (this.currentScreen === 'mainMenu') {
            if (this.howToPlayOpen) {
                this.renderHowToPlay(ctx);
            } else if (this.settingsOpen) {
                this.renderSettings(ctx);
            } else {
                this.renderMainMenu(ctx);
            }
        } else if (this.currentScreen === 'playerCustomize') {
            this.renderPlayerCustomize(ctx);
        } else if (this.currentScreen === 'levelSelect') {
            console.log('Rendering level select screen, levelList length:', this.levelList.length);
            this.renderLevelSelect(ctx);
        } else if (this.currentScreen === 'paused') {
            this.renderPauseMenu(ctx);
        } else if (this.currentScreen === 'playing') {
            // FPS overlay during gameplay
            this.renderFPS(ctx);
        }
    }
    
    shouldUpdateGame() {
        return this.currentScreen === 'playing' && !this.isPaused;
    }
    
    renderLevelSelect(ctx) {
        const { width, height } = this.game;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT THEME', width / 2, 80);
        
        // Level cards - 2x2 grid
        const cardWidth = 280;
        const cardHeight = 220;
        const cardSpacing = 40;
        const cols = 2;
        const rows = 2;
        
        const totalWidth = (cardWidth * cols) + (cardSpacing * (cols - 1));
        const totalHeight = (cardHeight * rows) + (cardSpacing * (rows - 1));
        const startX = (width - totalWidth) / 2;
        const startY = 140;
        
        this.levelList.forEach((level, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const cardX = startX + (col * (cardWidth + cardSpacing));
            const cardY = startY + (row * (cardHeight + cardSpacing));
            const isSelected = index === this.selectedLevelIndex;
            
            // Card background
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 4;
                
                // Pulsing effect
                const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20 * pulse;
            } else {
                ctx.fillStyle = 'rgba(50, 50, 80, 0.8)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
            }
            
            ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
            ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
            ctx.shadowBlur = 0;
            
            // Level preview (small representation)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(cardX + 15, cardY + 15, cardWidth - 30, 120);
            
            // Mini level preview
            this.renderLevelPreview(ctx, level.key, cardX + 15, cardY + 15, cardWidth - 30, 120);
            
            // Level name
            ctx.fillStyle = isSelected ? '#ffd700' : '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(level.name, cardX + cardWidth / 2, cardY + 160);
            
            // Description
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '14px Arial';
            ctx.fillText(level.description, cardX + cardWidth / 2, cardY + 185);
            
            // Selection indicator
            if (isSelected) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('▼ SELECTED ▼', cardX + cardWidth / 2, cardY + cardHeight - 15);
            }
        });
        
        // Instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Use Arrow Keys to navigate', width / 2, height - 70);
        ctx.fillText('Press ENTER or SPACE to select', width / 2, height - 45);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText('Press ESC to go back', width / 2, height - 20);
    }
    
    renderLevelPreview(ctx, levelKey, x, y, w, h) {
        // Draw themed preview background
        ctx.save();
        
        if (levelKey === 'classic') {
            ctx.fillStyle = '#2a2a3e';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#666';
        } else if (levelKey === 'sunny') {
            // Sky gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + h);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#DEB887');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, w, h);
            
            // Mini sun
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x + w - 20, y + 20, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#D2691E';
        } else if (levelKey === 'icy') {
            // Icy gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + h);
            gradient.addColorStop(0, '#1a3a52');
            gradient.addColorStop(1, '#87CEEB');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, w, h);
            
            // Snowflakes
            ctx.fillStyle = '#FFF';
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.arc(x + Math.random() * w, y + Math.random() * h, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = '#B0E0E6';
        } else if (levelKey === 'lava') {
            // Lava gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + h);
            gradient.addColorStop(0, '#2e1a1a');
            gradient.addColorStop(1, '#8B0000');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, w, h);
            
            // Lava glow at bottom
            ctx.fillStyle = 'rgba(255, 80, 0, 0.5)';
            ctx.fillRect(x, y + h - 20, w, 20);
            
            ctx.fillStyle = '#6b3636';
        }
        
        // Draw mini platforms (same layout for all)
        const scale = 0.15;
        ctx.fillRect(x + 80 * scale, y + 480 * scale, 140 * scale, 35 * scale);
        ctx.fillRect(x + 980 * scale, y + 480 * scale, 140 * scale, 35 * scale);
        ctx.fillRect(x + 520 * scale, y + 340 * scale, 160 * scale, 35 * scale);
        ctx.fillRect(x + 340 * scale, y + 200 * scale, 120 * scale, 35 * scale);
        ctx.fillRect(x + 740 * scale, y + 200 * scale, 120 * scale, 35 * scale);
        
        ctx.restore();
    }
}
