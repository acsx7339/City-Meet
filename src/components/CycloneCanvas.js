/**
 * City-Meet 核心 Canvas 氣旋與小心聲極座標旋轉引擎
 * 實現《技術規格書》中的極座標演算法：
 * X = X_c + r * cos(theta + omega * t)
 * Y = Y_c + r * sin(theta + omega * t)
 */

import { STORM_LEVELS } from '../data/mockEvents';
import { calculatePolarPosition } from '../utils/stormCalculator';

export class CycloneEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.events = [];
    this.options = {
      isMobile: false,
      onSelectEvent: null,
      ...options
    };

    this.particles = new Map(); // eventId -> Array of mood & wind particles
    this.glowFadeCache = new Map(); // glow -> fade string cache for 60fps render loop
    this.hoveredEventId = null;
    this.selectedEventId = null;
    this.mousePos = { x: -1000, y: -1000 };
    this.time = 0;
    this.animationFrameId = null;
    this.getScreenCoords = null; // function: (lat, lng) => { x, y }

    this.initEvents();
  }

  setCoordProjection(projectionFn) {
    this.getScreenCoords = projectionFn;
  }

  setEvents(events) {
    this.events = events;
    this.rebuildParticles();
  }

  setSelectedEventId(id) {
    this.selectedEventId = id;
  }

  setMousePosition(x, y) {
    this.mousePos = { x, y };

    let foundHover = null;
    if (this.getScreenCoords) {
      for (const evt of this.events) {
        const pt = this.getScreenCoords(evt.coordinates[0], evt.coordinates[1]);
        if (!pt) continue;
        const levelConfig = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
        const dx = this.mousePos.x - pt.x;
        const dy = this.mousePos.y - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= levelConfig.radius + 35) {
          foundHover = evt.id;
          break;
        }
      }
    }

    this.hoveredEventId = foundHover;
    return !!foundHover;
  }

  handleCoordClick(x, y) {
    let closestEvent = null;
    let minDistance = Infinity;

    if (this.getScreenCoords) {
      for (const evt of this.events) {
        const pt = this.getScreenCoords(evt.coordinates[0], evt.coordinates[1]);
        if (!pt) continue;
        const levelConfig = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
        const dx = x - pt.x;
        const dy = y - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = Math.max(levelConfig.radius + 35, 45);

        if (dist <= hitRadius && dist < minDistance) {
          minDistance = dist;
          closestEvent = evt;
        }
      }
    }

    if (!closestEvent && this.hoveredEventId) {
      closestEvent = this.events.find(ev => ev.id === this.hoveredEventId) || null;
    }

    if (closestEvent && this.options.onSelectEvent) {
      this.options.onSelectEvent(closestEvent);
      return true;
    }
    return false;
  }

  initEvents() {
    // 移除 canvas 上的攔截，統一由 Leaflet 地圖容器轉發，確保滑鼠可自由拖曳地圖
  }

  rebuildParticles() {
    const isMobile = this.options.isMobile;
    const nextParticles = new Map();

    this.events.forEach(evt => {
      const level = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
      const moodList = evt.moodParticles || [];
      const prevItems = this.particles.get(evt.id) || [];
      const items = [];

      // 1. 風場粒子：沿用現有粒子角度，平滑旋轉不瞬移
      const maxWind = isMobile ? Math.floor(level.particleCount * 0.6) : level.particleCount;
      const existingWind = prevItems.filter(p => p.type === 'wind');

      for (let i = 0; i < maxWind; i++) {
        if (existingWind[i]) {
          existingWind[i].r = Math.min(existingWind[i].r, level.radius);
          items.push(existingWind[i]);
        } else {
          items.push({
            type: 'wind',
            r: 12 + Math.random() * (level.radius - 8),
            theta: Math.random() * Math.PI * 2,
            speedOffset: 0.8 + Math.random() * 0.4,
            size: 1.5 + Math.random() * 2,
            alpha: 0.25 + Math.random() * 0.4
          });
        }
      }

      // 2. 心聲粒子：若已存在相同 ID 則完全保留原有旋轉角速度與位置，絕不跳動！
      const existingMoodMap = new Map();
      prevItems.filter(p => p.type === 'mood').forEach(m => existingMoodMap.set(m.id, m));

      const count = moodList.length;
      moodList.forEach((mood, idx) => {
        const existing = existingMoodMap.get(mood.id);
        if (existing) {
          existing.text = mood.text;
          existing.emoji = mood.emoji || '💬';
          existing.author = mood.author;
          existing.r = Math.min(existing.r, level.radius * 0.9);
          items.push(existing);
        } else {
          const orbitRadius = level.radius * (0.45 + (idx % 3) * 0.28);
          const baseAngle = (idx / count) * Math.PI * 2;
          items.push({
            type: 'mood',
            id: mood.id,
            text: mood.text,
            emoji: mood.emoji || '💬',
            author: mood.author,
            r: orbitRadius,
            theta: baseAngle,
            speedOffset: 0.95 + (idx % 2) * 0.1,
            scale: 1
          });
        }
      });

      nextParticles.set(evt.id, items);
    });

    this.particles = nextParticles;
  }

  addMoodParticle(eventId, moodItem) {
    const target = this.events.find(e => e.id === eventId);
    if (!target) return;

    if (!target.moodParticles) target.moodParticles = [];
    target.moodParticles.unshift(moodItem);

    const level = STORM_LEVELS[target.stormLevel] || STORM_LEVELS.mild;
    const items = this.particles.get(eventId) || [];

    // 新增一顆心聲粒子到軌道中
    items.unshift({
      type: 'mood',
      id: moodItem.id,
      text: moodItem.text,
      emoji: moodItem.emoji || '✨',
      author: moodItem.author,
      r: level.radius * 0.7,
      theta: Math.random() * Math.PI * 2,
      speedOffset: 1.0,
      scale: 1.4 // 剛進場時微放大
    });

    this.particles.set(eventId, items);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    const height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;

    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.scale(dpr, dpr);
    }
  }

  start() {
    if (this.animationFrameId) return;

    const loop = () => {
      this.time += 1;
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.stop();
  }

  render() {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    if (!this.getScreenCoords) return;

    this.events.forEach(evt => {
      const center = this.getScreenCoords(evt.coordinates[0], evt.coordinates[1]);
      if (!center) return;

      // 檢查中心點是否在地圖視野內 (加半徑 padding)
      const level = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
      const maxRadius = level.radius * 1.6;
      if (
        center.x + maxRadius < 0 ||
        center.x - maxRadius > width ||
        center.y + maxRadius < 0 ||
        center.y - maxRadius > height
      ) {
        return;
      }

      const isHovered = this.hoveredEventId === evt.id;
      const isSelected = this.selectedEventId === evt.id;

      this.drawStormCenter(ctx, center, evt, level, isHovered, isSelected);
      this.drawStormParticles(ctx, center, evt, level, isHovered);
    });
  }

  getGlowFade(glow) {
    if (!this.glowFadeCache.has(glow)) {
      this.glowFadeCache.set(glow, glow.replace(/[\d\.]+\)$/, '0.15)'));
    }
    return this.glowFadeCache.get(glow);
  }

  drawStormCenter(ctx, center, evt, level, isHovered, isSelected) {
    const { x, y } = center;
    const color = level.color;

    ctx.save();

    // 1. 旋轉氣旋外環氣場光暈 (Outer Atmosphere Glow - 使用記憶快取優化 60fps 繪製)
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, level.radius);
    glowGrad.addColorStop(0, level.glow);
    glowGrad.addColorStop(0.6, this.getGlowFade(level.glow));
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, level.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // 2. 氣旋漩渦風壁 (Cyclone Spiral Arm)
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 2.8 : 1.8;
    ctx.globalAlpha = isHovered ? 0.85 : 0.65;

    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.15) {
      const r = (a / (Math.PI * 4)) * level.radius;
      const angle = a - this.time * level.speed;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. 暴風眼中心核心 (Eye of Cyclone)
    ctx.globalAlpha = 1;
    const eyeGrad = ctx.createRadialGradient(x, y, 0, x, y, 16);
    eyeGrad.addColorStop(0, '#ffffff');
    eyeGrad.addColorStop(0.4, color);
    eyeGrad.addColorStop(1, 'rgba(0,0,0,0.85)');

    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // 選中狀態時的脈衝標記
    if (isSelected || isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, 16 + Math.sin(this.time * 0.1) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 官方活動特殊皇冠/認證標記
    if (evt.sourceType === 'official') {
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText('★ 官方', x, y - 18);
    }

    ctx.restore();
  }

  drawStormParticles(ctx, center, evt, level, isHovered) {
    const { x, y } = center;
    const items = this.particles.get(evt.id) || [];
    const color = level.color;

    ctx.save();

    items.forEach(p => {
      // 極座標旋轉步進演算法: X = X_c + r * cos(theta + omega * t)
      const { x: px, y: py } = calculatePolarPosition({
        centerX: x,
        centerY: y,
        radius: p.r,
        theta: p.theta,
        speed: level.speed * p.speedOffset,
        time: this.time
      });

      if (p.type === 'wind') {
        // 風場光點
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'mood') {
        // 小心聲氣泡 (Mood Particle Chip)
        this.drawMoodChip(ctx, px, py, p, color, isHovered);
      }
    });

    ctx.restore();
  }

  drawMoodChip(ctx, x, y, p, stormColor, isHovered) {
    const isMobile = this.options.isMobile;
    // 手機端預設文字更簡潔以維持效能
    const displayText = isMobile && p.text.length > 8 ? p.text.substring(0, 8) + '..' : p.text;

    ctx.save();
    ctx.font = '11px "Inter", -apple-system, sans-serif';
    const textWidth = ctx.measureText(displayText).width;
    const paddingX = 8;
    const chipWidth = textWidth + 28; // emoji + spacing
    const chipHeight = 22;

    const chipX = x - chipWidth / 2;
    const chipY = y - chipHeight / 2;

    // 半透明玻璃膠囊底色
    ctx.globalAlpha = isHovered ? 0.95 : 0.82;
    ctx.fillStyle = isHovered ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    this.roundRect(ctx, chipX, chipY, chipWidth, chipHeight, 11);
    ctx.fill();

    // 膠囊邊框 (帶氣旋顏色光暈)
    ctx.lineWidth = isHovered ? 1.5 : 1;
    ctx.strokeStyle = isHovered ? '#ffffff' : stormColor;
    ctx.stroke();

    // 繪製 Emoji
    ctx.font = '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, chipX + 6, chipY + chipHeight / 2);

    // 繪製心聲文字
    ctx.font = '500 11px "Inter", sans-serif';
    ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
    ctx.fillText(displayText, chipX + 22, chipY + chipHeight / 2);

    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
