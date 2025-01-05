let webamp = null;
let isWebampVisible = false;
let analyser, dataArray, smoothedFrequency = 0;
let audioContext;

async function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new AudioContext(); // Modern way
            console.log("AudioContext initialized.");
        } catch (error) {
            console.error("Error creating AudioContext:", error);
            return null; // Return null to indicate failure
        }
    }

    if (audioContext.state === "suspended") {
        try {
            await audioContext.resume();
            console.log("AudioContext resumed.");
        } catch (error) {
            console.error("Error resuming AudioContext:", error);
            return null; // Return null to indicate failure
        }
    }

    return audioContext; // Return the AudioContext instance
}

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
          console.log("Webamp loaded.");

          webamp.onDidInit(async () => { // Make the callback async
              console.log("Webamp fully initialized. Setting up audio analysis.");
              const context = await getAudioContext(); // Get the AudioContext
              if(context){
                  setupAudioAnalysisFromWebamp(context); // setup with the context
              } else {
                  console.error("Could not get audio context. Cancelling audio analysis setup")
              }
          });
        } catch (error) {
            console.error("Error rendering Webamp:", error);
            return; // Exit if rendering fails
        }

        isWebampVisible = true;
    } else {
        isWebampVisible ? webamp.close() : webamp.reopen();
        isWebampVisible = !isWebampVisible;
    }
}

function setupAudioAnalysisFromWebamp(audioContext) {
  try {
      const audioElement = webamp.getMediaElement();
      if (!audioElement) {
          console.error("Webamp MediaElement not found.");
          return;
      }

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