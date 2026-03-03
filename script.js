console.log("loaded with defer.");
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

function goToScreen(screenId) {
  ["main-menu", "story-screen", "combat-screen", "outcome-screen"].forEach(hide);
  show(screenId);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, attaching listeners…");
  const startBtn = $("startBtn");
  const menuBtn  = $("menuBtn");
  const howBtn   = $("howToPlayBtn");

  if (!startBtn) return console.error("startBtn missing!");
    startBtn.addEventListener("click", () => {
        console.log("Start clicked");
        gameState.currentSceneId = 1;
        goToScreen("story-screen");
        renderScene();

  });

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      console.log("Main Menu clicked");
      goToScreen("main-menu");
    });
  }

  if (howBtn) {
    howBtn.addEventListener("click", () => {
      alert("Use Continue or choose options to progress.");
    });
  }

  console.log("Listeners attached.");
});
// --- State and Scenes ---
const gameState = { currentSceneId: 1 };

const scenes = [
  { id: 1, text: "Dunkel City. Midnight. Your visor flickers as an encrypted ping hits your HUD: 'NEED HELP—SYNTECH DRONE—BLOCK 17'.", next: 2 },
  { id: 2, text: "You duck into a neon‑lit alley. The signal grows stronger. A junction up ahead splits into two tunnels.",
    choices: [
      { text: "Take the left tunnel (toward maintenance shafts)", next: 3 },
      { text: "Take the right tunnel (toward market strip)", next: 4 }
    ] },
  { id: 3, text: "The maintenance shafts are quiet… too quiet. Your motion sensor spikes. You brace yourself.", next: 5 },
  { id: 4, text: "The market strip hums with flickering signs. A drone silhouette darts across the roofs. It’s scanning.", next: 5 },
  { id: 5, text: "Your comm crackles: 'Target nearby. Prepare for contact.'", next: 6 },
  { id: 6, text: "End of demo. More coming soon!" }
];

function getSceneById(id) {
  return scenes.find(s => s.id === id);
}

function renderScene() {
  const scene = getSceneById(gameState.currentSceneId);
  if (!scene) {
    console.error("Scene not found:", gameState.currentSceneId);
    return;
  }

  $("story-text").textContent = scene.text;

  const choiceContainer = $("choice-buttons");
  choiceContainer.innerHTML = "";
  const hasChoices = Array.isArray(scene.choices) && scene.choices.length > 0;
  const hasNext = typeof scene.next === "number";

  const continueBtn = $("continueStoryBtn");

  if (hasChoices) {
    continueBtn.classList.add("hidden");
    scene.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.text;
      btn.addEventListener("click", () => {
        gameState.currentSceneId = choice.next;
        renderScene();
      });
      choiceContainer.appendChild(btn);
    });
  } else if (hasNext) {
    continueBtn.classList.remove("hidden");
    continueBtn.onclick = () => {
      gameState.currentSceneId = scene.next;
      renderScene();
    };
  } else {
    continueBtn.classList.add("hidden");
    const endMsg = document.createElement("div");
    endMsg.textContent = "— End of demo —";
    endMsg.style.opacity = "0.8";
    endMsg.style.marginTop = "8px";
    choiceContainer.appendChild(endMsg);
  }
}