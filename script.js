// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id)?.classList.remove("hidden");
const hide = (id) => $(id)?.classList.add("hidden");

function goToScreen(id) {
  // Cancel any in-progress typewriter animation when navigating away
  if (typeof currentTyper !== "undefined" && currentTyper) {
    clearInterval(currentTyper.intervalId);
    currentTyper = null;
    const el = $("story-text");
    if (el) el.classList.remove("typing");
  }
  ["main-menu", "story-screen", "combat-screen", "inventory-panel", "outcome-screen", "howto-panel"].forEach(hide);
  show(id);
}

// ---------- Story State ----------
const gameState = {
  currentSceneId: 1,
  postCombatSceneId: null,
  pendingEnemyType: null,
  currentEnemyType: null,
  storyFlags: { routeChoice: null }
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
  { id: 5, text: "'Target nearby. Prepare for contact.'", triggersCombat: true, enemyType: "drone", next: 6 },
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

  if (hpPacks >= 2 && techCells >= 2) return 23;
  if (route === "relay") return 21;
  if (route === "sideStreet") return 22;
  return 21;
}

// COMBAT SYSTEM DATA

let player = {
  name: "Operative",
  maxHp: 60,
  hp: 60,
  atk: 12,
  def: 6,
  tech: 0,
  maxTech: 30,
  inventory: {
    healthPack: { name: "Health Pack", quantity: 2, effect: "heal", value: 20 },
    techCell: { name: "Tech Cell", quantity: 1, effect: "tech", value: 15 }
  }
};

const enemyTemplates = {
  drone:    { name: "Syntech Drone",   maxHp: 40, hp: 40, atk: 10, def: 5, portrait: "assets/enemy_drone.jpg" },
  enforcer: { name: "Street Enforcer", maxHp: 55, hp: 55, atk: 9,  def: 7, portrait: "assets/enemy_enforcer.jpg" },
  hacker:   { name: "Neon Hacker",     maxHp: 30, hp: 30, atk: 13, def: 4, portrait: "assets/enemy_hacker.jpg" },
  boss:     { name: "Apex Guardian",   maxHp: 70, hp: 70, atk: 12, def: 6, portrait: "assets/enemy_boss.jpg" }
};

const randomEnemyTypes = ["drone", "enforcer", "hacker"];

let enemy = {
  name: "",
  maxHp: 0,
  hp: 0,
  atk: 0,
  def: 0
};

const TECH_GAIN = 10;
let playerIsDefending = false;

// LOCAL STORAGE SAVE / LOAD

const SAVE_KEY = "circuitWarfareSave_v3";
let suppressAutoSave = false;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const INITIAL_PLAYER = deepClone(player);
const INITIAL_GAME_STATE = {
  currentSceneId: 1,
  postCombatSceneId: null,
  pendingEnemyType: null,
  currentEnemyType: null,
  storyFlags: { routeChoice: null }
};

function withSaveSuppressed(fn) {
  suppressAutoSave = true;
  try {
    fn();
  } finally {
    suppressAutoSave = false;
  }
}

function resetRun() {
  withSaveSuppressed(() => {
    player = deepClone(INITIAL_PLAYER);

    enemy.name = "";
    enemy.maxHp = 0;
    enemy.hp = 0;
    enemy.atk = 0;
    enemy.def = 0;

    gameState.currentSceneId = INITIAL_GAME_STATE.currentSceneId;
    gameState.postCombatSceneId = INITIAL_GAME_STATE.postCombatSceneId;
    gameState.pendingEnemyType = INITIAL_GAME_STATE.pendingEnemyType;
    gameState.currentEnemyType = INITIAL_GAME_STATE.currentEnemyType;
    gameState.storyFlags = deepClone(INITIAL_GAME_STATE.storyFlags);

    playerIsDefending = false;
    closeInventoryPanel();
    resetCombatVisuals();

    const logBox = $("combat-log");
    if (logBox) logBox.innerHTML = "";
  });
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  syncContinueButton();
}

function getActiveScreenId() {
  const screens = ["main-menu", "story-screen", "combat-screen", "outcome-screen"];
  return screens.find((id) => !$(id)?.classList.contains("hidden")) || "main-menu";
}

function getCombatLogMessages() {
  const box = $("combat-log");
  if (!box) return [];
  return Array.from(box.querySelectorAll("p")).map((p) => p.textContent);
}

