class LevelManager {
    constructor() {
        this.currentLevel = 'classic';
        
        this.levels = {
            classic: {
                name: 'Classic Arena',
                description: 'Standard battlefield',
                theme: {
                    background: '#2a2a3e',
                    platformColor: '#666',
                    groundColor: '#555',
                    ambientParticles: false
                }
            },
            sunny: {
                name: 'Sunny Desert',
                description: 'Hot and bright arena',
                theme: {
                    background: '#87CEEB', // Sky blue
                    platformColor: '#D2691E', // Sandy brown
                    groundColor: '#CD853F', // Sand
                    ambientParticles: true,
                    particleColor: '#FFD700' // Golden sparkles
                }
            },
            icy: {
                name: 'Frozen Tundra',
                description: 'Cold and slippery terrain',
                theme: {
                    background: '#1a3a52', // Deep cold blue
                    platformColor: '#B0E0E6', // Ice blue
                    groundColor: '#87CEEB', // Light ice
                    ambientParticles: true,
                    particleColor: '#FFFFFF' // Snowflakes
                }
            },
            lava: {
                name: 'Volcanic Cavern',
                description: 'Dangerous molten arena',
                theme: {
                    background: '#2e1a1a', // Dark red
                    platformColor: '#6b3636', // Dark stone
                    groundColor: '#4a2020', // Darker ground
                    ambientParticles: true,
                    particleColor: '#ff6b35' // Embers
                }
            }
        };
    }
    
    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }
    
    setLevel(levelKey) {
        if (this.levels[levelKey]) {
            this.currentLevel = levelKey;
            return true;
        }
        return false;
    }
    
    getLevelList() {
        return Object.keys(this.levels).map(key => ({
            key: key,
            name: this.levels[key].name,
            description: this.levels[key].description
        }));
    }
    
    // Single platform layout used by all themes
    createPlatforms() {
        const platforms = [];
        
        // Ground platform (full width)
        platforms.push(new Platform(0, 570, 1200, 30, false));
        
        // === ZONE PLATFORMS (Strategically positioned for accessibility) ===
        
        // ZONE A - Lower Left (Gold) - Easy access from ground
        platforms.push(new Platform(50, 480, 150, 35, true, '#FFD700', 'ZONE A'));
        
        // ZONE B - Lower Right (Lime) - Easy access from ground
        platforms.push(new Platform(1000, 480, 150, 35, true, '#00FF00', 'ZONE B'));
        
        // === CLIMBING STRUCTURE - Left Side ===
        platforms.push(new Platform(250, 420, 120, 20, false)); // Step 1 from Zone A
        platforms.push(new Platform(400, 340, 120, 20, false)); // Step 2
        
        // ZONE D - Mid-Level Left (Magenta)
        platforms.push(new Platform(220, 260, 130, 35, true, '#FF00FF', 'ZONE D'));
        
        // === CLIMBING STRUCTURE - Right Side ===
        platforms.push(new Platform(830, 420, 120, 20, false)); // Step 1 from Zone B
        platforms.push(new Platform(680, 340, 120, 20, false)); // Step 2
        
        // ZONE E - Mid-Level Right (Orange)
        platforms.push(new Platform(850, 260, 130, 35, true, '#FF8800', 'ZONE E'));
        
        // === CENTER TOWER - Access to top zone ===
        platforms.push(new Platform(460, 380, 100, 20, false)); // Center low
        platforms.push(new Platform(520, 300, 100, 20, false)); // Center mid
        platforms.push(new Platform(580, 220, 100, 20, false)); // Center high
        
        // ZONE C - Top Center (Cyan) - King of the hill, hardest to hold
        platforms.push(new Platform(520, 140, 160, 35, true, '#00FFFF', 'ZONE C'));
        
        // === ADDITIONAL MOVEMENT/COMBAT PLATFORMS ===
        platforms.push(new Platform(100, 360, 80, 15, false)); // Left side combat platform
        platforms.push(new Platform(1020, 360, 80, 15, false)); // Right side combat platform
        platforms.push(new Platform(360, 180, 90, 15, false)); // Upper left access
        platforms.push(new Platform(750, 180, 90, 15, false)); // Upper right access
        
        return platforms;
    }
    
    renderBackground(ctx, width, height) {
        const level = this.getCurrentLevel();
        
        // Base background
        ctx.fillStyle = level.theme.background;
        ctx.fillRect(0, 0, width, height);
        
        // Level-specific background effects
        if (this.currentLevel === 'sunny') {
            this.renderSunnyBackground(ctx, width, height);
        } else if (this.currentLevel === 'icy') {
            this.renderIcyBackground(ctx, width, height);
        } else if (this.currentLevel === 'lava') {
            this.renderLavaBackground(ctx, width, height);
        }
    }
    
    renderSunnyBackground(ctx, width, height) {
        // Sun in top right
        const sunX = width - 100;
        const sunY = 80;
        const gradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 60);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun rays
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 30, sunY + Math.sin(angle) * 30);
            ctx.lineTo(sunX + Math.cos(angle) * 80, sunY + Math.sin(angle) * 80);
            ctx.stroke();
        }
        
        // Clouds
        const time = Date.now() * 0.00005;
        for (let i = 0; i < 4; i++) {
            const x = ((time * 30 + i * 300) % (width + 200)) - 100;
            const y = 80 + i * 60;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x, y, 50, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 30, y, 40, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sandy ground effect at bottom
        ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.fillRect(0, height - 100, width, 100);
    }
    
    renderIcyBackground(ctx, width, height) {
        // Northern lights effect at top
        const time = Date.now() * 0.0001;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, `rgba(0, 255, 200, ${0.1 + Math.sin(time) * 0.05})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.1 + Math.sin(time * 1.3) * 0.05})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, 200);
        
        // Ice crystals on edges
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const x = i * 150 + 50;
            const y = 30;
            const size = 15;
            
            // Draw snowflake
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
                ctx.stroke();
            }
        }
        
        // Icy mist at bottom
        const mistGradient = ctx.createLinearGradient(0, height - 150, 0, height);
        mistGradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
        mistGradient.addColorStop(1, 'rgba(200, 230, 255, 0.2)');
        ctx.fillStyle = mistGradient;
        ctx.fillRect(0, height - 150, width, 150);
    }
    
    renderLavaBackground(ctx, width, height) {
        // Lava glow at bottom
        const gradient = ctx.createLinearGradient(0, height - 200, 0, height);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 200, width, 200);
        
        // Animated lava cracks
        const time = Date.now() * 0.001;
        ctx.strokeStyle = `rgba(255, 80, 0, ${0.5 + Math.sin(time * 2) * 0.3})`;
        ctx.lineWidth = 3;
        
        // Draw some crack patterns
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 250, height);
            ctx.lineTo(i * 250 + 50, height - 100);
            ctx.lineTo(i * 250 + 100, height - 50);
            ctx.stroke();
        }
        
        // Lava bubbles/embers floating up
        for (let i = 0; i < 3; i++) {
            const bubbleX = 200 + i * 300 + Math.sin(time + i) * 50;
            const bubbleY = height - 80 + Math.sin(time * 2 + i) * 30;
            const bubbleSize = 5 + Math.sin(time * 3 + i) * 3;
            
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    updateAmbientParticles(particles, width, height) {
        const level = this.getCurrentLevel();
        
        if (!level.theme.ambientParticles) return;
        
        // Spawn ambient particles based on theme
        if (Math.random() < 0.1) {
            if (this.currentLevel === 'sunny') {
                // Golden sparkles/dust particles
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: -0.2 - Math.random() * 0.3,
                    life: 2,
                    maxLife: 2,
                    color: level.theme.particleColor,
                    size: 2,
                    ambient: true
                });
            } else if (this.currentLevel === 'icy') {
                // Snowflakes falling
                particles.push({
                    x: Math.random() * width,
                    y: -10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: 0.3 + Math.random() * 0.4,
                    life: 4,
                    maxLife: 4,
                    color: level.theme.particleColor,
                    size: 3,
                    ambient: true
                });
            } else if (this.currentLevel === 'lava') {
                // Embers rising
                particles.push({
                    x: Math.random() * width,
                    y: height - 30,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -1 - Math.random() * 2,
                    life: 2,
                    maxLife: 2,
                    color: level.theme.particleColor,
                    size: 3,
                    ambient: true
                });
            }
        }
    }
}
