let webamp = null;
let isWebampVisible = false;  // Track Webamp visibility state

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
    webamp.renderWhenReady(app);
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