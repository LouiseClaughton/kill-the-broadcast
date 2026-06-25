/* Instructions Toggle */
const instructionsButton = document.getElementById("instructions-button");

function toggleInstructions() {
    const instructions = document.getElementById("instruction-container");
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
        toggleInstructions();
        toggleLeaderboard();
        startButton.classList.add("hidden");
        startTv.classList.add("hidden");
        infoContainer.classList.add("visible-flex");
        game.classList.add("visible");
    })
}

start();
reset();