function restoreCombatLog(messages = []) {
  const box = $("combat-log");
  if (!box) return;
  box.innerHTML = "";
  messages.forEach((msg) => {
    const p = document.createElement("p");
    p.textContent = msg;
    box.appendChild(p);
  });
}

function getOutcomeSnapshot() {
  const screen = $("outcome-screen");
  return {
    title: $("outcome-title")?.textContent || "",
    message: $("outcome-message")?.textContent || "",
    continueHidden: $("continueAfterBattle")?.classList.contains("hidden") ?? true,
    continueText: $("continueAfterBattle")?.textContent || "Continue",
    retryHidden: $("retryBtn")?.classList.contains("hidden") ?? false,
    menuHidden: $("menuBtn")?.classList.contains("hidden") ?? false,
    outcomeType:
      ["outcome-victory", "outcome-defeat", "outcome-ending"].find((cls) =>
        screen?.classList.contains(cls)
      ) || null,
    endingClass:
      ["ending-relay", "ending-side", "ending-best"].find((cls) =>
        screen?.classList.contains(cls)
      ) || null
  };
}

function saveGame() {
  if (suppressAutoSave) return;

  const saveData = {
    gameState: deepClone(gameState),
    player: deepClone(player),
    enemy: deepClone(enemy),
    activeScreen: getActiveScreenId(),
    inventoryOpen: !($("inventory-panel")?.classList.contains("hidden")),
    combatLog: getCombatLogMessages(),
    outcome: getOutcomeSnapshot(),
    savedAt: Date.now()
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  syncContinueButton();
}

function restoreOutcomeFromSave(outcome) {
  withSaveSuppressed(() => {
    goToScreen("outcome-screen");

    const screen = $("outcome-screen");
    const title = $("outcome-title");
    const msg = $("outcome-message");
    const cont = $("continueAfterBattle");
    const retryBtn = $("retryBtn");
    const menuBtn = $("menuBtn");

    // Clear all outcome-related classes, then apply the saved ones
    screen.classList.remove(
      "outcome-victory", "outcome-defeat", "outcome-ending",
      "ending-relay", "ending-side", "ending-best"
    );
    if (outcome.outcomeType) screen.classList.add(outcome.outcomeType);
    if (outcome.endingClass) screen.classList.add(outcome.endingClass);

    title.textContent = outcome.title || "";
    title.setAttribute("data-text", outcome.title || "");
    msg.textContent = outcome.message || "";

    cont.textContent = outcome.continueText || "Continue";
    cont.classList.toggle("hidden", !!outcome.continueHidden);
    retryBtn.classList.toggle("hidden", !!outcome.retryHidden);
    menuBtn.classList.toggle("hidden", !!outcome.menuHidden);

    if (outcome.endingClass) {
      cont.onclick = () => goToScreen("main-menu");
      menuBtn.onclick = () => goToScreen("main-menu");
      return;
    }

    retryBtn.onclick = () => {
      gameState.pendingEnemyType = gameState.currentEnemyType;
      startCombat();
    };

    menuBtn.onclick = () => goToScreen("main-menu");

    if (!outcome.continueHidden) {
      cont.onclick = () => {
        gameState.currentSceneId = gameState.postCombatSceneId || 6;
        goToScreen("story-screen");
        renderScene();
      };
    }
  });
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    alert("No saved game found.");
    return;
  }

  const data = JSON.parse(raw);

  withSaveSuppressed(() => {
    player = deepClone(data.player);

    enemy.name = data.enemy.name;
    enemy.maxHp = data.enemy.maxHp;
    enemy.hp = data.enemy.hp;
    enemy.atk = data.enemy.atk;
    enemy.def = data.enemy.def;

    gameState.currentSceneId = data.gameState.currentSceneId;
    gameState.postCombatSceneId = data.gameState.postCombatSceneId;
    gameState.pendingEnemyType = data.gameState.pendingEnemyType;
    gameState.currentEnemyType = data.gameState.currentEnemyType;
    gameState.storyFlags = deepClone(data.gameState.storyFlags || { routeChoice: null });

    playerIsDefending = false;
    closeInventoryPanel();
    resetCombatVisuals();
  });

  // Restore final endings directly
  if ([21, 22, 23].includes(gameState.currentSceneId)) {
    showEndingCard(getScene(gameState.currentSceneId));
    return;
  }

  if (data.activeScreen === "combat-screen") {
    goToScreen("combat-screen");
    restoreCombatLog(data.combatLog);
    updateHUD();

    if (data.inventoryOpen) {
      openInventoryPanel();
    }
    return;
  }

  if (data.activeScreen === "outcome-screen") {
    restoreOutcomeFromSave(data.outcome);
    return;
  }

  if (data.activeScreen === "story-screen") {
    goToScreen("story-screen");
    renderScene();
    return;
  }

  goToScreen("main-menu");
}

