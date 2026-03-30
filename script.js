// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id)?.classList.remove("hidden");
const hide = (id) => $(id)?.classList.add("hidden");

function goToScreen(id) {
  ["main-menu", "story-screen", "combat-screen", "inventory-panel", "outcome-screen"].forEach(hide);
  show(id);
}

// ---------- Story State ----------
const gameState = {
  currentSceneId: 1,
  postCombatSceneId: null,
  pendingEnemyType: null,
  currentEnemyType: null,
  storyFlags: {
    routeChoice: null
  }
};

// ---------- Story Scenes ----------
const scenes = [
  { id: 1, text: "Dunkel City. Midnight. A distress signal hits your HUD.", next: 2 },

  {
    id: 2,
    text: "Two tunnels appear ahead.",
    choices: [
      { text: "Take the left tunnel", next: 3 },
      { text: "Take the right tunnel", next: 4 }
    ]
  },

  { id: 3, text: "Quiet… too quiet. Motion spikes.", next: 5 },
  { id: 4, text: "Market strip flickers. A drone scans the rooftops.", next: 5 },

  { id: 5, text: "'Target nearby. Prepare for contact.'", triggersCombat: true, next: 6 },

  { id: 6, text: "The enemy collapses into a shower of sparks. Among the wreckage, you recover a glowing data shard.", next: 7 },

  {
    id: 7,
    text: "The shard contains two possible leads. One points toward a rooftop signal relay. The other points to an abandoned side street where a dead drop may still be hidden.",
    choices: [
      { text: "Trace the rooftop signal relay", next: 8 },
      { text: "Investigate the abandoned side street", next: 9 }
    ]
  },

  { id: 8, text: "You scale a fire escape and reach a rooftop lined with old transmitter dishes. Neon static pulses through the rain as a hidden terminal flickers online.", next: 10 },
  { id: 9, text: "You move through the side street and find a hidden cache tucked behind a broken vending machine. Someone was here recently — the ground is still warm.", next: 10 },

  { id: 10, text: "Your HUD decrypts more of the shard. It reveals a route to a deeper relay hub beneath the district.", next: 11 },

  {
    id: 11,
    text: "Two access routes appear on your HUD. One route goes through a security checkpoint. The other threads through a maintenance shaft.",
    choices: [
      { text: "Go through the security checkpoint", next: 12 },
      { text: "Take the maintenance shaft", next: 13 }
    ]
  },

  { id: 12, text: "You approach the checkpoint. Heavy footsteps echo nearby.", next: 14 },
  { id: 13, text: "You crawl through the maintenance shaft. Ahead, a reinforced figure drops into your path.", next: 14 },

  { id: 14, text: "A Street Enforcer blocks your route to the relay controls.", triggersCombat: true, enemyType: "enforcer", next: 15 },

  { id: 15, text: "You force the controls open and begin the download, but a hostile signal floods your visor. Someone is fighting back from inside the network.", next: 16 },

  { id: 16, text: "A Neon Hacker hijacks nearby systems and attacks through the city grid.", triggersCombat: true, enemyType: "hacker", next: 17 },

  { id: 17, text: "The network stabilises for a moment. Hidden behind the noise is the entrance to the central relay chamber.", next: 18 },

  { id: 18, text: "As the chamber opens, a giant war machine powers on. The Apex Guardian has awakened.", triggersCombat: true, enemyType: "boss", next: 19 },

  { id: 19, text: "The Apex Guardian crashes to the floor. For a moment, Dunkel City's network falls silent. Whatever you uncovered tonight was only the outer layer of something far bigger.", next: 20 },

  { id: 20, text: "Resolving ending..." },

  { id: 21, text: "Ending: Relay Path. By tracing the rooftop signal, you expose a hidden surveillance network buried deep in Dunkel City's infrastructure. The data shard becomes the first proof of a much larger conspiracy." },

  { id: 22, text: "Ending: Side Street Path. The abandoned route reveals more than a hidden cache — it uncovers the remains of an old resistance network. Dunkel City's forgotten defenders may not be as gone as everyone believed." },

  { id: 23, text: "Best Ending: Overclocked Truth. You reach the end with enough resources to fully decode the shard and preserve the relay core. With proof in hand and systems intact, you leave the chamber not as a survivor, but as the first real threat to the corporations controlling Dunkel City." }
];

