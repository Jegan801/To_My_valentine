// State management
let currentStage = 0;
// Narrative Story Steps
const narrativeStages = [
    {
        mainText: "Good morning, My beautiful. Will you be my Valentine?",
        image: "images/stage-0.jpg" // Default/Initial
    },
    {
        mainText: "I built this page just for you. To show you how much you mean to me.",
        yesText: "Tell me more",
        image: "images/stage-1.png"
    },
    {
        mainText: "Every line of code carries a piece of my heart. Will you be my Valentine?",
        yesText: "Really?",
        image: "images/stage-1.png"
    },
    {
        mainText: "I promise to debug your bad days and cherish our good ones.",
        yesText: "Promise?",
        image: "images/stage-1.png"
    },
    {
        mainText: "You don’t know how long I waited for this click. Will you be my Valentine?",
        yesText: "Yes, I will!",
        image: "images/stage-1.png"
    }
];

const totalStages = narrativeStages.length;
let isMoving = false; // Flag to prevent rapid movements
let movementCooldown = false; // Cooldown flag
let noEscapeCount = 0; // How many times user tried to catch No button (increases speed)
let lastCursorX = 0, lastCursorY = 0;
let cursorVelX = 0, cursorVelY = 0;
let lastCursorTime = 0;

// Magnetic Mode State
let isMagneticMode = false;
let magneticElements = [];

// Secret Easter Egg: type L O V E on final page
// Keyboard: type L O V E. Mobile tap: I L O V E Y O U in order.
const LOVE_SEQUENCE = 'iloveyou';           // desktop keyboard
const MOBILE_TAP_SEQUENCE = 'iloveyou'; // mobile tap panel
let loveKeysTyped = '';
let isOnFinalPage = false;

// --- No button speed (fine-tune here) ---
const NO_BUTTON_SPEED = {
    baseDuration: 0.8,   // Faster start
    minDuration: 0.4,    // Faster max speed
    fasterPerTry: 0.03   // Faster acceleration
};

// Confirmation messages for each stage (fallback/No button use)
const confirmationMessages = [
    "Are you sure?",
    "Really sure?",
    "100% sure?",
    "Absolutely certain?",
    "Final answer?"
];

// --- Sound (Web Audio API) ---
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playClickSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
    } catch (_) { }
}

function playBoingSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08, 1);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18, 1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
    } catch (_) { }
}

// Teasing messages when No button escapes
const teasingMessages = [
    "Nice try 😏",
    "Not happening",
    "You missed",
    "Too slow!",
    "Nope! 😄",
    "Almost... not!"
];

// DOM Elements
const yesButton = document.getElementById('yesButton');
const noButton = document.getElementById('noButton');
const mainText = document.getElementById('mainText');
const mainImage = document.getElementById('mainImage');
const finalMessage = document.getElementById('finalMessage');
const errorMessage = document.getElementById('errorMessage');
const systemOverride = document.getElementById('systemOverride');
const systemLine1 = document.getElementById('systemLine1');
const systemLine2 = document.getElementById('systemLine2');
const systemProgressBar = document.getElementById('systemProgressBar');
// const foreverMessage = document.getElementById('foreverMessage');
const secretEasterEgg = document.getElementById('secretEasterEgg');
const secretMessage = document.getElementById('secretMessage');
const secretUnlockHint = document.getElementById('secretUnlockHint');
const loveTapPanel = document.getElementById('loveTapPanel');
const secretGravityBtn = document.getElementById('secretGravityBtn');
const secretGlitchBtn = document.getElementById('secretGlitchBtn');
const gravityMessage = document.getElementById('gravityMessage');
const glitchMessage = document.getElementById('glitchMessage');
const buttonsContainer = document.getElementById('buttonsContainer');
const contentWrapper = document.querySelector('.content-wrapper');
const bodyEl = document.getElementById('bodyEl');
const heartParticles = document.getElementById('heartParticles');
const confettiContainer = document.getElementById('confettiContainer');
const heartsBurstContainer = document.getElementById('heartsBurstContainer');
const cursorGlow = document.getElementById('cursorGlow');
const cursorTrail = document.getElementById('cursorTrail');
const cursorSparkles = document.getElementById('cursorSparkles');
let trailThrottle = 0;
let sparkleThrottle = 0;

/**
 * Time-aware behavior: morning greeting, night theme, late night softer/slower
 */
function applyTimeOfDay() {
    const hour = new Date().getHours();
    bodyEl.classList.remove('time-morning', 'time-night', 'time-latenight');

    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    // Update text if on the first stage
    if (currentStage === 0 && mainText) {
        mainText.textContent = `${greeting}, My beautiful. Will you be my Valentine?`;
    }

    if (hour >= 5 && hour < 12) {
        bodyEl.classList.add('time-morning');
    } else if (hour >= 18 && hour < 23) {
        bodyEl.classList.add('time-night');
        createStars();
    } else if (hour >= 23 || hour < 5) {
        bodyEl.classList.add('time-latenight');
        createStars();
    }
}

