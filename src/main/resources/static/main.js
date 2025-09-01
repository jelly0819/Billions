// Game state
// 音频元素引用
const bgMusic = document.getElementById('bgMusic');
const coinSound = document.getElementById('coinSound');
const jumpSound = document.getElementById('jumpSound');
const attackSound = document.getElementById('attackSound');
const damageSound = document.getElementById('damageSound');
const levelUpSound = document.getElementById('levelUpSound');
const musicToggle = document.getElementById('musicToggle');
const musicVolume = document.getElementById('musicVolume');

// 音频设置
let musicPlaying = false;

const gameState = {
    running: false,
    score: 0,
    lives: 3,
    level: 1,
    gravity: 0.5,
    gameOver: false,
    bossActive: false,
    playerDamage: 1,
    jumpPower: 12,
    playerDirection: 1,
    coins: 0
};

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function setCanvasSize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

setCanvasSize();

// Player object
const player = {
    x: 50,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    velX: 0,
    velY: 0,
    speed: 5,
    jumping: false,
    grounded: false,
    color: '#6c5ce7',
    health: 3,
    maxHealth: 3
};

// Platforms array
const platforms = [];

// Create platforms
function createPlatforms() {
    platforms.length = 0;
    
    // Ground platform
    platforms.push({
        x: 0,
        y: canvas.height - 50,
        width: canvas.width,
        height: 50,
        color: '#2d3436'
    });

    // Additional platforms
    const platformCount = Math.floor(canvas.width / 200);
    for (let i = 0; i < platformCount; i++) {
        platforms.push({
            x: i * 200 + 50,
            y: canvas.height - 150 - Math.random() * 100,
            width: 100,
            height: 20,
            color: '#636e72'
        });
    }

    // Add some moving platforms
    if (canvas.width > 600) {
        platforms.push({
            x: 200,
            y: canvas.height - 250,
            width: 80,
            height: 15,
            color: '#74b9ff',
            moving: true,
            speed: 1,
            direction: 1,
            minX: 150,
            maxX: 350
        });

        platforms.push({
            x: 400,
            y: canvas.height - 350,
            width: 80,
            height: 15,
            color: '#74b9ff',
            moving: true,
            speed: 1.5,
            direction: -1,
            minX: 300,
            maxX: 500
        });
    }

    // Add bounce platforms
    platforms.push({
        x: canvas.width - 150,
        y: canvas.height - 200,
        width: 60,
        height: 15,
        color: '#00b894',
        bounce: true,
        bouncePower: 15
    });
}

createPlatforms();

// Load images with error handling
const playerImage = new Image();
playerImage.src = './img/Javi.png';
playerImage.onerror = function() {
    console.log('Player image failed to load');
};

const enemyRobotImage = new Image();
enemyRobotImage.src = './img/bot1.png';
enemyRobotImage.onerror = function() {
    console.log('Enemy robot image failed to load');
};

const blueRobotImage = new Image();
blueRobotImage.src = './img/addition.png';
blueRobotImage.onerror = function() {
    console.log('加成机器人图像加载失败');
};

const bossImage = new Image();
bossImage.src = './img/bot1.png';
bossImage.onerror = function() {
    console.log('Boss image failed to load');
};

// Power-up images
const powerUpImages = {
    shield: new Image(),
    zk: new Image(),
    speed: new Image()
};

powerUpImages.shield.src = './img/addition.png';
powerUpImages.shield.onerror = function() {
    console.log('Shield power-up image failed to load');
};

powerUpImages.zk.src = './img/addition.png';
powerUpImages.zk.onerror = function() {
    console.log('ZK power-up image failed to load');
};

powerUpImages.speed.src = './img/addition.png';
powerUpImages.speed.onerror = function() {
    console.log('Speed power-up image failed to load');
};

// Collectible images
const coinImage = new Image();
coinImage.src = './img/Props/coin.png';
coinImage.onerror = function() {
    console.log('Coin image not found, using yellow circle drawing instead');
};



// Robots array
const robots = [];

// 加成机器人 array (friendly)
const bonusRobots = [];

let boss = null;

// Collectibles arrays
const coins = [];

// Power-ups array
const powerUps = [];

// Projectiles array
const projectiles = [];

