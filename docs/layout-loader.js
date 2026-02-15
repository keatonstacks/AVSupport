/**
 * layout-loader.js
 * Centralizes common CSS, scripts, and UI components for AVSupport documentation.
 */
(function () {
    // Determine the root path based on this script's location
    const scripts = document.getElementsByTagName('script');
    let myScript = null;
    for (let s of scripts) {
        if (s.src.includes('layout-loader.js')) {
            myScript = s;
            break;
        }
    }

    if (!myScript) return;
    const rootPath = myScript.src.substring(0, myScript.src.lastIndexOf('/') + 1);

    // 1. Inject common CSS
    if (!document.querySelector(`link[href*="styles.css"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = rootPath + 'styles.css';
        document.head.appendChild(link);
    }

    // 2. Inject Shader GLSL (before shader.js logic runs)
    if (!document.querySelector(`script[src*="shader-glsl.js"]`)) {
        const glslScript = document.createElement('script');
        glslScript.src = rootPath + 'shader-glsl.js';
        document.head.appendChild(glslScript);
    }

    // 3. Inject Search Logic (if not index.md)
    if (!document.querySelector(`script[src*="search.js"]`)) {
        const searchScript = document.createElement('script');
        searchScript.src = rootPath + 'search.js';
        document.head.appendChild(searchScript);
    }

    // 3. Inject UI elements on load
    window.addEventListener('load', () => {
        // Auto-inject search bar if placeholder exists
        const placeholder = document.getElementById('searchPlaceholder');
        if (placeholder && !document.getElementById('searchBar')) {
            placeholder.innerHTML = `
                <input type="text" id="searchBar" placeholder="Search Knowledge Base..." 
                oninput="searchResources()" style="width: 75%; padding: 10px; margin-bottom: 20px">
            `;
        }

        // Auto-inject Last Updated if placeholder exists (from index.md pattern)
        const updatedPlaceholder = document.getElementById('lastUpdated');
        if (updatedPlaceholder && typeof fetchLastCommit === 'undefined') {
            // Load lastCommit.js dynamically if needed
            const commitScript = document.createElement('script');
            commitScript.src = rootPath + 'lastCommit.js';
            document.head.appendChild(commitScript);
        }
    });
})();
