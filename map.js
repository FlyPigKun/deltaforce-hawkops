// map.js - Map data, collision, room layout

const TILE_SIZE = 32;

// Tile types
const TILE = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    FLOOR_DARK: 3,
    DOOR: 4,
    COVER_LOW: 5,
    RUBBLE: 6,
    SAND: 7,
    EXTRACTION: 8,
    WATER: 9,
    SNOW: 10
};

// Default colors (overridden per map theme)
let TILE_COLORS = {};

const TILE_SOLID = {
    [TILE.EMPTY]: false,
    [TILE.WALL]: true,
    [TILE.FLOOR]: false,
    [TILE.FLOOR_DARK]: false,
    [TILE.DOOR]: false,
    [TILE.COVER_LOW]: true,
    [TILE.RUBBLE]: false,
    [TILE.SAND]: false,
    [TILE.EXTRACTION]: false,
    [TILE.WATER]: true,
    [TILE.SNOW]: false
};

// ========== MAP DEFINITIONS ==========
const MAP_DEFS = {
    desert: {
        id: 'desert',
        name: '荒漠前哨',
        desc: '沙漠中的军事据点，建筑分散',
        difficulty: '普通',
        size: { w: 80, h: 60 },
        groundTile: TILE.SAND,
        theme: {
            [TILE.EMPTY]: '#0a120a',
            [TILE.WALL]: '#3a3a2a',
            [TILE.FLOOR]: '#2a3a2a',
            [TILE.FLOOR_DARK]: '#1e2e1e',
            [TILE.DOOR]: '#4a3a20',
            [TILE.COVER_LOW]: '#4a4a3a',
            [TILE.RUBBLE]: '#3a3020',
            [TILE.SAND]: '#4a4030',
            [TILE.EXTRACTION]: '#1a3a1a',
            [TILE.WATER]: '#1a2a3a',
            [TILE.SNOW]: '#4a4030'
        },
        buildings: [
            { x: 10, y: 8, w: 12, h: 10 },
            { x: 35, y: 5, w: 10, h: 8 },
            { x: 55, y: 10, w: 14, h: 12 },
            { x: 15, y: 30, w: 8, h: 8 },
            { x: 38, y: 25, w: 16, h: 14 },
            { x: 60, y: 28, w: 10, h: 10 },
            { x: 8, y: 45, w: 10, h: 8 },
            { x: 30, y: 45, w: 12, h: 10 },
            { x: 55, y: 45, w: 10, h: 8 },
        ],
        coverPositions: [
            [7,20],[12,22],[25,15],[30,20],[45,18],
            [50,25],[65,20],[70,35],[20,40],[40,40],
            [50,50],[25,52],[68,50],[15,15],[48,8],
            [33,35],[58,38],[42,52],[10,38],[72,15],
        ],
        extractionCandidates: [
            { x: 75, y: 10 }, { x: 75, y: 50 }, { x: 40, y: 56 },
            { x: 3, y: 10 }, { x: 3, y: 50 }, { x: 60, y: 3 },
        ],
        playerSpawn: { x: 3, y: 30 },
        enemyPatrols: [
            { spawn: [16,12], wp: [[16,12],[20,12],[20,16],[16,16]] },
            { spawn: [40,8],  wp: [[40,8],[43,8],[43,11],[40,11]] },
            { spawn: [60,15], wp: [[60,15],[66,15],[66,20],[60,20]] },
            { spawn: [18,33], wp: [[18,33],[21,33],[21,36],[18,36]] },
            { spawn: [44,28], wp: [[44,28],[50,28],[50,35],[44,35]] },
            { spawn: [63,32], wp: [[63,32],[67,32],[67,35],[63,35]] },
            { spawn: [12,48], wp: [[12,48],[16,48],[16,51],[12,51]] },
            { spawn: [35,48], wp: [[35,48],[40,48],[40,53],[35,53]] },
            { spawn: [58,48], wp: [[58,48],[63,48],[63,51],[58,51]] },
            { spawn: [30,20], wp: [[30,20],[35,15],[40,20],[35,25]] },
        ]
    },

    alpine: {
        id: 'alpine',
        name: '雪山基地',
        desc: '冰雪覆盖的山地基地，建筑密集',
        difficulty: '困难',
        size: { w: 70, h: 55 },
        groundTile: TILE.SNOW,
        theme: {
            [TILE.EMPTY]: '#0a0f15',
            [TILE.WALL]: '#3a4050',
            [TILE.FLOOR]: '#2a3040',
            [TILE.FLOOR_DARK]: '#1e2530',
            [TILE.DOOR]: '#3a3a4a',
            [TILE.COVER_LOW]: '#4a5060',
            [TILE.RUBBLE]: '#353a40',
            [TILE.SAND]: '#4a4030',
            [TILE.EXTRACTION]: '#1a2a3a',
            [TILE.WATER]: '#1a2535',
            [TILE.SNOW]: '#5a6070'
        },
        buildings: [
            { x: 8, y: 5, w: 10, h: 8 },
            { x: 25, y: 4, w: 14, h: 10 },
            { x: 48, y: 6, w: 12, h: 10 },
            { x: 10, y: 20, w: 10, h: 10 },
            { x: 28, y: 18, w: 18, h: 16 },
            { x: 52, y: 20, w: 10, h: 8 },
            { x: 6, y: 38, w: 12, h: 10 },
            { x: 25, y: 38, w: 10, h: 8 },
            { x: 42, y: 35, w: 14, h: 12 },
            { x: 58, y: 40, w: 8, h: 8 },
        ],
        coverPositions: [
            [5,15],[15,14],[22,12],[35,10],[45,15],
            [55,14],[62,25],[8,30],[20,30],[40,28],
            [50,30],[30,48],[45,48],[15,48],[60,48],
            [38,42],[10,42],[55,35],[25,25],[65,10],
        ],
        extractionCandidates: [
            { x: 66, y: 8 }, { x: 66, y: 48 }, { x: 35, y: 51 },
            { x: 3, y: 8 }, { x: 3, y: 45 }, { x: 50, y: 3 },
        ],
        playerSpawn: { x: 3, y: 28 },
        enemyPatrols: [
            { spawn: [13,9],  wp: [[13,9],[17,9],[17,13],[13,13]] },
            { spawn: [32,8],  wp: [[32,8],[36,8],[36,12],[32,12]] },
            { spawn: [53,10], wp: [[53,10],[58,10],[58,14],[53,14]] },
            { spawn: [14,24], wp: [[14,24],[18,24],[18,28],[14,28]] },
            { spawn: [35,22], wp: [[35,22],[42,22],[42,30],[35,30]] },
            { spawn: [55,24], wp: [[55,24],[60,24],[60,26],[55,26]] },
            { spawn: [11,42], wp: [[11,42],[16,42],[16,46],[11,46]] },
            { spawn: [30,42], wp: [[30,42],[33,42],[33,44],[30,44]] },
            { spawn: [48,40], wp: [[48,40],[54,40],[54,45],[48,45]] },
            { spawn: [61,44], wp: [[61,44],[64,44],[64,46],[61,46]] },
            { spawn: [25,30], wp: [[25,30],[30,25],[35,30],[30,35]] },
        ]
    },

    harbor: {
        id: 'harbor',
        name: '港口废墟',
        desc: '废弃港口，开阔地带+水域障碍',
        difficulty: '专家',
        size: { w: 85, h: 65 },
        groundTile: TILE.SAND,
        theme: {
            [TILE.EMPTY]: '#080e12',
            [TILE.WALL]: '#2a3038',
            [TILE.FLOOR]: '#222a30',
            [TILE.FLOOR_DARK]: '#1a2028',
            [TILE.DOOR]: '#3a3a30',
            [TILE.COVER_LOW]: '#3a4048',
            [TILE.RUBBLE]: '#2a2a28',
            [TILE.SAND]: '#3a3830',
            [TILE.EXTRACTION]: '#1a2a2a',
            [TILE.WATER]: '#0e1a2a',
            [TILE.SNOW]: '#3a3830'
        },
        buildings: [
            { x: 10, y: 5, w: 14, h: 10 },
            { x: 35, y: 3, w: 10, h: 8 },
            { x: 60, y: 5, w: 16, h: 12 },
            { x: 8, y: 25, w: 10, h: 10 },
            { x: 30, y: 22, w: 12, h: 10 },
            { x: 55, y: 25, w: 14, h: 12 },
            { x: 12, y: 45, w: 10, h: 8 },
            { x: 35, y: 42, w: 16, h: 14 },
            { x: 62, y: 45, w: 12, h: 10 },
            { x: 45, y: 55, w: 10, h: 6 },
        ],
        waterZones: [
            { x: 0, y: 58, w: 30, h: 7 },
            { x: 75, y: 0, w: 10, h: 20 },
            { x: 78, y: 30, w: 7, h: 15 },
        ],
        coverPositions: [
            [5,15],[18,18],[28,12],[42,10],[52,15],
            [70,18],[22,35],[40,35],[58,38],[75,40],
            [10,40],[30,55],[50,50],[65,55],[20,50],
            [45,20],[68,28],[8,35],[38,30],[55,50],
            [80,50],[15,55],[25,42],[60,35],[72,8],
        ],
        extractionCandidates: [
            { x: 80, y: 10 }, { x: 80, y: 50 }, { x: 45, y: 60 },
            { x: 3, y: 10 }, { x: 3, y: 50 }, { x: 40, y: 3 },
            { x: 70, y: 60 },
        ],
        playerSpawn: { x: 3, y: 32 },
        enemyPatrols: [
            { spawn: [16,9],  wp: [[16,9],[22,9],[22,13],[16,13]] },
            { spawn: [40,7],  wp: [[40,7],[43,7],[43,9],[40,9]] },
            { spawn: [66,10], wp: [[66,10],[72,10],[72,15],[66,15]] },
            { spawn: [12,29], wp: [[12,29],[16,29],[16,33],[12,33]] },
            { spawn: [35,26], wp: [[35,26],[40,26],[40,30],[35,30]] },
            { spawn: [60,30], wp: [[60,30],[67,30],[67,35],[60,35]] },
            { spawn: [16,48], wp: [[16,48],[20,48],[20,51],[16,51]] },
            { spawn: [42,46], wp: [[42,46],[48,46],[48,53],[42,53]] },
            { spawn: [66,49], wp: [[66,49],[72,49],[72,53],[66,53]] },
            { spawn: [30,38], wp: [[30,38],[38,32],[45,38],[38,44]] },
            { spawn: [75,25], wp: [[75,25],[78,22],[78,28],[75,28]] },
        ]
    }
};

