// Get WebGL 2.0 context
const canvas = document.getElementById('shaderCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2.0 is not supported by your browser or device.');
}

// Resize canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Vertex Shader
const vertexShaderSource = `#version 300 es
in vec4 position;
void main() {
    gl_Position = position;
}`;

// Fragment Shader
const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 color = texture(iChannel0, uv).rgb;
    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}`;

// Compile Shader
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

const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create Shader Program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

// Set up quad vertices
const vertices = new Float32Array([
    -1, -1, 1, -1, -1, 1, // First triangle
    -1, 1, 1, -1, 1, 1    // Second triangle
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Configure vertex attribute
const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Set up texture
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

// Set up uniforms
const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
const timeLocation = gl.getUniformLocation(program, 'iTime');
gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);

gl.useProgram(program);

// Render loop
function render(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update uniforms
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);

    // Draw scene
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}

render(0);

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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

    gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);
});
