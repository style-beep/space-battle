(function () {
  function generateStars() {
    const container = document.getElementById("starsContainer");
    if (!container) return;
    for (let i = 0; i < 200; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.width = Math.random() * 3 + 1 + "px";
      star.style.height = star.style.width;
      star.style.animationDelay = Math.random() * 5 + "s";
      star.style.animationDuration = Math.random() * 3 + 2 + "s";
      star.style.opacity = Math.random() * 0.6 + 0.2;
      container.appendChild(star);
    }
  }
  generateStars();

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const CW = 1000;
  const CH = 600;
  canvas.width = CW;
  canvas.height = CH;

  // Настройки сложности
  let currentDifficulty = "normal";
  let endlessMode = false;

  let difficultySettings = {
    easy: {
      name: "ЛЕГКО",
      lives: 8,
      enemySpeedMultiplier: 0.45,
      spawnDelayBase: 55,
      maxSpawnCount: 2,
      scoreMultiplier: 0.8,
    },
    normal: {
      name: "НОРМАЛЬНО",
      lives: 6,
      enemySpeedMultiplier: 0.7,
      spawnDelayBase: 42,
      maxSpawnCount: 2,
      scoreMultiplier: 1.0,
    },
    hard: {
      name: "СЛОЖНО",
      lives: 4,
      enemySpeedMultiplier: 0.95,
      spawnDelayBase: 32,
      maxSpawnCount: 3,
      scoreMultiplier: 1.2,
    },
    insane: {
      name: "БЕЗУМИЕ",
      lives: 3,
      enemySpeedMultiplier: 1.3,
      spawnDelayBase: 25,
      maxSpawnCount: 4,
      scoreMultiplier: 1.5,
    },
  };

  // Игровые переменные
  let score = 0;
  let lives = 6;
  let gameOver = false;
  let invincibleFrames = 0;
  let actualScoreMultiplier = 1.0;

  const PLAYER_RADIUS = 16;
  let player = { x: CW / 2, y: CH - 60, radius: PLAYER_RADIUS };

  let enemies = [];
  let enemySpawnTimer = 0;
  let bullets = [];
  let shootCooldown = 0;
  const SHOOT_DELAY = 8;
  let explosions = [];

  let leftPressed = false;
  let rightPressed = false;
  let mouseX = player.x;
  let useMouse = false;

  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettings = document.getElementById("closeSettings");
  const currentDifficultySpan = document.getElementById("currentDifficulty");
  const endlessModeToggle = document.getElementById("endlessModeToggle");

  function openSettingsPanel() {
    settingsOverlay.classList.add("active");
    updateDifficultyCards();
    endlessModeToggle.checked = endlessMode;
  }

  function closeSettingsPanel() {
    settingsOverlay.classList.remove("active");
  }

  function updateDifficultyCards() {
    const cards = document.querySelectorAll(".difficulty-card");
    cards.forEach((card) => {
      const diff = card.getAttribute("data-difficulty");
      if (diff === currentDifficulty) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
    currentDifficultySpan.innerText =
      difficultySettings[currentDifficulty].name;
  }

  function setDifficulty(difficulty) {
    if (!difficultySettings[difficulty]) return;

    currentDifficulty = difficulty;
    const settings = difficultySettings[difficulty];

    actualScoreMultiplier = settings.scoreMultiplier;

    restartGame();
    updateDifficultyCards();
    closeSettingsPanel();
  }

  function toggleEndlessMode() {
    endlessMode = endlessModeToggle.checked;
    restartGame();
  }

  function updateUI() {
    document.getElementById("scoreValue").innerText = Math.floor(score);
    document.getElementById("livesValue").innerText = lives;
  }

  function spawnEnemy() {
    const settings = difficultySettings[currentDifficulty];
    const radius = 9 + Math.random() * 7;
    let baseSpeed = 1.2 + Math.random() * 1.5;

    if (endlessMode && score > 0) {
      let endlessBonus = 1 + Math.floor(score / 800) * 0.15;
      baseSpeed = Math.min(baseSpeed * endlessBonus, 5.5);
    }

    enemies.push({
      x: 20 + Math.random() * (CW - 40),
      y: -radius,
      radius: radius,
      speedY: baseSpeed * settings.enemySpeedMultiplier,
    });
  }

  function addExplosion(x, y) {
    explosions.push({ x: x, y: y, life: 15, size: 12 });
  }

  function damagePlayer() {
    if (gameOver || invincibleFrames > 0) return;
    lives--;
    updateUI();
    addExplosion(player.x, player.y);

    if (lives <= 0 && !endlessMode) {
      gameOver = true;
      lives = 0;
      updateUI();
      for (let i = 0; i < 8; i++) {
        addExplosion(
          player.x + (Math.random() - 0.5) * 50,
          player.y + (Math.random() - 0.5) * 50,
        );
      }
    } else if (lives <= 0 && endlessMode) {
      lives = 1;
      updateUI();
    } else {
      invincibleFrames = 45;
    }
  }

  function shoot() {
    if (gameOver) return;
    bullets.push({
      x: player.x,
      y: player.y - PLAYER_RADIUS,
      radius: 5,
      speedY: -11,
    });
  }

  function restartGame() {
    gameOver = false;
    score = 0;
    const settings = difficultySettings[currentDifficulty];
    lives = settings.lives;
    invincibleFrames = 0;
    enemies = [];
    bullets = [];
    explosions = [];
    shootCooldown = 0;
    player.x = CW / 2;
    updateUI();
    for (let i = 0; i < 3; i++) spawnEnemy();
  }

  function updateGame() {
    if (gameOver) return;

    if (shootCooldown > 0) shootCooldown--;
    if (invincibleFrames > 0) invincibleFrames--;

    let move = 0;
    if (leftPressed) move = -1;
    if (rightPressed) move = 1;
    player.x += move * 7.5;

    if (useMouse && !leftPressed && !rightPressed) {
      let diff = mouseX - player.x;
      player.x += diff * 0.2;
    }

    player.x = Math.min(
      CW - PLAYER_RADIUS - 8,
      Math.max(PLAYER_RADIUS + 8, player.x),
    );

    if (shootCooldown === 0 && !gameOver) {
      shoot();
      shootCooldown = SHOOT_DELAY;
    }

    const settings = difficultySettings[currentDifficulty];

    if (enemySpawnTimer <= 0) {
      let count = settings.maxSpawnCount;
      if (endlessMode && score > 300) {
        count = Math.min(settings.maxSpawnCount + Math.floor(score / 600), 6);
      }
      for (let i = 0; i < count; i++) spawnEnemy();

      let spawnDelay = settings.spawnDelayBase;
      if (endlessMode && score > 200) {
        spawnDelay = Math.max(
          18,
          settings.spawnDelayBase - Math.floor(score / 500),
        );
      }
      enemySpawnTimer = spawnDelay;
    } else {
      enemySpawnTimer--;
    }

    for (let i = 0; i < bullets.length; i++) {
      bullets[i].y += bullets[i].speedY;
      if (
        bullets[i].y + bullets[i].radius < 0 ||
        bullets[i].y - bullets[i].radius > CH
      ) {
        bullets.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      e.y += e.speedY;

      if (e.y + e.radius > CH + 50) {
        enemies.splice(i, 1);
        damagePlayer();
        i--;
        continue;
      }
      if (e.y + e.radius < -50) {
        enemies.splice(i, 1);
        i--;
        continue;
      }

      let hit = false;
      for (let j = 0; j < bullets.length; j++) {
        const b = bullets[j];
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          bullets.splice(j, 1);
          hit = true;
          let points = Math.floor(10 * actualScoreMultiplier);
          score += points;
          updateUI();
          addExplosion(e.x, e.y);
          break;
        }
      }
      if (hit) {
        enemies.splice(i, 1);
        i--;
        continue;
      }

      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      if (distToPlayer < player.radius + e.radius) {
        damagePlayer();
        addExplosion(e.x, e.y);
        enemies.splice(i, 1);
        i--;
      }
    }

    if (
      endlessMode &&
      !gameOver &&
      score > 0 &&
      score % 800 < 20 &&
      lives < 10
    ) {
      if (Math.floor(score / 800) > Math.floor((score - 10) / 800)) {
        lives = Math.min(lives + 1, 10);
        updateUI();
        addExplosion(player.x, player.y - 20);
      }
    }

    for (let i = 0; i < explosions.length; i++) {
      explosions[i].life--;
      if (explosions[i].life <= 0) {
        explosions.splice(i, 1);
        i--;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, CW, CH);

    const grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "#070B1A");
    grad.addColorStop(1, "#0A0E1F");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    for (let i = 0; i < 150; i++) {
      if (i % 2 === 0) continue;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.002 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc((i * 131) % CW, (i * 253) % CH, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of enemies) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ff3366";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = "#dd2255";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4466";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x - 3, e.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(e.x + 3, e.y - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x - 2.5, e.y - 2.5, 0.8, 0, Math.PI * 2);
      ctx.arc(e.x + 3.5, e.y - 2.5, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.restore();
    }

    for (const b of bullets) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#0af";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0cf";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (invincibleFrames > 0 && Math.floor(Date.now() / 60) % 3 === 0) {
      ctx.globalAlpha = 0.5;
    }
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#0ff";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.radius);
    ctx.lineTo(player.x + player.radius * 0.9, player.y + player.radius * 0.4);
    ctx.lineTo(player.x + player.radius * 0.4, player.y + player.radius * 0.15);
    ctx.lineTo(player.x + player.radius * 0.4, player.y + player.radius * 0.6);
    ctx.lineTo(player.x, player.y + player.radius * 0.3);
    ctx.lineTo(player.x - player.radius * 0.4, player.y + player.radius * 0.6);
    ctx.lineTo(player.x - player.radius * 0.4, player.y + player.radius * 0.15);
    ctx.lineTo(player.x - player.radius * 0.9, player.y + player.radius * 0.4);
    ctx.closePath();
    const gradPlayer = ctx.createLinearGradient(
      player.x - 5,
      player.y - 8,
      player.x + 5,
      player.y + 10,
    );
    gradPlayer.addColorStop(0, "#4effa5");
    gradPlayer.addColorStop(1, "#00cc88");
    ctx.fillStyle = gradPlayer;
    ctx.fill();
    ctx.strokeStyle = "#ccffdd";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    for (const ex of explosions) {
      const intensity = ex.life / 15;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, ex.size * (1 - intensity) + 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 80, 40, ${0.9 * (1 - intensity)})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        ex.x,
        ex.y,
        ex.size * (0.6 - intensity * 0.3) + 3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255, 200, 50, 1)`;
      ctx.fill();
    }

    if (gameOver && lives <= 0) {
      ctx.font = '800 52px "Orbitron", monospace';
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      const gradGO = ctx.createLinearGradient(
        CW / 2 - 100,
        CH / 2 - 60,
        CW / 2 + 100,
        CH / 2,
      );
      gradGO.addColorStop(0, "#ff3366");
      gradGO.addColorStop(1, "#ff6699");
      ctx.fillStyle = gradGO;
      ctx.fillText("GAME OVER", CW / 2, CH / 2 - 40);
      ctx.font = '500 18px "Orbitron", monospace';
      ctx.fillStyle = "#aaddff";
      ctx.fillText("⟳ НАЖМИТЕ КНОПКУ ИЛИ R", CW / 2, CH / 2 + 30);
      ctx.font = "400 14px monospace";
      ctx.fillStyle = "#6688aa";
      ctx.fillText("чтобы продолжить битву", CW / 2, CH / 2 + 65);
      ctx.textAlign = "left";
    }
  }

  function keyDownHandler(e) {
    const code = e.code;
    if (code === "ArrowLeft" || code === "KeyA") {
      leftPressed = true;
      e.preventDefault();
    }
    if (code === "ArrowRight" || code === "KeyD") {
      rightPressed = true;
      e.preventDefault();
    }
    if (code === "KeyR") {
      restartGame();
      e.preventDefault();
    }
    if (code === "Escape") {
      closeSettingsPanel();
      e.preventDefault();
    }
    if (code === "Space") {
      e.preventDefault();
    }
  }

  function keyUpHandler(e) {
    const code = e.code;
    if (code === "ArrowLeft" || code === "KeyA") {
      leftPressed = false;
      e.preventDefault();
    }
    if (code === "ArrowRight" || code === "KeyD") {
      rightPressed = false;
      e.preventDefault();
    }
  }

  function mouseMoveHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = CW / rect.width;
    let canvasX = (e.clientX - rect.left) * scale;
    canvasX = Math.min(CW - 20, Math.max(20, canvasX));
    mouseX = canvasX;
    useMouse = true;
  }

  function touchMoveHandler(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scale = CW / rect.width;
    let canvasX = (e.touches[0].clientX - rect.left) * scale;
    canvasX = Math.min(CW - 20, Math.max(20, canvasX));
    mouseX = canvasX;
    useMouse = true;
  }

  function initSettings() {
    settingsBtn.addEventListener("click", openSettingsPanel);
    closeSettings.addEventListener("click", closeSettingsPanel);

    settingsOverlay.addEventListener("click", (e) => {
      if (e.target === settingsOverlay) {
        closeSettingsPanel();
      }
    });

    const difficultyCards = document.querySelectorAll(".difficulty-card");
    difficultyCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const difficulty = card.getAttribute("data-difficulty");
        setDifficulty(difficulty);
      });
    });

    endlessModeToggle.addEventListener("change", toggleEndlessMode);
  }

  window.addEventListener("keydown", keyDownHandler);
  window.addEventListener("keyup", keyUpHandler);
  canvas.addEventListener("mousemove", mouseMoveHandler);
  canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    touchMoveHandler(e);
  });
  document
    .getElementById("restartButton")
    .addEventListener("click", () => restartGame());

  initSettings();
  for (let i = 0; i < 3; i++) spawnEnemy();
  updateUI();
  updateDifficultyCards();

  function gameLoop() {
    updateGame();
    draw();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
})();