// Active powers
const activePowers = {
    shield: false,
    zk: false,
    speed: false
};

// Ability cooldowns
const abilityCooldowns = {
    blast: 0,
    heal: 0,
    chain: 0
};

// Basic attack cooldown
let basicAttackCooldown = 0;

// Keyboard control
const keys = {};

// Update UI display
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('coins').textContent = gameState.coins;

    // Update power-up display
    document.getElementById('shield-power').classList.toggle('active', activePowers.shield);
    document.getElementById('zk-power').classList.toggle('active', activePowers.zk);
    document.getElementById('speed-power').classList.toggle('active', activePowers.speed);

    // Update ability cooldowns
    updateAbilityCooldown('blast', abilityCooldowns.blast);
    updateAbilityCooldown('heal', abilityCooldowns.heal);
    updateAbilityCooldown('chain', abilityCooldowns.chain);
}

// Update ability cooldown display
function updateAbilityCooldown(ability, cooldown) {
    const element = document.getElementById(`${ability}-ability`);
    const cooldownBar = element.querySelector('.ability-cooldown');
    let maxCooldown = 120;

    if (ability === 'heal') maxCooldown = 180;
    if (ability === 'chain') maxCooldown = 240;

    if (cooldown > 0) {
        element.classList.add('disabled');
        cooldownBar.style.width = `${(cooldown / maxCooldown) * 100}%`;
    } else {
        element.classList.remove('disabled');
        cooldownBar.style.width = '0%';
    }
}