// ========== GAME MAP ==========
const GameMap = {
    width: 80,
    height: 60,
    tiles: [],
    lootSpawns: [],
    enemyPatrols: [],
    extractionPoints: [],
    playerSpawn: { x: 5, y: 30 },
    currentMapId: 'desert',

    init(mapId) {
        this.currentMapId = mapId || 'desert';
        const def = MAP_DEFS[this.currentMapId];
        if (!def) return this;

        this.width = def.size.w;
        this.height = def.size.h;

        // Apply theme colors
        TILE_COLORS = { ...def.theme };

        this.generateMap(def);
        return this;
    },

    generateMap(def) {
        const W = this.width;
        const H = this.height;

        // Fill with ground tile
        this.tiles = [];
        for (let y = 0; y < H; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < W; x++) {
                this.tiles[y][x] = def.groundTile;
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

        // Water zones (harbor)
        if (def.waterZones) {
            def.waterZones.forEach(wz => {
                for (let y = wz.y; y < Math.min(H, wz.y + wz.h); y++) {
                    for (let x = wz.x; x < Math.min(W, wz.x + wz.w); x++) {
                        if (y >= 0 && y < H && x >= 0 && x < W) {
                            this.tiles[y][x] = TILE.WATER;
                        }
                    }
                }
            });
        }

        // Buildings
        def.buildings.forEach(b => this.placeBuilding(b.x, b.y, b.w, b.h));

        // Cover
        def.coverPositions.forEach(([cx, cy]) => {
            if (this.tiles[cy] && this.tiles[cy][cx] && !TILE_SOLID[this.tiles[cy][cx]] && this.tiles[cy][cx] !== TILE.WATER) {
                this.tiles[cy][cx] = TILE.COVER_LOW;
                if (Math.random() > 0.5 && cx + 1 < W && this.tiles[cy][cx + 1] && !TILE_SOLID[this.tiles[cy][cx + 1]] && this.tiles[cy][cx + 1] !== TILE.WATER)
                    this.tiles[cy][cx + 1] = TILE.COVER_LOW;
            }
        });

        // Rubble
        for (let i = 0; i < 15; i++) {
            const rx = 2 + Math.floor(Math.random() * (W - 4));
            const ry = 2 + Math.floor(Math.random() * (H - 4));
            if (this.tiles[ry][rx] === def.groundTile) {
                this.tiles[ry][rx] = TILE.RUBBLE;
            }
        }

        // Randomly pick 3 extraction points from candidates
        const candidates = [...def.extractionCandidates];
        this.extractionPoints = [];
        const ids = ['ALPHA', 'BRAVO', 'CHARLIE'];
        for (let i = 0; i < 3 && candidates.length > 0; i++) {
            const idx = Math.floor(Math.random() * candidates.length);
            const c = candidates.splice(idx, 1)[0];
            this.extractionPoints.push({ x: c.x * TILE_SIZE, y: c.y * TILE_SIZE, id: ids[i] });
        }

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
        this.playerSpawn = { x: def.playerSpawn.x * TILE_SIZE, y: def.playerSpawn.y * TILE_SIZE };

        // Loot spawns
        this.lootSpawns = [];
        const lootTypes = ['medkit', 'ammo', 'parts', 'valuable', 'armor'];
        def.buildings.forEach(b => {
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
        for (let i = 0; i < 10; i++) {
            this.lootSpawns.push({
                x: (3 + Math.floor(Math.random() * (W - 6))) * TILE_SIZE,
                y: (3 + Math.floor(Math.random() * (H - 6))) * TILE_SIZE,
                type: lootTypes[Math.floor(Math.random() * lootTypes.length)]
            });
        }

        // Enemy patrols
        this.enemyPatrols = def.enemyPatrols.map(ep => ({
            spawn: { x: ep.spawn[0] * TILE_SIZE, y: ep.spawn[1] * TILE_SIZE },
            waypoints: ep.wp.map(p => ({ x: p[0] * TILE_SIZE, y: p[1] * TILE_SIZE }))
        }));
    },

    placeBuilding(bx, by, bw, bh) {
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
        for (let y = by + 1; y < by + bh - 1; y++) {
            for (let x = bx + 1; x < bx + bw - 1; x++) {
                if (this.tiles[y]) {
                    this.tiles[y][x] = ((x + y) % 3 === 0) ? TILE.FLOOR_DARK : TILE.FLOOR;
                }
            }
        }
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

    checkCollision(x, y, w, h) {
        const corners = [
            [x - w / 2, y - h / 2],
            [x + w / 2, y - h / 2],
            [x - w / 2, y + h / 2],
            [x + w / 2, y + h / 2]
        ];
        return corners.some(([cx, cy]) => this.isSolid(cx, cy));
    },

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

                if (tile === TILE.WALL) {
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(sx, sy + TILE_SIZE - 4, TILE_SIZE, 4);
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
                    ctx.strokeRect(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
                }

                if (tile === TILE.DOOR) {
                    ctx.fillStyle = 'rgba(200,150,50,0.3)';
                    ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                if (tile === TILE.COVER_LOW) {
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                if (tile === TILE.WATER) {
                    // Water shimmer
                    const shimmer = Math.sin((x * 3 + y * 2 + Date.now() / 500)) * 0.05 + 0.1;
                    ctx.fillStyle = `rgba(100,150,220,${shimmer})`;
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                }

                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
        }
    },

    renderMinimap(ctx, x, y, w, h, playerX, playerY, enemies, extractionPoints) {
        const scaleX = w / (this.width * TILE_SIZE);
        const scaleY = h / (this.height * TILE_SIZE);

        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, w, h);

        for (let ty = 0; ty < this.height; ty += 2) {
            for (let tx = 0; tx < this.width; tx += 2) {
                const tile = this.tiles[ty][tx];
                if (tile === TILE.WALL || tile === TILE.COVER_LOW) {
                    ctx.fillStyle = tile === TILE.WALL ? '#555' : '#444';
                    ctx.fillRect(tx * TILE_SIZE * scaleX, ty * TILE_SIZE * scaleY, TILE_SIZE * 2 * scaleX, TILE_SIZE * 2 * scaleY);
                } else if (tile === TILE.FLOOR || tile === TILE.FLOOR_DARK) {
                    ctx.fillStyle = '#2a3a2a';
                    ctx.fillRect(tx * TILE_SIZE * scaleX, ty * TILE_SIZE * scaleY, TILE_SIZE * 2 * scaleX, TILE_SIZE * 2 * scaleY);
                } else if (tile === TILE.WATER) {
                    ctx.fillStyle = '#1a2a4a';
                    ctx.fillRect(tx * TILE_SIZE * scaleX, ty * TILE_SIZE * scaleY, TILE_SIZE * 2 * scaleX, TILE_SIZE * 2 * scaleY);
                }
            }
        }

        extractionPoints.forEach(ep => {
            ctx.fillStyle = '#00ff66';
            ctx.beginPath();
            ctx.arc(ep.x * scaleX, ep.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        enemies.forEach(e => {
            if (e.detected) {
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(e.x * scaleX, e.y * scaleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.arc(playerX * scaleX, playerY * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3d5c3d';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);

        ctx.restore();
    }
};