function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (_) {
    return false;
  }
}

function syncContinueButton() {
  const btn = $("continueBtn");
  if (!btn) return;

  const exists = hasSave();
  btn.disabled = !exists;
  btn.style.opacity = exists ? "1" : "0.5";
}

// STORY / ENDINGS

function showEndingCard(scene) {
  goToScreen("outcome-screen");

  const title = $("outcome-title");
  const msg = $("outcome-message");
  const retryBtn = $("retryBtn");
  const contBtn = $("continueAfterBattle");
  const menuBtn = $("menuBtn");
  const screen = $("outcome-screen");

  // Clear all possible prior outcome classes (combat + ending variants)
  screen.classList.remove("outcome-victory", "outcome-defeat", "outcome-ending",
    "ending-relay", "ending-side", "ending-best");
  screen.classList.add("outcome-ending");

  let titleText = "";
  if (scene.id === 21) {
    titleText = "Relay Ending";
    screen.classList.add("ending-relay");
  }
  if (scene.id === 22) {
    titleText = "Side Street Ending";
    screen.classList.add("ending-side");
  }
  if (scene.id === 23) {
    titleText = "Overclocked Truth";
    screen.classList.add("ending-best");
  }

  title.textContent = titleText;
  title.setAttribute("data-text", titleText);

  msg.textContent = scene.text;

  retryBtn.classList.add("hidden");
  menuBtn.classList.add("hidden");

  contBtn.classList.remove("hidden");
  contBtn.textContent = "Main Menu";
  contBtn.onclick = () => goToScreen("main-menu");

  saveGame();
}

function renderScene() {
  const s = getScene(gameState.currentSceneId);
  if (!s) return;

  if ([21, 22, 23].includes(s.id)) {
    showEndingCard(s);
    return;
  }

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

  const storyPanel = $("story-panel");
  if (storyPanel) {
    storyPanel.classList.remove("story-refresh");
    void storyPanel.offsetWidth;
    storyPanel.classList.add("story-refresh");
  }

  const choicesContainer = $("choice-buttons");
  const cbtn = $("continueStoryBtn");

  // Clear any previous buttons and hide them until the text finishes typing.
  choicesContainer.innerHTML = "";
  cbtn.classList.add("hidden");

  // Build the scene's buttons but hold them hidden until the typewriter finishes
  const revealButtons = () => {
    if (s.choices) {
      s.choices.forEach((choice) => {
        const b = document.createElement("button");
        b.textContent = choice.text;
        b.onclick = () => {
          if (s.id === 7) {
            if (choice.next === 8) gameState.storyFlags.routeChoice = "relay";
            if (choice.next === 9) gameState.storyFlags.routeChoice = "sideStreet";
          }

          gameState.currentSceneId = choice.next;
          renderScene();
        };
        choicesContainer.appendChild(b);
      });

    } else if (s.next) {
      cbtn.classList.remove("hidden");
      cbtn.onclick = () => {
        gameState.currentSceneId = s.next;
        renderScene();
      };

    } else {
      choicesContainer.innerHTML = "<p>— End of demo —</p>";
    }

    saveGame();
  };

  // Start typing the text; reveal buttons when done
  typewriterText(s.text, revealButtons);
}

// COMBAT SYSTEM