function createStars() {
    const layer = document.getElementById('starsLayer');
    if (!layer || layer.children.length > 0) return;
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.width = star.style.height = (2 + Math.random() * 2) + 'px';
        layer.appendChild(star);
    }
}

/**
 * Initialize the application
 */
function init() {
    applyTimeOfDay();
    // positionNoButtonInitially(); // Removed - rely on CSS Flexbox for initial placement

    // Track cursor for escape prediction and cursor effects
    document.addEventListener('mousemove', (e) => {
        trackCursor(e);
        updateCursorEffects(e);
    });

    // Add event listeners
    yesButton.addEventListener('click', handleYesClick);
    noButton.addEventListener('mouseenter', handleNoButtonHover);
    noButton.addEventListener('click', handleNoButtonClick);
    noButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleNoButtonHover(e);
    });

    // Prevent context menu on long press for mobile
    noButton.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Track cursor position and velocity for predicting escape direction
 */
function trackCursor(e) {
    const now = Date.now();
    const dt = Math.min((now - lastCursorTime) / 1000, 0.2) || 0.05;
    cursorVelX = (e.clientX - lastCursorX) / dt;
    cursorVelY = (e.clientY - lastCursorY) / dt;
    lastCursorX = e.clientX;
    lastCursorY = e.clientY;
    lastCursorTime = now;

    // Log mouse position for debugging spotlight
    if (isSpotlightMode) {
        console.log('Mouse Position:', { x: e.clientX, y: e.clientY, lastX: lastCursorX, lastY: lastCursorY });
    }

    updateSpotlight(e.clientX, e.clientY);
}

/**
 * Cursor effects: glow, heart trail, sparkles
 */
function updateCursorEffects(e) {
    if (!cursorGlow || !cursorTrail || !cursorSparkles) return;

    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';

    trailThrottle++;
    if (trailThrottle % 4 === 0) {
        const heart = document.createElement('span');
        heart.className = 'cursor-trail-heart';
        heart.textContent = '❤';
        heart.style.left = e.clientX + 'px';
        heart.style.top = e.clientY + 'px';
        heart.style.fontSize = (10 + Math.random() * 10) + 'px';
        cursorTrail.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    }

    sparkleThrottle++;
    if (sparkleThrottle % 8 === 0) {
        const sparkle = document.createElement('span');
        sparkle.className = 'cursor-sparkle';
        sparkle.style.left = e.clientX + (Math.random() - 0.5) * 30 + 'px';
        sparkle.style.top = e.clientY + (Math.random() - 0.5) * 30 + 'px';
        cursorSparkles.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 600);
    }
}

/**
 * Handle No button hover - move it away playfully
 */
function handleNoButtonHover(event) {
    // Prevent movement if already moving or in cooldown
    if (isMoving || movementCooldown) {
        return;
    }

    // If it's the first time moving (still relative), break it out of flow
    if (noButton.style.position !== 'fixed') {
        const rect = noButton.getBoundingClientRect();
        noButton.style.position = 'fixed';
        noButton.style.left = rect.left + 'px';
        noButton.style.top = rect.top + 'px';
        // Small delay to ensure browser acknowledges fixed position before animating
        requestAnimationFrame(() => {
            moveNoButton(event);
        });
        showTeasingMessage();
        playBoingSound();
        noEscapeCount++;
        return;
    }

    noEscapeCount++;
    showTeasingMessage();
    playBoingSound();
    moveNoButton(event);
}

/**
 * Handle No button click - show error message
 */
function handleNoButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    // Show error message
    showErrorMessage();

    // Move button away after showing error
    setTimeout(() => {
        moveNoButton();
    }, 300);
}

/**
 * Position the No button initially next to the Yes button
 */
function positionNoButtonInitially() {
    // Wait for layout to be ready
    setTimeout(() => {
        const yesRect = yesButton.getBoundingClientRect();

        // Position No button to the right of Yes button
        const initialX = yesRect.right + 30; // 30px gap
        const initialY = yesRect.top;

        // Ensure button is visible and within viewport
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const buttonWidth = noButton.getBoundingClientRect().width;
        const buttonHeight = noButton.getBoundingClientRect().height;

        let finalX = Math.max(30, Math.min(viewportWidth - buttonWidth - 30, initialX));
        let finalY = Math.max(30, Math.min(viewportHeight - buttonHeight - 30, initialY));

        noButton.style.left = `${finalX}px`;
        noButton.style.top = `${finalY}px`;
    }, 100);
}


