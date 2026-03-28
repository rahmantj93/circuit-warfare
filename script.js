console.log("Loaded with defer.");

// Small helper for quick element access
const $ = (id) => document.getElementById(id);

// Show/Hide functions for screens
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

// Switch between screens
function goToScreen(screenId) {
  ["main-menu", "story-screen", "combat-screen", "outcome-screen"].forEach(hide);
  show(screenId);
}

// STORY SYSTEM
// Stores what scene the player is currently on
const gameState = {
  currentSceneId: 1
};

const scenes = [
  {
    id: 1,
    text: "Dunkel City. Midnight. Your visor flickers as an encrypted ping hits your HUD: 'NEED HELP—SYNTECH DRONE—BLOCK 17'.",
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
    triggersCombat: true,   // ⭐ combat trigger
    next: 6                 // This is used *after* combat finishes
  },
  {
    id: 6,
    text: "End of demo. More coming soon!"
  }
];

// Return scene object by ID
function getSceneById(id) {
  return scenes.find(s => s.id === id);
}

// Render the current story scene
function renderScene() {
  const scene = getSceneById(gameState.currentSceneId);
  if (!scene) {
    console.error("Scene not found:", gameState.currentSceneId);
    return;
  }

  // ⭐ Combat trigger check
  if (scene.triggersCombat) {
    console.log("Combat triggered!");
    startCombat();
    return;
  }

  // Update story text
  $("story-text").textContent = scene.text;

  // Clear old choices
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


//COMBAT SYSTEM (SETUP ONLY)


// Player stats
let player = {
  name: "Operative",
  maxHp: 60,
  hp: 60,
  atk: 12,
  def: 6,
  tech: 0,
  maxTech: 30,
  items: 2
};

// Enemy stats
let enemy = {
  name: "Syntech Drone",
  maxHp: 40,
  hp: 40,
  atk: 10,
  def: 5
};

// Start combat: switch screen, reset values, update HUD
function startCombat() {
  goToScreen("combat-screen");

  // Reset values
  enemy.hp = enemy.maxHp;
  player.tech = 0;

  // Reset combat log
  $("combat-log").innerHTML = "";
  logMessage("A hostile " + enemy.name + " appears!");

  // Update HUD
  updateCombatHUD();
}

// Update HP + Tech + Item display
function updateCombatHUD() {
  // Ensure new fields exist in HTML
  $("enemy-info").textContent =
    `${enemy.name} — HP: ${enemy.hp}/${enemy.maxHp}`;

  $("player-info").textContent =
    `You — HP: ${player.hp}/${player.maxHp} | Tech: ${player.tech}/${player.maxTech} | Items: ${player.items}`;
}

// Write a message to the combat log
function logMessage(msg) {
  const log = $("combat-log");
  const p = document.createElement("p");
  p.textContent = msg;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// =======================================
// BUTTON LISTENERS (MENU)
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  
  const startBtn = $("startBtn");
  const menuBtn = $("menuBtn");
  const howBtn = $("howToPlayBtn");

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
``