function loadEnemy(type) {
  const chosen = enemyTemplates[type];
  if (!chosen) return;

  gameState.currentEnemyType = type;

  enemy.name = chosen.name;
  enemy.maxHp = chosen.maxHp;
  enemy.hp = chosen.hp;
  enemy.atk = chosen.atk;
  enemy.def = chosen.def;

  const portraitEl = $("enemy-portrait");
  if (portraitEl) {
    portraitEl.classList.remove(
      "enemy-type-drone", "enemy-type-enforcer", "enemy-type-hacker", "enemy-type-boss"
    );
    portraitEl.classList.add("enemy-type-" + type);

    portraitEl.onerror = () => {
      portraitEl.onerror = null;
      portraitEl.src = "assets/enemy.jpg";
    };
    portraitEl.src = chosen.portrait || "assets/enemy.jpg";
  }
}

function pickRandomEnemy() {
  const chosenType = randomEnemyTypes[Math.floor(Math.random() * randomEnemyTypes.length)];
  loadEnemy(chosenType);
}

function safePlay(id) {
  const el = $(id);
  if (!el) return;

  try {
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (_) {}
}

function resetCombatVisuals() {
  const combatScreen = $("combat-screen");
  const overlay = $("combat-finish-overlay");

  if (combatScreen) {
    combatScreen.classList.remove("combat-finish", "final-impact", "combat-hit-flash", "special-flash-bg", "shake");
    combatScreen.style.opacity = "";
    combatScreen.style.transform = "";
    combatScreen.style.filter = "";
  }

  if (overlay) {
    overlay.classList.remove("combat-overlay-show", "glitch-active", "victory", "defeat");
    overlay.textContent = "";
    overlay.removeAttribute("data-text");
  }
}

function startCombat() {
  goToScreen("combat-screen");
  closeInventoryPanel();
  resetCombatVisuals();

  if (gameState.pendingEnemyType) {
    loadEnemy(gameState.pendingEnemyType);
    gameState.pendingEnemyType = null;
  } else {
    pickRandomEnemy();
  }

  player.tech = 0;
  playerIsDefending = false;

  if (player.hp <= 0) {
    player.hp = player.maxHp;
  }

  const logBox = $("combat-log");
  if (logBox) logBox.innerHTML = "";

  writeLog(`A hostile ${enemy.name} appears!`);
  updateHUD();
  saveGame();
}

function updateHUD() {
  const enemyInfo = $("enemy-info");
  const playerInfo = $("player-info");
  const enemyBar = $("enemy-hp-bar");
  const playerBar = $("player-hp-bar");

  const enemyPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const playerPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  if (enemyInfo) {
    enemyInfo.innerHTML = `
      <div class="hud-title-row">
        <span class="hud-title">${enemy.name}</span>
        <span class="hud-badge ${enemy.name === "Apex Guardian" ? "boss" : "hostile"}">
          ${enemy.name === "Apex Guardian" ? "Boss" : "Hostile"}
        </span>
      </div>
      <div class="hud-chip-row">
        <span class="hud-chip danger">HP ${enemy.hp}/${enemy.maxHp}</span>
        <span class="hud-chip">ATK ${enemy.atk}</span>
        <span class="hud-chip">DEF ${enemy.def}</span>
      </div>
    `;
  }

  if (playerInfo) {
    playerInfo.innerHTML = `
      <div class="hud-title-row">
        <span class="hud-title">${player.name}</span>
        <span class="hud-badge player">Operative</span>
      </div>
      <div class="hud-chip-row">
        <span class="hud-chip good">HP ${player.hp}/${player.maxHp}</span>
        <span class="hud-chip tech">Tech ${player.tech}/${player.maxTech}</span>
      </div>
      <div class="hud-chip-row">
        <span class="hud-chip">ATK ${player.atk}</span>
        <span class="hud-chip">DEF ${player.def}</span>
      </div>
      <div class="hud-chip-row">
        <span class="hud-chip item">HP Packs ${player.inventory.healthPack.quantity}</span>
        <span class="hud-chip item">Tech Cells ${player.inventory.techCell.quantity}</span>
      </div>
    `;
  }

  if (enemyBar) enemyBar.style.width = enemyPct + "%";
  if (playerBar) playerBar.style.width = playerPct + "%";
}

function writeLog(msg) {
  const box = $("combat-log");
  if (!box) return;

  const p = document.createElement("p");
  p.textContent = msg;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}
// INVENTORY SYSTEM

function openInventoryPanel() {
  renderInventoryPanel();

  const panel = $("inventory-panel");
  const box = $("inventory-box");

  if (panel) panel.classList.remove("hidden");

  if (box) {
    box.classList.remove("inventory-open");
    void box.offsetWidth;
    box.classList.add("inventory-open");
  }

  saveGame();
}

function closeInventoryPanel() {
  $("inventory-panel")?.classList.add("hidden");
  saveGame();
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
    useBtn.onclick = () => useInventoryItem(key);

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
  saveGame();
  closeInventoryPanel();
  enemyTurn();
}

// REWARDS / LOOT

function giveBattleReward() {
  if (enemy.name === "Apex Guardian") {
    player.inventory.healthPack.quantity += 1;
    player.inventory.techCell.quantity += 1;
    writeLog("You recovered a Health Pack and a Tech Cell from the Guardian's core.");
    return "Health Pack + Tech Cell";
  }

  if (Math.random() < 0.5) {
    player.inventory.healthPack.quantity += 1;
    writeLog("You found a Health Pack.");
    return "Health Pack";
  } else {
    player.inventory.techCell.quantity += 1;
    writeLog("You found a Tech Cell.");
    return "Tech Cell";
  }
}

// PLAYER ACTIONS

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

  saveGame();
  enemyTurn();
}

