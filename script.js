// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const show = (id) => $(id)?.classList.remove("hidden");
const hide = (id) => $(id)?.classList.add("hidden");

function goToScreen(id) {
  ["main-menu", "story-screen", "combat-screen", "outcome-screen"].forEach(hide);
  show(id);
}

// ---------- Story ----------
const gameState = { currentSceneId: 1 };

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
  { id: 5, text: "'Target nearby. Prepare for contact.'", triggersCombat: true },
  { id: 6, text: "End of demo. Thanks for playing!" }
];

function getScene(id) {
  return scenes.find((s) => s.id === id);
}

function renderScene() {
  const s = getScene(gameState.currentSceneId);
  if (!s) return;

  if (s.triggersCombat) {
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

// ---------- Combat ----------
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

const enemyRoster = [
  {
    name: "Syntech Drone",
    maxHp: 40,
    hp: 40,
    atk: 10,
    def: 5
  },
  {
    name: "Street Enforcer",
    maxHp: 55,
    hp: 55,
    atk: 9,
    def: 7
  },
  {
    name: "Neon Hacker",
    maxHp: 30,
    hp: 30,
    atk: 13,
    def: 4
  }
];

let enemy = {
  name: "",
  maxHp: 0,
  hp: 0,
  atk: 0,
  def: 0
};

function pickRandomEnemy() {
  const randomIndex = Math.floor(Math.random() * enemyRoster.length);
  const chosen = enemyRoster[randomIndex];

  enemy.name = chosen.name;
  enemy.maxHp = chosen.maxHp;
  enemy.hp = chosen.hp;
  enemy.atk = chosen.atk;
  enemy.def = chosen.def;
}

const TECH_GAIN = 10;
let playerIsDefending = false;

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

function startCombat() {
  goToScreen("combat-screen");
  closeInventoryPanel();

  pickRandomEnemy();   // choose random enemy
  player.tech = 0;

  const logBox = $("combat-log");
  if (logBox) logBox.innerHTML = "";

  writeLog(`A hostile ${enemy.name} appears!`);
  updateHUD();
}

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

function writeLog(msg) {
  const box = $("combat-log");
  if (!box) return;

  const p = document.createElement("p");
  p.textContent = msg;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}

// ---------- Inventory ----------
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

// ---------- Player Actions ----------
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

    // Optional screen shake
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

// ---------- Enemy Turn ----------
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

// ---------- End Combat ----------
function endCombat(win) {
  closeInventoryPanel();
  goToScreen("outcome-screen");

  const title = $("outcome-title");
  if (title) {
    title.textContent = win ? "VICTORY!" : "GAME OVER";
  }

  $("retryBtn").onclick = () => startCombat();
  $("menuBtn").onclick = () => goToScreen("main-menu");

  const cont = $("continueAfterBattle");
  if (win) {
    cont.classList.remove("hidden");
    cont.onclick = () => {
      gameState.currentSceneId = 6;
      goToScreen("story-screen");
      renderScene();
    };
  } else {
    cont.classList.add("hidden");
  }
}

// ---------- DOM Ready ----------
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
``