let webamp = null;
let isWebampVisible = false;
let analyser, dataArray, smoothedFrequency = 0;
let audioContext;

// Initialize or resume AudioContext
async function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new AudioContext();
            console.log("AudioContext initialized.");
        } catch (error) {
            console.error("Error creating AudioContext:", error);
            return null;
        }
    }

    if (audioContext.state === "suspended") {
        try {
            await audioContext.resume();
            console.log("AudioContext resumed.");
        } catch (error) {
            console.error("Error resuming AudioContext:", error);
            return null;
        }
    }

    return audioContext;
}

// Poll for the audio element with a timeout
async function pollForAudioElement(timeout = 5000, interval = 100) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkAudioElement = () => {
            const audioElement = document.querySelector("audio");
            if (audioElement) {
                resolve(audioElement);
            } else if (Date.now() - startTime > timeout) {
                resolve(null); // Timeout exceeded, return null
            } else {
                setTimeout(checkAudioElement, interval);
            }
        };

        checkAudioElement();
    });
}

// Toggle Webamp
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
            
            // Poll for the audio element
            const audioElement = await pollForAudioElement(5000);
            if (!audioElement) {
                throw new Error("Audio element not found within timeout.");
            }

            // Set up audio analysis
            const context = await getAudioContext();
            if (context) {
                setupAudioAnalysisFromWebamp(context, audioElement);
            } else {
                console.error("Could not get AudioContext. Skipping audio analysis.");
            }
        } catch (error) {
            console.error("Error rendering Webamp:", error.message);
            return;
        }

        isWebampVisible = true;
    } else {
        if (isWebampVisible) {
            webamp.close();
        } else {
            webamp.reopen();
        }
        isWebampVisible = !isWebampVisible;
    }
}

// Set up audio analysis
function setupAudioAnalysisFromWebamp(audioContext, audioElement) {
    try {
        if (audioElement.source) {
            console.log("Audio source already created. Skipping.");
            return;
        }

        const audioSource = audioContext.createMediaElementSource(audioElement);
        audioElement.source = audioSource;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);

        console.log("Audio analysis setup complete.");
    } catch (error) {
        console.error("Error during Webamp audio analysis setup:", error);
    }
}

// Get frequency bands
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
