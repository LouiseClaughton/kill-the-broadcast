const startTVcanvas = document.getElementById("start-tv");
const endTVcanvas = document.getElementById("end-tv");
const startTVctx = startTVcanvas.getContext("2d");
const endTVctx = endTVcanvas.getContext("2d");

let t = 0;

function roundedRect(x,y,w,h,r,ctx){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
}

function drawCRTScreen(ctx, t, colour, canvas){
    const cw = canvas.width;
    const ch = canvas.height;

    // scale based on canvas size
    const w = cw;
    const h = ch;

    console.log('Dimensions: ', w, h);

    console.log('Canvas Dimensions: ', canvas.width, canvas.height);

    const x = (cw - w);
    const y = (ch - h);

    ctx.save();

    roundedRect(x, y, w, h, 16, ctx);
    ctx.clip();

    // glow background
    let glow = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        20,
        x + w / 2,
        y + h / 2,
        180
    );

    glow.addColorStop(0, colour);
    glow.addColorStop(1, "#001a22");

    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);

    // animated noise
    for (let i = 0; i < 2500; i++) {
        const px = x + Math.random() * w;
        const py = y + Math.random() * h;

        const bright = Math.random() * 255;

        ctx.fillStyle = `rgba(${bright},${bright},${bright},0.08)`;
        ctx.fillRect(px, py, 1, 1);
    }

    // horizontal wobble
    for (let row = 0; row < h; row += 2) {
        const offset = Math.sin(row * 0.08 + t * 8) * 1.5;

        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(x + offset, y + row, w, 1);
    }

    // scanlines
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    for (let sy = y; sy < y + h; sy += 3) {
        ctx.beginPath();
        ctx.moveTo(x, sy);
        ctx.lineTo(x + w, sy);
        ctx.stroke();
    }

    // RGB bleed
    ctx.fillStyle = "rgba(255,0,0,0.03)";
    ctx.fillRect(x + 2, y, w, h);

    ctx.fillStyle = "rgba(0,255,255,0.03)";
    ctx.fillRect(x - 2, y, w, h);

    // flicker
    const flicker = 0.05 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${flicker})`;
    ctx.fillRect(x, y, w, h);

    // reflection
    const reflect = ctx.createLinearGradient(x, y, x + w, y + h);
    reflect.addColorStop(0, "rgba(255,255,255,0.25)");
    reflect.addColorStop(0.3, "rgba(255,255,255,0)");

    ctx.fillStyle = reflect;
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x + 70, y);
    ctx.lineTo(x + 20, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // vignette
    const vignette = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        40,
        x + w / 2,
        y + h / 2,
        170
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.65)");

    ctx.fillStyle = vignette;
    ctx.fillRect(x, y, w, h);

    ctx.restore();
}

function animate() {
    t += 0.016;

    startTVctx.clearRect(0, 0, startTVcanvas.width, startTVcanvas.height);
    endTVctx.clearRect(0, 0, endTVcanvas.width, endTVcanvas.height);

    drawCRTScreen(startTVctx, t, "#55ffff", startTVcanvas);
    drawCRTScreen(endTVctx, t, "#ff5555", endTVcanvas);

    requestAnimationFrame(animate);
}

animate();