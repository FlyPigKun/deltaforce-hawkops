// entities.js - Player, Enemy, Loot entities

// ============ PLAYER ============
class Player {
    constructor(x, y, operatorClass) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.operatorClass = operatorClass;
        this.radius = 14;

        // Stats by class
        const stats = {
            assault:  { hp: 100, armor: 50, speed: 160, fireRate: 0.12, damage: 18, magSize: 30, weaponName: '突击步枪' },
            engineer: { hp: 100, armor: 70, speed: 140, fireRate: 0.15, damage: 22, magSize: 25, weaponName: '战斗步枪' },
            support:  { hp: 120, armor: 40, speed: 145, fireRate: 0.10, damage: 15, magSize: 35, weaponName: '冲锋枪' },
            recon:    { hp: 80,  armor: 30, speed: 170, fireRate: 0.25, damage: 35, magSize: 10, weaponName: '精确步枪' }
        };
        const s = stats[operatorClass] || stats.assault;
        this.maxHp = s.hp;
        this.hp = s.hp;
        this.maxArmor = s.armor;
        this.armor = s.armor;
        this.speed = s.speed;
        this.fireRate = s.fireRate;
        this.damage = s.damage;
        this.magSize = s.magSize;
        this.weaponName = s.weaponName;
        this.ammo = s.magSize;
        this.totalAmmo = s.magSize * 3;
        this.reloading = false;
        this.reloadTime = 2.0;
        this.reloadTimer = 0;

        this.fireCooldown = 0;
        this.alive = true;

        // Skill
        this.skillCooldown = 0;
        this.skillMaxCooldown = this.getSkillCooldown();
        this.skillActive = false;
        this.skillDuration = 0;
        this.skillName = this.getSkillName();

        // Inventory
        this.inventory = [];
        this.maxInventory = 8;

        // Movement state
        this.vx = 0;
        this.vy = 0;

        // Effects
        this.invincible = false;
        this.speedBoost = 1;
        this.muzzleFlash = 0;

        // Mine placed by engineer
        this.mines = [];
    }

    getSkillCooldown() {
        const cds = { assault: 15, engineer: 20, support: 18, recon: 12 };
        return cds[this.operatorClass] || 15;
    }

    getSkillName() {
        const names = { assault: '冲刺', engineer: '地雷', support: '治疗烟雾', recon: '扫描' };
        return names[this.operatorClass] || '技能';
    }

    update(dt, keys, mouseAngle, map) {
        if (!this.alive) return;

        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const spd = this.speed * this.speedBoost;
        const newX = this.x + dx * spd * dt;
        const newY = this.y + dy * spd * dt;

        // Collision check
        if (!map.checkCollision(newX, this.y, this.radius * 2, this.radius * 2)) {
            this.x = newX;
        }
        if (!map.checkCollision(this.x, newY, this.radius * 2, this.radius * 2)) {
            this.y = newY;
        }

        this.angle = mouseAngle;

        // Fire cooldown
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

        // Reload
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                const needed = this.magSize - this.ammo;
                const available = Math.min(needed, this.totalAmmo);
                this.ammo += available;
                this.totalAmmo -= available;
            }
        }

        // Skill cooldown
        if (this.skillCooldown > 0) this.skillCooldown -= dt;
        if (this.skillActive) {
            this.skillDuration -= dt;
            if (this.skillDuration <= 0) {
                this.deactivateSkill();
            }
        }

        // Mine check
        this.mines = this.mines.filter(m => m.active);
    }

    shoot() {
        if (!this.alive || this.fireCooldown > 0 || this.reloading || this.ammo <= 0) return null;

        this.ammo--;
        this.fireCooldown = this.fireRate;
        this.muzzleFlash = 0.08;

        if (this.ammo <= 0 && this.totalAmmo > 0) {
            this.reload();
        }

        // Return bullet info
        const spread = (Math.random() - 0.5) * 0.06;
        return {
            x: this.x + Math.cos(this.angle) * 24,
            y: this.y + Math.sin(this.angle) * 24,
            angle: this.angle + spread,
            damage: this.damage,
            speed: 800,
            owner: 'player',
            life: 0.8
        };
    }

    reload() {
        if (this.reloading || this.totalAmmo <= 0 || this.ammo >= this.magSize) return;
        this.reloading = true;
        this.reloadTimer = this.reloadTime;
    }

    useSkill(enemies) {
        if (this.skillCooldown > 0 || this.skillActive) return null;

        this.skillCooldown = this.skillMaxCooldown;
        this.skillActive = true;
        let result = null;

        switch (this.operatorClass) {
            case 'assault':
                // Sprint: speed boost + invincible
                this.speedBoost = 2.0;
                this.invincible = true;
                this.skillDuration = 2.0;
                break;
            case 'engineer':
                // Place mine
                this.skillActive = false;
                const mine = {
                    x: this.x, y: this.y,
                    radius: 60, damage: 80,
                    active: true, triggered: false,
                    triggerTimer: 0
                };
                this.mines.push(mine);
                result = { type: 'mine', mine };
                break;
            case 'support':
                // Healing smoke
                this.skillDuration = 5.0;
                result = { type: 'heal_zone', x: this.x, y: this.y, radius: 80, duration: 5.0, healRate: 10 };
                break;
            case 'recon':
                // Scan enemies
                this.skillDuration = 4.0;
                if (enemies) {
                    enemies.forEach(e => {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < 400) e.detected = true;
                    });
                }
                result = { type: 'scan', radius: 400 };
                break;
        }
        return result;
    }

    deactivateSkill() {
        this.skillActive = false;
        this.speedBoost = 1;
        this.invincible = false;
    }

    takeDamage(amount) {
        if (this.invincible) return;
        // Armor absorbs first
        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.7);
            this.armor -= absorbed;
            amount -= absorbed;
        }
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    addItem(item) {
        if (this.inventory.length >= this.maxInventory) return false;
        this.inventory.push(item);

        // Apply immediate effects
        if (item.type === 'medkit') {
            this.hp = Math.min(this.maxHp, this.hp + 30);
            this.inventory.pop();
        } else if (item.type === 'ammo') {
            this.totalAmmo += this.magSize;
            this.inventory.pop();
            if (this.ammo <= 0 && !this.reloading) this.reload();
        } else if (item.type === 'armor') {
            this.armor = Math.min(this.maxArmor, this.armor + 25);
            this.inventory.pop();
        }
        return true;
    }

    getInventoryValue() {
        return this.inventory.reduce((sum, item) => sum + (item.getValue ? item.getValue() : 0), 0);
    }
}

