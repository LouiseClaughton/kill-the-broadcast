const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const cols = 6;
    const rows = 4;
    const size = 90;

    let tvs = [];
    let gameOver = false;
    let time = 0;

    function randomType() {
    const r = Math.random();
    if (r < 0.5) return "eye";
    if (r < 0.8) return "mouth";
    return "hand";
    }

    function init() {
    tvs = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
        tvs.push({
            x: x * size,
            y: y * size,
            type: randomType(),
            state: Math.random() < 0.4 ? "on" : "off",
            spread: 0,
            hover: 0
        });
        }
    }
    }

    function drawTV(tv) {
    // base
    ctx.fillStyle = tv.state === "on" ? "#fff" : "#222";
    ctx.fillRect(tv.x + 5, tv.y + 5, size - 10, size - 10);

    // glow for ON
    if (tv.state === "on") {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.strokeRect(tv.x + 5, tv.y + 5, size - 10, size - 10);
    }

    // label
    ctx.fillStyle = "red";
    ctx.font = "12px monospace";
    ctx.fillText(tv.type, tv.x + 10, tv.y + 20);
    }

    function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let tv of tvs) drawTV(tv);

    // UI pressure indicator
    let onCount = tvs.filter(t => t.state === "on").length;

    ctx.fillStyle = "white";
    ctx.fillText("ON TVs: " + onCount, 10, 390);

    if (onCount > 10) {
        ctx.fillStyle = "rgba(255,0,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px monospace";
        ctx.fillText("SYSTEM FAILURE", 120, 200);
    }
    }

    function getNeighbors(index) {
    let neighbors = [];
    let x = index % cols;
    let y = Math.floor(index / cols);

    let dirs = [
        [1,0],[-1,0],[0,1],[0,-1]
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

    function interact(tv, index) {
    if (tv.state === "off") return;

    if (tv.type === "eye") {
        tv.state = "off";
    }

    if (tv.type === "mouth") {
        tv.state = "off";
        tv.spread = 0;
    }

    if (tv.type === "hand") {
        tv.state = "off";

        // activate random TV
        let target = tvs[Math.floor(Math.random() * tvs.length)];
        target.state = "on";
    }
    }

    canvas.addEventListener("click", (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    tvs.forEach((tv, i) => {
        if (
        mx > tv.x && mx < tv.x + size &&
        my > tv.y && my < tv.y + size
        ) {
        interact(tv, i);
        }
    });
    });

    function update() {
    if (gameOver) return;

    time++;

    // Mouth spread mechanic
    tvs.forEach((tv, i) => {
        if (tv.type === "mouth" && tv.state === "on") {
        tv.spread++;

        if (tv.spread > 120) {
            let n = getNeighbors(i);
            if (n.length > 0) {
            let pick = n[Math.floor(Math.random() * n.length)];
            tvs[pick].state = "on";
            }
            tv.spread = 0;
        }
        }

        // Hand passive corruption
        if (tv.type === "hand" && tv.state === "on") {
        if (Math.random() < 0.01) {
            let t = tvs[Math.floor(Math.random() * tvs.length)];
            t.state = "on";
        }
        }
    });

    // difficulty scaling
    if (time % 300 === 0) {
        let t = tvs[Math.floor(Math.random() * tvs.length)];
        t.state = "on";
    }

    // lose condition
    let onCount = tvs.filter(t => t.state === "on").length;
    if (onCount > 18) {
        gameOver = true;
    }
    }

    function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
    }

init();
loop();