// Game loop
function gameLoop() {
    if (!gameState.running || gameState.gameOver) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background
    ctx.fillStyle = '#0d1128';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply gravity
    player.velY += gameState.gravity;

    // Update player position
    player.x += player.velX;
    player.y += player.velY;

    // Ensure player doesn't fall below canvas
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.jumping = false;
        player.grounded = true;
    }

    // Ensure player doesn't move outside left/right boundaries
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }

    // Update moving platforms
    updateMovingPlatforms();

    // Platform collision detection
    player.grounded = false;
    for (const platform of platforms) {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            // Collision from above
            if (player.y + player.height < platform.y + platform.height && player.velY > 0) {
                player.y = platform.y - player.height;
                player.velY = 0;
                player.jumping = false;
                player.grounded = true;
            }
        }
        if (platform.bounce &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y &&
            player.velY > 0) {
            player.velY = -platform.bouncePower;
        }

        // Draw platform
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Update and draw collectibles
    updateCollectibles();

    // Update and draw robots
    updateRobots();

    // Update and draw 加成机器人
        updateBonusRobots();

    // Update and draw boss
    updateBoss();

    // Update and draw power-ups
    updatePowerUps();

    // Update and draw projectiles
    updateProjectiles();

    // Draw player
    if (playerImage.complete) {
        // Flip image based on direction
        ctx.save();
        if (gameState.playerDirection === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, -player.x - player.width, player.y, player.width, player.height);
        } else {
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        }
        ctx.restore();
    } else {
        // Fallback to rectangle
        ctx.fillStyle = activePowers.shield ? '#00cec9' : player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw player eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 10, player.y + 10, 5, 5);
        ctx.fillRect(player.x + 25, player.y + 10, 5, 5);
    }

    // Draw health bar
    drawHealthBar();

    // Draw direction indicator
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Direction: ${gameState.playerDirection === 1 ? 'Right' : 'Left'}`, 10, 20);
    ctx.fillText('Press Q to switch', 10, 35);

    // Update UI
    updateUI();

    // Update ability cooldowns
    updateAbilityCooldowns();

    // Check level completion condition
    if (robots.length === 0 && bonusRobots.length === 0 && (!gameState.bossActive || boss.health <= 0)) {
        if (gameState.bossActive) {
            gameState.score += 100; // Bonus for defeating boss
            gameState.bossActive = false;
            boss = null;
        }

        gameState.running = false;
        showLevelUpScreen();
    }

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update moving platforms
function updateMovingPlatforms() {
    for (const platform of platforms) {
        if (platform.moving) {
            platform.x += platform.speed * platform.direction;

            if (platform.x <= platform.minX || platform.x >= platform.maxX) {
                platform.direction *= -1;
            }
        }
    }
}

// Update collectibles
function updateCollectibles() {
    // Draw and check coin collection
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];

        // Draw coin
        if (coinImage.complete) {
            ctx.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);
        } else {
            // Fallback to circle if image not loaded
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#b8860b';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Check collection
        if (
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y
        ) {
            coins.splice(i, 1);
            gameState.coins += 1;
            gameState.score += 5;
            playSound(coinSound); // 播放金币音效
        }
    }

    // 只保留金币掉落，去掉经验值掉落
}

// Update robots
function updateRobots() {
    for (let i = 0; i < robots.length; i++) {
        const robot = robots[i];

        if (robot.health <= 0) {
            robots.splice(i, 1);
            gameState.score += 10;
            spawnCollectible(robot.x, robot.y, 'coin');
            i--; // 调整索引
            continue; // 跳过当前循环的剩余部分
        }

        // Move robot based on type
        if (robot.type === 'normal') {
            robot.x += robot.speed * robot.direction;

            // Change direction when robot hits boundary
            if (robot.x <= 0 || robot.x >= canvas.width - robot.width) {
                robot.direction *= -1;
            }
        } else if (robot.type === 'jumper') {
            // Jumper robots move more slowly but jump occasionally
            robot.x += robot.speed * 0.7 * robot.direction;

            // Change direction when robot hits boundary
            if (robot.x <= 0 || robot.x >= canvas.width - robot.width) {
                robot.direction *= -1;
            }

            // Occasionally jump
            if (Math.random() < 0.01 && robot.grounded) {
                robot.velY = -10;
                robot.grounded = false;
            }

            // Apply gravity to jumper robots
            robot.velY += gameState.gravity;
            robot.y += robot.velY;

            // Ground collision for jumper robots
            if (robot.y > canvas.height - robot.height) {
                robot.y = canvas.height - robot.height;
                robot.velY = 0;
                robot.grounded = true;
            }
        } else if (robot.type === 'shooter') {
            // Shooter robots move slowly and shoot periodically
            robot.x += robot.speed * 0.5 * robot.direction;

            // Change direction when robot hits boundary
            if (robot.x <= 0 || robot.x >= canvas.width - robot.width) {
                robot.direction *= -1;
            }

            // Shoot periodically
            if (Math.random() < 0.01) {
                projectiles.push({
                    x: robot.x + robot.width/2,
                    y: robot.y + robot.height/2,
                    radius: 5,
                    speed: 5,
                    direction: player.x > robot.x ? 1 : -1,
                    color: '#ff5555',
                    enemy: true
                });
            }
        }

        // Detect if player jumps on robot
        if (
            player.x < robot.x + robot.width &&
            player.x + player.width > robot.x &&
            player.y < robot.y + robot.height &&
            player.y + player.height > robot.y &&
            player.velY > 0
        ) {
            // Jumped on robot from above
            robot.health -= gameState.playerDamage;

            if (robot.health <= 0) {
                robots.splice(i, 1);
                gameState.score += 10;
                // Spawn a coin when robot is defeated
                spawnCollectible(robot.x, robot.y, 'coin');
                i--;
            }

            player.velY = -10; // Bounce effect
            continue;
        }

        // Detect if player touches robot (from side or below)
        if (
            player.x < robot.x + robot.width &&
            player.x + player.width > robot.x &&
            player.y < robot.y + robot.height &&
            player.y + player.height > robot.y
        ) {
            if (!activePowers.shield) {
                player.health--;
            playSound(damageSound); // 播放受伤音效
            player.x = 50; // Reset player position
            player.y = canvas.height - 100;

                if (player.health <= 0) {
                    gameState.lives--;
                    player.health = player.maxHealth;

                    if (gameState.lives <= 0) {
                        gameOver();
                    }
                }
            }
        }

        // Draw robot using image
        if (enemyRobotImage.complete) {
            ctx.save();
            if (robot.direction === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    enemyRobotImage,
                    -robot.x - robot.width,
                    robot.y,
                    robot.width,
                    robot.height
                );
            } else {
                ctx.drawImage(
                    enemyRobotImage,
                    robot.x,
                    robot.y,
                    robot.width,
                    robot.height
                );
            }
            ctx.restore();
        } else {
            // Fallback to rectangle if image not loaded
            ctx.fillStyle = robot.color;
            ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(robot.x + 5, robot.y + 5, 5, 5);
            ctx.fillRect(robot.x + 20, robot.y + 5, 5, 5);
        }

        // Draw health bar for robots
        if (robot.health < robot.maxHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(robot.x, robot.y - 10, robot.width, 5);

            ctx.fillStyle = '#00ff00';
            ctx.fillRect(robot.x, robot.y - 10, (robot.health / robot.maxHealth) * robot.width, 5);
        }
    }
}

// Update 加成机器人 (friendly)
function updateBonusRobots() {
    for (let i = 0; i < bonusRobots.length; i++) {
        const bonusRobot = bonusRobots[i];

        // Move 加成机器人 slowly
        bonusRobot.x += bonusRobot.speed * bonusRobot.direction;

        // Change direction when 加成机器人 hits boundary
        if (bonusRobot.x <= 0 || bonusRobot.x >= canvas.width - bonusRobot.width) {
            bonusRobot.direction *= -1;
        }

        // Detect if player collects 加成机器人
        if (
            player.x < bonusRobot.x + bonusRobot.width &&
            player.x + player.width > bonusRobot.x &&
            player.y < bonusRobot.y + bonusRobot.height &&
            player.y + player.height > bonusRobot.y
        ) {
            bonusRobots.splice(i, 1);
            i--;

            // 加成机器人 gives special bonus
            gameState.score += 25;
            gameState.coins += 5;

            // Random power-up
            const powerTypes = ['shield', 'zk', 'speed'];
            const randomPower = powerTypes[Math.floor(Math.random() * powerTypes.length)];
            activePowers[randomPower] = true;

            // Power lasts for 10 seconds
            setTimeout(() => {
                activePowers[randomPower] = false;
                updateUI();
            }, 10000);

            continue;
        }

        // Draw 加成机器人 using image
        if (blueRobotImage.complete) {
            ctx.save();
            if (bonusRobot.direction === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    blueRobotImage,
                    -bonusRobot.x - bonusRobot.width,
                    bonusRobot.y,
                    bonusRobot.width,
                    bonusRobot.height
                );
            } else {
                ctx.drawImage(
                    blueRobotImage,
                    bonusRobot.x,
                    bonusRobot.y,
                    bonusRobot.width,
                    bonusRobot.height
                );
            }
            ctx.restore();
        } else {
            // Fallback to rectangle if image not loaded
            ctx.fillStyle = '#3498db';
            ctx.fillRect(bonusRobot.x, bonusRobot.y, bonusRobot.width, bonusRobot.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(bonusRobot.x + 5, bonusRobot.y + 5, 5, 5);
            ctx.fillRect(bonusRobot.x + 20, bonusRobot.y + 5, 5, 5);
        }
    }
}

// Update boss
function updateBoss() {
    if (!gameState.bossActive || !boss) return;

    // Move boss
    boss.x += boss.speed * boss.direction;

    // Change direction when boss hits boundary
    if (boss.x <= 0 || boss.x >= canvas.width - boss.width) {
        boss.direction *= -1;
    }

    // Boss attacks - less frequent for easier gameplay
    if (Math.random() < 0.02) {
        // Shoot projectiles
        projectiles.push({
            x: boss.x + boss.width/2,
            y: boss.y + boss.height/2,
            radius: 8,
            speed: 4,
            direction: player.x > boss.x ? 1 : -1,
            color: '#ff5555',
            enemy: true
        });
    }

    if (Math.random() < 0.008) {
        // Jump attack - less frequent
        boss.velY = -12;
    }

    // Apply gravity to boss
    boss.velY += gameState.gravity;
    boss.y += boss.velY;

    // Ground collision for boss
    if (boss.y > canvas.height - boss.height) {
        boss.y = canvas.height - boss.height;
        boss.velY = 0;
    }

    // Detect if player jumps on boss
    if (
        player.x < boss.x + boss.width &&
        player.x + player.width > boss.x &&
        player.y < boss.y + boss.height &&
        player.y + player.height > boss.y &&
        player.velY > 0
    ) {
        // Jumped on boss from above
        boss.health -= gameState.playerDamage;
        player.velY = -12; // Bounce effect

        if (boss.health <= 0) {
            gameState.score += 100;
            // Spawn multiple coins when boss is defeated
            for (let i = 0; i < 5; i++) {
                spawnCollectible(boss.x + Math.random() * boss.width, boss.y + Math.random() * boss.height, 'coin');
            }

            // 只保留金币掉落，去掉经验值掉落
        }
    }

    // Detect if player touches boss (from side or below)
    if (
        player.x < boss.x + boss.width &&
        player.x + player.width > boss.x &&
        player.y < boss.y + boss.height &&
        player.y + player.height > boss.y
    ) {
        if (!activePowers.shield) {
            player.health -= 1; // Reduced from 2 to 1 damage
            playSound(damageSound); // 播放受伤音效
            player.x = 50;
            player.y = canvas.height - 100;

            if (player.health <= 0) {
                gameState.lives--;
                player.health = player.maxHealth;

                if (gameState.lives <= 0) {
                    gameOver();
                }
            }
        }
    }

    // Draw boss
    if (bossImage.complete) {
        ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
    } else {
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    }

    // Draw boss health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(canvas.width/2 - 100, 20, 200, 15);

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(canvas.width/2 - 100, 20, (boss.health / boss.maxHealth) * 200, 15);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`BOSS: ${boss.health}/${boss.maxHealth}`, canvas.width/2 - 30, 32);
}

// Update power-ups
function updatePowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        const powerUp = powerUps[i];

        // Draw power-up image
        if (powerUpImages[powerUp.type] && powerUpImages[powerUp.type].complete) {
            ctx.drawImage(powerUpImages[powerUp.type], powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        } else {
            // Fallback to colored rectangle if image not loaded
            ctx.fillStyle = powerUp.color;
            ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            // Draw text label as fallback
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(
                powerUp.type === 'shield' ? 'S' : powerUp.type === 'zk' ? 'ZK' : 'F',
                powerUp.x + 5,
                powerUp.y + 15
            );
        }

        // Detect if player collects power-up
        if (
            player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y
        ) {
            // Activate the corresponding power
            activePowers[powerUp.type] = true;
            powerUps.splice(i, 1);
            i--;

            // Power lasts for 10 seconds
            setTimeout(() => {
                activePowers[powerUp.type] = false;
                updateUI();
            }, 10000);
        }
    }

    // Apply speed power-up
    player.speed = activePowers.speed ? 8 : 5;
}

// Update projectiles
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        // Move projectile
        projectile.x += projectile.speed * projectile.direction;

        // Remove projectiles that go off screen
        if (projectile.x < 0 || projectile.x > canvas.width) {
            projectiles.splice(i, 1);
            continue;
        }

        // Draw projectile
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();

        // Enemy projectiles hurt player
        if (projectile.enemy) {
            if (
                player.x < projectile.x + projectile.radius &&
                player.x + player.width > projectile.x - projectile.radius &&
                player.y < projectile.y + projectile.radius &&
                player.y + player.height > projectile.y - projectile.radius
            ) {
                if (!activePowers.shield) {
                    player.health--;
        playSound(damageSound); // 播放受伤音效

        if (player.health <= 0) {
                        gameState.lives--;
                        player.health = player.maxHealth;

                        if (gameState.lives <= 0) {
                            gameOver();
                        }
                    }
                }

                projectiles.splice(i, 1);
            }
        }
        // Player projectiles damage enemies
        else {
            let hit = false;

            // Check against robots
            for (let j = 0; j < robots.length; j++) {
                const robot = robots[j];

                if (
                    robot.x < projectile.x + projectile.radius &&
                    robot.x + robot.width > projectile.x - projectile.radius &&
                    robot.y < projectile.y + projectile.radius &&
                    robot.y + robot.height > projectile.y - projectile.radius
                ) {
                    robot.health -= 2;

                    if (robot.health <= 0) {
                        robots.splice(j, 1);
                        gameState.score += 10;
                        spawnCollectible(robot.x, robot.y, 'coin');
                    }

                    hit = true;
                    break;
                }
            }

            // Check against boss
            if (!hit && gameState.bossActive && boss) {
                if (
                    boss.x < projectile.x + projectile.radius &&
                    boss.x + boss.width > projectile.x - projectile.radius &&
                    boss.y < projectile.y + projectile.radius &&
                    boss.y + boss.height > projectile.y - projectile.radius
                ) {
                    boss.health -= 2;
                    hit = true;
                }
            }

            if (hit) {
                projectiles.splice(i, 1);
            }
        }
    }
}

// Draw player health bar
function drawHealthBar() {
    const barWidth = 40;
    const barHeight = 5;
    const x = player.x;
    const y = player.y - 10;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x, y, (player.health / player.maxHealth) * barWidth, barHeight);
}

// Update ability cooldowns
function updateAbilityCooldowns() {
    if (abilityCooldowns.blast > 0) abilityCooldowns.blast--;
    if (abilityCooldowns.heal > 0) abilityCooldowns.heal--;
    if (abilityCooldowns.chain > 0) abilityCooldowns.chain--;
    if (basicAttackCooldown > 0) basicAttackCooldown--;
}

// Spawn collectible
function spawnCollectible(x, y, type) {
    if (type === 'coin') {
        coins.push({
            x: x,
            y: y,
            width: 15,
            height: 15
        });
    }
    // 只保留金币掉落，去掉经验值掉落
}

// Use basic attack
function useBasicAttack() {
    if (basicAttackCooldown > 0) return;

    playSound(attackSound); // 播放攻击音效
    
    // Create a simple projectile
    projectiles.push({
        x: player.x + player.width/2,
        y: player.y + player.height/2,
        radius: 4,
        speed: 7,
        direction: gameState.playerDirection,
        color: '#6c5ce7',
        enemy: false
    });

    basicAttackCooldown = 15; // Short cooldown
}

// Use data blast ability
function useDataBlast() {
    if (abilityCooldowns.blast > 0) return;

    playSound(attackSound); // 播放攻击音效
    
    // Create multiple projectiles in a spread pattern
    for (let i = -1; i <= 1; i++) {
        projectiles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            radius: 6,
            speed: 7,
            direction: gameState.playerDirection + i * 0.3,
            color: '#6c5ce7',
            enemy: false
        });
    }

    abilityCooldowns.blast = 120; // 2 second cooldown at 60fps
}

// Use heal ability
function useHeal() {
    if (abilityCooldowns.heal > 0) return;

    player.health = Math.min(player.health + 1, player.maxHealth);
    abilityCooldowns.heal = 180; // 3 second cooldown at 60fps
}

// Use chain attack ability
function useChainAttack() {
    if (abilityCooldowns.chain > 0) return;

    playSound(attackSound); // 播放攻击音效
    
    if (robots.length > 0) {
        // Find closest robot
        let closestRobot = null;
        let minDistance = Infinity;

        for (const robot of robots) {
            const dx = robot.x - player.x;
            const dy = robot.y - player.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestRobot = robot;
            }
        }

        if (closestRobot) {
            // Create a chain lightning effect
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
            ctx.lineTo(closestRobot.x + closestRobot.width/2, closestRobot.y + closestRobot.height/2);
            ctx.stroke();

            // Damage the robot
            closestRobot.health -= 3;

            if (closestRobot.health <= 0) {
                const index = robots.indexOf(closestRobot);
                if (index > -1) {
                    robots.splice(index, 1);
                    gameState.score += 10;
                    spawnCollectible(closestRobot.x, closestRobot.y, 'coin');
                }
            }
        }
    }

    abilityCooldowns.chain = 240; // 4 second cooldown
}

// Switch attack direction
function switchDirection() {
    gameState.playerDirection *= -1;
}

//创建机器人数组
const robotTypes = [
    { type: 'normal', health: 1, speed: 1, color: '#ff7675' },
    { type: 'jumper', health: 1, speed: 0.7, color: '#fd79a8' },
    { type: 'shooter', health: 2, speed: 0.5, color: '#e17055' },
    { type: 'tank', health: 3, speed: 0.3, color: '#d63031' }, // 新类型：坦克
    { type: 'speedy', health: 1, speed: 1.5, color: '#00b894' } // 新类型：快速
];

// Next level
function nextLevel() {
    gameState.level++;

    // Add more robots with increased speed and variety
    const robotCount = Math.min(gameState.level + 2, 8); // Cap at 8 robots

    for (let i = 0; i < robotCount; i++) {
        const selectedType = robotTypes[Math.floor(Math.random() * robotTypes.length)];

        let type = 'normal';
        if (gameState.level >= 2 && Math.random() < 0.3) type = 'jumper';
        if (gameState.level >= 4 && Math.random() < 0.2) type = 'shooter';

        const robot = {
            x: Math.random() * (canvas.width - 60) + 50,
            y: Math.random() * (canvas.height - 200) + 50,
            width: 50,
            height: 50,
            speed: 1 + Math.random() * gameState.level * 0.3, // Reduced speed scaling
            direction: Math.random() > 0.5 ? 1 : -1,
            color: '#ff7675',
            type: type,
            health: type === 'shooter' ? 2 : 1,
            maxHealth: type === 'shooter' ? 2 : 1,
            grounded: false,
            velY: 0
        };

        robots.push(robot);
    }

    // Add 加成机器人 (friendly)
    if (Math.random() < 0.5) {
        const bonusRobotCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < bonusRobotCount; i++) {
            bonusRobots.push({
                x: Math.random() * (canvas.width - 60) + 50,
                y: Math.random() * (canvas.height - 200) + 50,
                width: 50,
                height: 50,
                speed: 1,
                direction: Math.random() > 0.5 ? 1 : -1,
                color: '#3498db'
            });
        }
    }

    // Add boss every 5 levels (instead of 3)
    if (gameState.level % 5 === 0) {
        gameState.bossActive = true;
        boss = {
            x: canvas.width / 2 - 40,
            y: canvas.height - 200,
            width: 80,
            height: 80,
            speed: 1.5, // Reduced speed
            direction: 1,
            color: '#ff5555',
            health: 5 + 3 * Math.floor(gameState.level / 5), // Reduced health scaling
            maxHealth: 5 + 3 * Math.floor(gameState.level / 5),
            velY: 0
        };
    }

    // Add power-ups (more frequently)
    if (Math.random() < 0.8) {
        powerUps.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 200) + 50,
            width: 20,
            height: 20,
            type: ['shield', 'zk', 'speed'][Math.floor(Math.random() * 3)],
            color: '#00cec9'
        });
    }

    // Add some coins (more coins)
    for (let i = 0; i < 8; i++) {
        spawnCollectible(
            Math.random() * (canvas.width - 100) + 50,
            Math.random() * (canvas.height - 200) + 50,
            'coin'
        );
    }

    // 只保留金币掉落，去掉经验值掉落
}

// Show level up screen
function showLevelUpScreen() {
    document.getElementById('level-up').style.display = 'block';
    playSound(levelUpSound); // 播放升级音效
}

// Apply upgrade
function applyUpgrade(upgrade) {
    if (upgrade === 'health') {
        player.maxHealth++;
        player.health = player.maxHealth;
    } else if (upgrade === 'speed') {
        player.speed += 0.5;
    } else if (upgrade === 'damage') {
        gameState.playerDamage += 0.2;
    } else if (upgrade === 'jump') {
        gameState.jumpPower += 1.5;
    }

    document.getElementById('level-up').style.display = 'none';
    gameState.running = true;
    nextLevel();
    gameLoop();
}

// Game over
function gameOver() {
    gameState.gameOver = true;
    gameState.running = false;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-coins').textContent = gameState.coins;
    document.getElementById('game-over').style.display = 'flex';
}

// Initialize game
function initGame() {
    // 如果音乐还没播放，尝试在游戏开始时播放
    if (!musicPlaying) {
        toggleMusic();
    }
    
    // Reset game state
    gameState.running = true;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.bossActive = false;
    gameState.playerDamage = 1;
    gameState.jumpPower = 12;
    gameState.playerDirection = 1;

    // Reset player
    player.x = 50;
    player.y = canvas.height - 100;
    player.velX = 0;
    player.velY = 0;
    player.speed = 5;
    player.maxHealth = 3;
    player.health = 3;

    // Clear arrays
    robots.length = 0;
    bonusRobots.length = 0;
    powerUps.length = 0;
    coins.length = 0;
    projectiles.length = 0;

    // Reset abilities
    abilityCooldowns.blast = 0;
    abilityCooldowns.heal = 0;
    abilityCooldowns.chain = 0;
    basicAttackCooldown = 0;

    // Reset powers
    activePowers.shield = false;
    activePowers.zk = false;
    activePowers.speed = false;

    // Recreate platforms
    createPlatforms();

    // Add initial robots and power-ups
    nextLevel();

    // Hide game over and level up screens
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('level-up').style.display = 'none';

    // Update UI
    updateUI();

    // Start game loop
    gameLoop();
}

// Event listeners
document.addEventListener('keydown', function(e) {
    keys[e.key] = true;

    // Jump
    if ((e.key === 'w' || e.key === 'W' || e.key === ' ' || e.key === 'ArrowUp') && player.grounded) {
        player.velY = -gameState.jumpPower;
        player.jumping = true;
        player.grounded = false;
        playSound(jumpSound); // 播放跳跃音效
    }

    // Ability keys
    if (e.key === '1') {
        useDataBlast();
    }

    if (e.key === '2') {
        useHeal();
    }

    if (e.key === '3') {
        useChainAttack();
    }

    // Basic attack
    if (e.key === 'f' || e.key === 'F') {
        useBasicAttack();
    }

    // Switch direction
    if (e.key === 'q' || e.key === 'Q') {
        switchDirection();
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

// Button events
document.getElementById('start-btn').addEventListener('click', function() {
    if (!gameState.running) {
        initGame();
    }
});

document.getElementById('pause-btn').addEventListener('click', function() {
    gameState.running = !gameState.running;
    if (gameState.running) {
        gameLoop();
    }
});

document.getElementById('restart-btn').addEventListener('click', initGame);

// Ability click events
document.getElementById('blast-ability').addEventListener('click', useDataBlast);
document.getElementById('heal-ability').addEventListener('click', useHeal);
document.getElementById('chain-ability').addEventListener('click', useChainAttack);

// Upgrade option events
document.querySelectorAll('.upgrade-option').forEach(option => {
    option.addEventListener('click', function() {
        if (gameState.running) return;
        applyUpgrade(this.dataset.upgrade);
    });
});

// Handle player movement
function handlePlayerMovement() {
    player.velX = 0;

    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        player.velX = -player.speed;
        gameState.playerDirection = -1;
    }

    if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        player.velX = player.speed;
        gameState.playerDirection = 1;
    }
}

//  Movement handling loop
setInterval(handlePlayerMovement, 10);

// 音频控制函数
function toggleMusic() {
    if (musicPlaying) {
        bgMusic.pause();
        musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        // 尝试播放背景音乐，如果失败可能是因为浏览器的自动播放限制
        bgMusic.play().catch(e => {
            console.log('Background music play prevented:', e);
            // 在用户与页面交互后再尝试播放
            document.addEventListener('click', attemptPlayBgMusic, { once: true });
        });
        musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
    musicPlaying = !musicPlaying;
}

function attemptPlayBgMusic() {
    bgMusic.play().catch(e => {
        console.log('Background music still cannot play:', e);
    });
}

function setVolume() {
    bgMusic.volume = musicVolume.value;
    // 为所有音效设置相同的音量
    coinSound.volume = musicVolume.value;
    jumpSound.volume = musicVolume.value;
    attackSound.volume = musicVolume.value;
    damageSound.volume = musicVolume.value;
    levelUpSound.volume = musicVolume.value;
}

// 播放音效函数
function playSound(soundElement) {
    // 重置音效以允许连续播放
    soundElement.currentTime = 0;
    // 尝试播放音效，如果失败则忽略
    soundElement.play().catch(e => {
        console.log('Sound play prevented:', e);
    });
}

// 初始化音频控制
musicToggle.addEventListener('click', toggleMusic);
musicVolume.addEventListener('input', setVolume);
setVolume(); // 设置初始音量

// Initialize canvas dimensions on resize
window.addEventListener('resize', function() {
    setCanvasSize();
    createPlatforms();
});

// Initial render
ctx.fillStyle = '#0d1128';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#fff';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Click "Start Game" to begin', canvas.width/2, canvas.height/2);