let webamp = null;
let isWebampVisible = false;
let analyser, dataArray, smoothedFrequency = 0;

function updateAudioAnalysis() {
    if (!analyser) return;

    // Fetch frequency data
    analyser.getByteFrequencyData(dataArray);

    // Process frequency bands
    const frequencyBands = getFrequencyBands(dataArray);

    // Update uniforms in the final rendering program
    updateShaderUniforms(gl, progFinal, frequencyBands);

    // Continue the loop
    requestAnimationFrame(updateAudioAnalysis);
}

async function toggleWinamp() {
    const app = document.getElementById("app");

    if (!webamp) {
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
            await webamp.renderWhenReady(app);
            console.log("Webamp rendered successfully.");

            const media = webamp.media;
            if (media && media._analyser) {
                setupAudioAnalysis(media._analyser);
                requestAnimationFrame(updateAudioAnalysis); // Start the analysis loop
            } else {
                console.error("AnalyserNode not found in Webamp's media.");
            }
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

function setupAudioAnalysis(analyserNode) {
    try {
        analyser = analyserNode;
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        console.log("Audio analysis setup complete.");
    } catch (error) {
        console.error("Error during audio analysis setup:", error);
    }
}

function updateShaderUniforms(gl, program, { smoothedFrequency, bass, midrange, treble }) {
    gl.useProgram(program);

    let loc = gl.getUniformLocation(program, "uFrequency");
    if (loc) gl.uniform1f(loc, smoothedFrequency);

    loc = gl.getUniformLocation(program, "uBass");
    if (loc) gl.uniform1f(loc, bass);

    loc = gl.getUniformLocation(program, "uMidrange");
    if (loc) gl.uniform1f(loc, midrange);

    loc = gl.getUniformLocation(program, "uTreble");
    if (loc) gl.uniform1f(loc, treble);
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
