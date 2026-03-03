console.log("Circuit Warfare Sprint 2 loaded");

// Helpers
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

// Screen Switching
function goToScreen(screenId){
  ["main-menu","story-screen","combat-screen","outcome-screen"].forEach(hide);
  show(screenId);
}

// Minimal Game State
const gameState = {
  currentSceneId: 1,  // start at scene 1
};

// Scene Data (sample narrative)
/*
  Rules:
  - If a scene has `choices`, render choice buttons and hide the Continue button.
  - If a scene has `next` and no choices, show the Continue button.
  - If a scene has neither `next` nor `choices`, it's an end scene
*/
const scenes = [
  {
    id: 1,
    text: "Dunkel City. Midnight. Your visor flickers as a encrypted ping hits your HUD: 'NEED HELP—SYNTECH DRONE—BLOCK 17'.",
    next: 2
  },
  {
    id: 2,
    text: "You duck into a neon‑lit alley. The signal grows stronger. A junction up ahead splits into two tunnels.",
    choices: [
      { text: "Take the left tunnel (toward maintenance shafts)", next: 3 },
      { text: "Take the right tunnel (toward market strip)", next: 4 }
    ]
  },
  {
    id: 3,
    text: "The maintenance shafts are quiet… too quiet. Your motion sensor spikes. You brace yourself.",
    next: 5
  },
  {
    id: 4,
    text: "The market strip hums with flickering signs. A drone silhouette darts across the roofs. It’s scanning.",
    next: 5
  },
  {
    id: 5,
    text: "Your comm crackles: 'Target nearby. Prepare for contact.'",
    // later, set triggersCombat: true
    // triggersCombat: true,
    next: 6
  },
  {
    id: 6,
    text: "End of demo. You successfully navigated scenes using Continue and Choices!",
    // no next, no choices -> end node for now
  }
];

// Render Logic
function getSceneById(id){
  return scenes.find(s => s.id === id);
}

function renderScene(){
  const scene = getSceneById(gameState.currentSceneId);
  if(!scene){
    console.error("Scene not found:", gameState.currentSceneId);
    return;
  }

  // Update text
  $("#story-text").textContent = scene.text;

  // Clear choices
  const choiceContainer = $("#choice-buttons");
  choiceContainer.innerHTML = "";

  // Decide UI: choices or continue or end
  const hasChoices = Array.isArray(scene.choices) && scene.choices.length > 0;
  const hasNext = typeof scene.next === "number";

  // Choices
  if(hasChoices){
    // Show choices, hide continue
    $("#continueStoryBtn").classList.add("hidden");

    scene.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.text;
      btn.addEventListener("click", () => {
        gameState.currentSceneId = choice.next;
        renderScene();
      });
      choiceContainer.appendChild(btn);
    });

  } else if(hasNext){
    // No choices, show continue
    $("#continueStoryBtn").classList.remove("hidden");
    $("#continueStoryBtn").onclick = () => {
      gameState.currentSceneId = scene.next;
      renderScene();
    };

  } else {
    // End node for now
    $("#continueStoryBtn").classList.add("hidden");
    const endMsg = document.createElement("div");
    endMsg.textContent = "— End of demo —";
    endMsg.style.opacity = "0.8";
    endMsg.style.marginTop = "8px";
    choiceContainer.appendChild(endMsg);
  }
}

// Main Menu Buttons
$("#startBtn").addEventListener("click", () => {
  // Reset state if needed
  gameState.currentSceneId = 1;
  goToScreen("story-screen");
  renderScene();
});

$("#menuBtn").addEventListener("click", () => {
  goToScreen("main-menu");
});

// How to Play placeholder
$("#howToPlayBtn").addEventListener("click", () => {
  alert("Read the story text and use Continue or choose options to progress.");
});

// Continue button click is assigned dynamically in renderScene()

// ---------- Boot ----------
console.log("Ready. Click 'Start Game' on the Main Menu.");