/**
 * Get escape position: Random position safely away from cursor
 */
function getEscapePosition(buttonRect, viewportWidth, viewportHeight, padding) {
    const currentX = parseFloat(noButton.style.left) || buttonRect.left;
    const currentY = parseFloat(noButton.style.top) || buttonRect.top;
    const buttonWidth = buttonRect.width;
    const buttonHeight = buttonRect.height;

    // Bounds
    const safePadding = 60;
    const minX = safePadding;
    const minY = safePadding;
    const maxX = viewportWidth - buttonWidth - safePadding;
    const maxY = viewportHeight - buttonHeight - safePadding;

    // Vector from cursor to button (escape direction)
    let dirX = (currentX + buttonWidth / 2) - lastCursorX;
    let dirY = (currentY + buttonHeight / 2) - lastCursorY;

    // Normalize
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    dirX /= len;
    dirY /= len;

    // Base distance - REDUCED as requested (was ~150+)
    const baseDist = 100 + Math.min(noEscapeCount * 10, 100);

    // Try angles to find a valid spot
    const angles = [0, 45, -45, 90, -90, 135, -135, 180];

    for (let angle of angles) {
        // Rotate vector
        const rad = angle * Math.PI / 180;
        const rotX = dirX * Math.cos(rad) - dirY * Math.sin(rad);
        const rotY = dirX * Math.sin(rad) + dirY * Math.cos(rad);

        const candidateX = currentX + rotX * baseDist;
        const candidateY = currentY + rotY * baseDist;

        // Check bounds
        if (candidateX >= minX && candidateX <= maxX &&
            candidateY >= minY && candidateY <= maxY) {

            // Found a valid escape route!
            const jitter = (Math.random() - 0.5) * 20;
            return {
                x: Math.max(minX, Math.min(maxX, candidateX + jitter)),
                y: Math.max(minY, Math.min(maxY, candidateY + jitter))
            };
        }
    }

    // If completely stuck, small jump towards center
    return {
        x: viewportWidth / 2 + (Math.random() - 0.5) * 100,
        y: viewportHeight / 2 + (Math.random() - 0.5) * 100
    };
}

/**
 * Move the No button: escape away from cursor, faster each time, with rotation
 */
function moveNoButton(event) {
    if (event) event.preventDefault();
    if (isMoving || movementCooldown) return;

    isMoving = true;
    movementCooldown = true;

    const button = noButton;
    // ensure fixed position is set if calling directly
    if (button.style.position !== 'fixed') {
        const rect = button.getBoundingClientRect();
        button.style.position = 'fixed';
        button.style.left = rect.left + 'px';
        button.style.top = rect.top + 'px';
    }

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const buttonRect = button.getBoundingClientRect();
    const padding = 30;

    const { x: escapeX, y: escapeY } = getEscapePosition(buttonRect, viewportWidth, viewportHeight, padding);

    // Speed: use NO_BUTTON_SPEED constants to tune
    const { baseDuration, minDuration, fasterPerTry } = NO_BUTTON_SPEED;
    const speedFactor = Math.max(minDuration, baseDuration - noEscapeCount * fasterPerTry);
    button.style.transition = `left ${speedFactor}s cubic-bezier(0.68, -0.55, 0.265, 1.55), top ${speedFactor}s cubic-bezier(0.68, -0.55, 0.265, 1.55), transform 0.5s ease-out`;

    button.style.left = `${escapeX}px`;
    button.style.top = `${escapeY}px`;

    // Rotate slightly while escaping (more rotation as attempts increase)
    const rotation = (Math.random() - 0.5) * (15 + Math.min(noEscapeCount * 2, 20));
    const scale = Math.max(0.5, 0.95 - (currentStage * 0.1));
    button.style.transform = `rotate(${rotation}deg) scale(${Math.max(scale, 1.05)})`;

    const durationMs = speedFactor * 1000;
    setTimeout(() => {
        const finalScale = Math.max(0.5, 0.95 - (currentStage * 0.1));
        button.style.transform = `scale(${finalScale})`;
        isMoving = false;
    }, durationMs + 50);

    setTimeout(() => {
        movementCooldown = false;
    }, durationMs + 150);
}

/**
 * Show a random teasing message when No button escapes
 */
function showTeasingMessage() {
    const msg = teasingMessages[noEscapeCount % teasingMessages.length];
    errorMessage.textContent = msg;
    errorMessage.classList.remove('show');
    void errorMessage.offsetWidth;
    errorMessage.classList.add('show');
    setTimeout(() => errorMessage.classList.remove('show'), 1800);
}

/**
 * Handle Yes button click - progressive confirmation
 */
