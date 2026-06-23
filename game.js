const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Game Variables

const COOLDOWN = 2000;
const HAND_HOVER_TIME = 1000; // 1 second
const MOUTH_HOLD_TIME = 500; // 0.5 seconds
const MOUTH_UNTOUCHED_TIME = 3000; // 3 seconds

// Mouth Spread Rate

let lastMouthSpread = 0;
const MOUTH_SPREAD_INTERVAL = 5000; // 5 seconds

// Tracking Variables

let hoveredTV = null;
let previousHoveredTV = null;
let holdStart = 0;
let holdTarget = null;

// Game Setup
const cols = 8;
const rows = 4;
const size = 120;
const gridOffsetX = (canvas.width - cols * size) / 2;
const timerSpan = document.querySelector("#time span");
const scoreSpan = document.querySelector("#score span");

let tvs = [];
let gameOver = false;
let score = 0;
let lastDifficultyTick = 0;

const tvImages = {
    eye: new Image(),
    mouth: new Image(),
    hand: new Image(),
};

tvImages.eye.src = "/assets/eye.png";
tvImages.mouth.src = "/assets/mouth.png";
tvImages.hand.src = "/assets/hand.png";

function spawnType(nowMs) {
    const elapsed = (nowMs - startTime) / 1000;
    const r = Math.random();

    if (elapsed < 10) {
        return r < 0.85 ? "eye" : "mouth";
    }

    if (elapsed < 30) {
        return r < 0.5 ? "eye" : "mouth";
    }

    if (r < 0.3) return "eye";
    if (r < 0.6) return "mouth";
    return "hand";
}

function init() {
    tvs = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            tvs.push({
                x: gridOffsetX + x * size,
                y: y * size,
                type: spawnType(performance.now()),
                state: "off", // All TVs begin off
                spread: 0,
                hover: 0,
                cooldown: 0,
                typeLocked: false,
                lastSpreadTime: 0,
                lastTouchedAt: 0,
                _handHovered: false,
            });
        }
    }
}

// -------------------------------
// Draw the TVs
// -------------------------------

function drawCRT(ctx, x, y, w, h, tintColor, time = 0) {
    ctx.save();

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.clip();

    // Glow background
    const glow = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        20,
        x + w / 2,
        y + h / 2,
        Math.max(w, h),
    );

    glow.addColorStop(0, tintColor);
    glow.addColorStop(1, "#001a22");

    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);

    // Noise
    for (let i = 0; i < 300; i++) {
        const px = x + Math.random() * w;
        const py = y + Math.random() * h;
        const bright = Math.random() * 255;

        ctx.fillStyle = `rgba(${bright},${bright},${bright},0.08)`;

        ctx.fillRect(px, py, 1, 1);
    }

    // Horizontal wobble
    for (let row = 0; row < h; row += 2) {
        const offset = Math.sin(row * 0.08 + time * 8) * 1.5;

        ctx.fillStyle = "rgba(255,255,255,0.02)";

        ctx.fillRect(x + offset, y + row, w, 1);
    }

    // Scanlines
    ctx.strokeStyle = "rgba(0,0,0,0.25)";

    for (let sy = y; sy < y + h; sy += 3) {
        ctx.beginPath();
        ctx.moveTo(x, sy);
        ctx.lineTo(x + w, sy);
        ctx.stroke();
    }

    // Flicker
    const flicker = 0.05 + Math.random() * 0.05;

    ctx.fillStyle = `rgba(255,255,255,${flicker})`;

    ctx.fillRect(x, y, w, h);

    ctx.restore();
}

function drawTV(tv) {
    const sx = tv.x + 5;
    const sy = tv.y + 5;
    const sw = size - 10;
    const sh = size - 10;

    if (tv.state === "on") {
        const colorMap = {
            eye: "#86bf87",
            mouth: "#c96d6d",
            hand: "#86a5b0",
        };

        drawCRT(ctx, sx, sy, sw, sh, colorMap[tv.type]);

        const img = tvImages[tv.type];
        if (img && img.complete) {
            ctx.drawImage(img, sx, sy, sw, sh);
        }
    } else {
        ctx.fillStyle = "#222";

        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 12);
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let tv of tvs) drawTV(tv);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px 'Crushed', monospace";
        ctx.fillText("SYSTEM FAILURE", 400, 250);
    }
}

function getNeighbors(index) {
    let neighbors = [];
    let x = index % cols;
    let y = Math.floor(index / cols);

    let dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ];

    for (let [dx, dy] of dirs) {
        let nx = x + dx;
        let ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            neighbors.push(ny * cols + nx);
        }
    }

    return neighbors;
}

canvas.addEventListener("click", (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    tvs.forEach((tv, i) => {
        if (mx > tv.x && mx < tv.x + size && my > tv.y && my < tv.y + size) {
            if (tv.type === "eye" && tv.state === "on") {
                tv.state = "off";
                score++; // Eyes score 1 point
            }
        }
    });
});

// Hover listener
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    hoveredTV = null;

    tvs.forEach((tv, i) => {
        if (mx > tv.x && mx < tv.x + size && my > tv.y && my < tv.y + size) {
            hoveredTV = { tv, i };
        }
    });

    // Clear hover timer if we moved away from the previous TV
    if (
        previousHoveredTV &&
        (!hoveredTV || hoveredTV.tv !== previousHoveredTV.tv)
    ) {
        previousHoveredTV.tv._hoverStart = 0;
    }

    previousHoveredTV = hoveredTV;
});