// ============ ENEMY AI ============
class Enemy {
    constructor(x, y, waypoints) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.radius = 12;
        this.hp = 60;
        this.maxHp = 60;
        this.damage = 10;
        this.speed = 90;
        this.fireRate = 0.5;
        this.fireCooldown = 0;
        this.alive = true;
        this.detected = false;
        this.detectedTimer = 0;

        // AI State machine
        this.state = 'patrol'; // patrol, alert, chase, attack
        this.waypoints = waypoints || [];
        this.waypointIndex = 0;
        this.alertTimer = 0;
        this.lastKnownPlayerX = 0;
        this.lastKnownPlayerY = 0;
        this.sightRange = 250;
        this.attackRange = 220;
        this.hearRange = 150;
        this.loseRange = 400;

        this.stateTimer = 0;
    }

    update(dt, player, map, bullets) {
        if (!this.alive) return;

        this.fireCooldown -= dt;
        if (this.detectedTimer > 0) {
            this.detectedTimer -= dt;
            if (this.detectedTimer <= 0) this.detected = false;
        }

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const canSee = distToPlayer < this.sightRange && map.raycast(this.x, this.y, player.x, player.y);

        switch (this.state) {
            case 'patrol':
                this.patrol(dt, map);
                if (canSee && player.alive) {
                    this.state = 'alert';
                    this.alertTimer = 1.0;
                    this.lastKnownPlayerX = player.x;
                    this.lastKnownPlayerY = player.y;
                }
                break;

            case 'alert':
                // Turn toward player
                this.angle = Math.atan2(this.lastKnownPlayerY - this.y, this.lastKnownPlayerX - this.x);
                this.alertTimer -= dt;
                if (this.alertTimer <= 0) {
                    if (canSee && player.alive) {
                        this.state = 'chase';
                    } else {
                        this.state = 'patrol';
                    }
                }
                break;

            case 'chase':
                if (!player.alive) { this.state = 'patrol'; break; }
                if (canSee) {
                    this.lastKnownPlayerX = player.x;
                    this.lastKnownPlayerY = player.y;
                }
                // Move toward last known position
                this.moveToward(this.lastKnownPlayerX, this.lastKnownPlayerY, dt, map);
                this.angle = Math.atan2(this.lastKnownPlayerY - this.y, this.lastKnownPlayerX - this.x);

                if (canSee && distToPlayer < this.attackRange) {
                    this.state = 'attack';
                } else if (distToPlayer > this.loseRange && !canSee) {
                    this.state = 'patrol';
                }
                break;

            case 'attack':
                if (!player.alive) { this.state = 'patrol'; break; }
                this.angle = Math.atan2(player.y - this.y, player.x - this.x);
                if (canSee) {
                    this.lastKnownPlayerX = player.x;
                    this.lastKnownPlayerY = player.y;
                    // Shoot
                    if (this.fireCooldown <= 0) {
                        this.fireCooldown = this.fireRate;
                        const spread = (Math.random() - 0.5) * 0.15;
                        bullets.push({
                            x: this.x + Math.cos(this.angle) * 20,
                            y: this.y + Math.sin(this.angle) * 20,
                            angle: this.angle + spread,
                            damage: this.damage,
                            speed: 500,
                            owner: 'enemy',
                            life: 0.6
                        });
                    }
                    // Keep distance
                    if (distToPlayer < 100) {
                        // back off slightly
                        const bx = this.x - Math.cos(this.angle) * this.speed * 0.5 * dt;
                        const by = this.y - Math.sin(this.angle) * this.speed * 0.5 * dt;
                        if (!map.checkCollision(bx, by, this.radius * 2, this.radius * 2)) {
                            this.x = bx;
                            this.y = by;
                        }
                    }
                } else {
                    this.state = 'chase';
                }
                if (distToPlayer > this.loseRange) {
                    this.state = 'patrol';
                }
                break;
        }
    }

    patrol(dt, map) {
        if (this.waypoints.length === 0) return;
        const wp = this.waypoints[this.waypointIndex];
        const dist = Math.hypot(wp.x - this.x, wp.y - this.y);

        if (dist < 10) {
            this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
        } else {
            this.moveToward(wp.x, wp.y, dt, map);
            this.angle = Math.atan2(wp.y - this.y, wp.x - this.x);
        }
    }

    moveToward(tx, ty, dt, map) {
        const angle = Math.atan2(ty - this.y, tx - this.x);
        const nx = this.x + Math.cos(angle) * this.speed * dt;
        const ny = this.y + Math.sin(angle) * this.speed * dt;
        if (!map.checkCollision(nx, this.y, this.radius * 2, this.radius * 2)) this.x = nx;
        if (!map.checkCollision(this.x, ny, this.radius * 2, this.radius * 2)) this.y = ny;
    }

    takeDamage(amount) {
        this.hp -= amount;
        // Getting shot immediately triggers chase
        if (this.state === 'patrol' || this.state === 'alert') {
            this.state = 'chase';
        }
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    // React to nearby gunshots
    hearShot(shotX, shotY) {
        const dist = Math.hypot(shotX - this.x, shotY - this.y);
        if (dist < this.hearRange && this.state === 'patrol') {
            this.state = 'alert';
            this.alertTimer = 2.0;
            this.lastKnownPlayerX = shotX;
            this.lastKnownPlayerY = shotY;
        }
    }
}

