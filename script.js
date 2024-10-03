let data; // Variable to hold CSV data
let numShapes; // Number of shapes to draw
let maxPlayDuration; // Store max play duration
let particles = []; // Array to hold particle objects
let lastParticleUpdate = 0; // Track time for adding new particles
let lastLyricUpdate = 10; // Track time for updating lyrics
let animationDuration = 20000; // Duration of the animation in milliseconds
let animationEndTime;

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

let currentLyricIndex = 0; // Index to track the currently displayed lyric
let lyricDisplayInterval = 2000; // Duration each lyric is displayed (in milliseconds)

function preload() {
    // Load the CSV file
    data = loadTable('topcontent.csv', 'csv', 'header');
    // Load Italiana font
    Italiana = loadFont('Italiana-Regular.ttf'); // Update the path to your font file
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); // Create canvas with full window dimensions
    noStroke();
    textAlign(CENTER);
    frameRate(60); // Adjusted for smooth performance
    numShapes = data.getRowCount();
    maxPlayDuration = getMaxPlayDuration(); // Get the maximum play duration once
    background(10, 10, 20);
    animationEndTime = millis() + animationDuration; // Set the end time for the animation
}

function draw() {
    if (millis() < animationEndTime) {
        // Create a dynamic background with moving gradients
        drawDynamicBackground();

        // Update and display all particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.display();

            // Remove particle if it is faded out
            if (p.isFadedOut()) {
                particles.splice(i, 1);
            }
        }

        // Continuously add new particles
        if (millis() - lastParticleUpdate > 100) { // Adjust the time interval as needed
            addNewParticles();
            lastParticleUpdate = millis();
        }

        // Display lyrics at random positions on the canvas
        displayLyrics();
    } else {
        // After the animation ends, show a black screen
        background(0);
        noLoop(); // Stop the draw loop
        showEndMessage(); // Show the end message
    }
}

function showEndMessage() {
    let endMessage = select('#end-message'); // Select the h1 element
    let contentContainer = select('#content-container'); // Select content container
    contentContainer.style('display', 'block'); // Show the content container
    endMessage.style('display', 'block'); // Change style to display the message
    select('video').style('display', 'block'); // Show the video
}

// Function to draw a dynamic background
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

// Function to add new particles
function addNewParticles() {
    let randomIndex = floor(random(numShapes));
    let song = data.getString(randomIndex, "Content");
    let playDuration = int(data.getString(randomIndex, "Play Duration Milliseconds"));
    let rank = randomIndex + 1;

    // Map play duration to a dynamic particle count and size
    let numParticles = map(playDuration, 0, maxPlayDuration, 0.1, 5);
    let particleSize = map(playDuration, 0, maxPlayDuration, 0.1, 2); // Adjusted size for 3D

    // Create and store new particles
    for (let j = 0; j < numParticles; j++) {
        particles.push(new Particle(rank, song, particleSize, playDuration));
    }
}

// Particle class to represent each music note
class Particle {
    constructor(rank, song, size, playDuration) {
        this.song = song;
        this.size = size;
        this.angle = random(TWO_PI);
        this.radius = random(2000, 0.0001); // Adjust radius for better dynamics
        this.lifetime = 255; // Full opacity (0-255)
        this.position = createVector(cos(this.angle) * this.radius, sin(this.angle) * this.radius, random(-300, 300)); // Added Z position
        this.playDuration = playDuration; // Store play duration for insights
        this.color = this.getColorBasedOnDuration(); // Get color based on duration
        this.rank = rank; // Store rank for display
    }

    getColorBasedOnDuration() {
        return this.playDuration > 20000 ? 
            color(255, 74, 74, this.lifetime) : 
            color(135, 255, 235, this.lifetime); // Soft blue for shorter durations
    }

    update() {
        // Update particle position with sinusoidal motion for artistic effect
        this.angle += 500; // Control the flow speed
        this.radius += sin(frameCount * 3) * 39; // Vary radius for depth
        this.position.x = cos(this.angle) * this.radius;
        this.position.y = sin(this.angle) * this.radius;

        // Add subtle z-axis movement
        this.position.z += map(sin(frameCount * 2), -1, 1, -1, 1); 

        // Fade out over time
        this.lifetime -= 1; // Decrease opacity
    }

    display() {
        push(); // Start a new drawing state
        translate(this.position.x, this.position.y, this.position.z); // Move to particle position
        fill(this.color); // Set color with fading effect
        noStroke();

        // Draw different shapes based on the particle size
        if (this.size > 10) {
            // Draw box for larger particles
            box(this.size); // 3D box shape
        } else {
            // Draw sphere for smaller particles
            sphere(this.size); // 3D sphere shape
        }

        // Display song name and rank near the particle with a dynamic size
        textSize(map(this.size, 5, 2, 1, 4)); // Dynamic text size based on particle size
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifetime); // Match text color with particle opacity
        text(`${this.song} (Rank: ${this.rank})`, 0, -this.size * 0.5); // Show song title and rank
        pop(); // Restore original drawing state
    }

    isFadedOut() {
        return this.lifetime < 0; // Check if the particle is faded out
    }
}

// Function to get the maximum play duration
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

// Function to display song lyrics
function displayLyrics() {
    fill(255); // White color for lyrics
    textSize(15); // Set text size for lyrics
    textFont(Italiana); // Use Italiana font
    let elapsedTime = millis() - lastLyricUpdate;

    if (elapsedTime > lyricDisplayInterval) {
        // Update lyric display
        currentLyricIndex = (currentLyricIndex + 1) % lyrics.length; // Loop through lyrics
        lastLyricUpdate = millis();
    }

    // Generate random positions for the lyrics
    let xPos = random(-width / 4, width / 4);
    let yPos = random(-height / 4, height / 4);

    // Display current lyric at a random position
    text(lyrics[currentLyricIndex], xPos, yPos);
}

// Adjust the canvas size when the window is resized
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
