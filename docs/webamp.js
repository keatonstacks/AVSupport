let webamp = null;
let isWebampVisible = false;  // Track Webamp visibility state
let isWebampPlaying = false;  // Track Webamp playing state
let analyser, dataArray;

function toggleWinamp() {
  const app = document.getElementById("app");

  if (!webamp) {
    // Initialize Webamp for the first time and render it
    webamp = new Webamp({
      initialTracks: [
        {
          metaData: {
            artist: "Pretty Lights",
            title: "ROADtothestars11_91.mp3",
          },
          url: "media/ROADtothestars11_91.mp3",
        },
        {
          metaData: {
            artist: "Pretty Lights",
            title: "Where Are You Going",
          },
          url: "media/WhereAreYouGoing_sum1dB_013124.mp3",
        },
        {
          metaData: {
            artist: "Pretty Lights",
            title: "New Heights",
          },
          url: "media/NEWHEIGHTS_sum2db_012224.mp3",
        },
        {
          metaData: {
            artist: "Pretty Lights",
            title: "How Can You Lose",
          },
          url: "media/HOWCANYOULOSE_SEARCHING2.mp3",
        },
        {
          metaData: {
            artist: "Pretty Lights",
            title: "Sunshine Coming Through",
          },
          url: "media/SunshineComingThroughWoutro.mp3",
        },
      ],
    });

    webamp.renderWhenReady(app).then(() => {
      // Get the audio element manually by querying the DOM
      const audioElement = document.querySelector("audio");
  
      if (!audioElement) {
          console.error("Audio element not found.");
          return;
      }
  
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
  
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
  
      audioElement.addEventListener("play", () => {
          isWebampPlaying = true;
          console.log("Audio is playing");
      });
  
      audioElement.addEventListener("pause", () => {
          isWebampPlaying = false;
          console.log("Audio is paused");
      });
  
      // Debugging: Log audio data
      function logAudioData() {
          if (isWebampPlaying) {
              analyser.getByteFrequencyData(dataArray);
              console.log(dataArray);
          }
          requestAnimationFrame(logAudioData);
      }
      logAudioData();
  });  

    isWebampVisible = true;
  } else {
    if (isWebampVisible) {
      webamp.close();
      isWebampVisible = false;
    } else {
      webamp.reopen();
      isWebampVisible = true;
    }
  }
}