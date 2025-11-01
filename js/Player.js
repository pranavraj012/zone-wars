class Player {
    constructor(x, y, color, name, controller) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 50;
        this.color = color;
        this.name = name;
        this.controller = controller;
        
        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 0.6;
        this.maxSpeed = 5;
        this.friction = 0.8; // More responsive ground control
        this.gravity = 0.5;
        this.terminalVelocity = 15;
        this.jumpForce = -12;
        this.isGrounded = false;
        this.wasGroundedLastFrame = false;
        
        // Facing direction
        this.facingDirection = 1; // 1 = right, -1 = left
        
        // Shooting
        this.shootCooldown = 500; // ms
        this.lastShootTime = 0;
        this.projectileSpeed = 8; // Default, can be updated from settings
        
        // Scoring
        this.dominationScore = 0; // in milliseconds
        this.lastScoreTime = 0;
        
        // Hit effect
        this.hitFlashTime = 0;
        this.hitFlashDuration = 300; // ms
        
        // Power-ups
        this.activePowerUps = new Map(); // type -> endTime
        
        // Health system
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isRespawning = false;
        this.respawnTime = 3000; // 3 seconds
        this.respawnStartTime = 0;
        this.spawnX = x;
        this.spawnY = y;
        this.fallSpawnY = -100; // Start falling from above
        this.isDead = false;
        this.hasSpawnedOnce = true; // Start as true so initial spawn works
        
        // Stats
        this.kills = 0;
        this.deaths = 0;
    }
    
    hasPowerUp(type) {
        const endTime = this.activePowerUps.get(type);
        if (endTime && Date.now() < endTime) {
            return true;
        }
        // Clean up expired power-up
        if (endTime && Date.now() >= endTime) {
            this.activePowerUps.delete(type);
        }
        return false;
    }
    
    addPowerUp(type, duration) {
        const endTime = Date.now() + duration;
        this.activePowerUps.set(type, endTime);
    }
    
    cleanExpiredPowerUps() {
        const now = Date.now();
        for (const [type, endTime] of this.activePowerUps.entries()) {
            if (now >= endTime) {
                this.activePowerUps.delete(type);
            }
        }
    }
    
    getActivePowerUpsList() {
        const active = [];
        for (const [type, endTime] of this.activePowerUps.entries()) {
            if (Date.now() < endTime) {
                active.push({
                    type,
                    timeLeft: (endTime - Date.now()) / 1000
                });
            }
        }
        return active;
    }
    
    getInput() {
        return this.controller.getInput();
    }
    
    update(platforms, canvasWidth, canvasHeight, currentTime) {
        // Clean expired power-ups each frame
        this.cleanExpiredPowerUps();
        
        // Handle respawning
        if (this.isRespawning) {
            if (currentTime - this.respawnStartTime >= this.respawnTime) {
                this.finishRespawn();
            }
            // Allow falling during respawn
            this.velocityY += this.gravity;
            this.y += this.velocityY;
            return; // Don't process other updates while respawning
        }
        
        // Handle death (falling animation)
        if (this.isDead) {
            this.velocityY += this.gravity;
            this.y += this.velocityY;
            return;
        }
        
        const input = this.getInput();
        
        // Cache power-up states to prevent multiple checks
        const hasSpeed = this.hasPowerUp('speed');
        const hasJump = this.hasPowerUp('jump');
        
        // Power-up effects
        const speedBoost = hasSpeed ? 1.5 : 1;
        const jumpBoost = hasJump ? 1.4 : 1;
        
        // Horizontal movement - more robust handling to avoid getting stuck
        // Determine desired horizontal direction: -1 left, 1 right, 0 none
        const desiredDir = input.left ? -1 : input.right ? 1 : 0;

        if (desiredDir !== 0) {
            // If we're moving opposite to desired direction, apply stronger braking to allow quick reversal
            if (this.velocityX !== 0 && Math.sign(this.velocityX) === -desiredDir) {
                // Heavy damping when changing direction for responsive controls
                this.velocityX *= 0.35;
            }

            // Apply acceleration in desired direction
            this.velocityX += desiredDir * this.acceleration * speedBoost;

            // Update facing direction
            this.facingDirection = desiredDir;
        }
        
        // Apply friction - stronger on ground, less in air
        if (this.isGrounded) {
            this.velocityX *= this.friction; // 0.8 - tighter control on ground
        } else {
            // Moderate air friction for better control
            this.velocityX *= 0.95;
        }
        
        // Clamp horizontal velocity
        const effectiveMaxSpeed = this.maxSpeed * speedBoost;
        if (Math.abs(this.velocityX) > effectiveMaxSpeed) {
            this.velocityX = Math.sign(this.velocityX) * effectiveMaxSpeed;
        }
        
        // Stop if velocity is very small
        if (Math.abs(this.velocityX) < 0.1) {
            this.velocityX = 0;
        }
        
        // Jumping - only allow on fresh landing to prevent bunny hopping
        // Player must have been in the air last frame and grounded this frame, or release and repress jump
        if (input.jump && this.isGrounded && this.velocityY >= 0) {
            // Only jump if we just landed (weren't grounded last frame)
            // This prevents holding jump key to continuously bounce
            if (!this.wasGroundedLastFrame) {
                this.velocityY = this.jumpForce * jumpBoost;
                this.isGrounded = false;
            }
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += this.gravity;
        }
        
        // Clamp vertical velocity
        if (this.velocityY > this.terminalVelocity) {
            this.velocityY = this.terminalVelocity;
        }
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Store previous grounded state before resetting
        this.wasGroundedLastFrame = this.isGrounded;
        
        // Reset grounded state before collision checks
        this.isGrounded = false;
        
        // Check boundaries
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            this.velocityX = 0;
        }
        
        // Floor collision with proper grounding
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        }
        
        // Ceiling collision
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        
        // Platform collisions
        for (const platform of platforms) {
            platform.resolveCollision(this);
        }
    }
    
    canShoot(currentTime) {
        const cooldown = this.hasPowerUp('rapid') ? this.shootCooldown / 3 : this.shootCooldown;
        return currentTime - this.lastShootTime >= cooldown;
    }
    
    shoot(currentTime) {
        if (this.canShoot(currentTime)) {
            this.lastShootTime = currentTime;
            const direction = this.facingDirection;
            const projectileX = direction > 0 ? this.x + this.width : this.x;
            const projectileY = this.y + this.height / 2;
            
            const isMega = this.hasPowerUp('mega');
            return new Projectile(projectileX, projectileY, direction, this.color, isMega, this.projectileSpeed);
        }
        return null;
    }
    
    takeDamage(damage, direction, currentTime) {
        // Shield blocks damage and knockback
        if (this.hasPowerUp('shield')) {
            return false; // No damage
        }
        
        this.health -= damage;
        
        // Apply knockback only if not already knocked back heavily
        const knockbackForce = direction * 8;
        // Don't override existing strong velocities
        if (Math.abs(this.velocityX) < Math.abs(knockbackForce)) {
            this.velocityX = knockbackForce;
        } else {
            // Add to existing velocity but cap it
            this.velocityX += knockbackForce * 0.5;
            this.velocityX = Math.max(-20, Math.min(20, this.velocityX));
        }
        
        // Only apply upward velocity if grounded or falling
        if (this.isGrounded || this.velocityY > 0) {
            this.velocityY = -5;
        }
        
        this.hitFlashTime = currentTime;
        
        // Check if dead
        if (this.health <= 0) {
            this.die(currentTime);
        }
        
        return true; // Damage applied
    }
    
    die(currentTime) {
        this.isDead = true;
        this.deaths++;
        this.health = 0;
        
        // Launch upward with some randomness
        this.velocityY = -8;
        this.velocityX = (Math.random() - 0.5) * 4; // Random horizontal spin
        
        this.activePowerUps.clear(); // Lose all power-ups
        
        // Start respawn timer after a brief delay
        setTimeout(() => {
            if (this.isDead) {
                this.startRespawn(currentTime);
            }
        }, 1500);
    }
    
    startRespawn(currentTime) {
        this.isRespawning = true;
        this.isDead = false;
        this.respawnStartTime = currentTime;
        this.x = this.spawnX;
        this.y = this.fallSpawnY; // Start above screen
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    finishRespawn() {
        this.isRespawning = false;
        this.health = this.maxHealth;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false; // Will be set by collision
    }
    
    giveKill() {
        this.kills++;
    }
    
    canAct() {
        return !this.isRespawning && !this.isDead;
    }
    
    addDominationScore(deltaTime) {
        this.dominationScore += deltaTime;
    }
    
    getDominationScoreInSeconds() {
        return this.dominationScore / 1000;
    }
    
    render(ctx, currentTime) {
        // Don't render if dead and fallen off screen
        if (this.isDead && this.y > 700) {
            return;
        }
        
        // Respawn effect
        if (this.isRespawning) {
            const respawnProgress = (currentTime - this.respawnStartTime) / this.respawnTime;
            const alpha = 0.3 + Math.sin(currentTime * 0.01) * 0.3;
            
            // Draw falling player with transparency
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw respawn timer above player
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            const timeLeft = Math.ceil((this.respawnTime - (currentTime - this.respawnStartTime)) / 1000);
            ctx.strokeText(timeLeft.toString(), this.x + this.width / 2, this.y - 10);
            ctx.fillText(timeLeft.toString(), this.x + this.width / 2, this.y - 10);
            ctx.restore();
            return;
        }
        
        // Death effect - fade out
        if (this.isDead) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }
        
        // Shield effect
        if (this.hasPowerUp('shield')) {
            ctx.save();
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            const shieldPulse = Math.sin(currentTime * 0.01) * 3;
            ctx.strokeRect(this.x - 5 - shieldPulse, this.y - 5 - shieldPulse, 
                           this.width + 10 + shieldPulse * 2, this.height + 10 + shieldPulse * 2);
            ctx.restore();
        }
        
        // Speed boost effect
        if (this.hasPowerUp('speed')) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(this.x - 2, this.y, this.width + 4, this.height);
        }
        
        // Hit flash effect
        const isFlashing = currentTime - this.hitFlashTime < this.hitFlashDuration;
        
        // Draw player with flash effect
        if (isFlashing && Math.floor(currentTime / 50) % 2 === 0) {
            ctx.fillStyle = '#ffffff'; // Flash white
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw facing direction indicator (eyes/face)
        const eyeY = this.y + 15;
        const eyeSize = 5;
        
        if (this.facingDirection === 1) {
            // Facing right - eyes on right side
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + this.width - 12, eyeY, eyeSize, eyeSize);
            ctx.fillRect(this.x + this.width - 12, eyeY + 10, eyeSize, eyeSize);
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + this.width - 9, eyeY + 1, 2, 3);
            ctx.fillRect(this.x + this.width - 9, eyeY + 11, 2, 3);
        } else {
            // Facing left - eyes on left side
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 7, eyeY, eyeSize, eyeSize);
            ctx.fillRect(this.x + 7, eyeY + 10, eyeSize, eyeSize);
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 7, eyeY + 1, 2, 3);
            ctx.fillRect(this.x + 7, eyeY + 11, 2, 3);
        }
        
        // Draw directional arrow above player
        const arrowY = this.y - 15;
        const arrowX = this.x + this.width / 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.facingDirection === 1) {
            // Right arrow
            ctx.moveTo(arrowX - 5, arrowY);
            ctx.lineTo(arrowX + 5, arrowY);
            ctx.lineTo(arrowX + 5, arrowY - 3);
            ctx.lineTo(arrowX + 10, arrowY + 3);
            ctx.lineTo(arrowX + 5, arrowY + 9);
            ctx.lineTo(arrowX + 5, arrowY + 6);
            ctx.lineTo(arrowX - 5, arrowY + 6);
        } else {
            // Left arrow
            ctx.moveTo(arrowX + 5, arrowY);
            ctx.lineTo(arrowX - 5, arrowY);
            ctx.lineTo(arrowX - 5, arrowY - 3);
            ctx.lineTo(arrowX - 10, arrowY + 3);
            ctx.lineTo(arrowX - 5, arrowY + 9);
            ctx.lineTo(arrowX - 5, arrowY + 6);
            ctx.lineTo(arrowX + 5, arrowY + 6);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw player name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.name, this.x + this.width / 2, this.y - 25);
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 25);
        
        // Draw HP bar above player
        const hpBarWidth = 40;
        const hpBarHeight = 5;
        const hpBarX = this.x + this.width / 2 - hpBarWidth / 2;
        const hpBarY = this.y - 35;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        let healthColor = '#00ff00';
        if (healthPercent < 0.3) healthColor = '#ff0000';
        else if (healthPercent < 0.6) healthColor = '#ffaa00';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * healthPercent, hpBarHeight);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Draw active power-up icons
        const activePowerUps = this.getActivePowerUpsList();
        activePowerUps.forEach((powerUp, index) => {
            const iconX = this.x + this.width / 2 - 10;
            const iconY = this.y + this.height + 5 + (index * 15);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(iconX, iconY, 20, 12);
            
            let symbol = '';
            let color = '#fff';
            switch(powerUp.type) {
                case 'speed': symbol = '⚡'; color = '#FFD700'; break;
                case 'jump': symbol = '↑'; color = '#00FF00'; break;
                case 'rapid': symbol = '⚔'; color = '#FF00FF'; break;
                case 'shield': symbol = '⬡'; color = '#00FFFF'; break;
                case 'mega': symbol = '★'; color = '#FF0000'; break;
            }
            
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(symbol, iconX + 2, iconY + 10);
            
            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.fillText(Math.ceil(powerUp.timeLeft), iconX + 12, iconY + 9);
        });
    }
}