function getScene(id) {
  return scenes.find((s) => s.id === id);
}

function determineEndingScene() {
  const hpPacks = player.inventory.healthPack.quantity;
  const techCells = player.inventory.techCell.quantity;
  const route = gameState.storyFlags.routeChoice;

  // Best ending if player finishes with strong resources
  if (hpPacks >= 2 && techCells >= 2) {
    return 23;
  }

  // Route-based endings
  if (route === "relay") {
    return 21;
  }

  if (route === "sideStreet") {
    return 22;
  }

  // Fallback ending
  return 21;
}

function renderScene() {
  const s = getScene(gameState.currentSceneId);
  if (!s) return;

  // Special handling for final endings
  if ([21, 22, 23].includes(s.id)) {
    showEndingCard(s);
    return;
  }

  // Resolve ending dynamically
  if (s.id === 20) {
    gameState.currentSceneId = determineEndingScene();
    renderScene();
    return;
  }

  if (s.triggersCombat) {
    gameState.postCombatSceneId = s.next || null;
    gameState.pendingEnemyType = s.enemyType || null;
    startCombat();
    return;
  }

  $("story-text").textContent = s.text;
  $("choice-buttons").innerHTML = "";
  const cbtn = $("continueStoryBtn");

  if (s.choices) {
    cbtn.classList.add("hidden");

    s.choices.forEach((choice) => {
      const b = document.createElement("button");
      b.textContent = choice.text;
      b.onclick = () => {
        // Track important route choice at scene 7
        if (s.id === 7) {
          if (choice.next === 8) {
            gameState.storyFlags.routeChoice = "relay";
          }
          if (choice.next === 9) {
            gameState.storyFlags.routeChoice = "sideStreet";
          }
        }

        gameState.currentSceneId = choice.next;
        renderScene();
      };
      $("choice-buttons").appendChild(b);
    });
  } else if (s.next) {
    cbtn.classList.remove("hidden");
    cbtn.onclick = () => {
      gameState.currentSceneId = s.next;
      renderScene();
    };
  } else {
    cbtn.classList.add("hidden");
    $("choice-buttons").innerHTML = "<p>— End of demo —</p>";
  }
}

function showEndingCard(scene) {
  goToScreen("outcome-screen");

  const title = $("outcome-title");
  const msg = $("outcome-message");
  const retryBtn = $("retryBtn");
  const contBtn = $("continueAfterBattle");
  const menuBtn = $("menuBtn");
  const screen = $("outcome-screen");

  // Reset old ending classes
  screen.classList.remove("ending-relay", "ending-side", "ending-best");

  // Pick title + theme
  if (scene.id === 21) {
    title.textContent = "Relay Ending";
    screen.classList.add("ending-relay");
  }

  if (scene.id === 22) {
    title.textContent = "Side Street Ending";
    screen.classList.add("ending-side");
  }

  if (scene.id === 23) {
    title.textContent = "Overclocked Truth";
    screen.classList.add("ending-best");
  }

  msg.textContent = scene.text;

  // Hide retry on final endings
  retryBtn.classList.add("hidden");

  // Hide the normal Main Menu button to avoid duplicates
  menuBtn.classList.add("hidden");
  contBtn.classList.remove("hidden");
  contBtn.textContent = "Main Menu";
  contBtn.onclick = () => {
    goToScreen("main-menu");
  };
}

// ==========================================
// COMBAT SYSTEM
// ==========================================

// ---------- Player ----------
let player = {
  name: "Operative",
  maxHp: 60,
  hp: 60,
  atk: 12,
  def: 6,
  tech: 0,
  maxTech: 30,
  inventory: {
    healthPack: {
      name: "Health Pack",
      quantity: 2,
      effect: "heal",
      value: 20
    },
    techCell: {
      name: "Tech Cell",
      quantity: 1,
      effect: "tech",
      value: 15
    }
  }
};

