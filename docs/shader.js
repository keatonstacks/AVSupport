(function () {
    // ---------- 1) Basic Setup ----------
    if (localStorage.getItem('lowPowerMode') === 'true') {
        console.log('Low Power Mode is ON. WebGL skipped.');
        return;
    }
    const canvas = document.getElementById('shaderCanvas');
    const gl = canvas.getContext('webgl2', { alpha: false });
    window.gl = gl; // Expose globally
    if (!gl) {
        console.error('WebGL 2.0 is not supported by your browser or device.');
        throw new Error('WebGL 2.0 is not supported.'); // Exit the script properly
    }
    // Fullscreen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // QUAD_VS is loaded from shader-glsl.js

    // QUAD_FS is loaded from shader-glsl.js

    // COMMON_GLSL is loaded from shader-glsl.js

    // ---------- 3) Buffer A Fragment Shader (Swirling Jupiter) ----------
    // BUFFER_A_FS is loaded from shader-glsl.js

    // ---------- 4) Buffer B Fragment Shader (Sharpen) ----------
    // BUFFER_B_FS is loaded from shader-glsl.js

    // ---------- Final Image Fragment Shader ----------
    // IMAGE_FS is loaded from shader-glsl.js

    // ---------- 6) Helper to compile & link WebGL programs ----------
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader Error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(vsSource, fsSource) {
        const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) {
            return null;
        }
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Program Link Error:', gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog);
            return null;
        }
        // Clean up
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return prog;
    }
    // =============================
    //  Update Pass Uniforms Helper
    // =============================
    function updatePassUniforms(gl, program, resolution, time, textureBindings) {
        // 1) Use the correct shader program
        gl.useProgram(program);

        // 2) Set iResolution
        let loc = gl.getUniformLocation(program, "iResolution");
        if (loc) {
            gl.uniform3f(loc, resolution[0], resolution[1], resolution[2]);
        }

        // 3) Set iTime
        loc = gl.getUniformLocation(program, "iTime");
        if (loc) {
            gl.uniform1f(loc, time);
        }

        // 4) Bind & set each texture
        // e.g. textureBindings = [
        //   { texture: noiseTex, uniformName: "iChannel0" },
        //   { texture: fboA0.tex, uniformName: "iChannel1" },
        //   ...
        // ]
        textureBindings.forEach((tb, index) => {
            // Activate texture unit
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, tb.texture);

            // Set uniform sampler2D
            loc = gl.getUniformLocation(program, tb.uniformName);
            if (loc) {
                gl.uniform1i(loc, index);
            }
        });
    }

    // ---------- 7) Create Pass Programs (A, B, Final) ----------
    const vs = QUAD_VS;
    const fsA = COMMON_GLSL + BUFFER_A_FS;
    const fsB = COMMON_GLSL + BUFFER_B_FS;
    const fsFinal = COMMON_GLSL + IMAGE_FS;

    const progA = createProgram(vs, fsA);    // Buffer A
    const progB = createProgram(vs, fsB);    // Buffer B
    const progFinal = createProgram(vs, fsFinal); // Final

    if (!progA || !progB || !progFinal) {
        console.error("Failed to create all programs. Shutting down the renderer.");
        throw new Error("Shader program creation failed.");
    }

    // ---------- 8) Full-Screen Quad Setup ----------
    const quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    const quadVerts = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    function setupVertexAttrib(program) {
        const loc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    // ---------- 9) Create framebuffers for A & B ----------
    const BUFFER_WIDTH = 512;
    const BUFFER_HEIGHT = 512;

    function createFBO(width, height) {
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Enable seamless tiling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { fbo, tex };
    }

    const fboA0 = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);
    const fboA1 = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);
    let currentA = 0;

    const fboB = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);

    // ---------- 10) Create noise texture (for iChannel0 in Buffer A) ----------
    const NOISE_WIDTH = 256, NOISE_HEIGHT = 256;
    const noiseData = new Uint8Array(NOISE_WIDTH * NOISE_HEIGHT * 4);
    for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.floor(Math.random() * 256);
    }
    const noiseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NOISE_WIDTH, NOISE_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, noiseData);

    // ---------- Create AUDIO Texture ----------
    const AUDIO_TEX_WIDTH = 256;
    const AUDIO_TEX_HEIGHT = 1;
    const audioTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, audioTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Initialize with black
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, AUDIO_TEX_WIDTH, AUDIO_TEX_HEIGHT, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);

    // Load texture from URL
    function loadTexture(url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]); // blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        const image = new Image();
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };

        image.onerror = function () {
            console.error('Failed to load texture from URL:', url);
        };

        image.src = url;

        return texture;
    }

    function isPowerOf2(value) {
        return (value & (value - 1)) == 0;
    }

    const ioTex = loadTexture('images/iotexture.jpg');
    const nebulaTex = loadTexture('images/nebulatexture.jpg');
    const starsTex = loadTexture('images/stars.png');

    // Timestamps and counters
    let startTime = performance.now(); // used for iTime
    let iFrame = 0;                    // counts frames

    // Visual Mode State
    let visualMode = 1; // Start in Ring Mode (1) by default as it's the "new hotness"
    // Expose toggle function
    window.toggleVisuals = function () {
        visualMode = (visualMode === 0) ? 1 : 0;
        console.log("Switched Visual Mode:", visualMode === 0 ? "Classic" : "Ring");
        // Update button text if it exists
        const btn = document.getElementById('modeToggleInfo');
        if (btn) btn.textContent = visualMode === 0 ? "Mode: Classic" : "Mode: Ring";
    };

    // Render Function
    function render() {
        const timeNow = performance.now();
        const iTime = (timeNow - startTime) * 0.001;

        const swirlFactor = Math.min(smoothedFrequency * 0.02, 2.0); // up to 2.0
        const colorFactor = Math.min(smoothedFrequency * 0.003, 0.5); // up to 0.5

        // Prepare an object to pass to updateShaderUniforms:
        const uniformData = {
            smoothedFrequency,
            bass,
            midrange,
            treble,
            swirlFactor,
            colorFactor,
            uVisualMode: visualMode // Pass the mode
        };

        // Update Audio Texture
        if (window.audioDataArray) {
            gl.bindTexture(gl.TEXTURE_2D, audioTex);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, AUDIO_TEX_WIDTH, AUDIO_TEX_HEIGHT, gl.LUMINANCE, gl.UNSIGNED_BYTE, window.audioDataArray);
        }

        // === Pass A ===
        gl.useProgram(progA);
        updatePassUniforms(gl, progA, [BUFFER_WIDTH, BUFFER_HEIGHT, 1.0], iTime, [
            { texture: noiseTex, uniformName: "iChannel0" },
            { texture: currentA === 0 ? fboA1.tex : fboA0.tex, uniformName: "iChannel1" }
        ]);

        // Pass the updated uniform data (includes swirlFactor & colorFactor):
        updateShaderUniforms(gl, progA, uniformData);
        // Also ensure uVisualMode is set for progA if we added it there (we did in BUFFER_A_FS)
        let locModeA = gl.getUniformLocation(progA, "uVisualMode");
        if (locModeA) gl.uniform1i(locModeA, visualMode);


        // Render to Buffer A
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentA === 0 ? fboA0.fbo : fboA1.fbo);
        gl.viewport(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progA);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // === Pass B ===
        gl.useProgram(progB);
        updatePassUniforms(gl, progB, [BUFFER_WIDTH, BUFFER_HEIGHT, 1.0], iTime, [
            { texture: currentA === 0 ? fboA0.tex : fboA1.tex, uniformName: "iChannel0" }
        ]);

        updateShaderUniforms(gl, progB, uniformData);

        // Render to Buffer B
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
        gl.viewport(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progB);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // === Final Pass ===
        gl.useProgram(progFinal);

        // Update bindings for combined shader:
        // iChannel0: Planet (Buffer B)
        // iChannel1: Nebula (Galaxy Background)
        // iChannel2: Stars/Io (Noise source)
        // iChannel3: Audio Texture (Luminance)
        updatePassUniforms(gl, progFinal, [canvas.width, canvas.height, 1.0], iTime, [
            { texture: fboB.tex, uniformName: "iChannel0" },
            { texture: nebulaTex, uniformName: "iChannel1" },
            { texture: ioTex, uniformName: "iChannel2" },
            { texture: audioTex, uniformName: "iChannel3" },
            { texture: starsTex, uniformName: "iChannel4" } // Added Stars explicitly for Classic Mode
        ]);

        updateShaderUniforms(gl, progFinal, uniformData);
        // Also ensure uVisualMode is set for progFinal
        let locModeFinal = gl.getUniformLocation(progFinal, "uVisualMode");
        if (locModeFinal) gl.uniform1i(locModeFinal, visualMode);

        // Render Final to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progFinal);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Flip the double-buffer for A
        currentA = 1 - currentA;
        iFrame++;

        requestAnimationFrame(render);
    }
    render();
})();
