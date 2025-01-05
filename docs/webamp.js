let webamp = null;
let isWebampVisible = false; // Track Webamp visibility state
let isWebampPlaying = false; // Track Webamp playing state
let analyser, dataArray;

function toggleWinamp() {
    const app = document.getElementById("app");

    if (!webamp) {
        // Initialize Webamp for the first time
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
            const audioElement = webamp.getMediaElement(); // Use Webamp's method to get the audio element

            if (!audioElement) {
                console.error("Audio element not found after Webamp rendered.");
                return;
            }

            setupAudioAnalysis(audioElement);
        });

        // Event listeners for Webamp actions
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

        // Continuously log frequency data
        function logAudioData() {
            if (isWebampPlaying) {
                analyser.getByteFrequencyData(dataArray);
                console.log(dataArray);
            }
            requestAnimationFrame(logAudioData);
        }
        logAudioData();
    } catch (error) {
        console.error("Error during audio analysis setup:", error);
    }
}
