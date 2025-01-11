/* GLOBALS */
let webamp = null;
let isWebampVisible = false;

/* Analyser + audio data */
let analyser        = null;
let dataArray       = null;
let smoothedFrequency = 0;
let bass            = 0;
let midrange        = 0;
let treble          = 0;

function updateAudioAnalysis() {
    if (!analyser) return;

    // 1) Get raw frequency data into dataArray
    analyser.getByteFrequencyData(dataArray);

    // 2) Compute frequency metrics (these next lines use the helper function below)
    const freqs = getFrequencyBands();
    smoothedFrequency = freqs.smoothedFrequency;
    bass = freqs.bass;
    midrange = freqs.midrange;
    treble = freqs.treble;
    
    requestAnimationFrame(updateAudioAnalysis);
}

/**
 * Toggles or initializes Webamp. Called by a button or on page load.
 */
async function toggleWinamp() {
    const app = document.getElementById("app");

    if (!webamp) {
        // Create the Webamp instance
        webamp = new Webamp({
            initialTracks: [
                { metaData: { artist: "Pretty Lights", title: "Road to the Stars" }, url: "media/ROADtothestars11_91.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Where Are You Going" }, url: "media/WhereAreYouGoing_sum1dB_013124.mp3" },
                { metaData: { artist: "Pretty Lights", title: "New Heights" }, url: "media/NEWHEIGHTS_sum2db_012224.mp3" },
                { metaData: { artist: "Pretty Lights", title: "How Can You Lose" }, url: "media/HOWCANYOULOSE_SEARCHING2.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Sunshine Coming Through" }, url: "media/SunshineComingThroughWoutro.mp3" },
            ],
        });

        try {
            // Wait for Webamp to fully initialize:
            await webamp.renderWhenReady(app);
            console.log("Webamp rendered successfully.");

            // 1) Extract the internal Media object from Webamp
            const media = webamp.media;
            if (media && media._analyser) {
                // 2) Setup our global audio analysis
                setupAudioAnalysis(media._analyser);

                // 3) Kick off the continuous update loop
                requestAnimationFrame(updateAudioAnalysis);
            } else {
                console.error("AnalyserNode not found in Webamp's media.");
            }
        } catch (error) {
            console.error("Error rendering Webamp:", error.message);
            return;
        }

        isWebampVisible = true;
    } else {
        // If Webamp is already created, just toggle open/close
        isWebampVisible ? webamp.close() : webamp.reopen();
        isWebampVisible = !isWebampVisible;
    }
}

/**
 * Sets up AnalyserNode-based audio data arrays. Called once on player init.
 */
function setupAudioAnalysis(analyserNode) {
    try {
        analyser = analyserNode;     // from Webamp
        analyser.fftSize = 256;      // resolution of frequency data
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        console.log("Audio analysis setup complete.");
    } catch (error) {
        console.error("Error during audio analysis setup:", error);
    }
}

/**
 * Called to push bass/mid/treble/frequency data to a specific WebGL program's uniforms.
 * You might optionally call this from your main shader.js render() loop as well.
 */
function updateShaderUniforms(gl, program, { smoothedFrequency, bass, midrange, treble }) {
    // Make sure we're using the right shader program first
    gl.useProgram(program);

    // Pass each band into uniform locations if they exist:
    let loc = gl.getUniformLocation(program, "uFrequency");
    if (loc) gl.uniform1f(loc, smoothedFrequency);

    loc = gl.getUniformLocation(program, "uBass");
    if (loc) gl.uniform1f(loc, bass);

    loc = gl.getUniformLocation(program, "uMidrange");
    if (loc) gl.uniform1f(loc, midrange);

    loc = gl.getUniformLocation(program, "uTreble");
    if (loc) gl.uniform1f(loc, treble);
}

/**
 * Reads global `dataArray` to produce frequency bands + smoothed average.
 * Returns an object { smoothedFrequency, bass, midrange, treble }.
 */
function getFrequencyBands() {
    // If no analyser, return zeros
    if (!analyser || !dataArray) {
        return { smoothedFrequency: 0, bass: 0, midrange: 0, treble: 0 };
    }

    // Refill dataArray with the latest frequency data
    analyser.getByteFrequencyData(dataArray);

    // 1) Average of all bins
    const total = dataArray.reduce((sum, value) => sum + value, 0);
    const avgFrequency = total / dataArray.length;

    // 2) Weighted rolling average (to smooth it out)
    smoothedFrequency = 0.9 * smoothedFrequency + 0.1 * avgFrequency;

    // 3) Example simple band divisions:
    //   - "Bass" = bins 0..20
    //   - "Midrange" = bins 20..100
    //   - "Treble" = bins 100..end
    const bassAvg = dataArray.slice(0, 20).reduce((sum, v) => sum + v, 0) / 20;
    const midAvg = dataArray.slice(20, 100).reduce((sum, v) => sum + v, 0) / 80;
    const trebleAvg = dataArray.slice(100).reduce((sum, v) => sum + v, 0) / (dataArray.length - 100);

    return {
        smoothedFrequency,
        bass: bassAvg,
        midrange: midAvg,
        treble: trebleAvg
    };
}