function handleYesClick() {
    playClickSound();
    currentStage++;

    if (currentStage < narrativeStages.length) {
        updateStage();
    } else {
        showSystemOverrideThenGift();
    }
}

/**
 * Update the stage of the confirmation process + emotional escalation
 */
function updateStage() {
    const stageData = narrativeStages[currentStage];

    // Update Main Text with fade effect
    mainText.style.opacity = '0';
    setTimeout(() => {
        if (stageData) {
            mainText.textContent = stageData.mainText;
            if (stageData.yesText) {
                yesButton.textContent = stageData.yesText;
            } else {
                yesButton.textContent = confirmationMessages[currentStage % confirmationMessages.length] || "Yes";
            }
            // Update Image if available
            if (stageData.image && mainImage) {
                // Preload/Check if exists would be good, but we'll specific set it
                // Add fade effect for image too
                mainImage.classList.add('fade-out');
                setTimeout(() => {
                    mainImage.src = stageData.image;
                    // On load, remove fade-out
                    mainImage.onload = () => {
                        mainImage.classList.remove('fade-out');
                        mainImage.classList.add('fade-in');
                        setTimeout(() => mainImage.classList.remove('fade-in'), 500);
                    };
                    // Fallback if load is instant or cached
                    setTimeout(() => mainImage.classList.remove('fade-out'), 100);
                }, 400);
            }
        }
        mainText.style.opacity = '1';
    }, 500);

    // Add stage class for scaling and glow
    yesButton.className = `btn btn-yes stage-${currentStage}`;

    // Update No button (make it smaller and harder to click)
    noButton.className = `btn btn-no stage-${currentStage}`;

    // Progressive emotional escalation: body class for warmer background
    bodyEl.className = '';
    bodyEl.classList.add(`stage-${currentStage}`);
    applyTimeOfDay(); // Re-apply time class if needed

    // Heart particles: more per stage
    updateHeartParticles();

    // Update transform to include scale from stage class
    const scale = Math.max(0.5, 0.95 - (currentStage * 0.1)); // Don't go below 0.5
    const currentTransform = noButton.style.transform || '';
    const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    const rotation = rotationMatch ? rotationMatch[0] : '';
    noButton.style.transform = `${rotation} scale(${scale})`.trim();

    yesButton.style.animation = 'none';
    setTimeout(() => {
        yesButton.style.animation = '';
    }, 10);

    // Move No button to a new position when stage updates (no teasing message)
    setTimeout(() => {
        if (!isMoving && !movementCooldown) {
            isMoving = true;
            movementCooldown = true;
            const buttonRect = noButton.getBoundingClientRect();
            const padding = 30;
            const { x, y } = getEscapePosition(buttonRect, window.innerWidth, window.innerHeight, padding);
            noButton.style.left = `${x}px`;
            noButton.style.top = `${y}px`;
            const scaleVal = Math.max(0.5, 0.95 - (currentStage * 0.1));
            noButton.style.transform = `scale(${scaleVal})`;
            setTimeout(() => {
                isMoving = false;
                movementCooldown = false;
            }, 800);
        }
    }, 200);
}

/**
 * Heart particles: number increases per stage
 */
function updateHeartParticles() {
    const count = 5 + currentStage * 4; // 9, 13, 17, 21, 25
    heartParticles.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart-particle';
        heart.textContent = '❤';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 5 + 's';
        heart.style.fontSize = (12 + Math.random() * 14) + 'px';
        heartParticles.appendChild(heart);
    }
}

/**
 * Show error message when No button is clicked
 */
function showErrorMessage() {
    errorMessage.textContent = 'Wrong answer, try again! ❤️';
    errorMessage.classList.remove('show');
    void errorMessage.offsetWidth;
    errorMessage.classList.add('show');
    setTimeout(() => errorMessage.classList.remove('show'), 2000);
}

/**
 * Confetti explosion + hearts burst from center (called when gift is revealed)
 */
function triggerConfettiAndHeartsBurst() {
    bodyEl.classList.add('finale-blur');

    const colors = ['#ff69b4', '#ff1493', '#ff6b9d', '#ff8fab', '#ffb6c1', '#fff0f5', '#ffc0cb'];

    // Confetti pieces (explode in all directions)
    for (let i = 0; i < 80; i++) {
        const angle = (Math.random() * 360) * Math.PI / 180;
        const dist = 120 + Math.random() * 200;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = '50%';
        piece.style.top = '50%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.setProperty('--tx', tx + 'px');
        piece.style.setProperty('--ty', ty + 'px');
        confettiContainer.appendChild(piece);
    }

    // Hearts burst from center
    for (let i = 0; i < 30; i++) {
        const angle = (i * 12 + Math.random() * 20) * Math.PI / 180;
        const dist = 80 + Math.random() * 120;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const heart = document.createElement('span');
        heart.className = 'burst-heart';
        heart.textContent = '❤';
        heart.style.setProperty('--tx', tx + 'px');
        heart.style.setProperty('--ty', ty + 'px');
        heart.style.animationDelay = Math.random() * 0.2 + 's';
        heart.style.fontSize = (18 + Math.random() * 20) + 'px';
        heartsBurstContainer.appendChild(heart);
    }

    setTimeout(() => {
        confettiContainer.innerHTML = '';
        heartsBurstContainer.innerHTML = '';
        bodyEl.classList.remove('finale-blur');
    }, 3500);
}