// ---------- Enemy Templates ----------
const enemyTemplates = {
  drone: {
    name: "Syntech Drone",
    maxHp: 40,
    hp: 40,
    atk: 10,
    def: 5
  },
  enforcer: {
    name: "Street Enforcer",
    maxHp: 55,
    hp: 55,
    atk: 9,
    def: 7
  },
  hacker: {
    name: "Neon Hacker",
    maxHp: 30,
    hp: 30,
    atk: 13,
    def: 4
  },
  boss: {
    name: "Apex Guardian",
    maxHp: 70,
    hp: 70,
    atk: 12,
    def: 6
  }
};

const randomEnemyTypes = ["drone", "enforcer", "hacker"];

let enemy = {
  name: "",
  maxHp: 0,
  hp: 0,
  atk: 0,
  def: 0
};

function loadEnemy(type) {
  const chosen = enemyTemplates[type];
  if (!chosen) return;

  gameState.currentEnemyType = type;

  enemy.name = chosen.name;
  enemy.maxHp = chosen.maxHp;
  enemy.hp = chosen.hp;
  enemy.atk = chosen.atk;
  enemy.def = chosen.def;
}


function pickRandomEnemy() {
  const randomIndex = Math.floor(Math.random() * randomEnemyTypes.length);
  const chosenType = randomEnemyTypes[randomIndex];
  loadEnemy(chosenType);
}

const TECH_GAIN = 10;
let playerIsDefending = false;

// ---------- Safe Audio ----------
function safePlay(id) {
  const el = $(id);
  if (!el) return;

  try {
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  } catch (_) {}
}

// ---------- Start Combat ----------
function startCombat() {
  goToScreen("combat-screen");
  closeInventoryPanel();

  if (gameState.pendingEnemyType) {
    loadEnemy(gameState.pendingEnemyType);
    gameState.pendingEnemyType = null;
  } else {
    pickRandomEnemy();
  }

  player.tech = 0;
  playerIsDefending = false;

  // If retrying after death, restore HP
  if (player.hp <= 0) {
    player.hp = player.maxHp;
  }

  const logBox = $("combat-log");
  if (logBox) logBox.innerHTML = "";

  writeLog(`A hostile ${enemy.name} appears!`);
  updateHUD();
}

// ---------- HUD ----------
function updateHUD() {
  const enemyInfo = $("enemy-info");
  const playerInfo = $("player-info");
  const enemyBar = $("enemy-hp-bar");
  const playerBar = $("player-hp-bar");

  if (enemyInfo) {
    enemyInfo.textContent = `${enemy.name} — HP: ${enemy.hp}/${enemy.maxHp}`;
  }

  if (playerInfo) {
    playerInfo.textContent =
      `You — HP: ${player.hp}/${player.maxHp} | Tech: ${player.tech}/${player.maxTech} | HP Packs: ${player.inventory.healthPack.quantity} | Tech Cells: ${player.inventory.techCell.quantity}`;
  }

  const enemyPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const playerPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  if (enemyBar) enemyBar.style.width = enemyPct + "%";
  if (playerBar) playerBar.style.width = playerPct + "%";
}

// ---------- Combat Log ----------
function writeLog(msg) {
  const box = $("combat-log");
  if (!box) return;

  const p = document.createElement("p");
  p.textContent = msg;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}

// ==========================================
// INVENTORY SYSTEM
// ==========================================

function openInventoryPanel() {
  renderInventoryPanel();
  $("inventory-panel")?.classList.remove("hidden");
}

function closeInventoryPanel() {
  $("inventory-panel")?.classList.add("hidden");
}

function renderInventoryPanel() {
  const list = $("inventory-list");
  if (!list) return;

  list.innerHTML = "";
  const inventory = player.inventory;

  Object.keys(inventory).forEach((key) => {
    const item = inventory[key];

    const wrapper = document.createElement("div");
    wrapper.className = "inventory-item";

    wrapper.innerHTML = `
      <strong>${item.name}</strong><br>
      Quantity: ${item.quantity}<br>
      Effect: ${item.effect} (${item.value})
    `;

    const useBtn = document.createElement("button");
    useBtn.textContent = "Use";
    useBtn.disabled = item.quantity <= 0;

    useBtn.onclick = () => {
      useInventoryItem(key);
    };

    wrapper.appendChild(useBtn);
    list.appendChild(wrapper);
  });
}

