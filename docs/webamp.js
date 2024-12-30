let webamp = null;
let isWebampVisible = localStorage.getItem('isWebampVisible') === 'true';  // Retrieve Webamp visibility state from local storage

function initializeWebamp() {
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
    webamp.renderWhenReady(app);
  }
}

function toggleWinamp() {
  if (!webamp) {
    initializeWebamp();
  }

  if (isWebampVisible) {
    webamp.close();
    isWebampVisible = false;
    localStorage.setItem('isWebampVisible', 'false');  // Save Webamp visibility state to local storage
  } else {
    webamp.reopen();
    isWebampVisible = true;
    localStorage.setItem('isWebampVisible', 'true');  // Save Webamp visibility state to local storage
  }
}

// Automatically reopen Webamp if it was visible
window.addEventListener('load', () => {
  if (isWebampVisible) {
    initializeWebamp();
    webamp.reopen();
  }
});