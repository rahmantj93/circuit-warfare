// Helper
const $ = id => document.getElementById(id);

// Screen switching
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");

function goToScreen(id){
  ["main-menu","story-screen","combat-screen","outcome-screen"].forEach(hide);
  show(id);
}

// ================= STORY =================

const gameState = { currentSceneId:1 };

const scenes=[
  { id:1, text:"Dunkel City. Midnight. A distress signal hits your HUD.", next:2 },
  { id:2, text:"Two tunnels appear ahead.", choices:[
      {text:"Left tunnel",next:3},
      {text:"Right tunnel",next:4}
    ]
  },
  { id:3, text:"Quiet… too quiet. Motion spikes.", next:5 },
  { id:4, text:"Market strip flickers. A drone scans the rooftops.", next:5 },
  { id:5, text:"'Target nearby. Prepare for contact.'", triggersCombat:true },
  { id:6, text:"End of demo. Thanks for playing!" }
];

function getScene(id){ return scenes.find(s=>s.id===id); }

function renderScene(){
  const s=getScene(gameState.currentSceneId);
  if(!s)return;

  if(s.triggersCombat){ startCombat(); return; }

  $("story-text").textContent=s.text;
  $("choice-buttons").innerHTML="";
  const cbtn=$("continueStoryBtn");

  if(s.choices){
    cbtn.classList.add("hidden");
    s.choices.forEach(ch=>{
      const b=document.createElement("button");
      b.textContent=ch.text;
      b.onclick=()=>{ gameState.currentSceneId=ch.next; renderScene(); };
      $("choice-buttons").appendChild(b);
    });
  }
  else if(s.next){
    cbtn.classList.remove("hidden");
    cbtn.onclick=()=>{ gameState.currentSceneId=s.next; renderScene(); };
  }
  else{
    cbtn.classList.add("hidden");
    $("choice-buttons").innerHTML="<p>— End of demo —</p>";
  }
}

// ================= COMBAT =================

let player={name:"Operative",maxHp:60,hp:60,atk:12,def:6,tech:0,maxTech:30,items:2};
let enemy={name:"Syntech Drone",maxHp:40,hp:40,atk:10,def:5};

const TECH_GAIN=10;
let playerIsDefending=false;

function startCombat(){
  goToScreen("combat-screen");
  enemy.hp=enemy.maxHp;
  player.tech=0;

  $("combat-log").innerHTML="";
  log("A hostile "+enemy.name+" appears!");
  updateHUD();
}

function updateHUD(){
  $("enemy-info").textContent=`${enemy.name} — HP: ${enemy.hp}/${enemy.maxHp}`;
  $("player-info").textContent=`You — HP: ${player.hp}/${player.maxHp} | Tech: ${player.tech}/${player.maxTech} | Items: ${player.items}`;
}

function log(msg){
  const p=document.createElement("p");
  p.textContent=msg;
  $("combat-log").appendChild(p);
  $("combat-log").scrollTop=$("combat-log").scrollHeight;
}

// ---------- PLAYER ACTIONS ----------

function playerAttack(){
  const dmg=Math.max(1, player.atk - enemy.def);
  enemy.hp-=dmg;
  log(`You attack for ${dmg} damage.`);
  updateHUD();
  if(enemy.hp<=0)return endCombat(true);
  enemyTurn();
}

function playerDefend(){
  playerIsDefending=true;
  log("You brace for impact.");
  enemyTurn();
}

function playerSpecial(){
  if(player.tech<player.maxTech){ log("Not enough Tech!"); return; }
  
  const dmg=Math.max(1,player.atk*2 - enemy.def);
  enemy.hp-=dmg;
  log(`SPECIAL ATTACK for ${dmg}!`);
  player.tech=0;

  // Neon flash
  const cs=$("combat-screen");
  cs.classList.remove("special-flash-bg");
  void cs.offsetWidth;
  cs.classList.add("special-flash-bg");
  setTimeout(()=>cs.classList.remove("special-flash-bg"),250);

  updateHUD();
  if(enemy.hp<=0)return endCombat(true);
  enemyTurn();
}

function playerUseItem(){
  if(player.items<=0){ log("No items left!"); return; }
  player.items--;
  player.hp=Math.min(player.maxHp,player.hp+20);
  log("You heal 20 HP.");
  updateHUD();
  enemyTurn();
}

// ---------- ENEMY TURN ----------

function enemyTurn(){
  setTimeout(()=>{
    // 20% defend
    if(Math.random()<0.2){
      log(`${enemy.name} braces defensively.`);
      enemy.def+=2;
      setTimeout(()=>enemy.def-=2,300);
      return;
    }

    let dmg=Math.max(1, enemy.atk - player.def);
    if(playerIsDefending){
      dmg=Math.floor(dmg/2);
      playerIsDefending=false;
      log("Your defense reduces incoming damage.");
    }

    player.hp-=dmg;
    log(`${enemy.name} hits you for ${dmg}.`);
    updateHUD();

    // FULL-SCREEN RED FLASH
    const cs=$("combat-screen");
    cs.classList.remove("combat-normal","combat-hit-flash");
    void cs.offsetWidth;
    cs.classList.add("combat-hit-flash");
    setTimeout(()=>{
      cs.classList.remove("combat-hit-flash");
      cs.classList.add("combat-normal");
    },200);

    // HUD scale
    const pinfo=$("player-info");
    pinfo.classList.remove("normal","hit-animate");
    void pinfo.offsetWidth;
    pinfo.classList.add("hit-animate");
    setTimeout(()=>{
      pinfo.classList.remove("hit-animate");
      pinfo.classList.add("normal");
    },200);

    // Spark effect
    const spark=$("spark");
    spark.classList.remove("spark-active");
    void spark.offsetWidth;
    spark.classList.add("spark-active");
    setTimeout(()=>spark.classList.remove("spark-active"),200);

    player.tech=Math.min(player.maxTech,player.tech+TECH_GAIN);

    if(player.hp<=0)return endCombat(false);

  },300);
}

// ---------- END COMBAT ----------

function endCombat(win){
  goToScreen("outcome-screen");
  $("outcome-title").textContent = win ? "VICTORY!" : "GAME OVER";

  $("retryBtn").onclick = ()=>startCombat();
  $("menuBtn").onclick = ()=>goToScreen("main-menu");

  if(win){
    $("continueAfterBattle").classList.remove("hidden");
    $("continueAfterBattle").onclick = ()=>{
      gameState.currentSceneId = 6;
      goToScreen("story-screen");
      renderScene();
    };
  }
  else{
    $("continueAfterBattle").classList.add("hidden");
  }
}

// ========== DOMContentLoaded ==========

document.addEventListener("DOMContentLoaded",()=>{

  $("startBtn").onclick=()=>{
    gameState.currentSceneId=1;
    goToScreen("story-screen");
    renderScene();
  };

  $("menuBtn").onclick=()=>goToScreen("main-menu");
  $("howToPlayBtn").onclick=()=>alert("Read the story and make choices.");

  $("attackBtn").onclick=playerAttack;
  $("defendBtn").onclick=playerDefend;
  $("specialBtn").onclick=playerSpecial;
  $("itemBtn").onclick=playerUseItem;
});