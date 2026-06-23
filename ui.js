const instructionsButton = document.getElementById("instructions-button");

function toggleInstructions() {
    const instructions = document.getElementById("instruction-container");
    instructions.classList.toggle("open");
}

instructionsButton.addEventListener("click", (e) => {
    toggleInstructions();
})

function reset() {
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", (e) => {
        window.location.reload(); // TEMP
    })
}

function start() {
    const startButton = document.getElementById("start");
    const tv = document.getElementById("tv");
    startButton.addEventListener("click", (e) => {
        loop();
        toggleInstructions();
        startButton.classList.add("hidden");
        tv.classList.add("hidden");
    })
}

start();
reset();