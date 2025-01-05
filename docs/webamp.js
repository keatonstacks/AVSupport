let webamp = null;
let isWebampVisible = false; // Track Webamp visibility state
let isWebampPlaying = false; // Track Webamp playing state
let analyser, dataArray, smoothedFrequency = 0;

// Toggle Winamp Player
function toggleWinamp() {
    const app = document.getElementById("app");

    if (!webamp) {
        // Initialize Webamp
        webamp = new Webamp({
            initialTracks: [
                { metaData: { artist: "Pretty Lights", title: "ROADtothestars11_91.mp3" }, url: "media/ROADtothestars11_91.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Where Are You Going" }, url: "media/WhereAreYouGoing_sum1dB_013124.mp3" },
                { metaData: { artist: "Pretty Lights", title: "New Heights" }, url: "media/NEWHEIGHTS_sum2db_012224.mp3" },
                { metaData: { artist: "Pretty Lights", title: "How Can You Lose" }, url: "media/HOWCANYOULOSE_SEARCHING2.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Sunshine Coming Through" }, url: "media/SunshineComingThroughWoutro.mp3" },
            ],
        });

        webamp.renderWhenReady(app).then(() => {
            const audioElement = webamp.getMediaElement();

            if (!audioElement) {
                console.error("Audio element not found after Webamp rendered.");
                return;
            }

            setupAudioAnalysis(audioElement);
        });

        // Webamp Event Listeners
        webamp.on("play", () => {
            isWebampPlaying = true;
            console.log("Audio is playing");
        });

        webamp.on("pause", () => {
            isWebampPlaying = false;
            console.log("Audio is paused");
        });

        isWebampVisible = true;
    } else {
        // Toggle Webamp visibility
        if (isWebampVisible) {
            webamp.close();
            isWebampVisible = false;
        } else {
            webamp.reopen();
            isWebampVisible = true;
        }
    }
}

// Setup Audio Analysis
function setupAudioAnalysis(audioElement) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        console.log("Audio analysis setup complete.");
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
  if (!isWebampPlaying || !analyser) return; // Only proceed if Webamp is actively playing

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