/**
 * Fake "System Override" moment: show compatibility check then reveal gift
 */
function showSystemOverrideThenGift() {
    buttonsContainer.classList.add('hide');
    errorMessage.classList.remove('show');
    mainText.style.opacity = '0';
    mainText.style.transition = 'opacity 0.5s ease-in-out';

    systemOverride.classList.add('show');
    systemLine1.classList.add('show');
    systemLine2.classList.remove('show');

    // Progress bar: slow fill over 3.2s (slowing process feel)
    if (systemProgressBar) {
        systemProgressBar.style.transition = 'none';
        systemProgressBar.style.width = '0%';
        systemProgressBar.offsetHeight; // reflow
        systemProgressBar.style.transition = 'width 3.2s cubic-bezier(0.2, 0.6, 0.4, 0.9)';
        systemProgressBar.style.width = '100%';
    }

    setTimeout(() => {
        systemLine2.classList.add('show');
    }, 1600);

    setTimeout(() => {
        systemOverride.classList.remove('show');
        systemLine1.classList.remove('show');
        systemLine2.classList.remove('show');
        if (systemProgressBar) systemProgressBar.style.width = '0%';
        showFinalGift();
    }, 3200);
}

/**
 * Show the final gift reveal (with confetti, hearts burst, scale, blur)
 */
function showFinalGift() {
    buttonsContainer.classList.add('hide');
    errorMessage.classList.remove('show');
    mainText.style.opacity = '0';
    mainText.style.transition = 'opacity 0.5s ease-in-out';

    setTimeout(() => {
        mainText.style.display = 'none'; // Remove from flow to eliminate gap
        mainImage.classList.add('fade-out');

        setTimeout(() => {
            // Hide the image completely on final page
            mainImage.style.display = 'none';

            // Show Final Hub
            const finalHub = document.getElementById('finalHub');
            if (finalHub) finalHub.classList.add('show');

            // Re-initialize buttons logic mainly for listeners
            initLoveEasterEgg();

            setTimeout(() => {
                finalMessage.classList.add('show');
                isOnFinalPage = true;
                // Surprise after the surprise: show forever message 3s later
                // setTimeout(() => {
                //    if (foreverMessage) foreverMessage.classList.add('show');
                // }, 3000);
            }, 400);
        }, 500); // Match fade-out duration
    }, 100); // Slight delay before starting fade-out
}

/**
 * Initialize interactions for final page hub
 */
function initLoveEasterEgg() {
    // Note: Most buttons are now static in the hub, we just need to attach listeners

    // Poem
    const secretPoemBtn = document.getElementById('secretPoemBtn');
    const poemModal = document.getElementById('poemModal');
    const closeModal = document.querySelector('.close-modal');

    if (secretPoemBtn && poemModal) {
        secretPoemBtn.addEventListener('click', () => {
            poemModal.classList.add('show');
        });

        closeModal.addEventListener('click', () => {
            poemModal.classList.remove('show');
        });

        poemModal.addEventListener('click', (e) => {
            if (e.target === poemModal) {
                poemModal.classList.remove('show');
            }
        });
    }

    // Unlock Hint (Hearts) -> Mobile tap panel or just hint
    if (secretUnlockHint) {
        secretUnlockHint.addEventListener('click', openLoveTapPanel);
    }

    // Feature Buttons
    const btnMap = [
        { id: 'secretGravityBtn', action: activateGravity },
        { id: 'secretMagneticBtn', action: activateMagneticMode },
        { id: 'secretGlitchBtn', action: activateGlitch },
        { id: 'secretSpotlightBtn', action: toggleSpotlightMode },
        // Rain Removed
        { id: 'secretHeartbeatBtn', action: activateHeartbeatMode },
        { id: 'secretMelodyBtn', action: activateMelodyMode }
    ];

    btnMap.forEach(item => {
        const btn = document.getElementById(item.id);
        if (btn) {
            // Remove old listeners to be safe? JS clone node or just simple add
            // Simple add is fine as long as we don't duplicate logic. 
            // Better to check if listener attached? 
            // Simply overwriting onclick property is safer for one-off buttons
            btn.onclick = item.action;
        }
    });

    initLoveTapPanel();
}

