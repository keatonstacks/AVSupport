const canvas = document.getElementById('shaderCanvas');
const gl = canvas.getContext('webgl');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Common GLSL code
const commonGLSL = `
    // Common code from ShaderToy
    #define TILING 1.0

    // Utility functions (WrapIndexX, WrapIndexY, etc.)
    // Add the shared utility functions here...
`;

// Vertex shader (shared by all stages)
const vertexShaderSource = `
    attribute vec4 position;
    void main() {
        gl_Position = position;
    }
`;

// GLSL shader sources for each stage
const bufferAGLSL = `
    ${commonGLSL}
    // Buffer A GLSL code here
`;

const bufferBGLSL = `
    ${commonGLSL}
    // Buffer B GLSL code here
`;

const imageGLSL = `
    ${commonGLSL}
    // Image GLSL code here
`;

// Function to compile shaders
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

// Function to create a shader program
function createProgram(vertexSource, fragmentSource) {
    const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// Create shader programs for each stage
const bufferAProgram = createProgram(vertexShaderSource, bufferAGLSL);
const bufferBProgram = createProgram(vertexShaderSource, bufferBGLSL);
const imageProgram = createProgram(vertexShaderSource, imageGLSL);

// Setup framebuffers and textures
const framebuffers = [];
const textures = [];
for (let i = 0; i < 3; i++) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvas.width,
        canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textures.push(texture);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    );
    framebuffers.push(framebuffer);
}

// Set up vertex buffer
const vertices = new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Function to render a pass
function renderPass(program, inputTextures, outputFramebuffer) {
    gl.useProgram(program);

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Bind input textures
    inputTextures.forEach((texture, i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, `iChannel${i}`), i);
    });

    // Bind output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);

    // Set resolution and time uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const timeLocation = gl.getUniformLocation(program, 'iTime');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, performance.now() * 0.001);

    // Draw
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Render loop
function render() {
    // Pass 1: Render Buffer A
    renderPass(bufferAProgram, [], framebuffers[0]);

    // Pass 2: Render Buffer B
    renderPass(bufferBProgram, [textures[0]], framebuffers[1]);

    // Pass 3: Render final image
    renderPass(imageProgram, [textures[1]], null);

    requestAnimationFrame(render);
}

// Start rendering
render();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    textures.forEach((texture) => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            canvas.width,
            canvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
    });
});
