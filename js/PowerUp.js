class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type;
        this.active = false; // Start inactive
        this.bobOffset = 0;
        this.bobSpeed = 0.03; // Slower, more gentle bobbing
        this.spawnX = x;
        this.spawnY = y;
        
        // Spawn animation
        this.isSpawning = false;
        this.spawnProgress = 0;
        this.spawnDuration = 800; // Faster spawn animation (0.8s)
        this.spawnStartTime = 0;
        this.particles = [];
        
        // Despawn timer
        this.spawnedTime = 0;
        this.lifeDuration = 20000; // Longer life - 20 seconds before despawn
        this.lastCollectedTime = 0;
        
        // Power-up types configuration
        this.config = {
            'speed': {
                color: '#FFD700',
                symbol: '⚡',
                name: 'Speed Boost',
                duration: 5000
            },
            'jump': {
                color: '#00FF00',
                symbol: '↑',
                name: 'Super Jump',
                duration: 5000
            },
            'rapid': {
                color: '#FF00FF',
                symbol: '⚔',
                name: 'Rapid Fire',
                duration: 7000
            },
            'shield': {
                color: '#00FFFF',
                symbol: '⬡',
                name: 'Shield',
                duration: 8000
            },
            'mega': {
                color: '#FF0000',
                symbol: '★',
                name: 'Mega Shot',
                duration: 6000
            }
        };
    }
    
    update() {
        const now = Date.now();
        
        if (this.isSpawning) {
            this.spawnProgress = (now - this.spawnStartTime) / this.spawnDuration;
            
            if (this.spawnProgress >= 1) {
                this.isSpawning = false;
                this.active = true;
                this.spawnProgress = 1;
                this.spawnedTime = now; // Track when it became active
            }
            
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.03; // Faster fade
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            return;
        }
        
        if (this.active) {
            // Gentle bobbing
            this.bobOffset = Math.sin(now * this.bobSpeed) * 3;
            
            // Check if should despawn (not collected in time)
            if (now - this.spawnedTime > this.lifeDuration) {
                this.despawn(now);
            }
        }
    }
    
    collect(currentTime) {
        this.active = false;
        this.isSpawning = false;
        this.lastCollectedTime = currentTime;
    }
    
    despawn(currentTime) {
        this.active = false;
        this.isSpawning = false;
        this.lastCollectedTime = currentTime;
        
        // Small fade-out effect
        const config = this.config[this.type];
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.spawnX + this.width / 2,
                y: this.spawnY + this.height / 2,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0.5,
                color: config.color
            });
        }
    }
    
    startSpawn(currentTime) {
        this.isSpawning = true;
        this.spawnStartTime = currentTime;
        this.spawnProgress = 0;
        this.x = this.spawnX;
        this.y = this.spawnY - 150; // Start less high
        
        // Smaller, cleaner particle burst
        const config = this.config[this.type];
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.spawnX + this.width / 2,
                y: this.spawnY + this.height / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.8,
                color: config.color
            });
        }
    }
    
    checkCollision(player) {
        if (!this.active || !player.canAct()) return false;
        
        return (
            player.x < this.spawnX + this.width &&
            player.x + player.width > this.spawnX &&
            player.y < this.spawnY + this.height &&
            player.y + player.height > this.spawnY
        );
    }
    
    collect(currentTime) {
        this.active = false;
        this.isSpawning = false;
        this.lastCollectedTime = currentTime;
    }
    
    getConfig() {
        return this.config[this.type];
    }
    
    isFullyDespawned() {
        return !this.active && !this.isSpawning && this.particles.length === 0;
    }
    
    render(ctx) {
        const now = Date.now();
        const powerUpConfig = this.config[this.type];
        
        // Render spawn particles (despawn too)
        if (this.particles.length > 0) {
            for (const p of this.particles) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
        // Spawning animation
        if (this.isSpawning) {
            const fallY = this.spawnY - 150 + (150 * this.spawnProgress);
            const alpha = Math.min(this.spawnProgress * 2, 1);
            
            // Smooth easing for fall
            const easedProgress = this.spawnProgress * this.spawnProgress;
            const smoothFallY = this.spawnY - 150 + (150 * easedProgress);
            
            ctx.globalAlpha = alpha;
            
            // Draw glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = powerUpConfig.color;
            ctx.fillStyle = powerUpConfig.color;
            ctx.fillRect(this.spawnX, smoothFallY, this.width, this.height);
            ctx.shadowBlur = 0;
            
            // Draw symbol
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUpConfig.symbol, this.spawnX + this.width / 2, smoothFallY + this.height / 2);
            
            ctx.globalAlpha = 1;
            
            // Subtle beam only at start
            if (this.spawnProgress < 0.5) {
                ctx.strokeStyle = powerUpConfig.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3 * (1 - this.spawnProgress * 2);
                ctx.beginPath();
                ctx.moveTo(this.spawnX + this.width / 2, smoothFallY);
                ctx.lineTo(this.spawnX + this.width / 2, this.spawnY + this.height);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            
            return;
        }
        
        if (!this.active) {
            // Don't render if not active and no particles
            return;
        }
        
        // Active power-up with gentle bob
        const renderY = this.spawnY + this.bobOffset;
        
        // Pulsing glow effect
        const glowIntensity = 10 + Math.sin(now * 0.003) * 5;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = powerUpConfig.color;
        
        // Draw box
        ctx.fillStyle = powerUpConfig.color;
        ctx.fillRect(this.spawnX, renderY, this.width, this.height);
        
        ctx.shadowBlur = 0;
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.spawnX, renderY, this.width, this.height);
        
        // Draw symbol
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUpConfig.symbol, this.spawnX + this.width / 2, renderY + this.height / 2);
        
        // Subtle rotating indicator (slower)
        const rotation = (now * 0.001) % (Math.PI * 2);
        ctx.save();
        ctx.translate(this.spawnX + this.width / 2, renderY + this.height / 2);
        ctx.rotate(rotation);
        ctx.strokeStyle = powerUpConfig.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6);
        ctx.restore();
        
        // Show time remaining before despawn
        const timeRemaining = this.lifeDuration - (now - this.spawnedTime);
        if (timeRemaining < 5000 && timeRemaining > 0) {
            const secondsLeft = Math.ceil(timeRemaining / 1000);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(secondsLeft.toString(), this.spawnX + this.width / 2, this.spawnY - 5);
            ctx.fillText(secondsLeft.toString(), this.spawnX + this.width / 2, this.spawnY - 5);
        }
    }
}