// Mousedown listener
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    holdTarget = null;
    holdStart = 0;

    tvs.forEach((tv, i) => {
        if (mx > tv.x && mx < tv.x + size && my > tv.y && my < tv.y + size) {
            if (tv.type === "mouth") {
                holdTarget = tv;
                holdStart = performance.now();
                tv.lastTouchedAt = holdStart;
            }
        }
    });
});

canvas.addEventListener("mouseup", () => {
    holdTarget = null;
    holdStart = 0;
});

canvas.addEventListener("mouseleave", () => {
    if (previousHoveredTV) {
        previousHoveredTV.tv._hoverStart = 0;
    }
    hoveredTV = null;
    previousHoveredTV = null;
    holdTarget = null;
    holdStart = 0;
});

function update() {
    if (gameOver) return;

    let mutatedThisFrame = false;
    const now = performance.now();

    // Update timer text once per frame in the main loop.
    const elapsedMs = now - startTime;
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    timerSpan.textContent = `${minutes}:${seconds}`;

    // Update score as TVs are turned off
    scoreSpan.textContent = `${score}`;

    // Mouth spread mechanic
    if (!mutatedThisFrame && now - lastMouthSpread >= MOUTH_SPREAD_INTERVAL) {
        const mouths = [];
        for (let i = 0; i < tvs.length; i++) {
            if (
                tvs[i].type === "mouth" &&
                tvs[i].state === "on" &&
                now - tvs[i].lastTouchedAt >= MOUTH_UNTOUCHED_TIME
            ) {
                mouths.push(i);
            }
            }

            if (mouths.length > 0) {
                const sourceIndex = mouths[Math.floor(Math.random() * mouths.length)];
                const neighbors = getNeighbors(sourceIndex).filter(
                    (index) => tvs[index].type !== "mouth",
                );

            if (neighbors.length > 0) {
                const targetIndex =
                neighbors[Math.floor(Math.random() * neighbors.length)];
                const target = tvs[targetIndex];

                target.type = "mouth";
                target.state = "on";
                target.typeLocked = true;
                target.lastTouchedAt = now;

                mutatedThisFrame = true;
                lastMouthSpread = now;
            }
        }
    }

    // Hand passive corruption
    tvs.forEach((tv, i) => {
        if (tv.type === "hand" && tv.state === "on") {
            if (Math.random() < 0.01) {
                let offTVs = tvs.filter((tv) => tv.state === "off");
                let t = offTVs[Math.floor(Math.random() * offTVs.length)];
                t.state = "on";
            }
        }
    });

    // Reset hand hover flag when hand is no longer active or type changes
    tvs.forEach((tv) => {
        if (tv._handHovered && (tv.type !== "hand" || tv.state === "off")) {
            tv._handHovered = false;
        }
    });

    // Hand hover mechanic
    if (hoveredTV && hoveredTV.tv.type === "hand" && !hoveredTV.tv._handHovered) {
        if (!hoveredTV.tv._hoverStart) {
            hoveredTV.tv._hoverStart = performance.now();
        }

        if (performance.now() - hoveredTV.tv._hoverStart > HAND_HOVER_TIME) {
            hoveredTV.tv.state = "off";
            score += 3; // Hands score 3 points

            let target = tvs[Math.floor(Math.random() * tvs.length)];
            target.state = "on";

            hoveredTV.tv._hoverStart = 0;
            hoveredTV.tv._handHovered = true;
        }
    }

    // Mouth hold mechanic
    if (holdTarget && holdTarget.type === "mouth") {
        const heldTime = performance.now() - holdStart;

        if (heldTime > MOUTH_HOLD_TIME) {
            holdTarget.state = "off";
            score += 2; // Mouths score 2 points
            holdTarget.spread = 0;

            holdTarget = null;
            holdStart = 0;
        }
    }

    // Difficulty scaling
    const baseInterval = 3000; // start slow
    const minInterval = 1500; // never faster than this

    const elapsedSeconds = elapsedMs / 1000;

    // shrink interval over time
    const dynamicInterval = Math.max(
        minInterval,
        baseInterval - elapsedSeconds * 50,
    );

    if (!mutatedThisFrame && elapsedMs - lastDifficultyTick >= dynamicInterval) {
        let offTVs = tvs.filter((tv) => tv.state === "off");
        let t = offTVs[Math.floor(Math.random() * offTVs.length)];

        const elapsedSeconds = (now - startTime) / 1000;

        if (!t.typeLocked) {
            let type = spawnType(now);
            t.type = type;

            if (type === "mouth") {
                t.typeLocked = true;
                t.lastTouchedAt = now;
            }
        }

        t.state = "on";
        lastDifficultyTick = elapsedMs;
    }

    // Lose condition
    let onCount = tvs.filter((t) => t.state === "on").length;
    if (onCount > 18) {
        gameOver = true;
    }
}

let startTime = 0;

function loop() {
    if (!startTime) {
        startTime = performance.now();
    }

    update();
    draw();
    requestAnimationFrame(loop);
}

init();
