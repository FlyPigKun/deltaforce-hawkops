// game.js - Main game loop, rendering, input, camera

const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,

    // Game state
    state: 'menu', // menu, playing, inventory, extracting, gameover, victory
    selectedOperator: 'assault',

    // Entities
    player: null,
    enemies: [],
    lootItems: [],
    bullets: [],
    particles: [],
    healZones: [],

    // Camera
    camera: { x: 0, y: 0, w: 0, h: 0 },

    // Input
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    mouseWorld: { x: 0, y: 0 },

    // Extraction
    extractionTimer: 0,
    extractionActive: false,
    currentExtraction: null,
    extractionDuration: 5.0,

    // Weather
    weather: 'clear', // clear, rain, sandstorm
    weatherTimer: 0,
    weatherParticles: [],
    weatherIntensity: 0,

    // Fog of war
    explored: null,

    // Time
    lastTime: 0,
    gameTime: 0,

    // Kill count
    kills: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input listeners
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'e') this.handleInteract();
            if (e.key.toLowerCase() === 'r') this.handleReload();
            if (e.key.toLowerCase() === 'q') this.handleSkill();
            if (e.key.toLowerCase() === 'tab') { e.preventDefault(); this.toggleInventory(); }
            if (e.key === 'Escape') this.handleEscape();
        });
        window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', e => {
            if (e.button === 0) this.mouse.down = true;
        });
        this.canvas.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.down = false;
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Hide cursor in game
        this.canvas.style.cursor = 'none';

        this.showMenu();
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.camera.w = this.width;
        this.camera.h = this.height;
    },

    showMenu() {
        this.state = 'menu';
        document.getElementById('menuScreen').style.display = 'flex';
        document.getElementById('gameHUD').style.display = 'none';
        document.getElementById('inventoryPanel').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('victoryScreen').style.display = 'none';
        this.canvas.style.cursor = 'default';
    },

    startGame() {
        document.getElementById('menuScreen').style.display = 'none';
        document.getElementById('gameHUD').style.display = 'block';
        this.canvas.style.cursor = 'none';
        this.state = 'playing';

        // Init map
        GameMap.init();

        // Init player
        this.player = new Player(GameMap.playerSpawn.x, GameMap.playerSpawn.y, this.selectedOperator);

        // Init enemies
        this.enemies = GameMap.enemyPatrols.map(ep =>
            new Enemy(ep.spawn.x, ep.spawn.y, ep.waypoints)
        );

        // Init loot
        this.lootItems = GameMap.lootSpawns.map(ls => new Loot(ls.x, ls.y, ls.type));

        // Reset
        this.bullets = [];
        this.particles = [];
        this.healZones = [];
        this.kills = 0;
        this.gameTime = 0;
        this.extractionActive = false;
        this.extractionTimer = 0;

        // Weather
        this.weather = 'clear';
        this.weatherTimer = 30 + Math.random() * 30;

        // Fog of war grid
        this.explored = [];
        for (let y = 0; y < GameMap.height; y++) {
            this.explored[y] = [];
            for (let x = 0; x < GameMap.width; x++) {
                this.explored[y][x] = false;
            }
        }
    },

    loop(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        if (this.state === 'playing' || this.state === 'extracting') {
            this.update(dt);
        }
        this.render();
        requestAnimationFrame(t => this.loop(t));
    },

    update(dt) {
        this.gameTime += dt;

        // Mouse world position
        this.mouseWorld.x = this.mouse.x + this.camera.x;
        this.mouseWorld.y = this.mouse.y + this.camera.y;

        // Player angle toward mouse
        const mouseAngle = Math.atan2(
            this.mouseWorld.y - this.player.y,
            this.mouseWorld.x - this.player.x
        );

        // Update player
        this.player.update(dt, this.keys, mouseAngle, GameMap);

        // Shooting
        if (this.mouse.down && this.state === 'playing') {
            const bullet = this.player.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                // Muzzle flash particles
                for (let i = 0; i < 3; i++) {
                    const a = this.player.angle + (Math.random() - 0.5) * 0.5;
                    this.particles.push(new Particle(
                        bullet.x, bullet.y,
                        Math.cos(a) * (100 + Math.random() * 100),
                        Math.sin(a) * (100 + Math.random() * 100),
                        0.15 + Math.random() * 0.1,
                        'rgba(255,200,50,1)',
                        2 + Math.random() * 2
                    ));
                }
                // Shell casing
                const shellAngle = this.player.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                this.particles.push(new Particle(
                    this.player.x, this.player.y,
                    Math.cos(shellAngle) * 80,
                    Math.sin(shellAngle) * 80 - 30,
                    0.5, 'rgba(200,180,50,1)', 3
                ));
                // Alert nearby enemies
                this.enemies.forEach(e => { if (e.alive) e.hearShot(this.player.x, this.player.y); });
            }
        }

        // Update bullets
        this.bullets.forEach(b => {
            b.x += Math.cos(b.angle) * b.speed * dt;
            b.y += Math.sin(b.angle) * b.speed * dt;
            b.life -= dt;

            // Wall collision
            if (GameMap.isSolid(b.x, b.y)) {
                b.life = 0;
                // Spark particles
                for (let i = 0; i < 3; i++) {
                    this.particles.push(new Particle(
                        b.x, b.y,
                        (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100,
                        0.2, 'rgba(255,200,100,1)', 2
                    ));
                }
            }

            // Hit detection
            if (b.owner === 'player') {
                this.enemies.forEach(e => {
                    if (!e.alive) return;
                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 4) {
                        e.takeDamage(b.damage);
                        b.life = 0;
                        if (!e.alive) this.kills++;
                        // Blood particles
                        for (let i = 0; i < 5; i++) {
                            this.particles.push(new Particle(
                                e.x, e.y,
                                (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80,
                                0.4, 'rgba(180,30,30,1)', 3
                            ));
                        }
                    }
                });
            } else if (b.owner === 'enemy') {
                if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.radius + 4) {
                    this.player.takeDamage(b.damage);
                    b.life = 0;
                    // Blood
                    for (let i = 0; i < 3; i++) {
                        this.particles.push(new Particle(
                            this.player.x, this.player.y,
                            (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60,
                            0.3, 'rgba(180,30,30,1)', 3
                        ));
                    }
                }
            }
        });
        this.bullets = this.bullets.filter(b => b.life > 0);

        // Update enemies
        this.enemies.forEach(e => {
            if (e.alive) e.update(dt, this.player, GameMap, this.bullets);
        });

        // Mine check
        this.player.mines.forEach(mine => {
            if (!mine.active) return;
            this.enemies.forEach(e => {
                if (!e.alive) return;
                if (Math.hypot(e.x - mine.x, e.y - mine.y) < mine.radius) {
                    if (!mine.triggered) {
                        mine.triggered = true;
                        mine.triggerTimer = 0.5;
                    }
                }
            });
            if (mine.triggered) {
                mine.triggerTimer -= dt;
                if (mine.triggerTimer <= 0) {
                    // Explode
                    mine.active = false;
                    this.enemies.forEach(e => {
                        if (!e.alive) return;
                        if (Math.hypot(e.x - mine.x, e.y - mine.y) < mine.radius) {
                            e.takeDamage(mine.damage);
                            if (!e.alive) this.kills++;
                        }
                    });
                    // Explosion particles
                    for (let i = 0; i < 20; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const sp = 50 + Math.random() * 150;
                        this.particles.push(new Particle(
                            mine.x, mine.y,
                            Math.cos(a) * sp, Math.sin(a) * sp,
                            0.5, 'rgba(255,150,50,1)', 4
                        ));
                    }
                }
            }
        });

        // Update heal zones
        this.healZones.forEach(hz => hz.update(dt, this.player));
        this.healZones = this.healZones.filter(hz => hz.active);

        // Update particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);

        // Camera follow
        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = this.player.y - this.height / 2;
        this.camera.x = Math.max(0, Math.min(GameMap.width * TILE_SIZE - this.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(GameMap.height * TILE_SIZE - this.height, this.camera.y));

        // Update fog of war (explore around player)
        const ptx = Math.floor(this.player.x / TILE_SIZE);
        const pty = Math.floor(this.player.y / TILE_SIZE);
        const viewRadius = this.getViewRadius();
        const tileRadius = Math.ceil(viewRadius / TILE_SIZE);
        for (let dy = -tileRadius; dy <= tileRadius; dy++) {
            for (let dx = -tileRadius; dx <= tileRadius; dx++) {
                const ty = pty + dy, tx = ptx + dx;
                if (ty >= 0 && ty < GameMap.height && tx >= 0 && tx < GameMap.width) {
                    if (dx * dx + dy * dy <= tileRadius * tileRadius) {
                        this.explored[ty][tx] = true;
                    }
                }
            }
        }

        // Extraction check
        if (this.state === 'extracting') {
            this.extractionTimer -= dt;
            if (this.extractionTimer <= 0) {
                this.victory();
            }
            // Check if still in zone
            const dist = Math.hypot(this.player.x - this.currentExtraction.x, this.player.y - this.currentExtraction.y);
            if (dist > 40) {
                this.state = 'playing';
                this.extractionActive = false;
            }
        }

        // Weather update
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
            const weathers = ['clear', 'rain', 'sandstorm'];
            this.weather = weathers[Math.floor(Math.random() * weathers.length)];
            this.weatherTimer = 20 + Math.random() * 40;
            this.weatherIntensity = 0;
        }
        if (this.weather !== 'clear') {
            this.weatherIntensity = Math.min(1, this.weatherIntensity + dt * 0.3);
        } else {
            this.weatherIntensity = Math.max(0, this.weatherIntensity - dt * 0.5);
        }

        // Player death
        if (!this.player.alive) {
            this.gameOver();
        }
    },

    getViewRadius() {
        let r = 300;
        if (this.weather === 'sandstorm') r = 180;
        if (this.weather === 'rain') r = 240;
        return r;
    },

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a120a';
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'menu') return;
        if (this.state === 'gameover' || this.state === 'victory') {
            // Still render the game behind
        }
        if (!this.player) return;

        // Draw map
        GameMap.render(ctx, this.camera);

        // Draw heal zones
        this.healZones.forEach(hz => hz.draw(ctx, this.camera));

        // Draw mines
        this.player.mines.forEach(mine => {
            if (!mine.active) return;
            const sx = mine.x - this.camera.x;
            const sy = mine.y - this.camera.y;
            ctx.save();
            ctx.beginPath();
            ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            ctx.fillStyle = mine.triggered ? '#ff4400' : '#888';
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (mine.triggered) {
                ctx.beginPath();
                ctx.arc(sx, sy, mine.radius * (1 - mine.triggerTimer / 0.5), 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,100,0,0.5)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();
        });

        // Draw loot
        this.lootItems.forEach(loot => {
            if (loot.collected) return;
            const sx = loot.x - this.camera.x;
            const sy = loot.y - this.camera.y;
            if (sx < -50 || sx > this.width + 50 || sy < -50 || sy > this.height + 50) return;
            SVG.drawLoot(ctx, sx, sy, loot.type);
        });

        // Draw extraction points
        GameMap.extractionPoints.forEach(ep => {
            const sx = ep.x - this.camera.x;
            const sy = ep.y - this.camera.y;
            if (sx < -100 || sx > this.width + 100 || sy < -100 || sy > this.height + 100) return;
            const isActive = this.currentExtraction === ep && this.state === 'extracting';
            SVG.drawExtractionPoint(ctx, sx, sy, isActive, isActive ? this.extractionTimer : 0);
        });

        // Draw enemies
        this.enemies.forEach(e => {
            if (!e.alive) return;
            const sx = e.x - this.camera.x;
            const sy = e.y - this.camera.y;
            if (sx < -50 || sx > this.width + 50 || sy < -50 || sy > this.height + 50) return;
            SVG.drawEnemy(ctx, sx, sy, e.angle, e.state);
            // Health bar
            if (e.hp < e.maxHp) {
                SVG.drawBar(ctx, sx - 15, sy - 22, 30, 4, e.hp, e.maxHp, '#cc3333');
            }
        });

        // Draw bullets
        this.bullets.forEach(b => {
            const sx = b.x - this.camera.x;
            const sy = b.y - this.camera.y;
            ctx.fillStyle = b.owner === 'player' ? '#ffdd66' : '#ff6644';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw player
        if (this.player.alive) {
            const psx = this.player.x - this.camera.x;
            const psy = this.player.y - this.camera.y;
            SVG.drawOperator(ctx, psx, psy, this.player.angle, this.player.operatorClass);

            // Muzzle flash
            if (this.player.muzzleFlash > 0) {
                SVG.drawMuzzleFlash(ctx, psx, psy, this.player.angle);
            }
        }

        // Draw particles
        this.particles.forEach(p => p.draw(ctx, this.camera));

        // Vision cone / fog of war
        this.renderFog(ctx);

        // Weather effects
        this.renderWeather(ctx);

        // Interaction prompts
        this.renderPrompts(ctx);

        // HUD
        this.renderHUD(ctx);

        // Minimap
        GameMap.renderMinimap(
            ctx,
            this.width - 170, 10, 160, 120,
            this.player.x, this.player.y,
            this.enemies,
            GameMap.extractionPoints
        );

        // Crosshair
        if (this.state === 'playing' || this.state === 'extracting') {
            SVG.drawCrosshair(ctx, this.mouse.x, this.mouse.y);
        }
    },

    renderFog(ctx) {
        if (!this.explored) return;
        const viewRadius = this.getViewRadius();

        // Dark overlay with vision circle cut out
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Draw explored but not visible area (dim)
        const startX = Math.max(0, Math.floor(this.camera.x / TILE_SIZE));
        const startY = Math.max(0, Math.floor(this.camera.y / TILE_SIZE));
        const endX = Math.min(GameMap.width, Math.ceil((this.camera.x + this.camera.w) / TILE_SIZE) + 1);
        const endY = Math.min(GameMap.height, Math.ceil((this.camera.y + this.camera.h) / TILE_SIZE) + 1);

        for (let ty = startY; ty < endY; ty++) {
            for (let tx = startX; tx < endX; tx++) {
                const sx = tx * TILE_SIZE - this.camera.x;
                const sy = ty * TILE_SIZE - this.camera.y;
                const worldCX = tx * TILE_SIZE + TILE_SIZE / 2;
                const worldCY = ty * TILE_SIZE + TILE_SIZE / 2;
                const dist = Math.hypot(worldCX - this.player.x, worldCY - this.player.y);

                if (!this.explored[ty][tx]) {
                    // Unexplored - full black
                    ctx.fillStyle = 'rgba(0,0,0,0.9)';
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                } else if (dist > viewRadius) {
                    // Explored but not in view
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                } else if (dist > viewRadius * 0.7) {
                    // Edge of vision
                    const fade = (dist - viewRadius * 0.7) / (viewRadius * 0.3);
                    ctx.fillStyle = `rgba(0,0,0,${fade * 0.5})`;
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        ctx.restore();
    },

    renderWeather(ctx) {
        if (this.weatherIntensity <= 0) return;

        if (this.weather === 'rain') {
            const count = Math.floor(this.weatherIntensity * 80);
            for (let i = 0; i < count; i++) {
                const rx = Math.random() * this.width;
                const ry = Math.random() * this.height;
                SVG.drawRainDrop(ctx, rx, ry);
            }
        } else if (this.weather === 'sandstorm') {
            SVG.drawSandstorm(ctx, this.width, this.height, this.weatherIntensity);
            // Sand particles
            ctx.fillStyle = `rgba(180,150,80,${this.weatherIntensity * 0.1})`;
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                ctx.fillRect(x, y, 2 + Math.random() * 3, 1);
            }
        }

        // Weather indicator
        if (this.weather !== 'clear') {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            const weatherNames = { rain: '雨天 - 视野降低', sandstorm: '沙尘暴 - 视野大幅降低' };
            ctx.fillText(weatherNames[this.weather], this.width / 2, 30);
        }
    },

    renderPrompts(ctx) {
        if (!this.player.alive) return;

        // Loot pickup prompt
        const nearLoot = this.lootItems.find(l =>
            !l.collected && Math.hypot(l.x - this.player.x, l.y - this.player.y) < 40
        );
        if (nearLoot) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(this.width / 2 - 80, this.height / 2 + 40, 160, 30);
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[E] 拾取 ${nearLoot.getDisplayName()}`, this.width / 2, this.height / 2 + 60);
        }

        // Extraction prompt
        const nearExtract = GameMap.extractionPoints.find(ep =>
            Math.hypot(ep.x - this.player.x, ep.y - this.player.y) < 40
        );
        if (nearExtract && this.state !== 'extracting') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(this.width / 2 - 80, this.height / 2 + 75, 160, 30);
            ctx.fillStyle = '#00ff66';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] 开始撤离', this.width / 2, this.height / 2 + 95);
        }
    },

    renderHUD(ctx) {
        if (!this.player) return;

        const p = this.player;

        // Health bar - bottom left
        const barX = 20, barY = this.height - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 5, barY - 25, 220, 80);

        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HP', barX, barY - 5);
        SVG.drawBar(ctx, barX + 25, barY - 15, 180, 14, p.hp, p.maxHp, '#44aa44');
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText(`${Math.ceil(p.hp)}/${p.maxHp}`, barX + 80, barY - 3);

        ctx.fillStyle = '#aaa';
        ctx.fillText('AP', barX, barY + 18);
        SVG.drawBar(ctx, barX + 25, barY + 8, 180, 14, p.armor, p.maxArmor, '#4477cc');
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.ceil(p.armor)}/${p.maxArmor}`, barX + 80, barY + 20);

        // Operator class
        ctx.fillStyle = SVG.operatorColors[p.operatorClass].accent;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(p.operatorClass.toUpperCase(), barX, barY + 45);

        // Weapon & ammo - bottom right
        const ammoX = this.width - 200, ammoY = this.height - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(ammoX - 10, ammoY - 25, 200, 70);

        ctx.fillStyle = '#c4a960';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(p.weaponName, this.width - 20, ammoY - 5);

        ctx.fillStyle = p.ammo <= 5 ? '#ff4444' : '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${p.ammo}`, this.width - 70, ammoY + 25);
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText(`/ ${p.totalAmmo}`, this.width - 20, ammoY + 25);

        if (p.reloading) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('换弹中...', this.width - 100, ammoY + 42);
            SVG.drawBar(ctx, ammoX, ammoY + 46, 180, 4, p.reloadTime - p.reloadTimer, p.reloadTime, '#ffaa00');
        }

        // Skill - bottom center
        const skillX = this.width / 2, skillY = this.height - 45;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(skillX - 50, skillY - 20, 100, 40);

        ctx.textAlign = 'center';
        if (p.skillCooldown > 0) {
            ctx.fillStyle = '#666';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`[Q] ${p.skillCooldown.toFixed(1)}s`, skillX, skillY + 5);
        } else {
            ctx.fillStyle = '#00ff66';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`[Q] ${p.skillName}`, skillX, skillY + 5);
        }

        // Kill count & time
        ctx.fillStyle = '#aaa';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`击杀: ${this.kills}`, 20, 30);
        const mins = Math.floor(this.gameTime / 60);
        const secs = Math.floor(this.gameTime % 60);
        ctx.fillText(`时间: ${mins}:${secs.toString().padStart(2, '0')}`, 20, 48);

        // Inventory count
        ctx.fillText(`背包: ${p.inventory.length}/${p.maxInventory} [Tab]`, 20, 66);
        if (p.getInventoryValue() > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`价值: $${p.getInventoryValue()}`, 20, 84);
        }

        // Controls hint
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WASD移动 | 鼠标瞄准射击 | R换弹 | Q技能 | E交互 | Tab背包', this.width / 2, this.height - 8);
    },

    handleInteract() {
        if (this.state !== 'playing' || !this.player.alive) return;

        // Check loot
        const nearLoot = this.lootItems.find(l =>
            !l.collected && Math.hypot(l.x - this.player.x, l.y - this.player.y) < 40
        );
        if (nearLoot) {
            if (this.player.addItem(nearLoot)) {
                nearLoot.collected = true;
            }
            return;
        }

        // Check extraction
        const nearExtract = GameMap.extractionPoints.find(ep =>
            Math.hypot(ep.x - this.player.x, ep.y - this.player.y) < 40
        );
        if (nearExtract) {
            this.state = 'extracting';
            this.extractionActive = true;
            this.extractionTimer = this.extractionDuration;
            this.currentExtraction = nearExtract;
        }
    },

    handleReload() {
        if (this.player && this.player.alive) {
            this.player.reload();
        }
    },

    handleSkill() {
        if (!this.player || !this.player.alive || this.state !== 'playing') return;
        const result = this.player.useSkill(this.enemies);
        if (result) {
            if (result.type === 'heal_zone') {
                this.healZones.push(new HealZone(result.x, result.y, result.radius, result.duration, result.healRate));
            }
            if (result.type === 'scan') {
                // Visual pulse effect
                for (let i = 0; i < 30; i++) {
                    const a = (i / 30) * Math.PI * 2;
                    this.particles.push(new Particle(
                        this.player.x + Math.cos(a) * 20,
                        this.player.y + Math.sin(a) * 20,
                        Math.cos(a) * 200, Math.sin(a) * 200,
                        0.5, 'rgba(100,180,255,1)', 3
                    ));
                }
            }
        }
    },

    toggleInventory() {
        const panel = document.getElementById('inventoryPanel');
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
            this.updateInventoryUI();
        }
    },

    updateInventoryUI() {
        const grid = document.getElementById('inventoryGrid');
        grid.innerHTML = '';
        const names = { parts: '武器零件', valuable: '贵重物品' };
        const colors = { parts: '#888', valuable: '#ffd700' };

        for (let i = 0; i < this.player.maxInventory; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            if (this.player.inventory[i]) {
                const item = this.player.inventory[i];
                slot.innerHTML = `<span style="color:${colors[item.type] || '#aaa'}">${names[item.type] || item.type}</span>`;
                slot.classList.add('inv-filled');
            }
            grid.appendChild(slot);
        }

        document.getElementById('invValue').textContent = `$${this.player.getInventoryValue()}`;
    },

    handleEscape() {
        if (document.getElementById('inventoryPanel').style.display === 'block') {
            document.getElementById('inventoryPanel').style.display = 'none';
        }
    },

    gameOver() {
        this.state = 'gameover';
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('deathKills').textContent = this.kills;
        document.getElementById('deathTime').textContent =
            `${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}`;
        this.canvas.style.cursor = 'default';
    },

    victory() {
        this.state = 'victory';
        document.getElementById('victoryScreen').style.display = 'flex';
        document.getElementById('vicKills').textContent = this.kills;
        document.getElementById('vicTime').textContent =
            `${Math.floor(this.gameTime / 60)}:${Math.floor(this.gameTime % 60).toString().padStart(2, '0')}`;
        document.getElementById('vicLoot').textContent = `$${this.player.getInventoryValue()}`;
        document.getElementById('vicItems').textContent = this.player.inventory.length;
        this.canvas.style.cursor = 'default';
    },

    selectOperator(cls) {
        this.selectedOperator = cls;
        document.querySelectorAll('.op-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`.op-card[data-class="${cls}"]`)?.classList.add('selected');
    }
};