let loveTapIndex = 0;

function openLoveTapPanel(e) {
    e.stopPropagation();
    if (loveTapPanel) {
        loveTapIndex = 0;
        loveTapPanel.classList.add('show');
    }
}

function initLoveTapPanel() {
    if (!loveTapPanel) return;
    loveTapPanel.querySelectorAll('.love-tap-letter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const letter = (e.currentTarget.getAttribute('data-letter') || '').toLowerCase();
            const next = MOBILE_TAP_SEQUENCE[loveTapIndex];
            if (letter === next) {
                loveTapIndex++;
                if (loveTapIndex === MOBILE_TAP_SEQUENCE.length) {
                    loveTapPanel.classList.remove('show');
                    loveTapIndex = 0;
                    showSecretEasterEgg();
                }
            } else {
                loveTapIndex = 0;
            }
        });
    });
    const closeBtn = loveTapPanel.querySelector('.love-tap-close');
    if (closeBtn) closeBtn.addEventListener('click', () => loveTapPanel.classList.remove('show'));
}

function handleLoveEasterEggKey(e) {
    if (!isOnFinalPage || !secretEasterEgg) return;
    const key = (e.key || '').toLowerCase();
    const nextChar = LOVE_SEQUENCE[loveKeysTyped.length];
    if (key === nextChar) {
        loveKeysTyped += key;
        if (loveKeysTyped === LOVE_SEQUENCE) {
            document.removeEventListener('keydown', handleLoveEasterEggKey);
            showSecretEasterEgg();
            loveKeysTyped = '';
        }
    } else {
        loveKeysTyped = '';
    }
}

/**
 * Show hidden secret message + animation
 */
function showSecretEasterEgg() {
    const inner = secretEasterEgg.querySelector('.secret-easter-egg-inner');
    const heartsEl = secretEasterEgg.querySelector('.secret-hearts');
    if (!inner || !heartsEl) return;

    // Burst of hearts for the secret
    const heartChars = ['❤', '💕', '💖', '💗', '💓'];
    for (let i = 0; i < 20; i++) {
        const angle = (i * 18 + Math.random() * 20) * Math.PI / 180;
        const dist = 60 + Math.random() * 80;
        const h = document.createElement('span');
        h.className = 'secret-mini-heart';
        h.textContent = heartChars[i % heartChars.length];
        h.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        h.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        h.style.animationDelay = Math.random() * 0.15 + 's';
        heartsEl.appendChild(h);
    }

    secretEasterEgg.classList.add('show');

    const closeSecret = () => {
        secretEasterEgg.classList.remove('show');
        secretEasterEgg.removeEventListener('click', closeSecret);
        document.removeEventListener('keydown', closeOnEscape);
    };
    const closeOnEscape = (e) => {
        if (e.key === 'Escape') closeSecret();
    };
    secretEasterEgg.addEventListener('click', closeSecret);
    document.addEventListener('keydown', closeOnEscape);

    setTimeout(() => {
        heartsEl.innerHTML = '';
    }, 2500);
}

/**
 * Gravity mode: elements fall within viewport, message stays fixed on screen, no page scroll
 */
function activateGravity() {
    if (window._gravityActive) return;
    window._gravityActive = true;

    // Lock scroll so page doesn't scroll; keep message in view
    const scrollY = window.scrollY;
    bodyEl.classList.add('gravity-no-scroll');
    window.scrollTo(0, 0);

    const viewportH = window.innerHeight;
    const g = 0.5;
    const maxY = viewportH + 100; // Cap fall so we don't create extra scroll
    const elements = [
        contentWrapper,
        document.querySelector('.heart-particles'),
        secretUnlockHint,
        secretGravityBtn,
        secretGlitchBtn
    ].filter(Boolean);
    const state = elements.map(el => ({
        el,
        y: 0,
        vy: 0
    }));

    function tick() {
        let anyMoving = false;
        state.forEach((s) => {
            if (!s.el) return;
            s.vy += g;
            s.y += s.vy;
            if (s.y < maxY) {
                anyMoving = true;
                s.el.style.transform = `translateY(${s.y}px)`;
            }
        });
        if (anyMoving) requestAnimationFrame(tick);
        else {
            window._gravityActive = false;
            if (gravityMessage) {
                gravityMessage.classList.add('show');
                const closeGravity = () => {
                    gravityMessage.classList.remove('show');
                    gravityMessage.removeEventListener('click', closeGravity);
                    bodyEl.classList.remove('gravity-no-scroll');
                    state.forEach(s => {
                        if (s.el) s.el.style.transform = '';
                    });
                    window.scrollTo(0, scrollY);
                };
                gravityMessage.addEventListener('click', closeGravity);
            } else {
                bodyEl.classList.remove('gravity-no-scroll');
                window.scrollTo(0, scrollY);
            }
        }
    }
    requestAnimationFrame(tick);
}

