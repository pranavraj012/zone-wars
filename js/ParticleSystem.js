// Particle effects system for visual flair
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                maxLife: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createDeathEffect(x, y, color) {
        // Larger explosion for death
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const speed = Math.random() * 8 + 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 1,
                color: color,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    createTrail(x, y, color, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                maxLife: 1,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity
            p.vx *= 0.98; // Air resistance
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    clear() {
        this.particles = [];
    }
}
