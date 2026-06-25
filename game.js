const supabaseUrl = "https://dcgaoqmgmyyqdztzyfkq.supabase.co";
const supabaseKey = "sb_publishable_lqFW2OiuI4wk-aoxqi2GPw_PBuCYSQZ";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const initialsCanvas = document.getElementById("initials-canvas");
const initialsCtx = initialsCanvas.getContext("2d");
const nameEntry = document.getElementById("name-entry");
const playerInitialsInput = document.getElementById("player-initials");
const submitScoreButton = document.getElementById("submit-score");

// Detect whether the site is being viewed on a mobile device
const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

// -------------------------------
// Game Variables
// -------------------------------

const COOLDOWN = 2000;
const HAND_HOVER_TIME = 1000; // 1 second
const MOUTH_HOLD_TIME = 500; // 0.5 seconds
const MOUTH_UNTOUCHED_TIME = 3000; // 3 seconds

// Mouth Spread Rate

let lastMouthSpread = 0;
const MOUTH_SPREAD_INTERVAL = 5000; // 5 seconds

// Tracking Variables

const DOUBLE_TAP_THRESHOLD = 300;
let hoveredTV = null;
let previousHoveredTV = null;
let holdStart = 0;
let holdTarget = null;
let touchHoldTarget = null;
let touchHoldStart = 0;
let lastTouchTap = { time: 0, index: -1 };

// Game Setup

let cols;
let rows;

if (window.innerWidth < 768) {
    cols = 4;
    rows = 6;
} else {
    cols = 8;
    rows = 4;
}

let size = 120;
let gridOffsetX = 0;
let gridOffsetY = 0;
let cellPadding = 6;

const timerSpan = document.querySelector("#time span");
const scoreSpan = document.querySelector("#score span");

let tvs = [];
let gameOver = false;
let score = 0;
let lastDifficultyTick = 0;
let startTime = 0;

// TV Images by Type

const tvImages = {
    eye: new Image(),
    mouth: new Image(),
    hand: new Image(),
};

tvImages.eye.src = "/assets/eye.png";
tvImages.mouth.src = "/assets/mouth.png";
tvImages.hand.src = "/assets/hand.png";

// -------------------------------
// TV Spawner
// -------------------------------

function spawnType(nowMs) {
    const elapsed = startTime ? (nowMs - startTime) / 1000 : 0;
    const r = Math.random();

    if (elapsed < 30) {
        return "eye"; // Only eyes for the first 20 seconds
    }

    if (elapsed > 30 && elapsed < 60) {
        return r < 0.85 ? "eye" : "mouth"; // Between 30 and 60 seconds, mostly eyes with some mouths
    }

    if (elapsed > 60 && elapsed < 90) {
        // Start to see more mouths and some hands between 60 and 90 seconds
        if (r < 0.5) return "eye";
        if (r < 0.8) return "mouth";
        return "hand";
    }

    if (elapsed > 90) {
        // Equal distribution of all three types over 90 seconds
        if (r < 0.3) return "eye";
        if (r < 0.6) return "mouth";
        return "hand";
    }

    return "eye";
}

// -------------------------------
// Initialise the TVs
// -------------------------------

function init() {
    tvs = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            tvs.push({
                x: gridOffsetX + x * size,
                y: gridOffsetY + y * size,
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
    const sx = tv.x + cellPadding;
    const sy = tv.y + cellPadding;
    const sw = size - cellPadding * 2;
    const sh = size - cellPadding * 2;

    if (tv.state === "on") {
        const colorMap = {
            eye: "#86bf87",
            mouth: "#c96d6d",
            hand: "#86a5b0",
        };

        drawCRT(ctx, sx, sy, sw, sh, colorMap[tv.type]);

        const img = tvImages[tv.type];
        if (img && img.complete) {
            const scale = Math.max(sw / img.width, sh / img.height);

            const dw = img.width * scale;
            const dh = img.height * scale;

            const dx = sx + (sw - dw) / 2;
            const dy = sy + (sh - dh) / 2;

            ctx.drawImage(img, dx, dy, dw, dh);
        }
    } else {
        ctx.fillStyle = "#222";

        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 12);
        ctx.fill();
    }
}

// -------------------------------
// Mechanics
// -------------------------------

// Get screen neighbours (for mouth spread function)

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

function getTVAtPoint(x, y) {
    for (let i = 0; i < tvs.length; i++) {
        const tv = tvs[i];
        if (x > tv.x && x < tv.x + size && y > tv.y && y < tv.y + size) {
            return { tv, index: i };
        }
    }
    return null;
}

function getTouchPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
    };
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

