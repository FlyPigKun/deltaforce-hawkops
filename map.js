// map.js - Map data, collision, room layout

const TILE_SIZE = 32;

// Tile types
const TILE = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    FLOOR_DARK: 3,
    DOOR: 4,
    COVER_LOW: 5,  // half-height cover
    RUBBLE: 6,
    SAND: 7,
    EXTRACTION: 8
};

const TILE_COLORS = {
    [TILE.EMPTY]: '#0a120a',
    [TILE.WALL]: '#3a3a2a',
    [TILE.FLOOR]: '#2a3a2a',
    [TILE.FLOOR_DARK]: '#1e2e1e',
    [TILE.DOOR]: '#4a3a20',
    [TILE.COVER_LOW]: '#4a4a3a',
    [TILE.RUBBLE]: '#3a3020',
    [TILE.SAND]: '#4a4030',
    [TILE.EXTRACTION]: '#1a3a1a'
};

const TILE_SOLID = {
    [TILE.EMPTY]: false,
    [TILE.WALL]: true,
    [TILE.FLOOR]: false,
    [TILE.FLOOR_DARK]: false,
    [TILE.DOOR]: false,
    [TILE.COVER_LOW]: true,
    [TILE.RUBBLE]: false,
    [TILE.SAND]: false,
    [TILE.EXTRACTION]: false
};

