class Projectile {
    constructor(x, y, direction, color, isMega = false, baseSpeed = 8) {
        this.x = x;
        this.y = y;
        this.isMega = isMega;
        this.radius = isMega ? 15 : 10;
        this.speed = isMega ? baseSpeed * 1.25 : baseSpeed;
        this.velocityX = direction * this.speed;
        this.color = color;
        this.active = true;
        this.knockbackMultiplier = isMega ? 2 : 1;
        this.damage = isMega ? 30 : 15; // Mega shots do more damage
    }
    
    update() {
        this.x += this.velocityX;
    }
    
    checkBounds(canvasWidth, canvasHeight) {
        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth ||
            this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.active = false;
        }
    }
    
    checkCollisionWithPlayer(player) {
        if (!this.active) return false;
        
        // Circle vs Rectangle collision
        const closestX = Math.max(player.x, Math.min(this.x, player.x + player.width));
        const closestY = Math.max(player.y, Math.min(this.y, player.y + player.height));
        
        const distanceX = this.x - closestX;
        const distanceY = this.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        
        return distanceSquared < (this.radius * this.radius);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Mega projectile effects
        if (this.isMega) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        if (this.isMega) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    getKnockbackMultiplier() {
        return this.knockbackMultiplier;
    }
    
    getDamage() {
        return this.damage;
    }
}