/**
 * Reality break: 0.5s glitch then message
 */
function activateGlitch() {
    if (bodyEl.classList.contains('glitch-active')) return;
    bodyEl.classList.add('glitch-active');
    const glitchDuration = 500;
    const glitchInterval = setInterval(() => {
        bodyEl.classList.toggle('glitch-invert');
        bodyEl.classList.toggle('glitch-shake');
    }, 80);
    setTimeout(() => {
        clearInterval(glitchInterval);
        bodyEl.classList.remove('glitch-active', 'glitch-invert', 'glitch-shake');
        if (glitchMessage) {
            glitchMessage.classList.add('show');
            glitchMessage.addEventListener('click', () => glitchMessage.classList.remove('show'));
        }
    }, glitchDuration);
}

/**
 * Magnetic Mode: All elements attracted to cursor
 */
function activateMagneticMode() {
    if (isMagneticMode) return;
    isMagneticMode = true;

    // Select elements to magnetize
    const selector = 'button, img, h1, h2, p, .heart-particle, .confetti-piece';
    const elements = document.querySelectorAll(selector);

    magneticElements = Array.from(elements).map(el => ({
        el,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        baseX: el.getBoundingClientRect().left,
        baseY: el.getBoundingClientRect().top
    }));

    // Add click listener to end mode (one-time)
    setTimeout(() => {
        document.addEventListener('click', endMagneticMode, { once: true });
        document.addEventListener('touchstart', endMagneticMode, { once: true });
    }, 100); // slight delay to avoid immediate trigger from the button click

    requestAnimationFrame(magneticLoop);
}

function endMagneticMode(e) {
    if (!isMagneticMode) return;
    isMagneticMode = false;

    // Show Magnetic Message "I am attracted to you"
    const msg = document.createElement('div');
    msg.className = 'secret-overlay-message show';
    msg.innerHTML = '<p>You are my magnet pulling me towards you ...</p>';
    document.body.appendChild(msg);

    // Reset elements
    magneticElements.forEach(item => {
        item.el.style.transform = '';
    });

    setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => msg.remove(), 500);
    }, 2500);
}

function magneticLoop() {
    if (!isMagneticMode) return;

    const mouseX = lastCursorX;
    const mouseY = lastCursorY;

    magneticElements.forEach(item => {
        const rect = item.el.getBoundingClientRect();
        // Use initial base position for center calculation if we want them to stay somewhat anchored, 
        // OR use current rect. Using current rect makes them swarm the mouse.
        // Let's use current visual center.
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Attraction force (stronger when closer)
        // Cap max force to avoid exploding
        const force = Math.max(0, 800 / (dist + 50));

        const angle = Math.atan2(dy, dx);
        const ax = Math.cos(angle) * force * 0.8;
        const ay = Math.sin(angle) * force * 0.8;

        item.vx += ax;
        item.vy += ay;

        // Dampening/Friction
        item.vx *= 0.90;
        item.vy *= 0.90;

        // Update position (relative translation)
        item.x += item.vx;
        item.y += item.vy;

        item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
    });

    requestAnimationFrame(magneticLoop);
}







// --- Love Rain Mode ---


function activateRainMode() {
    if (isRainMode) return;
    isRainMode = true;
    floodEl.classList.add('rising');

    // No text message, just visual rain and flood

    rainInterval = setInterval(createRainDrop, 50);

    // Click to exit
    setTimeout(() => {
        document.addEventListener('click', endRainMode, { once: true });
    }, 100);
}

function createRainDrop() {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.textContent = rainStrings[Math.floor(Math.random() * rainStrings.length)];
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.animationDuration = (2 + Math.random()) + 's';
    drop.style.fontSize = (10 + Math.random() * 14) + 'px';
    drop.style.animationDuration = (1 + Math.random()) + 's';
    document.body.appendChild(drop);

    setTimeout(() => drop.remove(), 3000);
}



// --- Heartbeat Mode ---
let isHeartbeatMode = false;

