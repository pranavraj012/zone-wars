class Platform {
    constructor(x, y, width, height, isZone = false, zoneColor = null, zoneName = '') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isZone = isZone;
        this.zoneColor = zoneColor;
        this.zoneName = zoneName;
        this.controlledBy = null; // null, 'player1', 'player2'
        
        // Capture mechanics
        this.captureProgress = 0; // 0 to 100
        this.capturingPlayer = null; // Who is currently on the zone
        this.captureSpeed = 0.5; // Percentage per 100ms (5 seconds to full capture)
        this.decaySpeed = 0.2; // How fast neutral zones decay when empty
        this.isNeutral = true; // Starts neutral
    }
    
    updateCapture(player1OnZone, player2OnZone, deltaTime, captureSpeedMultiplier = 1.0) {
        if (!this.isZone) return;
        
        const captureAmount = (deltaTime / 100) * this.captureSpeed * captureSpeedMultiplier;
        
        // Both players on zone - contested, no progress
        if (player1OnZone && player2OnZone) {
            this.capturingPlayer = 'contested';
            return;
        }
        
        // Player 1 on zone
        if (player1OnZone) {
            this.capturingPlayer = 'player1';
            
            if (this.controlledBy === 'player1') {
                // Already owned, keep at 100%
                this.captureProgress = 100;
            } else if (this.controlledBy === 'player2') {
                // Taking from enemy - first reduce their control
                this.captureProgress = Math.max(0, this.captureProgress - captureAmount);
                if (this.captureProgress === 0) {
                    this.controlledBy = null;
                    this.isNeutral = true;
                }
            } else {
                // Neutral or empty - capture it
                this.captureProgress = Math.min(100, this.captureProgress + captureAmount);
                this.isNeutral = false;
                if (this.captureProgress >= 100) {
                    this.controlledBy = 'player1';
                }
            }
        }
        // Player 2 on zone
        else if (player2OnZone) {
            this.capturingPlayer = 'player2';
            
            if (this.controlledBy === 'player2') {
                // Already owned, keep at 100%
                this.captureProgress = 100;
            } else if (this.controlledBy === 'player1') {
                // Taking from enemy - first reduce their control
                this.captureProgress = Math.max(0, this.captureProgress - captureAmount);
                if (this.captureProgress === 0) {
                    this.controlledBy = null;
                    this.isNeutral = true;
                }
            } else {
                // Neutral or empty - capture it
                this.captureProgress = Math.min(100, this.captureProgress + captureAmount);
                this.isNeutral = false;
                if (this.captureProgress >= 100) {
                    this.controlledBy = 'player2';
                }
            }
        }
        // No one on zone
        else {
            this.capturingPlayer = null;
            
            // Decay neutral zones slowly
            if (this.isNeutral && this.captureProgress > 0) {
                this.captureProgress = Math.max(0, this.captureProgress - (deltaTime / 100) * this.decaySpeed);
            }
        }
    }
    
    resolveCollision(player) {
        if (!this.checkCollision(player)) return;
        
        const playerBottom = player.y + player.height;
        const playerTop = player.y;
        const playerRight = player.x + player.width;
        const playerLeft = player.x;
        
        const platformTop = this.y;
        const platformBottom = this.y + this.height;
        const platformRight = this.x + this.width;
        const platformLeft = this.x;
        
        // Calculate overlaps
        const overlapLeft = playerRight - platformLeft;
        const overlapRight = platformRight - playerLeft;
        const overlapTop = playerBottom - platformTop;
        const overlapBottom = platformBottom - playerTop;
        
        // Find minimum overlap
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        // Fix: Add small threshold to prevent jitter in corners
        const threshold = 2;
        
        // Resolve based on minimum overlap direction
        // Priority: vertical collisions when falling/jumping, horizontal when moving sideways
        
        if (minOverlap === overlapTop && player.velocityY >= 0) {
            // Landing on platform from above (falling down)
            player.y = platformTop - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
        } else if (minOverlap === overlapBottom && player.velocityY < 0) {
            // Hitting platform from below (jumping up)
            player.y = platformBottom;
            player.velocityY = 0;
        } else if (minOverlap === overlapLeft && player.velocityX > 0) {
            // Hitting platform from left side
            player.x = platformLeft - player.width;
            // Fix: Only zero velocity if significant collision (not just grazing)
            if (overlapLeft > threshold) {
                player.velocityX = Math.min(0, player.velocityX);
            }
        } else if (minOverlap === overlapRight && player.velocityX < 0) {
            // Hitting platform from right side
            player.x = platformRight;
            // Fix: Only zero velocity if significant collision (not just grazing)
            if (overlapRight > threshold) {
                player.velocityX = Math.max(0, player.velocityX);
            }
        } else if (minOverlap === overlapTop) {
            // Edge case: very small velocity or standing
            player.y = platformTop - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
        }
    }
    
    checkIfPlayerOnTop(player) {
        if (!this.isZone) return false;
        
        const playerBottom = player.y + player.height;
        const playerLeft = player.x;
        const playerRight = player.x + player.width;
        
        const platformTop = this.y;
        const platformLeft = this.x;
        const platformRight = this.x + this.width;
        
        // More lenient check - within 8 pixels of top and overlapping horizontally
        const verticalTolerance = 8;
        const onTop = Math.abs(playerBottom - platformTop) < verticalTolerance;
        const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
        
        // Check if player is standing on top of platform
        return (
            player.isGrounded &&
            onTop &&
            horizontalOverlap
        );
    }
    
    checkCollision(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
    
    render(ctx, player1Color = '#0066ff', player2Color = '#ff0000') {
        if (this.isZone) {
            // Base zone color
            ctx.fillStyle = this.zoneColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Helper function to convert hex to rgba
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            // Capture progress overlay
            if (this.captureProgress > 0) {
                const progressHeight = (this.height * this.captureProgress) / 100;
                
                let overlayColor;
                if (this.controlledBy === 'player1') {
                    overlayColor = hexToRgba(player1Color, 0.6);
                } else if (this.controlledBy === 'player2') {
                    overlayColor = hexToRgba(player2Color, 0.6);
                } else if (this.capturingPlayer === 'player1') {
                    overlayColor = hexToRgba(player1Color, 0.4);
                } else if (this.capturingPlayer === 'player2') {
                    overlayColor = hexToRgba(player2Color, 0.4);
                } else {
                    overlayColor = 'rgba(128, 128, 128, 0.3)'; // Gray for neutral
                }
                
                ctx.fillStyle = overlayColor;
                ctx.fillRect(this.x, this.y + this.height - progressHeight, this.width, progressHeight);
            }
            
            // Glow effect for owned zones
            if (this.controlledBy) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.controlledBy === 'player1' ? player1Color : player2Color;
            }
            
            // Draw border based on status
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            
            if (this.controlledBy === 'player1') {
                ctx.strokeStyle = player1Color;
                ctx.lineWidth = 5;
            } else if (this.controlledBy === 'player2') {
                ctx.strokeStyle = player2Color;
                ctx.lineWidth = 5;
            } else if (this.capturingPlayer === 'contested') {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 5;
            }
            
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
            
            // Draw zone name
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.strokeText(this.zoneName, this.x + this.width / 2, this.y + this.height / 2 + 5);
            ctx.fillText(this.zoneName, this.x + this.width / 2, this.y + this.height / 2 + 5);
            
            // Show capture progress percentage
            if (this.captureProgress > 0 && this.captureProgress < 100) {
                const progressText = `${Math.floor(this.captureProgress)}%`;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeText(progressText, this.x + this.width / 2, this.y + this.height / 2 + 20);
                ctx.fillText(progressText, this.x + this.width / 2, this.y + this.height / 2 + 20);
            }
            
            // Show control indicator
            if (this.controlledBy) {
                let indicator = this.controlledBy === 'player1' ? '▲ P1' : '▲ P2';
                let indicatorColor = this.controlledBy === 'player1' ? player1Color : player2Color;
                
                ctx.fillStyle = indicatorColor;
                ctx.font = 'bold 10px Arial';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeText(indicator, this.x + this.width / 2, this.y - 5);
                ctx.fillText(indicator, this.x + this.width / 2, this.y - 5);
            } else if (this.capturingPlayer === 'contested') {
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 10px Arial';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeText('⚔ CONTESTED', this.x + this.width / 2, this.y - 5);
                ctx.fillText('⚔ CONTESTED', this.x + this.width / 2, this.y - 5);
            }
        } else {
            // Regular platform
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
