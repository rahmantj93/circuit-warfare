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

const TECH_GAIN = 10;

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

// Handle player attack/defend/special/item action
function playerAttack() {
  const dmg = Math.max(1, player.atk - enemy.def);
  enemy.hp -= dmg;
  logMessage(`You attack the ${enemy.name} for ${dmg} damage.`);
  
  updateCombatHUD();
  
  if (enemy.hp <= 0) {
    endCombat(true);
    return;
  }

  enemyTurn();
}

let playerIsDefending = false;

function playerDefend() {
  playerIsDefending = true;
  logMessage("You brace for impact. (Defend)");
  enemyTurn();
}

function playerSpecial() {
  if (player.tech < player.maxTech) {
    logMessage("Not enough Tech to use Special Move!");
    return;
  }

  const dmg = Math.max(1, player.atk * 2 - enemy.def);
  enemy.hp -= dmg;
  logMessage(`You unleash a SPECIAL ATTACK for ${dmg} damage!`);
  player.tech = 0;

  updateCombatHUD();

  if (enemy.hp <= 0) {
    endCombat(true);
    return;
  }

  enemyTurn();
}

function playerUseItem() {
  if (player.items <= 0) {
    logMessage("You have no items left!");
    return;
  }

  const healAmount = 20;
  player.hp = Math.min(player.maxHp, player.hp + healAmount);
  player.items--;

  logMessage(`You use a health pack and heal ${healAmount} HP.`);
  updateCombatHUD();

  enemyTurn();
}

function enemyTurn() {
  // Simple AI: 80% attack, 20% defend
  const roll = Math.random();

  if (roll < 0.2) {
    logMessage(`${enemy.name} braces for defense.`);
    // Enemy defense reduces your next turn's damage a little (optional)
    enemy.def += 2;
    setTimeout(() => { enemy.def -= 2; }, 1000);
    return;
  }

  // Enemy ATTACK
  let dmg = Math.max(1, enemy.atk - player.def);

  if (playerIsDefending) {
    dmg = Math.floor(dmg / 2);
    playerIsDefending = false;
    logMessage("Your defend reduces the incoming damage!");
  }

  player.hp -= dmg;
  logMessage(`${enemy.name} attacks you for ${dmg} damage.`);

  updateCombatHUD();

  // Tech gain for player each turn
  player.tech = Math.min(player.maxTech, player.tech + TECH_GAIN);

  if (player.hp <= 0) {
    endCombat(false);
  }
}

function endCombat(playerWon) {
  if (playerWon) {
    logMessage("You defeated the enemy!");
    $("#outcome-title").textContent = "VICTORY!";
  } else {
    logMessage("You have been defeated...");
    $("#outcome-title").textContent = "GAME OVER";
  }

  // Move to outcome screen after short delay
  setTimeout(() => {
    goToScreen("outcome-screen");
  }, 1200);

  // Continue button (only on victory)
  $("#continueAfterBattle").onclick = () => {
    if (playerWon) {
      gameState.currentSceneId = 6; // Goes to scene 6 after victory
      goToScreen("story-screen");
      renderScene();
    } else {
      goToScreen("main-menu");
    }
  };

  $("#retryBtn").onclick = () => {
    startCombat();
  };

  $("#menuBtn").onclick = () => {
    goToScreen("main-menu");
  };
}

// =======================================
// BUTTON LISTENERS (MENU)
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, attaching listeners…");

  // ===== MENU BUTTONS =====
  const startBtn = $("startBtn");
  const menuBtn = $("menuBtn");
  const howBtn  = $("howToPlayBtn");

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

  // ===== COMBAT ACTION BUTTONS =====
  const attackBtn  = $("attackBtn");
  const defendBtn  = $("defendBtn");
  const specialBtn = $("specialBtn");
  const itemBtn    = $("itemBtn");

  if (attackBtn) {
    attackBtn.addEventListener("click", playerAttack);
  }
  if (defendBtn) {
    defendBtn.addEventListener("click", playerDefend);
  }
  if (specialBtn) {
    specialBtn.addEventListener("click", playerSpecial);
  }
  if (itemBtn) {
    itemBtn.addEventListener("click", playerUseItem);
  }

  console.log("All listeners attached successfully.");
});
``