function activateHeartbeatMode() {
    if (isHeartbeatMode) return;
    isHeartbeatMode = true;

    document.body.classList.add('heartbeat-active');

    // Message
    const msg = document.createElement('div');
    msg.className = 'secret-overlay-message show';
    msg.innerHTML = '<p>My system clock is synced to your heartbeat.</p>';
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => msg.remove(), 500);
    }, 2500);

    // Create central pulsing heart overlay
    const pulseHeart = document.createElement('div');
    pulseHeart.className = 'heartbeat-overlay-icon';
    pulseHeart.innerHTML = '❤️';
    document.body.appendChild(pulseHeart);

    // Create floating hearts
    const heartInterval = setInterval(() => {
        if (!isHeartbeatMode) {
            clearInterval(heartInterval);
            return;
        }
        createFloatingHeart();
    }, 300);

    // Click to exit
    setTimeout(() => {
        document.addEventListener('click', () => endHeartbeatMode(pulseHeart, heartInterval), { once: true });
    }, 100);
}

function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart-beat';
    heart.innerHTML = '💗';
    heart.style.left = Math.random() * 90 + 5 + 'vw';
    heart.style.top = Math.random() * 90 + 5 + 'vh';
    heart.style.animationDuration = (0.8 + Math.random() * 0.5) + 's';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
}

function endHeartbeatMode(overlay, interval) {
    if (!isHeartbeatMode) return;
    isHeartbeatMode = false;
    document.body.classList.remove('heartbeat-active');
    if (overlay) overlay.remove();
    clearInterval(interval);
    document.querySelectorAll('.floating-heart-beat').forEach(h => h.remove());
}

// --- Melody Mode ---
let isMelodyMode = false;

function activateMelodyMode() {
    if (isMelodyMode) return;
    isMelodyMode = true;

    document.body.classList.add('melody-active');

    // Message
    const msg = document.createElement('div');
    msg.className = 'secret-overlay-message show';
    msg.innerHTML = '<p>You are the melody to my code. So play me like a violin</p>';
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.classList.remove('show');
        setTimeout(() => msg.remove(), 500);
    }, 2500);

    // Add listeners to interactive elements
    const elements = document.querySelectorAll('button, h1, h2, p, img');
    elements.forEach(el => {
        el.addEventListener('mouseenter', playMelodyNote);
    });

    // Click to exit
    setTimeout(() => {
        document.addEventListener('click', endMelodyMode, { once: true });
    }, 100);
}

function playMelodyNote() {
    if (!isMelodyMode) return;
    // Pentatonic scale frequencies
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const note = notes[Math.floor(Math.random() * notes.length)];

    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (_) { }
}

function endMelodyMode() {
    if (!isMelodyMode) return;
    isMelodyMode = false;
    document.body.classList.remove('melody-active');
    const elements = document.querySelectorAll('button, h1, h2, p, img');
    elements.forEach(el => {
        el.removeEventListener('mouseenter', playMelodyNote);
    });
}
/**
 * Handle window resize to ensure No button stays in viewport
 */
window.addEventListener('resize', () => {
    // Ensure No button stays within viewport
    const buttonRect = noButton.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const buttonWidth = buttonRect.width;
    const buttonHeight = buttonRect.height;

    let newX = parseFloat(noButton.style.left) || buttonRect.left;
    let newY = parseFloat(noButton.style.top) || buttonRect.top;

    // Constrain to viewport
    const padding = 50; // Increased safety padding
    newX = Math.max(padding, Math.min(viewportWidth - buttonWidth - padding, newX));
    newY = Math.max(padding, Math.min(viewportHeight - buttonHeight - padding, newY));

    noButton.style.left = `${newX}px`;
    noButton.style.top = `${newY}px`;
});

// Spotlight Mode State
let isSpotlightMode = false;
const spotlightLayer = document.getElementById('spotlightLayer');
const spotlightMessage = document.getElementById('spotlightMessage');
const secretSpotlightBtn = document.getElementById('secretSpotlightBtn');

// initSpotlightMode removed - handled in initLoveEasterEgg instead


function toggleSpotlightMode() {
    console.log('Spotlight button clicked!', { isSpotlightMode, spotlightLayer, spotlightMessage });

    if (!spotlightLayer || !spotlightMessage) {
        console.error('Spotlight elements not found!');
        return;
    }

    isSpotlightMode = !isSpotlightMode;

    if (isSpotlightMode) {
        spotlightLayer.classList.add('active');
        spotlightMessage.classList.add('active');
        document.body.style.cursor = 'none'; // Hide default cursor for immersion

        // Initial position
        updateSpotlight(lastCursorX, lastCursorY);

    } else {
        spotlightLayer.classList.remove('active');
        spotlightMessage.classList.remove('active');
        document.body.style.cursor = 'auto';
    }
}

// Update spotlight position
function updateSpotlight(x, y) {
    if (isSpotlightMode && spotlightLayer) {
        console.log('Updating spotlight position:', x, y);
        spotlightLayer.style.setProperty('--x', x + 'px');
        spotlightLayer.style.setProperty('--y', y + 'px');
    }
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
} else {
    init();
}