function playerDefend() {
  safePlay("sfx-defend");
  playerIsDefending = true;
  writeLog("You brace for impact.");
  saveGame();
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
    cs.classList.add("shake");
    setTimeout(() => cs.classList.remove("shake"), 300);
  }

  updateHUD();

  if (enemy.hp <= 0) {
    endCombat(true);
    return;
  }

  saveGame();
  enemyTurn();
}

// ENEMY TURN

function enemyTurn() {
  setTimeout(() => {
    if (Math.random() < 0.2) {
      writeLog(`${enemy.name} braces defensively.`);
      enemy.def += 2;
      setTimeout(() => { enemy.def -= 2; }, 300);
      saveGame();
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
      setTimeout(() => spark.classList.remove("spark-active"), 200);
    }

    player.tech = Math.min(player.maxTech, player.tech + TECH_GAIN);
    updateHUD();

    if (player.hp <= 0) {
      endCombat(false);
      return;
    }

    saveGame();
  }, 300);
}

// END COMBAT

function endCombat(win) {
  closeInventoryPanel();

  let rewardText = "";
  if (win) {
    const reward = giveBattleReward();
    rewardText = ` Reward gained: ${reward}.`;
  }

  const overlay = $("combat-finish-overlay");
  if (overlay) {
    overlay.classList.remove("victory", "defeat", "combat-overlay-show");
    overlay.textContent = win ? "TARGET ELIMINATED" : "SYSTEM FAILURE";
    overlay.classList.add(win ? "victory" : "defeat");
    void overlay.offsetWidth;
    overlay.classList.add("combat-overlay-show");
  }

  if (win) safePlay("sfx-victory");
  else safePlay("sfx-defeat");

  setTimeout(() => {
    resetCombatVisuals();
    goToScreen("outcome-screen");

    const screen = $("outcome-screen");
    if (screen) {
      // Clear any previous outcome class
      screen.classList.remove("outcome-victory", "outcome-defeat", "outcome-ending",
        "ending-relay", "ending-side", "ending-best");
      screen.classList.add(win ? "outcome-victory" : "outcome-defeat");
    }

    const title = $("outcome-title");
    if (title) {
      const text = win ? "VICTORY!" : "GAME OVER";
      title.textContent = text;
      title.setAttribute("data-text", text);
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

    saveGame();
  }, 900);
}

// AUDIO: MUTE TOGGLE + BGM

const MUTE_KEY = "circuitWarfare_muted";
let isMuted = localStorage.getItem(MUTE_KEY) === "1";

function applyMuteState() {
  const bgm = $("bgm");
  const btn = $("muteBtn");

  document.querySelectorAll("audio").forEach((a) => { a.muted = isMuted; });

  if (btn) btn.textContent = isMuted ? "🔇" : "🔊";
  if (btn) btn.title = isMuted ? "Sound off — click or press M to unmute" : "Sound on — click or press M to mute";

  if (bgm && !isMuted && bgm.paused) {
    const p = bgm.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem(MUTE_KEY, isMuted ? "1" : "0");
  applyMuteState();
}

function startBgm() {
  const bgm = $("bgm");
  if (!bgm || isMuted) return;
  try {
    bgm.volume = 0.35;
    const p = bgm.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (_) {}
}

// ==========================================
// HOW TO PLAY MODAL
// ==========================================

function openHowTo() {
  $("howto-panel")?.classList.remove("hidden");
}
function closeHowTo() {
  $("howto-panel")?.classList.add("hidden");
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
// Combat: A=Attack, D=Defend, S=Special, I=Inventory
// Global: M=mute, Esc=close modals
function handleKeydown(e) {
  if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

  const k = e.key.toLowerCase();

  // mute toggle
  if (k === "m") {
    toggleMute();
    return;
  }

  // Esc closes any open modal
  if (k === "escape") {
    if (!$("inventory-panel")?.classList.contains("hidden")) closeInventoryPanel();
    if (!$("howto-panel")?.classList.contains("hidden")) closeHowTo();
    return;
  }

  // Combat keys
  const combatVisible = !$("combat-screen")?.classList.contains("hidden");
  const modalOpen =
    !$("inventory-panel")?.classList.contains("hidden") ||
    !$("howto-panel")?.classList.contains("hidden");

  if (!combatVisible) return;

  if (k === "i") {
    // Toggle inventory from combat
    if ($("inventory-panel")?.classList.contains("hidden")) openInventoryPanel();
    else closeInventoryPanel();
    return;
  }

  if (modalOpen) return; // other combat keys disabled while a modal is open

  if (k === "a") playerAttack();
  else if (k === "d") playerDefend();
  else if (k === "s") playerSpecial();
}


let currentTyper = null;

function cancelTyper() {
  if (currentTyper) {
    clearInterval(currentTyper.intervalId);
    // Snap the text to full immediately
    const el = $("story-text");
    if (el) {
      el.textContent = currentTyper.fullText;
      el.classList.remove("typing");
    }
    // Reveal whatever was waiting (Continue btn / choice buttons)
    if (currentTyper.onDone) currentTyper.onDone();
    currentTyper = null;
  }
}

function typewriterText(fullText, onDone) {
  const el = $("story-text");
  if (!el) {
    if (onDone) onDone();
    return;
  }

  // Cancel any previous animation first
  if (currentTyper) {
    clearInterval(currentTyper.intervalId);
    currentTyper = null;
  }

  el.textContent = "";
  el.classList.add("typing");

  let i = 0;
  const speed = 22; // ms per character

  const intervalId = setInterval(() => {
    i++;
    el.textContent = fullText.slice(0, i);
    if (i >= fullText.length) {
      clearInterval(intervalId);
      el.classList.remove("typing");
      currentTyper = null;
      if (onDone) onDone();
    }
  }, speed);

  currentTyper = { intervalId, fullText, onDone };
}

// DOM READY


document.addEventListener("DOMContentLoaded", () => {
  // Apply persisted mute state and set up button
  applyMuteState();
  $("muteBtn")?.addEventListener("click", toggleMute);

  // How to play modal
  $("howToPlayBtn").onclick = openHowTo;
  $("closeHowtoBtn")?.addEventListener("click", closeHowTo);
  // Click the backdrop to close
  $("howto-panel")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "howto-panel") closeHowTo();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeydown);

  // Click on the story panel (or on the story text itself) to skip the typewriter
  const storyPanelEl = $("story-panel");
  if (storyPanelEl) {
    storyPanelEl.addEventListener("click", () => {
      if (currentTyper) cancelTyper();
    });
  }

  // Start / continue game
  $("startBtn").onclick = () => {
    // Warn before wiping an existing save
    if (hasSave()) {
      const proceed = window.confirm(
        "Starting a new game will erase your current save. Continue?"
      );
      if (!proceed) return;
    }
    clearSave();
    resetRun();
    gameState.currentSceneId = 1;
    goToScreen("story-screen");
    renderScene();
    startBgm();
  };

  $("continueBtn").onclick = () => {
    loadGame();
    startBgm();
  };

  syncContinueButton();

  $("menuBtn").onclick = () => goToScreen("main-menu");

  $("attackBtn").onclick = playerAttack;
  $("defendBtn").onclick = playerDefend;
  $("specialBtn").onclick = playerSpecial;
  $("itemBtn").onclick = openInventoryPanel;

  const closeBtn = $("closeInventoryBtn");
  if (closeBtn) closeBtn.onclick = closeInventoryPanel;
});