// ============ RARITY SYSTEM ============
const RARITY = {
    common:    { name: '普通', color: '#aaaaaa', glow: 'rgba(170,170,170,', multiplier: 1,   particles: 5,  shake: 0 },
    uncommon:  { name: '优良', color: '#4caf50', glow: 'rgba(76,175,80,',  multiplier: 1.5, particles: 10, shake: 2 },
    rare:      { name: '稀有', color: '#2196f3', glow: 'rgba(33,150,243,', multiplier: 2.5, particles: 18, shake: 4 },
    epic:      { name: '史诗', color: '#9c27b0', glow: 'rgba(156,39,176,', multiplier: 4,   particles: 28, shake: 6 },
    legendary: { name: '传说', color: '#ff9800', glow: 'rgba(255,152,0,',  multiplier: 8,   particles: 40, shake: 10 }
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// Weighted random rarity selection
function rollRarity() {
    const roll = Math.random() * 100;
    if (roll < 2)  return 'legendary';
    if (roll < 10) return 'epic';
    if (roll < 30) return 'rare';
    if (roll < 60) return 'uncommon';
    return 'common';
}

// ============ LOOT ============
class Loot {
    constructor(x, y, type, rarity) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.rarity = rarity || rollRarity();
        this.collected = false;
        this.radius = 14;
    }

    getDisplayName() {
        const names = {
            medkit: '医疗包',
            ammo: '弹药箱',
            parts: '武器零件',
            valuable: '贵重物品',
            armor: '护甲板'
        };
        return names[this.type] || this.type;
    }

    getRarityInfo() {
        return RARITY[this.rarity] || RARITY.common;
    }

    getValue() {
        const baseValues = { medkit: 0, ammo: 0, parts: 150, valuable: 500, armor: 0 };
        const base = baseValues[this.type] || 0;
        return Math.round(base * this.getRarityInfo().multiplier);
    }
}

// ============ PARTICLE SYSTEM ============
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= dt;
    }

    draw(ctx, camera) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.fillRect(
            this.x - camera.x - this.size / 2,
            this.y - camera.y - this.size / 2,
            this.size, this.size
        );
    }
}

// ============ HEAL ZONE ============
class HealZone {
    constructor(x, y, radius, duration, healRate) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.healRate = healRate;
        this.active = true;
    }

    update(dt, player) {
        this.duration -= dt;
        if (this.duration <= 0) { this.active = false; return; }

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < this.radius) {
            player.hp = Math.min(player.maxHp, player.hp + this.healRate * dt);
        }
    }

    draw(ctx, camera) {
        if (!this.active) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const alpha = Math.min(1, this.duration / 1) * 0.3;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.radius);
        grad.addColorStop(0, `rgba(100,255,100,${alpha})`);
        grad.addColorStop(1, `rgba(100,255,100,0)`);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}
