<link rel="stylesheet" href="styles.css">
<script src="https://unpkg.com/webamp"></script>

### Audio Visual Support Documentation

Welcome to my personal Audio Visual Support knowledge base.

Having worked in the industry for 10 years, I hope to help provide organized, quick access to comprehensive Audio Visual knowledge base articles I have used over the years to find success across various projects.

### Biamp Products
- [General Information](biamp/general-biamp.md)
- [Tesira](biamp/tesira.md)

### Crestron Products
- [General Information](crestron/general-crestron.md)

### WyreStorm Products
- [General Information](wyrestorm/general-wyre.md)

### About

**Author**: Keaton Stacks
**Date**: December 29, 2024

<button onclick="toggleWinamp()">Play Pretty Lights</button>
<div id="app"></div>

<script>
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
            url: "https://swirlbridge.pl/lib/mp3/ROADtothestars11_91.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "WhereAreYouGoing_sum1dB_013124.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/WhereAreYouGoing_sum1dB_013124.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "NEWHEIGHTS_sum2db_012224.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/NEWHEIGHTS_sum2db_012224.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "HOWCANYOULOSE_SEARCHING2.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/HOWCANYOULOSE_SEARCHING2.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "SunshineComingThroughWoutro.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/SunshineComingThroughWoutro.mp3",
          },
        ],
      });

      webamp.renderWhenReady(app);
      isWebampVisible = true;  // Set visibility to true after rendering
    } else if (isWebampVisible) {
      // Close Webamp and hide it
      webamp.close();  // Closes the Webamp player
      isWebampVisible = false;  // Set visibility to false after closing
    } else {
      // Reinitialize Webamp if it was previously closed
      webamp = new Webamp({
        initialTracks: [
          {
            metaData: {
              artist: "Pretty Lights",
              title: "ROADtothestars11_91.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/ROADtothestars11_91.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "WhereAreYouGoing_sum1dB_013124.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/WhereAreYouGoing_sum1dB_013124.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "NEWHEIGHTS_sum2db_012224.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/NEWHEIGHTS_sum2db_012224.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "HOWCANYOULOSE_SEARCHING2.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/HOWCANYOULOSE_SEARCHING2.mp3",
          },
          {
            metaData: {
              artist: "Pretty Lights",
              title: "SunshineComingThroughWoutro.mp3",
            },
            url: "https://swirlbridge.pl/lib/mp3/SunshineComingThroughWoutro.mp3",
          },
        ],
      });

      webamp.renderWhenReady(app);  // Re-render Webamp inside the app div
      isWebampVisible = true;  // Set visibility to true after re-rendering
    }
  }

  // Add error handling to check if tracks are loaded correctly
  window.addEventListener('error', function(event) {
    console.error('Error loading track:', event);
  });

  // Add event listener for Webamp errors
  if (webamp) {
    webamp.on('error', function(error) {
      console.error('Webamp error:', error);
    });
  }
</script>