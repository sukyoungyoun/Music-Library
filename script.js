let data; // Variable to hold CSV data
let numShapes; // Number of shapes to draw
let maxPlayDuration; // Store max play duration
let particles = []; // Array to hold particle objects
let lastParticleUpdate = 0; // Track time for adding new particles
let lastLyricUpdate = 1; // Track time for updating lyrics
let animationDuration = 20000; // Duration of the animation in milliseconds
let animationEndTime;
let canvas;
let spiralRadius = 100; // Adjust the radius for the spiral
let spiralAngleIncrement = 0.1; // Adjust the angle increment for spiral tightness
let spiralOffset = 0; // This will help animate the spiral

let lyrics = [
    "Cause I'm unbreakable, I'm stronger than before",
    "We are bulletproof, we won't back down",
    "Living life, we got nothing to lose",
    "I no fit do without you, you're my everything",
    "Can't help but feel this way, I need you near me",
    "You know I can't help but fall in love with you",
    "Started from the bottom now we're here",
    "We the best, another one",
    "Lose you to love me, had to lose you to find me",
    "You're my light in the dark, always guiding me",
    "Take me back to the start, where it all began",
    "Let me love you the way you deserve"
];

let currentLyricIndex = 0;
let lyricDisplayInterval = 10;
let lyricPositions = []; // Array to hold positions for scattered lyrics
let lyricMovementSpeed = 10; // Speed of movement for lyrics
let lyricMaxX; // Maximum X position for lyrics
let lyricMaxY; // Maximum Y position for lyrics
let animationStarted = false;

function preload() {
    // Load the CSV file
    data = loadTable('topcontent.csv', 'csv', 'header');
    Italiana = loadFont('Italiana-Regular.ttf');
}

function setup() {
    noLoop(); // Prevent automatic animation start
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container'); // Append canvas to the hidden div
    noStroke();
    textAlign(CENTER);
    frameRate(100);
    numShapes = data.getRowCount();
    maxPlayDuration = getMaxPlayDuration();
    background(10, 10, 20);
    animationEndTime = millis() + animationDuration;

    // Initialize maximum positions for lyrics
    lyricMaxX = width / 4;
    lyricMaxY = height / 2;

    // Generate random initial positions for each lyric
    for (let i = 0; i < lyrics.length; i++) {
        lyricPositions.push(createVector(random(-lyricMaxX, lyricMaxX), random(-lyricMaxY, lyricMaxY)));
    }

    // Add event listener for the start button
    let startButton = document.getElementById('start-button');
    startButton.addEventListener('click', startVisualization);
}

function startVisualization() {
    document.getElementById('intro-container').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
    animationStarted = true;
    loop(); // Start the animation
}

function draw() {
    if (!animationStarted) return;

    if (millis() < animationEndTime) {
        drawDynamicBackground();

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.display();
            if (p.isFadedOut()) {
                particles.splice(i, 1);
            }
        }

        if (millis() - lastParticleUpdate > 100) {
            addNewParticles();
            lastParticleUpdate = millis();
        }

        displayLyrics();
    } else {
        background(0);
        noLoop();
        showEndMessage();
    }
}

function showEndMessage() {
    let endMessage = select('#end-message');
    endMessage.style('display', 'block'); // Ensure this is being executed
}

function drawDynamicBackground() {
    let bgColor1 = color(20, 20, 30, 50);
    let bgColor2 = color(10, 10, 20, 50);

    for (let y = -height / 2; y < height / 2; y += 10) {
        let inter = map(y, -height / 2, height / 2, 0, 1);
        let c = lerpColor(bgColor1, bgColor2, inter);
        stroke(c);
        line(-width / 2, y, width / 2, y);
    }
}

function addNewParticles() {
    let randomIndex = floor(random(numShapes));
    let song = data.getString(randomIndex, "Content");
    let playDuration = int(data.getString(randomIndex, "Play Duration Milliseconds"));
    let rank = randomIndex + 1;

    let numParticles = map(playDuration, 0, maxPlayDuration, 0.01, 3);
    let particleSize = map(playDuration, 0, maxPlayDuration, 0.1, 10);

    for (let j = 0; j < numParticles; j++) {
        particles.push(new Particle(rank, song, particleSize, playDuration));
    }
}

class Particle {
    constructor(rank, song, size, playDuration) {
        this.song = song;
        this.size = size;
        this.angle = random(TWO_PI);
        this.radius = random(2000, 0.01);
        this.lifetime = 255;
        this.position = createVector(cos(this.angle) * this.radius, sin(this.angle) * this.radius, random(-300, 300));
        this.playDuration = playDuration;
        this.color = this.getColorBasedOnDuration();
        this.rank = rank;
    }

    getColorBasedOnDuration() {
        return this.playDuration > 20000 ? 
            color(255, 74, 74, this.lifetime) : 
            color(135, 255, 235, this.lifetime);
    }

    update() {
        this.angle += 500;
        this.radius += sin(frameCount * 4) * 39;
        this.position.x = cos(this.angle) * this.radius;
        this.position.y = sin(this.angle) * this.radius;
        this.position.z += map(sin(frameCount * 2), -1, 1, -1, 1);
        this.lifetime -= 1;
    }

    display() {
        push();
        translate(this.position.x, this.position.y, this.position.z);
        fill(this.color);
        noStroke();
        if (this.size > 10) {
            box(this.size);
        } else {
            sphere(this.size);
        }
        textSize(map(this.size, 5, 2, 1, 4));
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifetime);
        text(`${this.song} (Rank: ${this.rank})`, 0, -this.size * 0.5);
        pop();
    }

    isFadedOut() {
        return this.lifetime < 0;
    }
}

function getMaxPlayDuration() {
    let maxDuration = 0;
    for (let i = 0; i < numShapes; i++) {
        let playDuration = int(data.getString(i, "Play Duration Milliseconds"));
        if (playDuration > maxDuration) {
            maxDuration = playDuration;
        }
    }
    return maxDuration;
}

function displayLyrics() {
    fill(255);
    textSize(3); // Increased text size for better visibility
    textFont(Italiana);
    
    // Update the spiral offset for animation
    spiralOffset += 0.03; // Control the speed of the spiral expansion

    // Calculate the position of each lyric in a spiral pattern
    for (let i = 0; i < lyrics.length; i++) {
        // Calculate the angle for the current lyric
        let angle = i * spiralAngleIncrement + spiralOffset; // Adding offset to animate the spiral
        let radius = spiralRadius + (i * 10); // Increase radius for each lyric to space them out

        // Convert polar coordinates to Cartesian coordinates
        let x = radius * cos(angle);
        let y = radius * sin(angle);

        // Display the current lyric at its spiral position
        text(lyrics[i], x, y);
    }

    // Change the current lyric displayed based on elapsed time
    let elapsedTime = millis() - lastLyricUpdate;
    if (elapsedTime > lyricDisplayInterval * 1000) { // Adjusted to seconds
        currentLyricIndex = (currentLyricIndex + 1) % lyrics.length;
        lastLyricUpdate = millis();
    }
}
