import * as PIXI from 'pixi.js';

export function createBasketballTexture(): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    
    const ctx = canvas.getContext('2d')!;
    
    // 绘制篮球
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b00';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 绘制篮球纹路
    ctx.beginPath();
    ctx.moveTo(2, 20);
    ctx.lineTo(38, 20);
    ctx.moveTo(20, 2);
    ctx.lineTo(20, 38);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    return PIXI.Texture.from(canvas);
} 