function useInventoryItem(itemKey) {
  const item = player.inventory[itemKey];

  if (!item || item.quantity <= 0) {
    writeLog("Item unavailable.");
    return;
  }

  if (item.effect === "heal") {
    player.hp = Math.min(player.maxHp, player.hp + item.value);
    writeLog(`You used ${item.name} and restored ${item.value} HP.`);
    safePlay("sfx-item");
  }

  if (item.effect === "tech") {
    player.tech = Math.min(player.maxTech, player.tech + item.value);
    writeLog(`You used ${item.name} and restored ${item.value} Tech.`);
    safePlay("sfx-item");
  }

  item.quantity--;
  updateHUD();
  closeInventoryPanel();

  // Using an item consumes your turn
  enemyTurn();
}

// ==========================================
// REWARDS / LOOT
// ==========================================

function giveBattleReward() {
  if (enemy.name === "Apex Guardian") {
    player.inventory.healthPack.quantity += 1;
    player.inventory.techCell.quantity += 1;
    writeLog("You recovered a Health Pack and a Tech Cell from the Guardian's core.");
    return "Health Pack + Tech Cell";
  }

  const roll = Math.random();

  if (roll < 0.5) {
    player.inventory.healthPack.quantity += 1;
    writeLog("You found a Health Pack.");
    return "Health Pack";
  } else {
    player.inventory.techCell.quantity += 1;
    writeLog("You found a Tech Cell.");
    return "Tech Cell";
  }
}

// ==========================================
// PLAYER ACTIONS
// ==========================================

function playerAttack() {
  safePlay("sfx-attack");

  const dmg = Math.max(1, player.atk - enemy.def);
  enemy.hp -= dmg;

  writeLog(`You attack for ${dmg} damage.`);
  updateHUD();

  if (enemy.hp <= 0) {
    endCombat(true);
    return;
  }

  enemyTurn();
}

function playerDefend() {
  safePlay("sfx-defend");
  playerIsDefending = true;
  writeLog("You brace for impact.");
  enemyTurn();
}

function playerSpecial() {
  if (player.tech < player.maxTech) {
    writeLog("Not enough Tech!");
    return;
  }

  safePlay("sfx-special");

  const dmg = Math.max(1, player.atk * 2 - enemy.def);
  enemy.hp -= dmg;

  writeLog(`SPECIAL ATTACK for ${dmg}!`);
  player.tech = 0;

  const cs = $("combat-screen");
  if (cs) {
    cs.classList.remove("special-flash-bg");
    void cs.offsetWidth;
    cs.classList.add("special-flash-bg");
    setTimeout(() => cs.classList.remove("special-flash-bg"), 300);

    // Optional screen shake if CSS exists
    cs.classList.add("shake");
    setTimeout(() => cs.classList.remove("shake"), 300);
  }

  updateHUD();

  if (enemy.hp <= 0) {
    endCombat(true);
    return;
  }

  enemyTurn();
}

// ==========================================
// ENEMY TURN
// ==========================================

function enemyTurn() {
  setTimeout(() => {
    if (Math.random() < 0.2) {
      writeLog(`${enemy.name} braces defensively.`);
      enemy.def += 2;
      setTimeout(() => {
        enemy.def -= 2;
      }, 300);
      return;
    }

    let dmg = Math.max(1, enemy.atk - player.def);

    if (playerIsDefending) {
      dmg = Math.floor(dmg / 2);
      playerIsDefending = false;
      writeLog("Your defense reduces the damage.");
    }

    player.hp -= dmg;
    safePlay("sfx-hit");

    writeLog(`${enemy.name} hits you for ${dmg}.`);
    updateHUD();

    const cs = $("combat-screen");
    if (cs) {
      cs.classList.remove("combat-normal", "combat-hit-flash");
      void cs.offsetWidth;
      cs.classList.add("combat-hit-flash");

      setTimeout(() => {
        cs.classList.remove("combat-hit-flash");
        cs.classList.add("combat-normal");
      }, 250);
    }

    const pinfo = $("player-info");
    if (pinfo) {
      pinfo.classList.remove("normal", "hit-animate");
      void pinfo.offsetWidth;
      pinfo.classList.add("hit-animate");

      setTimeout(() => {
        pinfo.classList.remove("hit-animate");
        pinfo.classList.add("normal");
      }, 200);
    }

    const spark = $("spark");
    if (spark) {
      spark.classList.remove("spark-active");
      void spark.offsetWidth;
      spark.classList.add("spark-active");

      setTimeout(() => {
        spark.classList.remove("spark-active");
      }, 200);
    }

    player.tech = Math.min(player.maxTech, player.tech + TECH_GAIN);
    updateHUD();

    if (player.hp <= 0) {
      endCombat(false);
    }
  }, 300);
}

