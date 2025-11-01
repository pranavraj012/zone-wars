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
        } else if (this.currentLevel === 'classic') {
            this.renderClassicBackground(ctx, width, height);
        }
    }
    
    renderClassicBackground(ctx, width, height) {
        const time = Date.now() * 0.001;
        
        // Subtle grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        
        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Floating geometric shapes
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const shapeX = ((time * 20 + i * 240) % (width + 100)) - 50;
            const shapeY = 100 + i * 100 + Math.sin(time + i) * 30;
            const shapeSize = 30 + (i * 10);
            const rotation = time * 0.5 + i;
            
            ctx.save();
            ctx.translate(shapeX, shapeY);
            ctx.rotate(rotation);
            
            if (i % 2 === 0) {
                // Square
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
            } else {
                // Circle
                ctx.strokeStyle = 'rgba(255, 100, 200, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
    
    renderSunnyBackground(ctx, width, height) {
        const time = Date.now() * 0.001;
        
        // Sun in top right with pulsing effect
        const sunX = width - 100;
        const sunY = 80;
        const sunPulse = 1 + Math.sin(time * 0.5) * 0.1;
        const gradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 60 * sunPulse);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60 * sunPulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating sun rays
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time * 0.2;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 30, sunY + Math.sin(angle) * 30);
            ctx.lineTo(sunX + Math.cos(angle) * 80, sunY + Math.sin(angle) * 80);
            ctx.stroke();
        }
        
        // Floating clouds with shadows
        for (let i = 0; i < 4; i++) {
            const x = ((time * 30 + i * 300) % (width + 200)) - 100;
            const y = 80 + i * 60;
            
            // Cloud shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.beginPath();
            ctx.ellipse(x + 5, y + 5, 50, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 35, y + 5, 40, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Cloud
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x, y, 50, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 30, y, 40, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Heat wave distortion effect (visual suggestion)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.02)';
        for (let i = 0; i < 3; i++) {
            const waveY = height - 150 + i * 20 + Math.sin(time * 2 + i) * 5;
            ctx.fillRect(0, waveY, width, 15);
        }
        
        // Sandy ground effect at bottom
        ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.fillRect(0, height - 100, width, 100);
        
        // Sand dust particles floating
        ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
        for (let i = 0; i < 8; i++) {
            const dustX = ((time * 15 + i * 150) % width);
            const dustY = height - 120 + Math.sin(time + i) * 10;
            ctx.beginPath();
            ctx.arc(dustX, dustY, 2 + Math.sin(time * 3 + i), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderIcyBackground(ctx, width, height) {
        const time = Date.now() * 0.0001;
        
        // Northern lights effect at top - more vibrant and animated
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, `rgba(0, 255, 200, ${0.15 + Math.sin(time * 10) * 0.08})`);
        gradient.addColorStop(0.3, `rgba(50, 150, 255, ${0.12 + Math.sin(time * 8) * 0.06})`);
        gradient.addColorStop(0.6, `rgba(100, 200, 255, ${0.15 + Math.sin(time * 13) * 0.08})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, 200);
        
        // Wavy aurora bands
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = i % 2 === 0 ? '#00ffcc' : '#66ccff';
            ctx.lineWidth = 20;
            ctx.beginPath();
            const yBase = 40 + i * 30;
            for (let x = 0; x <= width; x += 10) {
                const y = yBase + Math.sin(x * 0.01 + time * 100 + i * 2) * 20;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Falling snowflakes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 30; i++) {
            const snowX = ((time * 200 + i * 40) % width);
            const snowY = ((time * 150 + i * 20) % height);
            const snowSize = 2 + (i % 3);
            ctx.beginPath();
            ctx.arc(snowX, snowY, snowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ice crystals on edges - animated
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const x = i * 150 + 50;
            const y = 30 + Math.sin(time * 50 + i) * 5;
            const size = 15 + Math.sin(time * 30 + i) * 3;
            const rotation = time * 20 + i;
            
            // Draw rotating snowflake
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2 + rotation;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
                ctx.stroke();
                
                // Small branches
                const branchLen = size * 0.4;
                const midX = x + Math.cos(angle) * size * 0.6;
                const midY = y + Math.sin(angle) * size * 0.6;
                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(midX + Math.cos(angle + 0.5) * branchLen, midY + Math.sin(angle + 0.5) * branchLen);
                ctx.stroke();
            }
        }
        
        // Icy mist at bottom - animated
        const mistGradient = ctx.createLinearGradient(0, height - 150, 0, height);
        mistGradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
        mistGradient.addColorStop(1, `rgba(200, 230, 255, ${0.2 + Math.sin(time * 80) * 0.05})`);
        ctx.fillStyle = mistGradient;
        ctx.fillRect(0, height - 150, width, 150);
        
        // Frost particles near ground
        ctx.fillStyle = 'rgba(220, 240, 255, 0.6)';
        for (let i = 0; i < 15; i++) {
            const frostX = ((time * 100 + i * 80) % width);
            const frostY = height - 100 + Math.sin(time * 60 + i) * 30;
            ctx.beginPath();
            ctx.arc(frostX, frostY, 1 + Math.sin(time * 40 + i), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderLavaBackground(ctx, width, height) {
        const time = Date.now() * 0.001;
        
        // Animated lava glow at bottom - pulsing
        const glowIntensity = 0.3 + Math.sin(time * 1.5) * 0.1;
        const gradient = ctx.createLinearGradient(0, height - 200, 0, height);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(0.5, `rgba(255, 80, 0, ${glowIntensity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, ${glowIntensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 200, width, 200);
        
        // Animated lava cracks - pulsing glow
        const crackGlow = 0.5 + Math.sin(time * 2) * 0.3;
        ctx.strokeStyle = `rgba(255, 80, 0, ${crackGlow})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 80, 0, 0.5)';
        
        // Draw crack patterns
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 250, height);
            ctx.lineTo(i * 250 + 50 + Math.sin(time + i) * 10, height - 100);
            ctx.lineTo(i * 250 + 100 + Math.sin(time * 1.5 + i) * 10, height - 50);
            ctx.lineTo(i * 250 + 150, height - 120);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // Lava bubbles floating up
        for (let i = 0; i < 8; i++) {
            const bubbleX = 150 + i * 150 + Math.sin(time + i) * 50;
            const bubbleY = height - 100 + ((time * 30 + i * 20) % 100);
            const bubbleSize = 4 + Math.sin(time * 3 + i) * 3;
            const bubbleAlpha = Math.max(0, 1 - ((time * 30 + i * 20) % 100) / 100);
            
            // Bubble glow
            const bubbleGradient = ctx.createRadialGradient(bubbleX, bubbleY, 0, bubbleX, bubbleY, bubbleSize * 2);
            bubbleGradient.addColorStop(0, `rgba(255, 150, 0, ${0.8 * bubbleAlpha})`);
            bubbleGradient.addColorStop(0.5, `rgba(255, 80, 0, ${0.5 * bubbleAlpha})`);
            bubbleGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
            ctx.fillStyle = bubbleGradient;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bubble core
            ctx.fillStyle = `rgba(255, 200, 0, ${0.9 * bubbleAlpha})`;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ember particles floating up
        ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
        for (let i = 0; i < 20; i++) {
            const emberX = ((time * 40 + i * 60) % width);
            const emberY = height - ((time * 100 + i * 30) % 300);
            const emberSize = 2 + Math.sin(time * 5 + i) * 1;
            const emberAlpha = Math.max(0, 1 - ((time * 100 + i * 30) % 300) / 300);
            
            ctx.globalAlpha = emberAlpha;
            ctx.beginPath();
            ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Heat wave shimmer lines
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const yStart = height - 250 + i * 40;
            for (let x = 0; x <= width; x += 20) {
                const y = yStart + Math.sin(x * 0.05 + time * 3 + i) * 8;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    updateAmbientParticles(particles, width, height) {
        const level = this.getCurrentLevel();
        
        if (!level.theme.ambientParticles) return;
        
        // Spawn ambient particles based on theme with per-theme spawn chances
        let spawnChance = 0.1;
        if (this.currentLevel === 'sunny') spawnChance = 0.25;
        else if (this.currentLevel === 'icy') spawnChance = 0.16;
        else if (this.currentLevel === 'lava') spawnChance = 0.22;

        if (Math.random() < spawnChance) {
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
