let webamp = null;
let isWebampVisible = false; // Track Webamp visibility state
let analyser, dataArray, smoothedFrequency = 0;

// Toggle Winamp Player
let audioContext; // Declare AudioContext globally

function toggleWinamp() {
    const app = document.getElementById("app");

    if (!audioContext) {
        // Initialize the AudioContext on the first interaction
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext initialized.");
    } else if (audioContext.state === "suspended") {
        // Resume the AudioContext if suspended
        audioContext.resume().then(() => {
            console.log("AudioContext resumed.");
        });
    }

    if (!webamp) {
        // Initialize and render Webamp
        webamp = new Webamp({
            initialTracks: [
                { metaData: { artist: "Pretty Lights", title: "ROADtothestars11_91.mp3" }, url: "media/ROADtothestars11_91.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Where Are You Going" }, url: "media/WhereAreYouGoing_sum1dB_013124.mp3" },
                { metaData: { artist: "Pretty Lights", title: "New Heights" }, url: "media/NEWHEIGHTS_sum2db_012224.mp3" },
                { metaData: { artist: "Pretty Lights", title: "How Can You Lose" }, url: "media/HOWCANYOULOSE_SEARCHING2.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Sunshine Coming Through" }, url: "media/SunshineComingThroughWoutro.mp3" },
            ],
        });

        webamp.renderWhenReady(app); // Render the Webamp UI
        isWebampVisible = true;
    } else {
        // Toggle Webamp visibility
        isWebampVisible ? webamp.close() : webamp.reopen();
        isWebampVisible = !isWebampVisible;
    }
}

// Setup Audio Analysis (Browser-Wide)
function setupAudioAnalysis() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Capture all browser audio
        const destination = audioContext.destination;
        const source = audioContext.createMediaStreamSource(new MediaStream());
        source.connect(analyser);
        analyser.connect(destination);

        console.log("Browser-wide audio analysis setup complete.");
    } catch (error) {
        console.error("Error during audio analysis setup:", error);
    }
}

// Retrieve Frequency Data with Smoothing
function getFrequencyBands() {
    if (!analyser) return { smoothedFrequency: 0, bass: 0, midrange: 0, treble: 0 };

    analyser.getByteFrequencyData(dataArray);

    // Calculate average frequency
    const total = dataArray.reduce((sum, value) => sum + value, 0);
    const avgFrequency = total / dataArray.length;

    // Smooth the frequency to avoid abrupt changes
    smoothedFrequency = smoothedFrequency * 0.9 + avgFrequency * 0.1;

    // Extract specific frequency bands
    const bass = dataArray.slice(0, 20).reduce((sum, value) => sum + value, 0) / 20;
    const midrange = dataArray.slice(20, 100).reduce((sum, value) => sum + value, 0) / 80;
    const treble = dataArray.slice(100).reduce((sum, value) => sum + value, 0) / (dataArray.length - 100);

    return { smoothedFrequency, bass, midrange, treble };
}

// Update Shader Uniforms
function updateShaderUniforms(gl, program) {
    if (!analyser) return; // Only proceed if analyser is available

    const { smoothedFrequency, bass, midrange, treble } = getFrequencyBands();

    let loc = gl.getUniformLocation(program, "uFrequency");
    gl.uniform1f(loc, smoothedFrequency);

    loc = gl.getUniformLocation(program, "uBass");
    gl.uniform1f(loc, bass);

    loc = gl.getUniformLocation(program, "uMidrange");
    gl.uniform1f(loc, midrange);

    loc = gl.getUniformLocation(program, "uTreble");
    gl.uniform1f(loc, treble);
}

// Initialize Analysis on Load
window.onload = setupAudioAnalysis;