canvas.addEventListener("touchstart", (e) => {
    if (!isTouchDevice || gameOver) return;
    e.preventDefault();

    const { x, y } = getTouchPosition(e);
    const hit = getTVAtPoint(x, y);
    if (!hit) return;

    if (hit.tv.type === "mouth") {
        holdTarget = hit.tv;
        touchHoldTarget = hit.tv;
        holdStart = touchHoldStart = performance.now();
        hit.tv.lastTouchedAt = holdStart;
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (!isTouchDevice || gameOver || !touchHoldTarget) return;
    e.preventDefault();

    const { x, y } = getTouchPosition(e);
    const tv = touchHoldTarget;

    if (x < tv.x || x > tv.x + size || y < tv.y || y > tv.y + size) {
        touchHoldTarget = null;
        holdTarget = null;
        holdStart = 0;
        touchHoldStart = 0;
    }
});

canvas.addEventListener("touchend", (e) => {
    if (!isTouchDevice || gameOver) return;
    e.preventDefault();

    const { x, y } = getTouchPosition(e);
    const hit = getTVAtPoint(x, y);
    const now = performance.now();

    if (!hit) {
        touchHoldTarget = null;
        holdTarget = null;
        holdStart = 0;
        touchHoldStart = 0;
        return;
    }

    const { tv, index } = hit;

    if (tv.type === "eye" && tv.state === "on") {
        tv.state = "off";
        score++;
        lastTouchTap.time = 0;
        lastTouchTap.index = -1;
        return;
    }

    if (tv.type === "hand" && tv.state === "on") {
        if (
            now - lastTouchTap.time < DOUBLE_TAP_THRESHOLD &&
            lastTouchTap.index === index
        ) {
            tv.state = "off";
            score += 3;
            tv._handHovered = false;
            lastTouchTap.time = 0;
            lastTouchTap.index = -1;
        } else {
            lastTouchTap.time = now;
            lastTouchTap.index = index;
        }
        return;
    }

    if (tv.type === "mouth") {
        touchHoldTarget = null;
        holdTarget = null;
        holdStart = 0;
        touchHoldStart = 0;
        return;
    }
});

// Hover listener for hand mechanics

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

    // Clear hover timer if mouse moved away from the previous TV
    if (
        previousHoveredTV &&
        (!hoveredTV || hoveredTV.tv !== previousHoveredTV.tv)
    ) {
        previousHoveredTV.tv._hoverStart = 0;
    }

    previousHoveredTV = hoveredTV;
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

// Mousedown listener for mouth mechanics

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

// -------------------------------
// Update Game
// -------------------------------

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
                if (offTVs.length > 0) {
                    let t = offTVs[Math.floor(Math.random() * offTVs.length)];
                    t.state = "on";
                }
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

    // Shrink interval over time
    const dynamicInterval = Math.max(
        minInterval,
        baseInterval - elapsedSeconds * 50,
    );

    if (!mutatedThisFrame && elapsedMs - lastDifficultyTick >= dynamicInterval) {
        let offTVs = tvs.filter((tv) => tv.state === "off");
        if (offTVs.length > 0) {
            let t = offTVs[Math.floor(Math.random() * offTVs.length)];

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
    }

    // Lose condition
    let onCount = tvs.filter((t) => t.state === "on").length;
    if (window.innerWidth > 769 && onCount == 32) {
        gameOver = true;
        gameOverHandle(score);
    } else if (window.innerWidth < 769 && onCount == 24) {
        gameOver = true;
        gameOverHandle(score);
    }
}

// -------------------------------
// Arcade Name Entry State
// -------------------------------

let initials = ["A", "A", "A"];
let selectedLetter = 0;
let enteringName = false;
let finalScore = 0;

// -------------------------------
// GAME OVER
// -------------------------------

function gameOverHandle(scoreValue) {
    const gameCanvas = document.getElementById("game");
    const endTV = document.getElementById("end-tv");
    const end = document.getElementById("end");
    setTimeout(() => {
        gameCanvas.classList.remove("visible");
        endTV.classList.add("visible");
        end.classList.add("visible");
        enteringName = true;
        finalScore = scoreValue;

        const useMobileEntry = isTouchDevice || window.innerWidth <= 768;

        if (useMobileEntry) {
            initialsCanvas.style.display = "none";
            if (nameEntry) {
                nameEntry.style.display = "flex";
                if (playerInitialsInput) {
                playerInitialsInput.value = "";
                playerInitialsInput.focus();
                }
            }
        } else {
            initialsCanvas.style.display = "block";
            if (nameEntry) {
                nameEntry.style.display = "none";
            }
        }
    }, 3000);
}

// -------------------------------
// ARCADE INPUT
// -------------------------------

document.addEventListener("keydown", async (e) => {
    if (!enteringName) return;

    if (e.key === "ArrowLeft") {
        selectedLetter = (selectedLetter + 2) % 3;
    }

    if (e.key === "ArrowRight") {
        selectedLetter = (selectedLetter + 1) % 3;
    }

    if (e.key === "ArrowUp") {
        let code = initials[selectedLetter].charCodeAt(0) + 1;
        if (code > 90) code = 65;
        initials[selectedLetter] = String.fromCharCode(code);
    }

    if (e.key === "ArrowDown") {
        let code = initials[selectedLetter].charCodeAt(0) - 1;
        if (code < 65) code = 90;
        initials[selectedLetter] = String.fromCharCode(code);
    }

    if (e.key === "Enter") {
        const name = initials.join("");
        await submitScore(name, finalScore);
        enteringName = false;
        initialsCanvas.style.display = "none";
        if (nameEntry) {
            nameEntry.style.display = "none";
        }
        window.location.reload();
        drawLeaderboard();
    }
});

function normalizeInitials(value) {
    return value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);
}

