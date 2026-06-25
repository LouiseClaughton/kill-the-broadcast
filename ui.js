/* Instructions Toggle */

const instructionsButton = document.getElementById("instructions-button");
const instructions = document.getElementById("instruction-container");

if (window.innerWidth > 769) {
    instructions.classList.add("open");
} else {
    // Force closed by default on mobile/small screens
    instructions.classList.remove("open");
    instructions.style.transition = "none";
}

function toggleInstructions() {
    instructions.classList.toggle("open");
}

instructionsButton.addEventListener("click", (e) => {
    toggleInstructions();
})

/* Leaderboard Toggle */
const leaderboardButton = document.getElementById("leaderboard-button");

function toggleLeaderboard() {
    const leaderboard = document.getElementById("leaderboard-container");
    leaderboard.classList.toggle("open");
}

leaderboardButton.addEventListener("click", (e) => {
    toggleLeaderboard();
})

/* Reset Game */
function reset() {
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", (e) => {
        window.location.reload();
    });

    const endButton = document.getElementById("end");
    endButton.addEventListener("click", (e) => {
        window.location.reload();
    });
}

/* Start Game */
function start() {
    const startButton = document.getElementById("start");
    const startTv = document.getElementById("start-tv");
    const game = document.getElementById("game");
    const infoContainer = document.getElementById("info-container");
    startButton.addEventListener("click", (e) => {
        loop();
        if (window.innerWidth > 769) {
            toggleInstructions();
        }
        toggleLeaderboard();
        startButton.classList.add("hidden");
        startTv.classList.add("hidden");
        infoContainer.classList.add("visible-flex");
        game.classList.add("visible");
    })
}

start();
reset();