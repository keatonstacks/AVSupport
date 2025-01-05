let webamp = null;
let isWebampVisible = false;
let analyser, dataArray, smoothedFrequency = 0;
let audioContext;

async function toggleWinamp() {
    const app = document.getElementById("app");

    if (!webamp) {
        webamp = new Webamp({
            initialTracks: [
                { metaData: { artist: "Pretty Lights", title: "ROADtothestars11_91.mp3" }, url: "media/ROADtothestars11_91.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Where Are You Going" }, url: "media/WhereAreYouGoing_sum1dB_013124.mp3" },
                { metaData: { artist: "Pretty Lights", title: "New Heights" }, url: "media/NEWHEIGHTS_sum2db_012224.mp3" },
                { metaData: { artist: "Pretty Lights", title: "How Can You Lose" }, url: "media/HOWCANYOULOSE_SEARCHING2.mp3" },
                { metaData: { artist: "Pretty Lights", title: "Sunshine Coming Through" }, url: "media/SunshineComingThroughWoutro.mp3" },
            ],
        });

        try {
            await webamp.renderWhenReady(app);
            console.log("Webamp rendered successfully.");

            // Attach event listener for playback
            webamp.on("play", () => {
                console.log("Playback started. Attempting to set up audio analysis.");
                setupAudioAnalysisFromWebamp();
            });
        } catch (error) {
            console.error("Error rendering Webamp:", error.message);
            return;
        }

        isWebampVisible = true;
    } else {
        isWebampVisible ? webamp.close() : webamp.reopen();
        isWebampVisible = !isWebampVisible;
    }
}

function setupAudioAnalysisFromWebamp() {
    try {
        if (!webamp.audioManager) {
            console.error("Webamp AudioManager not available.");
            return;
        }

        // Get Webamp's AudioContext
        const webampAudioContext = webamp.audioManager.audioContext;
        if (!webampAudioContext) {
            console.error("Webamp AudioContext not found.");
            return;
        }

        const webampAnalyser = webamp.audioManager.getAnalyser();
        if (!webampAnalyser) {
            console.error("Webamp Analyser not found.");
            return;
        }

        analyser = webampAnalyser;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        console.log("Audio analysis setup complete using Webamp AudioManager.");
    } catch (error) {
        console.error("Error during Webamp audio analysis setup:", error);
    }
}

function getFrequencyBands() {
    if (!analyser) return { smoothedFrequency: 0, bass: 0, midrange: 0, treble: 0 };

    analyser.getByteFrequencyData(dataArray);

    const total = dataArray.reduce((sum, value) => sum + value, 0);
    const avgFrequency = total / dataArray.length;

    smoothedFrequency = smoothedFrequency * 0.9 + avgFrequency * 0.1;

    const bass = dataArray.slice(0, 20).reduce((sum, value) => sum + value, 0) / 20;
    const midrange = dataArray.slice(20, 100).reduce((sum, value) => sum + value, 0) / 80;
    const treble = dataArray.slice(100).reduce((sum, value) => sum + value, 0) / (dataArray.length - 100);

    return { smoothedFrequency, bass, midrange, treble };
}

// Update shader uniforms
function updateShaderUniforms(gl, program) {
    if (!analyser) return;

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