async function submitInitials(name) {
    const normalized = normalizeInitials(name).padEnd(3, "A");
    await submitScore(normalized, finalScore);
    enteringName = false;
    initialsCanvas.style.display = "none";
    if (nameEntry) {
        nameEntry.style.display = "none";
    }
    window.location.reload();
    drawLeaderboard();
}

if (playerInitialsInput) {
    playerInitialsInput.addEventListener("input", (e) => {
        e.target.value = normalizeInitials(e.target.value);
    });
    playerInitialsInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            await submitInitials(playerInitialsInput.value);
        }
    });
}

if (submitScoreButton) {
    submitScoreButton.addEventListener("click", async () => {
        if (playerInitialsInput) {
            await submitInitials(playerInitialsInput.value);
        }
    });
}

// -------------------------------
// INITIALS SCREEN (CANVAS)
// -------------------------------

function drawInitialsScreen() {
    initialsCtx.fillStyle = "#111";
    initialsCtx.fillRect(0, 0, initialsCanvas.width, initialsCanvas.height);

    initialsCtx.fillStyle = "white";
    initialsCtx.font = "20px 'Kode Mono', monospace";
    initialsCtx.textAlign = "center";
    initialsCtx.fillText("ENTER INITIALS", initialsCanvas.width / 2, 50);

    const blink = Math.floor(performance.now() / 300) % 2;

    const spacing = 80;
    const startX = (initialsCanvas.width - spacing * (initials.length - 1)) / 2;

    initialsCtx.font = "16px 'Kode Mono', monospace";
    initialsCtx.textAlign = "center";

    for (let i = 0; i < 3; i++) {
        const x = startX + i * spacing;
        const y = 120;

        initialsCtx.fillStyle = i === selectedLetter ? "red" : "white";
        initialsCtx.fillText(initials[i], x, y);

        if (i === selectedLetter && blink) {
            initialsCtx.fillText("^", x, y - 20);
        }
    }
}

// -------------------------------
// SUPABASE FUNCTIONS
// -------------------------------

async function submitScore(playerName, scoreValue) {
    const { error } = await supabaseClient.from("Leaderboard").insert([
        {
            player_name: playerName,
            score: scoreValue,
        },
    ]);

    if (error) {
        console.error(error);
    }
}

async function getTopTen() {
    const { data, error } = await supabaseClient
        .from("Leaderboard")
        .select("player_name, score")
        .order("score", { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

// -------------------------------
// LEADERBOARD DOM
// -------------------------------

async function drawLeaderboard() {
    const container = document.getElementById("leaderboard-container");

    const scores = await getTopTen();

    const firstFive = scores.slice(0, 5);
    const secondFive = scores.slice(5, 10);

    container.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = "LEADERBOARD";
    container.appendChild(title);

    const scoreContainer = document.createElement("div");
    scoreContainer.classList.add("score-container");

    const scoreColumn1 = document.createElement("div");
    scoreColumn1.classList.add("score-column-1");
    const scoreColumn2 = document.createElement("div");
    scoreColumn2.classList.add("score-column-2");

    firstFive.forEach((entry, i) => {
        const row = document.createElement("div");
        row.textContent = `${i + 1}. ${entry.player_name} - ${entry.score}`;
        row.classList.add("score");
        scoreColumn1.appendChild(row);
    });

    secondFive.forEach((entry, i) => {
        const row = document.createElement("div");
        row.textContent = `${i + 6}. ${entry.player_name} - ${entry.score}`;
        row.classList.add("score");
        scoreColumn2.appendChild(row);
    });

    scoreContainer.appendChild(scoreColumn1);
    scoreContainer.appendChild(scoreColumn2);
    container.appendChild(scoreContainer);
}

// -------------------------------
// MAIN DRAW LOOP
// -------------------------------

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (enteringName) {
        drawInitialsScreen();
        return;
    }

    for (let tv of tvs) drawTV(tv);
}

// -------------------------------
// RESIZE
// -------------------------------

function updateTVPositions() {
    tvs.forEach((tv, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        tv.x = gridOffsetX + col * size;
        tv.y = gridOffsetY + row * size;
    });
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const maxWidth = window.innerWidth - 50;
    const maxHeight = window.innerHeight - 250;

    size = Math.floor(Math.min(maxWidth / cols, maxHeight / rows));

    const gridWidth = cols * size;
    const gridHeight = rows * size;

    canvas.style.width = `${gridWidth}px`;
    canvas.style.height = `${gridHeight}px`;

    canvas.width = gridWidth * dpr;
    canvas.height = gridHeight * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    gridOffsetX = 0;
    gridOffsetY = 0;

    cellPadding = Math.max(2, Math.floor(size * 0.08));

    updateTVPositions();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// -------------------------------
// INIT
// -------------------------------

drawLeaderboard();
init();

function loop() {
    if (!startTime) {
        startTime = performance.now();
    }

    update();
    draw();
    requestAnimationFrame(loop);
}
