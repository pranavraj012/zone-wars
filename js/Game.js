class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // UI Manager - create FIRST
        this.uiManager = new UIManager(this);
        
        // Level Manager
        this.levelManager = new LevelManager();
        
        // Game state
        this.gameOver = false;
        this.winner = null;
        this.lastTime = Date.now();
        this.lastScoreUpdateTime = Date.now();
        this.scoreUpdateInterval = 100; // Update score every 100ms
        
        // Controllers
        this.controller1 = new Controller({
            left: 'a',
            right: 'd',
            jump: 'w',
            shoot: 'Shift'
        });
        
        this.controller2 = new Controller({
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            shoot: 'Enter'
        });
        
        // Player customization data (will be updated from UI)
        this.player1Config = {
            color: '#0066ff',
            name: 'P1'
        };
        this.player2Config = {
            color: '#ff0000',
            name: 'P2'
        };
        
        // Players - better spawn positions
        this.player1 = new Player(150, 200, this.player1Config.color, this.player1Config.name, this.controller1);
        this.player2 = new Player(1000, 200, this.player2Config.color, this.player2Config.name, this.controller2);
        
        // Projectiles
        this.projectiles = [];
        
        // Platforms
        this.platforms = [];
        this.loadCurrentLevel();
        
        // Power-ups
        this.powerUps = [];
        this.updatePowerUpSettings(); // Initialize from settings
        this.lastPowerUpSpawnTime = Date.now();
        this.allPowerUpTypes = ['speed', 'jump', 'rapid', 'shield', 'mega'];
        this.allPowerUpLocations = [
            { x: 300, y: 445 },   // Near left zone
            { x: 500, y: 515 },   // Lower left area
            { x: 900, y: 445 },   // Near right zone
            { x: 700, y: 515 },   // Lower right area
            { x: 600, y: 315 },   // Center zone
            { x: 480, y: 355 },   // Left of center
            { x: 720, y: 355 },   // Right of center
            { x: 240, y: 180 },   // Upper left
            { x: 930, y: 180 },   // Upper right
            { x: 380, y: 225 },   // Mid-upper left
            { x: 770, y: 225 }    // Mid-upper right
        ];
        
        // Particle system
        this.particles = new ParticleSystem();
        
        // Restart handler
        this.setupRestartHandler();
        
        // Win condition - will be updated from settings
        this.updateMatchSettings();
        
        // Screen shake for hit effects
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    }
    
    setupRestartHandler() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                if (this.uiManager.currentScreen !== 'mainMenu') {
                    this.restart();
                }
            }
            
            // Return to main menu on ESC from game over
            if (e.key === 'Escape' && this.gameOver) {
                this.uiManager.currentScreen = 'mainMenu';
                this.uiManager.selectedMenuItem = 0;
            }
        });
    }
    
    updateMatchSettings() {
        const settings = this.uiManager.gameSettings;
        this.matchDuration = settings.matchDuration;
        this.matchStartTime = Date.now();
        this.matchTimeRemaining = this.matchDuration;
    }
    
    updatePowerUpSettings() {
        const settings = this.uiManager.gameSettings;
        this.maxActivePowerUps = settings.maxPowerUps;
        this.powerUpSpawnInterval = settings.powerUpSpawnRate * 1000; // Convert to ms
    }
    
    updatePlayerSettings() {
        const settings = this.uiManager.gameSettings;
        
        // Update player speeds
        this.player1.maxSpeed = settings.playerSpeed;
        this.player2.maxSpeed = settings.playerSpeed;
        
        // Update projectile speed
        this.player1.projectileSpeed = settings.projectileSpeed;
        this.player2.projectileSpeed = settings.projectileSpeed;
        
        // Update player health
        this.player1.maxHealth = settings.startingHealth;
        this.player2.maxHealth = settings.startingHealth;
        this.player1.health = settings.startingHealth;
        this.player2.health = settings.startingHealth;
        
        // Update respawn time
        this.player1.respawnTime = settings.respawnTime * 1000;
        this.player2.respawnTime = settings.respawnTime * 1000;
    }
    
    triggerScreenShake(intensity = 5, duration = 200) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const shake = this.screenShake.intensity;
            this.screenShake.x = (Math.random() - 0.5) * shake;
            this.screenShake.y = (Math.random() - 0.5) * shake;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }
    
    loadCurrentLevel() {
        const level = this.levelManager.getCurrentLevel();
        this.platforms = this.levelManager.createPlatforms();
    }
    
    spawnRandomPowerUp() {
        const now = Date.now();
        
        // Count active/spawning power-ups
        const activePowerUpCount = this.powerUps.filter(p => p.active || p.isSpawning).length;
        
        // Don't spawn if at max
        if (activePowerUpCount >= this.maxActivePowerUps) {
            return;
        }
        
        // Random type
        const type = this.allPowerUpTypes[Math.floor(Math.random() * this.allPowerUpTypes.length)];
        
        // Random location (avoid active power-up locations)
        const availableLocations = this.allPowerUpLocations.filter(loc => {
            return !this.powerUps.some(p => 
                (p.active || p.isSpawning) && 
                Math.abs(p.spawnX - loc.x) < 50 && 
                Math.abs(p.spawnY - loc.y) < 50
            );
        });
        
        if (availableLocations.length === 0) return;
        
        const location = availableLocations[Math.floor(Math.random() * availableLocations.length)];
        
        // Create and spawn
        const powerUp = new PowerUp(location.x, location.y, type);
        powerUp.startSpawn(now);
        this.powerUps.push(powerUp);
    }
    
    update() {
        // Check if game should update (not paused, not in menu)
        if (!this.uiManager.shouldUpdateGame()) {
            // Disable controllers when not playing
            this.controller1.enabled = false;
            this.controller2.enabled = false;
            return;
        }
        
        // Enable controllers during gameplay
        this.controller1.enabled = true;
        this.controller2.enabled = true;
        
        if (this.gameOver) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
        
        // Update players
        this.player1.update(this.platforms, this.width, this.height, now);
        this.player2.update(this.platforms, this.width, this.height, now);
        
        // Check if dead players can score (they can't)
        const player1CanScore = this.player1.canAct();
        const player2CanScore = this.player2.canAct();
        
        // Handle shooting (only if alive)
        if (this.player1.canAct()) {
            const input1 = this.player1.getInput();
            if (input1.shoot) {
                const projectile = this.player1.shoot(now);
                if (projectile) {
                    this.projectiles.push(projectile);
                    this.controller1.resetShoot();
                }
            }
        }
        
        if (this.player2.canAct()) {
            const input2 = this.player2.getInput();
            if (input2.shoot) {
                const projectile = this.player2.shoot(now);
                if (projectile) {
                    this.projectiles.push(projectile);
                    this.controller2.resetShoot();
                }
            }
        }
        
                // Update particles
        this.particles.update();
        
        // Update ambient particles for current level
        this.levelManager.updateAmbientParticles(this.particles.particles, this.width, this.height);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            projectile.checkBounds(this.width, this.height);
            
            // Create projectile trail for mega shots
            if (projectile.isMega && Math.random() < 0.3) {
                this.particles.createTrail(projectile.x, projectile.y, projectile.color, 2);
            }
            
            // Check collision with players (only if they can be hit)
            if (projectile.color !== this.player1.color && projectile.checkCollisionWithPlayer(this.player1) && this.player1.canAct()) {
                const direction = projectile.velocityX > 0 ? 1 : -1;
                const damageApplied = this.player1.takeDamage(
                    projectile.getDamage(),
                    direction * projectile.getKnockbackMultiplier(), 
                    now
                );
                
                // Create explosion effect regardless (shows shield block too)
                if (damageApplied || this.player1.hasPowerUp('shield')) {
                    this.particles.createExplosion(projectile.x, projectile.y, projectile.color, 15);
                    projectile.active = false;
                    
                    // Trigger screen shake
                    this.triggerScreenShake(projectile.isMega ? 10 : 5, projectile.isMega ? 300 : 150);
                    
                    // Give kill credit if player died from this hit
                    if (damageApplied && this.player1.health <= 0) {
                        this.player2.giveKill();
                        this.particles.createDeathEffect(this.player1.x + this.player1.width / 2, 
                                                        this.player1.y + this.player1.height / 2, 
                                                        this.player1.color);
                        this.triggerScreenShake(15, 500); // Bigger shake on death
                    }
                }
            }
            
            if (projectile.color !== this.player2.color && projectile.checkCollisionWithPlayer(this.player2) && this.player2.canAct()) {
                const direction = projectile.velocityX > 0 ? 1 : -1;
                const damageApplied = this.player2.takeDamage(
                    projectile.getDamage(),
                    direction * projectile.getKnockbackMultiplier(), 
                    now
                );
                
                // Create explosion effect regardless (shows shield block too)
                if (damageApplied || this.player2.hasPowerUp('shield')) {
                    this.particles.createExplosion(projectile.x, projectile.y, projectile.color, 15);
                    projectile.active = false;
                    
                    // Trigger screen shake
                    this.triggerScreenShake(projectile.isMega ? 10 : 5, projectile.isMega ? 300 : 150);
                    
                    // Give kill credit if player died from this hit
                    if (damageApplied && this.player2.health <= 0) {
                        this.player1.giveKill();
                        this.particles.createDeathEffect(this.player2.x + this.player2.width / 2, 
                                                        this.player2.y + this.player2.height / 2, 
                                                        this.player2.color);
                        this.triggerScreenShake(15, 500); // Bigger shake on death
                    }
                }
            }
            
            // Remove inactive projectiles
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update power-ups
        for (const powerUp of this.powerUps) {
            powerUp.update();
            
            // Skip if already collected
            if (!powerUp.active) continue;
            
            // Check collision with players (only if alive) - player 1 first
            if (this.player1.canAct() && powerUp.checkCollision(this.player1)) {
                powerUp.collect(now);
                const config = powerUp.getConfig();
                this.player1.addPowerUp(powerUp.type, config.duration);
                this.particles.createExplosion(powerUp.spawnX + powerUp.width / 2, 
                                              powerUp.spawnY + powerUp.height / 2, 
                                              config.color, 25);
                continue; // Skip checking player 2 once collected
            }
            
            // Only check player 2 if player 1 didn't collect it
            if (this.player2.canAct() && powerUp.checkCollision(this.player2)) {
                powerUp.collect(now);
                const config = powerUp.getConfig();
                this.player2.addPowerUp(powerUp.type, config.duration);
                this.particles.createExplosion(powerUp.spawnX + powerUp.width / 2, 
                                              powerUp.spawnY + powerUp.height / 2, 
                                              config.color, 25);
            }
        }
        
        // Remove fully despawned power-ups (cleaned up)
        this.powerUps = this.powerUps.filter(p => p.active || p.isSpawning || (now - p.lastCollectedTime < 2000));
        
        // Spawn new power-ups periodically
        if (now - this.lastPowerUpSpawnTime > this.powerUpSpawnInterval) {
            this.spawnRandomPowerUp();
            this.lastPowerUpSpawnTime = now;
        }
        
        // Update particles
        this.particles.update();
        
        // Update zone control and scoring
        this.updateZoneControl();
        
        // Update match timer
        const matchElapsed = (now - this.matchStartTime) / 1000;
        this.matchTimeRemaining = Math.max(0, this.matchDuration - matchElapsed);
        
        // Update domination scores based on zones controlled
        if (now - this.lastScoreUpdateTime >= this.scoreUpdateInterval) {
            const scoreDelta = now - this.lastScoreUpdateTime;
            
            // Count controlled zones
            const player1Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player1').length;
            const player2Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player2').length;
            
            // Score based on number of zones (1 point per second per zone)
            if (player1CanScore && player1Zones > 0) {
                this.player1.addDominationScore(scoreDelta * player1Zones);
            }
            if (player2CanScore && player2Zones > 0) {
                this.player2.addDominationScore(scoreDelta * player2Zones);
            }
            
            this.lastScoreUpdateTime = now;
        }
        
        // Check win condition
        this.checkWinCondition();
    }
    
    updateZoneControl() {
        const now = Date.now();
        const deltaTime = now - this.lastScoreUpdateTime;
        const captureSpeedMultiplier = this.uiManager.gameSettings.captureSpeed;
        
        for (const platform of this.platforms) {
            if (platform.isZone) {
                const player1OnZone = this.player1.canAct() && platform.checkIfPlayerOnTop(this.player1);
                const player2OnZone = this.player2.canAct() && platform.checkIfPlayerOnTop(this.player2);
                
                platform.updateCapture(player1OnZone, player2OnZone, deltaTime, captureSpeedMultiplier);
            }
        }
    }
    
    checkWinCondition() {
        const player1Score = this.player1.getDominationScoreInSeconds();
        const player2Score = this.player2.getDominationScoreInSeconds();
        
        // Win condition: Timer runs out, highest score wins
        if (this.matchTimeRemaining <= 0) {
            this.gameOver = true;
            if (player1Score > player2Score) {
                this.winner = this.player1;
            } else if (player2Score > player1Score) {
                this.winner = this.player2;
            } else {
                // Tie - use zone control as tiebreaker
                const player1Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player1').length;
                const player2Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player2').length;
                
                if (player1Zones > player2Zones) {
                    this.winner = this.player1;
                } else if (player2Zones > player1Zones) {
                    this.winner = this.player2;
                } else {
                    // True tie - use K/D ratio
                    const player1KD = this.player1.kills / Math.max(1, this.player1.deaths);
                    const player2KD = this.player2.kills / Math.max(1, this.player2.deaths);
                    this.winner = player1KD >= player2KD ? this.player1 : this.player2;
                }
            }
        }
    }
    
    render() {
        console.log('Game.render() - currentScreen:', this.uiManager.currentScreen);
        
        // Check if we should render game or UI first
        if (this.uiManager.currentScreen === 'mainMenu' || 
            this.uiManager.currentScreen === 'playerCustomize' || 
            this.uiManager.currentScreen === 'levelSelect') {
            console.log('Rendering UI for screen:', this.uiManager.currentScreen);
            // For menus, just render the UI (it handles its own background)
            this.uiManager.render(this.ctx);
            return;
        }
        
        console.log('Rendering game');
        
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Render background based on current level
        this.levelManager.renderBackground(this.ctx, this.width, this.height);
        
        // Render game elements
        // Render platforms with level theme
        const level = this.levelManager.getCurrentLevel();
        for (const platform of this.platforms) {
            if (!platform.isZone) {
                // Apply level theme color to regular platforms
                this.ctx.fillStyle = level.theme.platformColor;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add border for depth
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            } else {
                // Keep zone colors and render normally with player colors
                platform.render(this.ctx, this.player1.color, this.player2.color);
            }
        }
        
        // Render power-ups
        for (const powerUp of this.powerUps) {
            powerUp.render(this.ctx);
        }
        
        // Render particles
        this.particles.render(this.ctx);
        
        // Render projectiles
        for (const projectile of this.projectiles) {
            projectile.render(this.ctx);
        }
        
        // Render players
        this.player1.render(this.ctx, Date.now());
        this.player2.render(this.ctx, Date.now());
        
        // Restore context after screen shake
        this.ctx.restore();
        
        // Render UI (without shake)
        this.renderUI();
        
        // Render game over screen
        if (this.gameOver) {
            this.renderGameOver();
        }
        
        // Render UI overlays (pause menu, FPS, etc)
        this.uiManager.render(this.ctx);
    }
    
    renderUI() {
        // Match timer at top center
        const minutes = Math.floor(this.matchTimeRemaining / 60);
        const seconds = Math.floor(this.matchTimeRemaining % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillStyle = this.matchTimeRemaining <= 30 ? '#ff0000' : '#fff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(timeString, this.width / 2, 35);
        this.ctx.fillText(timeString, this.width / 2, 35);
        
        // Win condition reminder (small text under timer)
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '12px Arial';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('Highest score when time ends wins!', this.width / 2, 55);
        this.ctx.fillText('Highest score when time ends wins!', this.width / 2, 55);
        
        const barWidth = 400;
        const barHeight = 35;
        const barY = 70;
        const player1BarX = 50;
        const player2BarX = this.width - barWidth - 50;
        
        // Count zones
        const totalZones = this.platforms.filter(p => p.isZone).length;
        const player1Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player1').length;
        const player2Zones = this.platforms.filter(p => p.isZone && p.controlledBy === 'player2').length;
        
        // Player 1 score bar (with zone indicator)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(player1BarX, barY, barWidth, barHeight);
        
        // Calculate progress based on match duration (score per second)
        const maxExpectedScore = this.matchDuration; // Roughly 1 point per second max
        const player1Progress = Math.min(this.player1.getDominationScoreInSeconds() / maxExpectedScore, 1);
        this.ctx.fillStyle = this.player1.color;
        this.ctx.fillRect(player1BarX, barY, barWidth * player1Progress, barHeight);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(player1BarX, barY, barWidth, barHeight);
        
        // Player 1 text (score + zones) - use player name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        const p1Score = this.player1.getDominationScoreInSeconds().toFixed(0);
        this.ctx.strokeText(`${this.player1.name}: ${p1Score}pts | ${player1Zones}/${totalZones} Zones`, 
            player1BarX + barWidth / 2, barY + barHeight / 2 + 6);
        this.ctx.fillText(`${this.player1.name}: ${p1Score}pts | ${player1Zones}/${totalZones} Zones`, 
            player1BarX + barWidth / 2, barY + barHeight / 2 + 6);
        
        // Player 2 score bar (with zone indicator)
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(player2BarX, barY, barWidth, barHeight);
        
        const player2Progress = Math.min(this.player2.getDominationScoreInSeconds() / maxExpectedScore, 1);
        this.ctx.fillStyle = this.player2.color;
        this.ctx.fillRect(player2BarX, barY, barWidth * player2Progress, barHeight);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(player2BarX, barY, barWidth, barHeight);
        
        // Player 2 text (score + zones) - use player name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        const p2Score = this.player2.getDominationScoreInSeconds().toFixed(0);
        this.ctx.strokeText(`${this.player2.name}: ${p2Score}pts | ${player2Zones}/${totalZones} Zones`, 
            player2BarX + barWidth / 2, barY + barHeight / 2 + 6);
        this.ctx.fillText(`${this.player2.name}: ${p2Score}pts | ${player2Zones}/${totalZones} Zones`, 
            player2BarX + barWidth / 2, barY + barHeight / 2 + 6);
        
        // Total domination bonus indicator (extra points)
        if (player1Zones === totalZones && totalZones > 0) {
            this.ctx.fillStyle = '#0066ff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`★ TOTAL DOMINATION! +${totalZones}pts/sec ★`, this.width / 2, 125);
            this.ctx.fillText(`★ TOTAL DOMINATION! +${totalZones}pts/sec ★`, this.width / 2, 125);
        } else if (player2Zones === totalZones && totalZones > 0) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`★ TOTAL DOMINATION! +${totalZones}pts/sec ★`, this.width / 2, 125);
            this.ctx.fillText(`★ TOTAL DOMINATION! +${totalZones}pts/sec ★`, this.width / 2, 125);
        }
        
        // Shoot cooldown indicators
        this.renderCooldownIndicator(this.player1, player1BarX, barY + barHeight + 10, barWidth);
        this.renderCooldownIndicator(this.player2, player2BarX, barY + barHeight + 10, barWidth);
        
        // K/D stats
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        const p1Stats = `K: ${this.player1.kills} | D: ${this.player1.deaths}`;
        const p2Stats = `K: ${this.player2.kills} | D: ${this.player2.deaths}`;
        this.ctx.strokeText(p1Stats, player1BarX, barY + barHeight + 30);
        this.ctx.fillText(p1Stats, player1BarX, barY + barHeight + 30);
        this.ctx.textAlign = 'right';
        this.ctx.strokeText(p2Stats, player2BarX + barWidth, barY + barHeight + 30);
        this.ctx.fillText(p2Stats, player2BarX + barWidth, barY + barHeight + 30);
    }
    
    renderCooldownIndicator(player, x, y, width) {
        const now = Date.now();
        const cooldownRemaining = player.shootCooldown - (now - player.lastShootTime);
        const cooldownProgress = Math.max(0, cooldownRemaining) / player.shootCooldown;
        
        const indicatorWidth = width;
        const indicatorHeight = 8;
        
        this.ctx.fillStyle = cooldownProgress > 0 ? '#666' : '#00ff00';
        this.ctx.fillRect(x, y, indicatorWidth * (1 - cooldownProgress), indicatorHeight);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, indicatorWidth, indicatorHeight);
    }
    
    renderGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Winner banner background
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(0, this.height / 2 - 150, this.width, 300);
        
        // Winner text
        this.ctx.fillStyle = this.winner.color;
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 8;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.winner.color;
        this.ctx.strokeText(`${this.winner.name} WINS!`, this.width / 2, this.height / 2 - 50);
        this.ctx.fillText(`${this.winner.name} WINS!`, this.width / 2, this.height / 2 - 50);
        this.ctx.shadowBlur = 0;
        
        // Victory details
        const p1Score = this.player1.getDominationScoreInSeconds().toFixed(0);
        const p2Score = this.player2.getDominationScoreInSeconds().toFixed(0);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(`Final Score: ${p1Score} - ${p2Score}`, this.width / 2, this.height / 2 + 10);
        this.ctx.fillText(`Final Score: ${p1Score} - ${p2Score}`, this.width / 2, this.height / 2 + 10);
        
        // Stats
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.fillText(`P1: ${this.player1.kills}K / ${this.player1.deaths}D`, this.width / 2 - 150, this.height / 2 + 60);
        this.ctx.fillText(`P2: ${this.player2.kills}K / ${this.player2.deaths}D`, this.width / 2 + 150, this.height / 2 + 60);
        
        // Restart instruction with animation
        const pulseAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        this.ctx.fillStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 120);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press ESC for Main Menu', this.width / 2, this.height / 2 + 155);
    }
    
    restart() {
        // Apply game settings
        this.updateMatchSettings();
        this.updatePowerUpSettings();
        
        // Reset game state
        this.gameOver = false;
        this.winner = null;
        this.lastTime = Date.now();
        this.lastScoreUpdateTime = Date.now();
        this.matchStartTime = Date.now();
        this.matchTimeRemaining = this.matchDuration;
        
        // Reset players with their customized colors and names
        this.player1 = new Player(150, 200, this.player1Config.color, this.player1Config.name, this.controller1);
        this.player2 = new Player(1000, 200, this.player2Config.color, this.player2Config.name, this.controller2);
        
        // Apply player settings after creation
        this.updatePlayerSettings();
        
        // Clear projectiles
        this.projectiles = [];
        
        // Reload level to reset capture states
        this.loadCurrentLevel();
        
        // Clear power-ups and reset spawn timer
        this.powerUps = [];
        this.lastPowerUpSpawnTime = Date.now();
        
        // Clear particles
        this.particles.clear();
    }
    
    run() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.run());
    }
}
