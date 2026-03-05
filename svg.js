// svg.js - All SVG icon generators for Delta Force: Hawk Ops

const SVG = {
    // Operator colors by class
    operatorColors: {
        assault: { primary: '#c43c3c', secondary: '#8b2020', accent: '#ff6b6b' },
        engineer: { primary: '#c4a960', secondary: '#8b7635', accent: '#ffd700' },
        support: { primary: '#3d8b3d', secondary: '#2a5c2a', accent: '#7dff7d' },
        recon: { primary: '#3d6b8b', secondary: '#2a4a5c', accent: '#7dc8ff' }
    },

    // Draw operator (top-down view) on canvas
    drawOperator(ctx, x, y, angle, operatorClass, size = 16) {
        const colors = this.operatorColors[operatorClass] || this.operatorColors.assault;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Body circle
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Direction indicator (gun barrel)
        ctx.beginPath();
        ctx.moveTo(size * 0.5, 0);
        ctx.lineTo(size * 1.6, 0);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.secondary;
        ctx.fill();

        // Class icon on body
        ctx.fillStyle = colors.accent;
        ctx.font = `${size * 0.7}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { assault: '⚔', engineer: '⚙', support: '+', recon: '◎' };
        ctx.fillText(icons[operatorClass] || '?', 0, 0);

        ctx.restore();
    },

    // Draw enemy (top-down)
    drawEnemy(ctx, x, y, angle, state, size = 14) {
        const stateColors = {
            patrol: '#cc4444',
            alert: '#ff8800',
            chase: '#ff2200',
            attack: '#ff0000'
        };
        const color = stateColors[state] || '#cc4444';

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#660000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gun
        ctx.beginPath();
        ctx.moveTo(size * 0.5, 0);
        ctx.lineTo(size * 1.4, 0);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#881111';
        ctx.fill();

        // Alert indicator
        if (state === 'alert' || state === 'chase' || state === 'attack') {
            ctx.fillStyle = '#ffff00';
            ctx.font = `bold ${size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('!', 0, -size * 1.5);
        }

        ctx.restore();
    },

    // Draw loot items
    drawLoot(ctx, x, y, type, size = 12) {
        ctx.save();
        ctx.translate(x, y);

        switch (type) {
            case 'medkit':
                // White box with red cross
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-size, -size, size * 2, size * 2);
                ctx.strokeStyle = '#cc0000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-size, -size, size * 2, size * 2);
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(-size * 0.2, -size * 0.7, size * 0.4, size * 1.4);
                ctx.fillRect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.4);
                break;

            case 'ammo':
                // Yellow ammo box
                ctx.fillStyle = '#c4a960';
                ctx.fillRect(-size, -size * 0.7, size * 2, size * 1.4);
                ctx.strokeStyle = '#8b7635';
                ctx.lineWidth = 2;
                ctx.strokeRect(-size, -size * 0.7, size * 2, size * 1.4);
                ctx.fillStyle = '#8b7635';
                ctx.font = `bold ${size}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('弹', 0, 0);
                break;

            case 'parts':
                // Gear icon
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = '#888';
                ctx.fill();
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = '#555';
                ctx.fill();
                // Gear teeth
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    ctx.fillStyle = '#888';
                    ctx.fillRect(
                        Math.cos(a) * size * 0.6 - 3,
                        Math.sin(a) * size * 0.6 - 3,
                        6, 6
                    );
                }
                break;

            case 'valuable':
                // Gold diamond
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.7, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.7, 0);
                ctx.closePath();
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.strokeStyle = '#cc9900';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Shine
                ctx.beginPath();
                ctx.moveTo(-size * 0.2, -size * 0.3);
                ctx.lineTo(size * 0.1, -size * 0.5);
                ctx.lineTo(size * 0.3, -size * 0.1);
                ctx.strokeStyle = '#fff8';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;

            case 'armor':
                // Shield shape
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.8, -size * 0.5);
                ctx.lineTo(size * 0.8, size * 0.3);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.8, size * 0.3);
                ctx.lineTo(-size * 0.8, -size * 0.5);
                ctx.closePath();
                ctx.fillStyle = '#4477aa';
                ctx.fill();
                ctx.strokeStyle = '#2255aa';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }

        // Glow effect for loot
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size * 1.5);
        glow.addColorStop(0, 'rgba(255,255,200,0.15)');
        glow.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.restore();
    },

    // Draw extraction point
    drawExtractionPoint(ctx, x, y, active, timer) {
        ctx.save();
        ctx.translate(x, y);

        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.strokeStyle = active ? `rgba(0,255,100,${pulse})` : 'rgba(0,200,80,0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner area
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = active ? 'rgba(0,255,100,0.15)' : 'rgba(0,200,80,0.08)';
        ctx.fill();

        // Arrow up icon
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(8, -2);
        ctx.lineTo(3, -2);
        ctx.lineTo(3, 10);
        ctx.lineTo(-3, 10);
        ctx.lineTo(-3, -2);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fillStyle = active ? '#00ff66' : '#00cc55';
        ctx.fill();

        // Timer text
        if (active && timer > 0) {
            ctx.fillStyle = '#00ff66';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(timer.toFixed(1) + 's', 0, -38);
        }

        // Label
        ctx.fillStyle = '#00cc55';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('撤离点', 0, 28);

        ctx.restore();
    },

    // Draw crosshair
    drawCrosshair(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;

        // Outer lines
        const gap = 6, len = 12;
        ctx.beginPath();
        ctx.moveTo(-gap - len, 0); ctx.lineTo(-gap, 0);
        ctx.moveTo(gap, 0); ctx.lineTo(gap + len, 0);
        ctx.moveTo(0, -gap - len); ctx.lineTo(0, -gap);
        ctx.moveTo(0, gap); ctx.lineTo(0, gap + len);
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,50,50,0.9)';
        ctx.fill();

        ctx.restore();
    },

    // Draw muzzle flash
    drawMuzzleFlash(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const gradient = ctx.createRadialGradient(8, 0, 0, 8, 0, 20);
        gradient.addColorStop(0, 'rgba(255,255,200,0.9)');
        gradient.addColorStop(0.3, 'rgba(255,200,50,0.6)');
        gradient.addColorStop(1, 'rgba(255,100,0,0)');

        ctx.beginPath();
        ctx.ellipse(12, 0, 18, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    },

    // Draw bullet trail
    drawBulletTrail(ctx, x1, y1, x2, y2, alpha) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255,220,100,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    },

    // Weather: rain particle
    drawRainDrop(ctx, x, y) {
        ctx.save();
        ctx.strokeStyle = 'rgba(150,180,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y + 10);
        ctx.stroke();
        ctx.restore();
    },

    // Weather: sandstorm overlay
    drawSandstorm(ctx, width, height, intensity) {
        ctx.save();
        ctx.fillStyle = `rgba(180,150,80,${intensity * 0.3})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    },

    // Minimap player arrow
    drawMinimapPlayer(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-3, -3);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-3, 3);
        ctx.closePath();
        ctx.fillStyle = '#00ff66';
        ctx.fill();
        ctx.restore();
    },

    // Draw health/armor bar
    drawBar(ctx, x, y, w, h, value, maxValue, color, bgColor = '#333') {
        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
        const ratio = Math.max(0, value / maxValue);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * ratio, h);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    },

    // Generate operator select card SVG (for menu)
    getOperatorCardSVG(operatorClass) {
        const colors = this.operatorColors[operatorClass];
        const labels = {
            assault: { name: '突击', desc: '冲刺 - 短暂加速+无敌', icon: '⚔' },
            engineer: { name: '工程', desc: '地雷 - 区域伤害陷阱', icon: '⚙' },
            support: { name: '支援', desc: '烟雾 - 范围回血', icon: '+' },
            recon: { name: '侦察', desc: '扫描 - 显示附近敌人', icon: '◎' }
        };
        const info = labels[operatorClass];
        return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="116" height="156" rx="8" fill="#1a2a1a" stroke="${colors.primary}" stroke-width="2"/>
            <circle cx="60" cy="55" r="30" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="3"/>
            <circle cx="60" cy="55" r="14" fill="${colors.secondary}"/>
            <text x="60" y="62" text-anchor="middle" fill="${colors.accent}" font-size="20" font-family="monospace">${info.icon}</text>
            <line x1="75" y1="55" x2="100" y2="55" stroke="#555" stroke-width="4" stroke-linecap="round"/>
            <text x="60" y="110" text-anchor="middle" fill="#ddd" font-size="16" font-weight="bold" font-family="monospace">${info.name}</text>
            <text x="60" y="132" text-anchor="middle" fill="#999" font-size="8" font-family="monospace">${info.desc}</text>
        </svg>`;
    }
};
