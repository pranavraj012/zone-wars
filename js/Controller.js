class Controller {
    constructor(keyMap) {
        this.keys = {
            left: false,
            right: false,
            jump: false,
            shoot: false
        };
        
        this.keyMap = keyMap;
        this.jumpPressed = false;
        this.shootPressed = false;
        this.enabled = true; // Add enabled flag
    this.lastHorizontal = null; // { dir: 'left'|'right', time: number }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.enabled) {
                this.handleKeyDown(e.key);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.enabled) {
                this.handleKeyUp(e.key);
            }
        });
        
        // Fix: Reset all keys when window loses focus (prevents stuck keys)
        window.addEventListener('blur', () => {
            this.resetAllKeys();
        });
        
        // Fix: Reset all keys when visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.resetAllKeys();
            }
        });
    }
    
    resetAllKeys() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.jump = false;
        this.keys.shoot = false;
        this.jumpPressed = false;
        this.shootPressed = false;
        this.lastHorizontal = null;
    }
    
    handleKeyDown(key) {
        // Normalize comparison to be case-insensitive to avoid issues with Shift/CapsLock
        const k = String(key).toLowerCase();
        const leftMap = String(this.keyMap.left).toLowerCase();
        const rightMap = String(this.keyMap.right).toLowerCase();

        if (k === leftMap) {
            this.keys.left = true;
            this.lastHorizontal = { dir: 'left', time: Date.now() };
        }
        if (k === rightMap) {
            this.keys.right = true;
            this.lastHorizontal = { dir: 'right', time: Date.now() };
        }
        // Only trigger jump once per keypress
        if (key === this.keyMap.jump) {
            if (!this.jumpPressed) {
                this.keys.jump = true;
                this.jumpPressed = true;
            }
        }
        // Only trigger shoot once per keypress
        if (key === this.keyMap.shoot) {
            if (!this.shootPressed) {
                this.keys.shoot = true;
                this.shootPressed = true;
            }
        }
    }
    
    handleKeyUp(key) {
        const k2 = String(key).toLowerCase();
        const leftMap2 = String(this.keyMap.left).toLowerCase();
        const rightMap2 = String(this.keyMap.right).toLowerCase();

        if (k2 === leftMap2) {
            this.keys.left = false;
            // If left was last horizontal and right is still held, promote right
            if (this.lastHorizontal && this.lastHorizontal.dir === 'left' && this.keys.right) {
                this.lastHorizontal = { dir: 'right', time: Date.now() };
            }
            // Clear lastHorizontal if none held
            if (!this.keys.left && !this.keys.right) this.lastHorizontal = null;
        }
        if (k2 === rightMap2) {
            this.keys.right = false;
            if (this.lastHorizontal && this.lastHorizontal.dir === 'right' && this.keys.left) {
                this.lastHorizontal = { dir: 'left', time: Date.now() };
            }
            if (!this.keys.left && !this.keys.right) this.lastHorizontal = null;
        }
        if (key === this.keyMap.jump) {
            this.keys.jump = false;
            this.jumpPressed = false;
        }
        if (key === this.keyMap.shoot) {
            this.keys.shoot = false;
            this.shootPressed = false;
        }
    }
    
    getInput() {
        // If both left and right are pressed, prefer the most recently pressed direction
        const resolved = { ...this.keys };
        if (resolved.left && resolved.right && this.lastHorizontal) {
            if (this.lastHorizontal.dir === 'left') resolved.right = false;
            else resolved.left = false;
        }
        return resolved;
    }
    
    resetShoot() {
        this.keys.shoot = false;
    }
}
