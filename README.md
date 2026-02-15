# Audio Visual Support Documentation

Welcome to my personal Audio Visual Support knowledge base.

Having worked in the industry for 10 years, I hope to help provide organized, quick access to comprehensive Audio Visual knowledge base articles I have used over the years to find success across various projects.

## Contents

- [Biamp Products](docs/biamp/general-biamp.md)
  - [Tesira](docs/biamp/tesira.md)
- [Crestron Products](docs/crestron/general-crestron.md)
- [WyreStorm Products](docs/wyrestorm/general-wyre.md)

## About

**Author**: Keaton Stacks  
**Date**: December 29, 2024

---

## 🎵 Web Visualizer

A WebGL-based fractal planet simulation reacting to music in real-time.

### Features

#### 🌌 Dual Visual Modes
Toggle between two distinct styles:
1.  **Ring Mode (Default)**: A smooth, banded gas giant with a detached, audio-reactive equatorial ring. Features a deep galaxy/nebula background.
2.  **Classic Mode**: The original, high-intensity fractal storm visualization. Features deep "Nautilus" spirals, intense color grading, and a chaotic atmosphere.

#### 🎛️ Audio Reactivity
Powered by `webamp.js` with a 512-point FFT:
-   **Bass**: Drives atmospheric pulse, storm turbulence, and ring emission.
-   **Mids/Treble**: Influence color shifts, lightning effects, and fine detail sharpening.

### usage

-   **Launch**: Open `docs/index.html` in a web browser (or serve locally).
-   **Controls**:
    -   **Visual Mode**: Button in top-left to switch between Ring/Classic.
    -   **Cinema Mode**: Eye icon (👁️) in bottom-left to hide UI.
    -   **Player**: Full Winamp controls via the embedded interface.

### Tech Stack
-   **WebGL**: Custom GLSL shaders (`shader-glsl.js`).
-   **Engine**: `shader.js` (Render Loop, Texture Management).
-   **Audio**: `webamp.js` (FFT Analysis).