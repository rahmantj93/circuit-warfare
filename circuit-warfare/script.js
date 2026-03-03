console.log("Circuit Warfare is loading...");

// Temporary code just to test screen switching
document.getElementById("startBtn").onclick = () => {
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("story-screen").classList.remove("hidden");
};