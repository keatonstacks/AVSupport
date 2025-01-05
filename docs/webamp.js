let webamp = null;
let isWebampVisible = false; // Track Webamp visibility state
let isWebampPlaying = false; // Track Webamp playing state
let analyser, dataArray;

// Function to toggle Webamp visibility
function toggleWinamp() {
  const app = document.getElementById("app");

  if (!webamp) {
    // Initialize Webamp for the first time
    webamp = new Webamp({
      initialTracks: [
        { metaData: { artist: "Pretty Lights", title: "Road to the Stars" }, url: "media/ROADtothestars11_91.mp3" },
        { metaData: { artist: "Pretty Lights", title: "Where Are You Going" }, url: "media/WhereAreYouGoing_sum1dB_013124.mp3" },
        { metaData: { artist: "Pretty Lights", title: "New Heights" }, url: "media/NEWHEIGHTS_sum2db_012224.mp3" },
        { metaData: { artist: "Pretty Lights", title: "How Can You Lose" }, url: "media/HOWCANYOULOSE_SEARCHING2.mp3" },
        { metaData: { artist: "Pretty Lights", title: "Sunshine Coming Through" }, url: "media/SunshineComingThroughWoutro.mp3" },
      ],
      handleTrackDropEvent: true, // Optional: Enable drag-and-drop of tracks
    });

    webamp.renderWhenReady(app).then(() => {
      setupAudioAnalysis(); // Set up audio analysis after Webamp is rendered
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

// Function to set up audio analysis
function setupAudioAnalysis() {
  setTimeout(() => {
    const audioElement = document.querySelector("audio");
    if (!audioElement) {
      console.error("Audio element not found. Ensure Webamp has properly rendered the audio player.");
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Play/pause event listeners
      audioElement.addEventListener("play", () => {
        isWebampPlaying = true;
        console.log("Audio is playing");
      });

      audioElement.addEventListener("pause", () => {
        isWebampPlaying = false;
        console.log("Audio is paused");
      });

      // Continuously log frequency data for analysis
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
  }, 500); // Delay to ensure Webamp renders properly
}