// ==========================================
// END COMBAT
// ==========================================


function endCombat(win) {
  closeInventoryPanel();

  let rewardText = "";

  if (win) {
    const reward = giveBattleReward();
    rewardText = ` Reward gained: ${reward}.`;
  }

  const combatScreen = $("combat-screen");
  const overlay = $("combat-finish-overlay");

  // Play victory / defeat cue
  if (win) {
    safePlay("sfx-victory");
  } else {
    safePlay("sfx-defeat");
  }

  // Final impact shake ONLY at combat end
  if (combatScreen) {
    combatScreen.classList.remove("final-impact", "combat-finish");
    void combatScreen.offsetWidth;
    combatScreen.classList.add("final-impact");
  }

  // Prepare overlay text
  if (overlay) {
    overlay.classList.remove("victory", "defeat", "combat-overlay-show", "glitch-active");
    overlay.textContent = win ? "TARGET ELIMINATED" : "SYSTEM FAILURE";
    overlay.setAttribute("data-text", overlay.textContent);

    if (win) {
      overlay.classList.add("victory");
    } else {
      overlay.classList.add("defeat");
    }

    void overlay.offsetWidth;
    overlay.classList.add("combat-overlay-show", "glitch-active");
  }

  // Fade/zoom combat screen during delay
  if (combatScreen) {
    void combatScreen.offsetWidth;
    combatScreen.classList.add("combat-finish");
  }

  setTimeout(() => {
    if (combatScreen) {
      combatScreen.classList.remove("combat-finish", "final-impact");
    }

    if (overlay) {
      overlay.classList.remove("combat-overlay-show", "glitch-active", "victory", "defeat");
      overlay.textContent = "";
      overlay.removeAttribute("data-text");
    }

    goToScreen("outcome-screen");

    const title = $("outcome-title");
    if (title) {
      title.textContent = win ? "VICTORY!" : "GAME OVER";
    }

    const msg = $("outcome-message");
    if (msg) {
      msg.textContent = win
        ? `You survived the encounter.${rewardText}`
        : "You were defeated in combat.";
    }

    updateHUD();

    $("retryBtn").onclick = () => {
      gameState.pendingEnemyType = gameState.currentEnemyType;
      startCombat();
    };

    $("menuBtn").onclick = () => goToScreen("main-menu");

    const cont = $("continueAfterBattle");
    const menuBtn = $("menuBtn");
    const retryBtn = $("retryBtn");

    // Restore normal outcome buttons
    menuBtn.classList.remove("hidden");
    retryBtn.classList.remove("hidden");
    cont.textContent = "Continue";

    if (win) {
      cont.classList.remove("hidden");
      cont.onclick = () => {
        gameState.currentSceneId = gameState.postCombatSceneId || 6;
        goToScreen("story-screen");
        renderScene();
      };
    } else {
      cont.classList.add("hidden");
    }

  }, 1000);
}


// ==========================================
// DOM READY
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded, attaching listeners…");

  $("startBtn").onclick = () => {
    gameState.currentSceneId = 1;
    goToScreen("story-screen");
    renderScene();
  };

  $("menuBtn").onclick = () => goToScreen("main-menu");
  $("howToPlayBtn").onclick = () => alert("Read the story and make choices.");

  $("attackBtn").onclick = playerAttack;
  $("defendBtn").onclick = playerDefend;
  $("specialBtn").onclick = playerSpecial;
  $("itemBtn").onclick = openInventoryPanel;

  const closeBtn = $("closeInventoryBtn");
  if (closeBtn) {
    closeBtn.onclick = closeInventoryPanel;
  }

  console.log("Listeners attached.");
});