const GameMap = {
    width: 80,   // tiles
    height: 60,  // tiles
    tiles: [],
    lootSpawns: [],
    enemyPatrols: [],
    extractionPoints: [],
    playerSpawn: { x: 5, y: 30 },

    init() {
        this.generateMap();
        return this;
    },

    generateMap() {
        const W = this.width;
        const H = this.height;
        // Fill with sand
        this.tiles = [];
        for (let y = 0; y < H; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < W; x++) {
                this.tiles[y][x] = TILE.SAND;
            }
        }

        // Border walls
        for (let x = 0; x < W; x++) {
            this.tiles[0][x] = TILE.WALL;
            this.tiles[H - 1][x] = TILE.WALL;
        }
        for (let y = 0; y < H; y++) {
            this.tiles[y][0] = TILE.WALL;
            this.tiles[y][W - 1] = TILE.WALL;
        }

        // Generate buildings
        const buildings = [
            { x: 10, y: 8, w: 12, h: 10, name: 'Warehouse' },
            { x: 35, y: 5, w: 10, h: 8, name: 'Command Post' },
            { x: 55, y: 10, w: 14, h: 12, name: 'Barracks' },
            { x: 15, y: 30, w: 8, h: 8, name: 'Armory' },
            { x: 38, y: 25, w: 16, h: 14, name: 'Main Building' },
            { x: 60, y: 28, w: 10, h: 10, name: 'Comms Tower' },
            { x: 8, y: 45, w: 10, h: 8, name: 'Garage' },
            { x: 30, y: 45, w: 12, h: 10, name: 'Medical Bay' },
            { x: 55, y: 45, w: 10, h: 8, name: 'Supply Depot' },
        ];

        buildings.forEach(b => this.placeBuilding(b.x, b.y, b.w, b.h));

        // Scatter cover objects
        const coverPositions = [
            [7, 20], [12, 22], [25, 15], [30, 20], [45, 18],
            [50, 25], [65, 20], [70, 35], [20, 40], [40, 40],
            [50, 50], [25, 52], [68, 50], [15, 15], [48, 8],
            [33, 35], [58, 38], [42, 52], [10, 38], [72, 15],
        ];
        coverPositions.forEach(([cx, cy]) => {
            if (this.tiles[cy] && this.tiles[cy][cx] === TILE.SAND) {
                this.tiles[cy][cx] = TILE.COVER_LOW;
                if (Math.random() > 0.5 && this.tiles[cy][cx + 1] === TILE.SAND)
                    this.tiles[cy][cx + 1] = TILE.COVER_LOW;
            }
        });

        // Rubble patches
        for (let i = 0; i < 15; i++) {
            const rx = 2 + Math.floor(Math.random() * (W - 4));
            const ry = 2 + Math.floor(Math.random() * (H - 4));
            if (this.tiles[ry][rx] === TILE.SAND) {
                this.tiles[ry][rx] = TILE.RUBBLE;
            }
        }

        // Extraction points (map edges)
        this.extractionPoints = [
            { x: 75 * TILE_SIZE, y: 10 * TILE_SIZE, id: 'ALPHA' },
            { x: 75 * TILE_SIZE, y: 50 * TILE_SIZE, id: 'BRAVO' },
            { x: 40 * TILE_SIZE, y: 56 * TILE_SIZE, id: 'CHARLIE' },
        ];

        // Mark extraction tiles
        this.extractionPoints.forEach(ep => {
            const tx = Math.floor(ep.x / TILE_SIZE);
            const ty = Math.floor(ep.y / TILE_SIZE);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = tx + dx, ny = ty + dy;
                    if (ny >= 0 && ny < H && nx >= 0 && nx < W) {
                        this.tiles[ny][nx] = TILE.EXTRACTION;
                    }
                }
            }
        });

        // Player spawn
        this.playerSpawn = { x: 3 * TILE_SIZE, y: 30 * TILE_SIZE };

        // Loot spawns
        this.lootSpawns = [];
        const lootTypes = ['medkit', 'ammo', 'parts', 'valuable', 'armor'];
        // Place loot in buildings and around map
        buildings.forEach(b => {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const lx = (b.x + 1 + Math.floor(Math.random() * (b.w - 2))) * TILE_SIZE + TILE_SIZE / 2;
                const ly = (b.y + 1 + Math.floor(Math.random() * (b.h - 2))) * TILE_SIZE + TILE_SIZE / 2;
                this.lootSpawns.push({
                    x: lx, y: ly,
                    type: lootTypes[Math.floor(Math.random() * lootTypes.length)]
                });
            }
        });
        // Extra scattered loot
        for (let i = 0; i < 10; i++) {
            this.lootSpawns.push({
                x: (3 + Math.floor(Math.random() * (W - 6))) * TILE_SIZE,
                y: (3 + Math.floor(Math.random() * (H - 6))) * TILE_SIZE,
                type: lootTypes[Math.floor(Math.random() * lootTypes.length)]
            });
        }

        // Enemy patrol routes
        this.enemyPatrols = [
            { spawn: { x: 16 * TILE_SIZE, y: 12 * TILE_SIZE }, waypoints: [[16, 12], [20, 12], [20, 16], [16, 16]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 40 * TILE_SIZE, y: 8 * TILE_SIZE }, waypoints: [[40, 8], [43, 8], [43, 11], [40, 11]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 60 * TILE_SIZE, y: 15 * TILE_SIZE }, waypoints: [[60, 15], [66, 15], [66, 20], [60, 20]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 18 * TILE_SIZE, y: 33 * TILE_SIZE }, waypoints: [[18, 33], [21, 33], [21, 36], [18, 36]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 44 * TILE_SIZE, y: 28 * TILE_SIZE }, waypoints: [[44, 28], [50, 28], [50, 35], [44, 35]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 63 * TILE_SIZE, y: 32 * TILE_SIZE }, waypoints: [[63, 32], [67, 32], [67, 35], [63, 35]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 12 * TILE_SIZE, y: 48 * TILE_SIZE }, waypoints: [[12, 48], [16, 48], [16, 51], [12, 51]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 35 * TILE_SIZE, y: 48 * TILE_SIZE }, waypoints: [[35, 48], [40, 48], [40, 53], [35, 53]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 58 * TILE_SIZE, y: 48 * TILE_SIZE }, waypoints: [[58, 48], [63, 48], [63, 51], [58, 51]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
            { spawn: { x: 30 * TILE_SIZE, y: 20 * TILE_SIZE }, waypoints: [[30, 20], [35, 15], [40, 20], [35, 25]].map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE })) },
        ];
    },

    placeBuilding(bx, by, bw, bh) {
        // Walls
        for (let x = bx; x < bx + bw; x++) {
            if (this.tiles[by]) this.tiles[by][x] = TILE.WALL;
            if (this.tiles[by + bh - 1]) this.tiles[by + bh - 1][x] = TILE.WALL;
        }
        for (let y = by; y < by + bh; y++) {
            if (this.tiles[y]) {
                this.tiles[y][bx] = TILE.WALL;
                this.tiles[y][bx + bw - 1] = TILE.WALL;
            }
        }
        // Floor inside
        for (let y = by + 1; y < by + bh - 1; y++) {
            for (let x = bx + 1; x < bx + bw - 1; x++) {
                if (this.tiles[y]) {
                    this.tiles[y][x] = ((x + y) % 3 === 0) ? TILE.FLOOR_DARK : TILE.FLOOR;
                }
            }
        }
        // Doors (2 per building)
        const doorY = by + Math.floor(bh / 2);
        if (this.tiles[doorY]) {
            this.tiles[doorY][bx] = TILE.DOOR;
            this.tiles[doorY][bx + bw - 1] = TILE.DOOR;
        }
        const doorX = bx + Math.floor(bw / 2);
        if (this.tiles[by]) this.tiles[by][doorX] = TILE.DOOR;
        if (this.tiles[by + bh - 1]) this.tiles[by + bh - 1][doorX] = TILE.DOOR;
    },

    isSolid(worldX, worldY) {
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return true;
        return TILE_SOLID[this.tiles[ty][tx]] || false;
    },

    getTile(worldX, worldY) {
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return TILE.WALL;
        return this.tiles[ty][tx];
    },

    // Check rect collision with walls
    checkCollision(x, y, w, h) {
        const corners = [
            [x - w / 2, y - h / 2],
            [x + w / 2, y - h / 2],
            [x - w / 2, y + h / 2],
            [x + w / 2, y + h / 2]
        ];
        return corners.some(([cx, cy]) => this.isSolid(cx, cy));
    },

    // Raycast for line of sight
    raycast(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / (TILE_SIZE / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = x1 + dx * t;
            const cy = y1 + dy * t;
            if (this.isSolid(cx, cy)) return false;
        }
        return true;
    },

    // Draw map tiles
    render(ctx, camera) {
        const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
        const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
        const endX = Math.min(this.width, Math.ceil((camera.x + camera.w) / TILE_SIZE) + 1);
        const endY = Math.min(this.height, Math.ceil((camera.y + camera.h) / TILE_SIZE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                const sx = x * TILE_SIZE - camera.x;
                const sy = y * TILE_SIZE - camera.y;

                ctx.fillStyle = TILE_COLORS[tile] || '#000';
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

                // Wall top shade
                if (tile === TILE.WALL) {
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(sx, sy + TILE_SIZE - 4, TILE_SIZE, 4);
                    // Brick pattern
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
                    ctx.strokeRect(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
                }

                // Door highlight
                if (tile === TILE.DOOR) {
                    ctx.fillStyle = 'rgba(200,150,50,0.3)';
                    ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                // Cover pattern
                if (tile === TILE.COVER_LOW) {
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                // Subtle grid
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
        }
    },

    // Render minimap
    renderMinimap(ctx, x, y, w, h, playerX, playerY, enemies, extractionPoints) {
        const scaleX = w / (this.width * TILE_SIZE);
        const scaleY = h / (this.height * TILE_SIZE);

        ctx.save();
        ctx.translate(x, y);

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);

        // Tiles (simplified)
        for (let ty = 0; ty < this.height; ty += 2) {
            for (let tx = 0; tx < this.width; tx += 2) {
                const tile = this.tiles[ty][tx];
                if (tile === TILE.WALL || tile === TILE.COVER_LOW) {
                    ctx.fillStyle = tile === TILE.WALL ? '#555' : '#444';
                    ctx.fillRect(tx * TILE_SIZE * scaleX, ty * TILE_SIZE * scaleY, TILE_SIZE * 2 * scaleX, TILE_SIZE * 2 * scaleY);
                } else if (tile === TILE.FLOOR || tile === TILE.FLOOR_DARK) {
                    ctx.fillStyle = '#2a3a2a';
                    ctx.fillRect(tx * TILE_SIZE * scaleX, ty * TILE_SIZE * scaleY, TILE_SIZE * 2 * scaleX, TILE_SIZE * 2 * scaleY);
                }
            }
        }

        // Extraction points
        extractionPoints.forEach(ep => {
            ctx.fillStyle = '#00ff66';
            ctx.beginPath();
            ctx.arc(ep.x * scaleX, ep.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Enemies (only if detected)
        enemies.forEach(e => {
            if (e.detected) {
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(e.x * scaleX, e.y * scaleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Player
        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.arc(playerX * scaleX, playerY * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#3d5c3d';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        ctx.restore();
    }
};
