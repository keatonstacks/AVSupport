(() => {
    // ---------- 1) Basic Setup ----------
    const canvas = document.getElementById('shaderCanvas');
    const gl = canvas.getContext('webgl2', { alpha: false });
    if (!gl) {
        console.error('WebGL 2.0 is not supported by your browser or device.');
        return;
    }
    // Fullscreen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    // A simple vertex shader: full-screen quad
    const QUAD_VS = `#version 300 es
    precision highp float;
    layout(location = 0) in vec2 position;
    out vec2 vUV;
    void main() {
        // Map position from [-1,1] to [0,1] or pass as UV
        vUV = (position + 1.0) * 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }
    `;

    // We'll create separate fragment shaders for Buffer A, Buffer B, and Final pass.
    // The "common" code is appended to the top of each.

    // ---------- 2) Common GLSL Code (pasted in each pass) ----------
    const COMMON_GLSL = `#version 300 es
    precision highp float;

    // ----------- BEGIN COMMON CODE -----------
    #define TILING 1.0

    // from your "common" snippet:
    int WrapIndexX(int index){
        return (index % 16 + 16) % 16;
    }
    int WrapIndexY(int index){
        return (index % 16 + 16) % 16;
    }

    vec3 sampleJupiterASmoothstepFilter(vec2 uv)
    {
        vec2 imageSize = vec2(16, 16);
        const vec3 image[256] = vec3[](
        vec3(0.906,0.780, 0.678),vec3(0.906,0.780, 0.678),vec3(0.906,0.780, 0.678),vec3(0.906,0.780, 0.678),vec3(0.808,0.714, 0.647),vec3(0.808,0.714, 0.647),vec3(0.655,0.510, 0.451),vec3(0.655,0.510, 0.451),vec3(0.796,0.643, 0.557),vec3(0.796,0.643, 0.557),vec3(1.000,0.906, 0.808),vec3(1.000,0.906, 0.808),vec3(1.000,0.937, 0.839),vec3(1.000,0.937, 0.839),vec3(0.804,0.671, 0.580),vec3(0.804,0.671, 0.580),
        vec3(0.733,0.573, 0.471),vec3(0.388,0.157, 0.063),vec3(0.561,0.365, 0.267),vec3(0.561,0.365, 0.267),vec3(0.655,0.510, 0.451),vec3(0.655,0.510, 0.451),vec3(0.655,0.510, 0.451),vec3(0.502,0.310, 0.255),vec3(0.388,0.125, 0.063),vec3(0.592,0.384, 0.310),vec3(0.796,0.643, 0.557),vec3(0.592,0.384, 0.310),vec3(0.804,0.671, 0.580),vec3(0.612,0.404, 0.322),vec3(0.804,0.671, 0.580),vec3(0.804,0.671, 0.580),
        vec3(0.733,0.573, 0.471),vec3(0.561,0.365, 0.267),vec3(0.561,0.365, 0.267),vec3(0.388,0.157, 0.063),vec3(0.353,0.110, 0.063),vec3(0.353,0.110, 0.063),vec3(0.502,0.310, 0.255),vec3(0.808,0.714, 0.647),vec3(0.592,0.384, 0.310),vec3(0.388,0.125, 0.063),vec3(0.592,0.384, 0.310),vec3(0.592,0.384, 0.310),vec3(0.612,0.404, 0.322),vec3(0.420,0.141, 0.063),vec3(0.420,0.141, 0.063),vec3(0.420,0.141, 0.063),
        vec3(0.733,0.573, 0.471),vec3(0.733,0.573, 0.471),vec3(0.733,0.573, 0.471),vec3(0.561,0.365, 0.267),vec3(0.353,0.110, 0.063),vec3(0.655,0.510, 0.451),vec3(0.655,0.510, 0.451),vec3(0.655,0.510, 0.451),vec3(0.796,0.643, 0.557),vec3(0.796,0.643, 0.557),vec3(0.592,0.384, 0.310),vec3(0.796,0.643, 0.557),vec3(0.612,0.404, 0.322),vec3(0.612,0.404, 0.322),vec3(0.612,0.404, 0.322),vec3(0.612,0.404, 0.322),
        vec3(0.710,0.510, 0.420),vec3(0.710,0.510, 0.420),vec3(0.588,0.416, 0.353),vec3(0.588,0.416, 0.353),vec3(0.592,0.451, 0.420),vec3(0.537,0.376, 0.322),vec3(0.537,0.376, 0.322),vec3(0.537,0.376, 0.322),vec3(0.549,0.384, 0.322),vec3(0.549,0.384, 0.322),vec3(0.678,0.502, 0.420),vec3(0.678,0.502, 0.420),vec3(0.667,0.490, 0.431),vec3(0.808,0.604, 0.518),vec3(0.667,0.490, 0.431),vec3(0.667,0.490, 0.431),
        vec3(0.588,0.416, 0.353),vec3(0.471,0.325, 0.286),vec3(0.588,0.416, 0.353),vec3(0.588,0.416, 0.353),vec3(0.592,0.451, 0.420),vec3(0.482,0.302, 0.224),vec3(0.592,0.451, 0.420),vec3(0.482,0.302, 0.224),vec3(0.678,0.502, 0.420),vec3(0.549,0.384, 0.322),vec3(0.678,0.502, 0.420),vec3(0.808,0.620, 0.518),vec3(0.525,0.380, 0.345),vec3(0.525,0.380, 0.345),vec3(0.808,0.604, 0.518),vec3(0.525,0.380, 0.345),
        vec3(0.471,0.325, 0.286),vec3(0.471,0.325, 0.286),vec3(0.710,0.510, 0.420),vec3(0.588,0.416, 0.353),vec3(0.537,0.376, 0.322),vec3(0.592,0.451, 0.420),vec3(0.592,0.451, 0.420),vec3(0.592,0.451, 0.420),vec3(0.678,0.502, 0.420),vec3(0.420,0.271, 0.224),vec3(0.678,0.502, 0.420),vec3(0.420,0.271, 0.224),vec3(0.667,0.490, 0.431),vec3(0.667,0.490, 0.431),vec3(0.667,0.490, 0.431),vec3(0.667,0.490, 0.431),
        vec3(0.588,0.416, 0.353),vec3(0.710,0.510, 0.420),vec3(0.471,0.325, 0.286),vec3(0.353,0.235, 0.224),vec3(0.592,0.451, 0.420),vec3(0.647,0.525, 0.518),vec3(0.647,0.525, 0.518),vec3(0.592,0.451, 0.420),vec3(0.678,0.502, 0.420),vec3(0.420,0.271, 0.224),vec3(0.420,0.271, 0.224),vec3(0.549,0.384, 0.322),vec3(0.388,0.271, 0.259),vec3(0.667,0.490, 0.431),vec3(0.525,0.380, 0.345),vec3(0.388,0.271, 0.259),
        vec3(0.525,0.388, 0.341),vec3(0.525,0.388, 0.341),vec3(0.353,0.204, 0.161),vec3(0.525,0.388, 0.341),vec3(0.569,0.443, 0.408),vec3(0.451,0.302, 0.259),vec3(0.451,0.302, 0.259),vec3(0.686,0.584, 0.557),vec3(0.518,0.380, 0.353),vec3(0.667,0.545, 0.502),vec3(0.518,0.380, 0.353),vec3(0.667,0.545, 0.502),vec3(0.655,0.506, 0.427),vec3(0.655,0.506, 0.427),vec3(0.518,0.333, 0.224),vec3(0.655,0.506, 0.427),
        vec3(0.698,0.576, 0.525),vec3(0.698,0.576, 0.525),vec3(0.698,0.576, 0.525),vec3(0.525,0.388, 0.341),vec3(0.686,0.584, 0.557),vec3(0.808,0.729, 0.710),vec3(0.686,0.584, 0.557),vec3(0.569,0.443, 0.408),vec3(0.667,0.545, 0.502),vec3(0.816,0.710, 0.655),vec3(0.816,0.710, 0.655),vec3(0.816,0.710, 0.655),vec3(0.796,0.682, 0.631),vec3(0.796,0.682, 0.631),vec3(0.796,0.682, 0.631),vec3(0.655,0.506, 0.427),
        vec3(0.698,0.576, 0.525),vec3(0.871,0.765, 0.710),vec3(0.871,0.765, 0.710),vec3(0.698,0.576, 0.525),vec3(0.686,0.584, 0.557),vec3(0.686,0.584, 0.557),vec3(0.808,0.729, 0.710),vec3(0.808,0.729, 0.710),vec3(0.816,0.710, 0.655),vec3(0.816,0.710, 0.655),vec3(0.969,0.875, 0.808),vec3(0.816,0.710, 0.655),vec3(0.796,0.682, 0.631),vec3(0.937,0.859, 0.839),vec3(0.937,0.859, 0.839),vec3(0.937,0.859, 0.839),
        vec3(0.871,0.765, 0.710),vec3(0.871,0.765, 0.710),vec3(0.871,0.765, 0.710),vec3(0.871,0.765, 0.710),vec3(0.686,0.584, 0.557),vec3(0.808,0.729, 0.710),vec3(0.808,0.729, 0.710),vec3(0.686,0.584, 0.557),vec3(0.667,0.545, 0.502),vec3(0.816,0.710, 0.655),vec3(0.969,0.875, 0.808),vec3(0.816,0.710, 0.655),vec3(0.796,0.682, 0.631),vec3(0.796,0.682, 0.631),vec3(0.518,0.333, 0.224),vec3(0.796,0.682, 0.631),
        vec3(0.827,0.686, 0.624),vec3(0.655,0.471, 0.376),vec3(0.655,0.471, 0.376),vec3(0.655,0.471, 0.376),vec3(0.580,0.424, 0.353),vec3(0.580,0.424, 0.353),vec3(0.482,0.286, 0.192),vec3(0.776,0.698, 0.678),vec3(0.667,0.514, 0.439),vec3(0.667,0.514, 0.439),vec3(0.816,0.694, 0.624),vec3(0.518,0.333, 0.259),vec3(0.451,0.235, 0.192),vec3(0.451,0.235, 0.192),vec3(0.631,0.459, 0.396),vec3(0.631,0.459, 0.396),
        vec3(0.827,0.686, 0.624),vec3(0.655,0.471, 0.376),vec3(0.655,0.471, 0.376),vec3(0.655,0.471, 0.376),vec3(0.580,0.424, 0.353),vec3(0.580,0.424, 0.353),vec3(0.580,0.424, 0.353),vec3(0.580,0.424, 0.353),vec3(0.518,0.333, 0.259),vec3(0.816,0.694, 0.624),vec3(0.816,0.694, 0.624),vec3(0.816,0.694, 0.624),vec3(0.451,0.235, 0.192),vec3(0.631,0.459, 0.396),vec3(0.816,0.682, 0.600),vec3(0.816,0.682, 0.600),
        vec3(0.655,0.471, 0.376),vec3(0.482,0.255, 0.129),vec3(0.827,0.686, 0.624),vec3(0.655,0.471, 0.376),vec3(0.482,0.286, 0.192),vec3(0.580,0.424, 0.353),vec3(0.678,0.561, 0.514),vec3(0.580,0.424, 0.353),vec3(0.667,0.514, 0.439),vec3(0.816,0.694, 0.624),vec3(0.667,0.514, 0.439),vec3(0.667,0.514, 0.439),vec3(0.816,0.682, 0.600),vec3(0.816,0.682, 0.600),vec3(0.631,0.459, 0.396),vec3(0.451,0.235, 0.192),
        vec3(0.827,0.686, 0.624),vec3(1.000,0.906, 0.871),vec3(1.000,0.906, 0.871),vec3(0.827,0.686, 0.624),vec3(0.776,0.698, 0.678),vec3(0.776,0.698, 0.678),vec3(0.776,0.698, 0.678),vec3(0.776,0.698, 0.678),vec3(0.816,0.694, 0.624),vec3(0.969,0.875, 0.808),vec3(0.969,0.875, 0.808),vec3(0.969,0.875, 0.808),vec3(1.000,0.906, 0.808),vec3(1.000,0.906, 0.808),vec3(0.816,0.682, 0.600),vec3(1.000,0.906, 0.808));
        int xIndex = int(floor(uv.x * imageSize.x - 0.5));
        int yIndex = int(floor(uv.y * imageSize.y - 0.5));
        vec3 sample00 = image[WrapIndexY(yIndex) * 16 + WrapIndexX(xIndex)];
        vec3 sample10 = image[WrapIndexY(yIndex) * 16 + WrapIndexX(xIndex + 1)];
        vec3 sample01 = image[WrapIndexY(yIndex + 1) * 16 + WrapIndexX(xIndex)];
        vec3 sample11 = image[WrapIndexY(yIndex + 1) * 16 + WrapIndexX(xIndex + 1)];
        float xFactor = smoothstep(0.0, 1.0, fract(uv.x * imageSize.x - 0.5));
        float yFactor = smoothstep(0.0, 1.0, fract(uv.y * imageSize.y - 0.5));
        vec3 interpolated = mix(mix(sample00, sample10, xFactor), mix(sample01, sample11, xFactor), yFactor);
        return interpolated;
    }

    vec2 hash( vec2 p ) 
    {
        p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
        return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }

    float simplexNoise( in vec2 p )
    {
        const float K1 = 0.366025404; // (sqrt(3)-1)/2;
        const float K2 = 0.211324865; // (3-sqrt(3))/6;
        vec2  i = floor( p + (p.x+p.y)*K1 );
        vec2  a = p - i + (i.x+i.y)*K2;
        float m = step(a.y,a.x); 
        vec2  o = vec2(m,1.0-m);
        vec2  b = a - o + K2;
        vec2  c = a - 1.0 + 2.0*K2;
        vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
        vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
        return dot( n, vec3(70.0) );
    }

    vec3 sampleJupiterBSmoothstepFilter(vec2 uv)
    {
        vec2 imageSize = vec2(16, 16);
        const vec3 image[256] = vec3[](
        vec3(0.969,0.937, 0.871),vec3(0.557,0.384, 0.329),vec3(0.969,0.937, 0.871),vec3(0.353,0.110, 0.063),vec3(0.753,0.643, 0.588),vec3(0.753,0.643, 0.588),vec3(0.753,0.643, 0.588),vec3(0.753,0.643, 0.588),vec3(0.804,0.690, 0.631),vec3(0.969,0.922, 0.871),vec3(0.643,0.463, 0.396),vec3(0.969,0.922, 0.871),vec3(0.353,0.094, 0.031),vec3(0.784,0.655, 0.569),vec3(0.784,0.655, 0.569),vec3(1.000,0.937, 0.839),
        vec3(0.969,0.937, 0.871),vec3(0.557,0.384, 0.329),vec3(0.969,0.937, 0.871),vec3(0.557,0.384, 0.329),vec3(0.937,0.906, 0.839),vec3(0.937,0.906, 0.839),vec3(0.569,0.384, 0.341),vec3(0.753,0.643, 0.588),vec3(0.482,0.235, 0.161),vec3(0.804,0.690, 0.631),vec3(0.482,0.235, 0.161),vec3(0.969,0.922, 0.871),vec3(0.569,0.373, 0.298),vec3(1.000,0.937, 0.839),vec3(0.353,0.094, 0.031),vec3(0.784,0.655, 0.569),
        vec3(0.969,0.937, 0.871),vec3(0.353,0.110, 0.063),vec3(0.761,0.659, 0.600),vec3(0.557,0.384, 0.329),vec3(0.753,0.643, 0.588),vec3(0.388,0.125, 0.094),vec3(0.753,0.643, 0.588),vec3(0.937,0.906, 0.839),vec3(0.482,0.235, 0.161),vec3(0.969,0.922, 0.871),vec3(0.482,0.235, 0.161),vec3(0.969,0.922, 0.871),vec3(0.569,0.373, 0.298),vec3(1.000,0.937, 0.839),vec3(0.784,0.655, 0.569),vec3(0.569,0.373, 0.298),
        vec3(0.969,0.937, 0.871),vec3(0.353,0.110, 0.063),vec3(0.969,0.937, 0.871),vec3(0.557,0.384, 0.329),vec3(0.937,0.906, 0.839),vec3(0.388,0.125, 0.094),vec3(0.569,0.384, 0.341),vec3(0.937,0.906, 0.839),vec3(0.643,0.463, 0.396),vec3(0.804,0.690, 0.631),vec3(0.643,0.463, 0.396),vec3(0.804,0.690, 0.631),vec3(0.353,0.094, 0.031),vec3(0.784,0.655, 0.569),vec3(0.784,0.655, 0.569),vec3(0.569,0.373, 0.298),
        vec3(0.451,0.235, 0.161),vec3(0.612,0.447, 0.384),vec3(0.612,0.447, 0.384),vec3(0.612,0.447, 0.384),vec3(0.290,0.141, 0.129),vec3(0.871,0.667, 0.549),vec3(0.290,0.141, 0.129),vec3(0.871,0.667, 0.549),vec3(0.525,0.306, 0.255),vec3(0.698,0.549, 0.482),vec3(0.698,0.549, 0.482),vec3(0.871,0.796, 0.710),vec3(0.722,0.580, 0.502),vec3(0.906,0.796, 0.710),vec3(0.537,0.369, 0.298),vec3(0.722,0.580, 0.502),
        vec3(0.451,0.235, 0.161),vec3(0.451,0.235, 0.161),vec3(0.451,0.235, 0.161),vec3(0.451,0.235, 0.161),vec3(0.675,0.490, 0.408),vec3(0.675,0.490, 0.408),vec3(0.290,0.141, 0.129),vec3(0.290,0.141, 0.129),vec3(0.353,0.063, 0.031),vec3(0.353,0.063, 0.031),vec3(0.698,0.549, 0.482),vec3(0.525,0.306, 0.255),vec3(0.722,0.580, 0.502),vec3(0.537,0.369, 0.298),vec3(0.353,0.157, 0.094),vec3(0.722,0.580, 0.502),
        vec3(0.612,0.447, 0.384),vec3(0.773,0.659, 0.612),vec3(0.612,0.447, 0.384),vec3(0.773,0.659, 0.612),vec3(0.675,0.490, 0.408),vec3(0.675,0.490, 0.408),vec3(0.871,0.667, 0.549),vec3(0.871,0.667, 0.549),vec3(0.698,0.549, 0.482),vec3(0.871,0.796, 0.710),vec3(0.871,0.796, 0.710),vec3(0.525,0.306, 0.255),vec3(0.722,0.580, 0.502),vec3(0.722,0.580, 0.502),vec3(0.722,0.580, 0.502),vec3(0.537,0.369, 0.298),
        vec3(0.612,0.447, 0.384),vec3(0.937,0.875, 0.839),vec3(0.612,0.447, 0.384),vec3(0.773,0.659, 0.612),vec3(0.482,0.314, 0.267),vec3(0.482,0.314, 0.267),vec3(0.675,0.490, 0.408),vec3(0.675,0.490, 0.408),vec3(0.871,0.796, 0.710),vec3(0.525,0.306, 0.255),vec3(0.871,0.796, 0.710),vec3(0.525,0.306, 0.255),vec3(0.906,0.796, 0.710),vec3(0.353,0.157, 0.094),vec3(0.722,0.580, 0.502),vec3(0.722,0.580, 0.502),
        vec3(0.525,0.388, 0.341),vec3(0.729,0.592, 0.525),vec3(0.322,0.188, 0.161),vec3(0.937,0.796, 0.710),vec3(0.569,0.431, 0.384),vec3(0.353,0.188, 0.161),vec3(1.000,0.922, 0.839),vec3(0.569,0.431, 0.384),vec3(0.871,0.729, 0.612),vec3(0.569,0.424, 0.376),vec3(0.718,0.576, 0.494),vec3(0.871,0.729, 0.612),vec3(0.937,0.827, 0.776),vec3(0.678,0.537, 0.471),vec3(0.678,0.537, 0.471),vec3(0.549,0.396, 0.322),
        vec3(0.525,0.388, 0.341),vec3(0.937,0.796, 0.710),vec3(0.525,0.388, 0.341),vec3(0.937,0.796, 0.710),vec3(0.569,0.431, 0.384),vec3(0.353,0.188, 0.161),vec3(0.353,0.188, 0.161),vec3(0.569,0.431, 0.384),vec3(0.420,0.271, 0.259),vec3(0.569,0.424, 0.376),vec3(0.718,0.576, 0.494),vec3(0.569,0.424, 0.376),vec3(0.678,0.537, 0.471),vec3(0.678,0.537, 0.471),vec3(0.937,0.827, 0.776),vec3(0.678,0.537, 0.471),
        vec3(0.525,0.388, 0.341),vec3(0.525,0.388, 0.341),vec3(0.322,0.188, 0.161),vec3(0.525,0.388, 0.341),vec3(0.353,0.188, 0.161),vec3(0.784,0.675, 0.612),vec3(0.569,0.431, 0.384),vec3(0.569,0.431, 0.384),vec3(0.718,0.576, 0.494),vec3(0.569,0.424, 0.376),vec3(0.569,0.424, 0.376),vec3(0.420,0.271, 0.259),vec3(0.549,0.396, 0.322),vec3(0.549,0.396, 0.322),vec3(0.937,0.827, 0.776),vec3(0.808,0.682, 0.624),
        vec3(0.322,0.188, 0.161),vec3(0.937,0.796, 0.710),vec3(0.322,0.188, 0.161),vec3(0.729,0.592, 0.525),vec3(0.784,0.675, 0.612),vec3(0.784,0.675, 0.612),vec3(0.784,0.675, 0.612),vec3(0.569,0.431, 0.384),vec3(0.718,0.576, 0.494),vec3(0.569,0.424, 0.376),vec3(0.871,0.729, 0.612),vec3(0.718,0.576, 0.494),vec3(0.549,0.396, 0.322),vec3(0.549,0.396, 0.322),vec3(0.808,0.682, 0.624),vec3(0.937,0.827, 0.776),
        vec3(0.847,0.776, 0.722),vec3(1.000,0.984, 0.937),vec3(0.847,0.776, 0.722),vec3(0.847,0.776, 0.722),vec3(0.557,0.396, 0.341),vec3(0.761,0.651, 0.588),vec3(0.761,0.651, 0.588),vec3(0.761,0.651, 0.588),vec3(0.761,0.651, 0.624),vec3(0.761,0.651, 0.624),vec3(0.761,0.651, 0.624),vec3(0.557,0.380, 0.376),vec3(0.804,0.718, 0.655),vec3(0.804,0.718, 0.655),vec3(0.804,0.718, 0.655),vec3(0.804,0.718, 0.655),
        vec3(0.847,0.776, 0.722),vec3(0.847,0.776, 0.722),vec3(0.698,0.569, 0.506),vec3(0.847,0.776, 0.722),vec3(0.969,0.906, 0.839),vec3(0.557,0.396, 0.341),vec3(0.969,0.906, 0.839),vec3(0.969,0.906, 0.839),vec3(0.969,0.922, 0.871),vec3(0.969,0.922, 0.871),vec3(0.969,0.922, 0.871),vec3(0.969,0.922, 0.871),vec3(1.000,0.969, 0.937),vec3(1.000,0.969, 0.937),vec3(0.420,0.220, 0.094),vec3(0.612,0.467, 0.373),
        vec3(0.847,0.776, 0.722),vec3(0.847,0.776, 0.722),vec3(0.847,0.776, 0.722),vec3(1.000,0.984, 0.937),vec3(0.353,0.141, 0.094),vec3(0.353,0.141, 0.094),vec3(0.969,0.906, 0.839),vec3(0.557,0.396, 0.341),vec3(0.761,0.651, 0.624),vec3(0.761,0.651, 0.624),vec3(0.761,0.651, 0.624),vec3(0.761,0.651, 0.624),vec3(1.000,0.969, 0.937),vec3(0.420,0.220, 0.094),vec3(1.000,0.969, 0.937),vec3(0.420,0.220, 0.094),
        vec3(0.549,0.365, 0.290),vec3(0.847,0.776, 0.722),vec3(0.549,0.365, 0.290),vec3(0.847,0.776, 0.722),vec3(0.557,0.396, 0.341),vec3(0.969,0.906, 0.839),vec3(0.969,0.906, 0.839),vec3(0.761,0.651, 0.588),vec3(0.969,0.922, 0.871),vec3(0.353,0.110, 0.129),vec3(0.969,0.922, 0.871),vec3(0.761,0.651, 0.624),vec3(1.000,0.969, 0.937),vec3(0.804,0.718, 0.655),vec3(1.000,0.969, 0.937),vec3(0.420,0.220, 0.094));
        int xIndex = int(floor(uv.x * imageSize.x - 0.5));
        int yIndex = int(floor(uv.y * imageSize.y - 0.5));
        vec3 sample00 = image[WrapIndexY(yIndex) * 16 + WrapIndexX(xIndex)];
        vec3 sample10 = image[WrapIndexY(yIndex) * 16 + WrapIndexX(xIndex + 1)];
        vec3 sample01 = image[WrapIndexY(yIndex + 1) * 16 + WrapIndexX(xIndex)];
        vec3 sample11 = image[WrapIndexY(yIndex + 1) * 16 + WrapIndexX(xIndex + 1)];
        float xFactor = smoothstep(0.0, 1.0, fract(uv.x * imageSize.x - 0.5));
        float yFactor = smoothstep(0.0, 1.0, fract(uv.y * imageSize.y - 0.5));
        vec3 interpolated = mix(mix(sample00, sample10, xFactor), mix(sample01, sample11, xFactor), yFactor);
        return interpolated;
    }

    vec2 QuakeLavaUV(vec2 coords, float amplitude, float speed, float frequency, float time)
    {
        float scaledTime = time * speed;
        vec2 scaledCoords = coords * frequency;
        float x = sin(scaledTime + scaledCoords.x) * amplitude;
        float y = sin(scaledTime + scaledCoords.y) * amplitude;
        return coords + vec2(y, x);
    }

    float SeedFromResolution(vec3 resolution) {
        return resolution.x - resolution.y;
    }
    // ----------- END COMMON CODE -----------
    `;

    // ---------- 3) Buffer A Fragment Shader (Swirling Jupiter) ----------
    const BUFFER_A_FS = `
    // "Buffer A" code from your snippet
    // We read:
    //   iChannel0 = noise
    //   iChannel1 = previous Buffer A texture
    // We output the swirling Jupiter (plus seed in alpha).
    uniform sampler2D iChannel0; 
    uniform sampler2D iChannel1; 
    uniform vec3 iResolution;
    uniform float iTime;
    uniform int iFrame;

    out vec4 fragColor;

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        bool firstFrame = (iFrame == 0);

        float oldTextureSeed = texture(iChannel1, vec2(0.0, 0.0)).w;
        float newTextureSeed = SeedFromResolution(iResolution);
        bool resolutionChange = (oldTextureSeed != newTextureSeed);

        float shorterSide = min(iResolution.x, iResolution.y);
        vec2 uv = fract(fragCoord / shorterSide - vec2(0.5, 0.5));

        float sourceNoise = texture(iChannel0, uv + vec2(-0.03, 0.0)*iTime).x;
        float sourceMask = clamp(((sourceNoise - 0.5) * 10.0) + 0.5, 0.0, 1.0);

        vec2 dotsUV = QuakeLavaUV(uv, 0.01, 4.0, 37.699, iTime);    
        float dotsA = pow(texture(iChannel0, dotsUV * 3.0 + iTime * vec2(-0.1,-0.1)).x, 5.5);
        float dotsB = pow(texture(iChannel0, -dotsUV * 5.0 + iTime * vec2(0.1,0.1)).x, 5.5);
        float dots = max(dotsA, dotsB);

        vec2 turbulenceUVA = QuakeLavaUV(uv, 0.005, 2.0, 37.699, iTime);    
        float turbulenceNoiseA = simplexNoise(turbulenceUVA * 6.0 + vec2(iTime * 1.0, 0.0));
        vec2 turbulenceA = vec2(dFdy(turbulenceNoiseA), -dFdx(turbulenceNoiseA));

        vec2 turbulenceUVB = QuakeLavaUV(uv, 0.002, 4.0, 157.079, iTime);    
        float turbulenceNoiseB = texture(iChannel0, turbulenceUVB + iTime * vec2(-0.05,0.0)).x;
        vec2 turbulenceB = vec2(dFdy(turbulenceNoiseB), -dFdx(turbulenceNoiseB));

        vec3 jupiterA = sampleJupiterASmoothstepFilter(uv * 1.0);
        vec3 jupiterB = sampleJupiterBSmoothstepFilter(uv * 1.0);
        vec2 combinedVelocity = turbulenceA * 0.015 + turbulenceB * 0.004
                                + vec2(sin(uv.y * 40.0)+1.5, 0.0) * 0.0006;

        vec3 sourceColor = mix(jupiterA, jupiterB, sourceMask);

        if(firstFrame || resolutionChange)
        {
            fragColor = vec4(sourceColor, newTextureSeed);
        }
        else
        {
            float minDimension = min(iResolution.x, iResolution.y);
            float maxDimension = max(iResolution.x, iResolution.y);
            float maxAspectRatio = maxDimension / minDimension;
            vec2 aspectFactor = (iResolution.x > iResolution.y)
                ? vec2(maxAspectRatio, 1.0)
                : vec2(1.0, maxAspectRatio);

            vec2 previousUV = fract(fragCoord / iResolution.xy * aspectFactor) / aspectFactor;
            vec3 previousFrame = texture(iChannel1, previousUV + combinedVelocity).xyz;
            vec3 previousMixedWithSource = mix(previousFrame, sourceColor, dots * 0.04);

            fragColor = vec4(previousMixedWithSource, newTextureSeed);
        }
    }

    void main() {
        mainImage(fragColor, gl_FragCoord.xy);
    }
    `;

    // ---------- 4) Buffer B Fragment Shader (Sharpen) ----------
    const BUFFER_B_FS = `
    // "Buffer B" code (sharpen pass)
    uniform sampler2D iChannel0; 
    uniform vec3 iResolution;

    out vec4 fragColor;

    #define strength 5.0
    #define clampValue 0.02

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 uv = fragCoord / iResolution.xy;
        float xPixelOffset = 1.0 / iResolution.x;
        float yPixelOffset = 1.0 / iResolution.y;

        vec3 centerSample = texture(iChannel0, uv).xyz;
        vec3 northSample  = texture(iChannel0, uv + vec2(0.0,  yPixelOffset)).xyz;
        vec3 southSample  = texture(iChannel0, uv + vec2(0.0, -yPixelOffset)).xyz;
        vec3 eastSample   = texture(iChannel0, uv + vec2(xPixelOffset, 0.0)).xyz;
        vec3 westSample   = texture(iChannel0, uv + vec2(-xPixelOffset,0.0)).xyz;

        vec3 sharpen = (4.0*centerSample - northSample - southSample - eastSample - westSample) * strength;
        sharpen = clamp(sharpen, -clampValue, clampValue);
        vec3 sharpenedInput = clamp(centerSample + sharpen, 0.0, 1.0);

        fragColor = vec4(sharpenedInput, 1.0);
    }

    void main() {
        mainImage(fragColor, gl_FragCoord.xy);
    }
    `;

    // ---------- 5) Final Image Fragment Shader ----------
    const IMAGE_FS = `
    // Final pass that draws Jupiter, Io, stars, and nebula
    uniform sampler2D iChannel0; // Sharpened Jupiter (Buffer B)
    uniform sampler2D iChannel1; // Unsharpened swirl (Buffer A)
    uniform sampler2D iChannel2; // Io texture
    uniform sampler2D iChannel3; // Nebula (or star) texture

    uniform vec3 iResolution;
    uniform float iTime;

    out vec4 fragColor;

    // from your "image" snippet:
    #define BackgroundColor vec3(0.0941, 0.1019, 0.0901)

    vec4 generateSphereSurfaceWithMask(vec2 uv, float radius) {
        float radiusSquared = radius * radius;
        float uvLengthSquared = dot(uv, uv);
        float uvLength = sqrt(uvLengthSquared);
        float mask = step(uvLength, radius);
        vec3 surface = vec3(0.0);
        if(mask > 0.0)
        {
            surface = vec3(uv / radius, sqrt(radiusSquared - uvLengthSquared));
        }
        else
        {
            surface = vec3(uv / uvLength, uvLength - radius);
        }
        return vec4(surface, mask);
    }

    vec2 generateSphericalUV(vec3 position, float spin)
    {
        float width = sqrt(1.0 - position.y * position.y);
        float generatrixX = position.x / width;
        vec2 generatrix = vec2(generatrixX, position.y);
        vec2 uv = asin(generatrix) / 3.14159 + vec2(0.5 + spin, 0.5);
        return uv;
    }

    mat3 createRotationMatrix(float pitch, float roll) {
        float cosPitch = cos(pitch);
        float sinPitch = sin(pitch);
        float cosRoll = cos(roll);
        float sinRoll = sin(roll);
        return mat3(
            cosRoll,            -sinRoll * cosPitch,   sinRoll * sinPitch,
            sinRoll,             cosRoll * cosPitch,  -cosRoll * sinPitch,
            0.0,                 sinPitch,             cosPitch
        );
    }

    vec4 atmosphere( vec4 sphereSurfaceWithMask, vec3 lightDirection, vec3 atmosphereColor,
                     float haloWidth, float minAtmosphere, float maxAtmosphere, float falloff)
    {
        vec3 absorbtion = vec3(2.0, 3.0, 4.0);
        float inverseWidth = 1.0 / haloWidth;
        float fresnelBlend = pow(1.0 - sphereSurfaceWithMask.z, falloff);
        float amount = mix(minAtmosphere, maxAtmosphere, fresnelBlend);

        vec3 normal = sphereSurfaceWithMask.xyz;
        if(sphereSurfaceWithMask.w < 0.5)
        {
            float haloBlend = pow(max(1.0 - sphereSurfaceWithMask.z*inverseWidth, 0.0), 5.0);
            amount = haloBlend * maxAtmosphere;
            normal = vec3(sphereSurfaceWithMask.xy, 0.0);
        }
        float light = max((dot(normal, lightDirection)+0.3)/1.3, 0.0);
        vec3 absorbedLight = vec3(pow(light, absorbtion.x), pow(light, absorbtion.y), pow(light, absorbtion.z));
        vec3 litAtmosphere = absorbedLight * atmosphereColor;
        return vec4(litAtmosphere, amount);
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        float shorterSide = min(iResolution.x, iResolution.y);
        float aspectRatio = iResolution.x / iResolution.y;
        vec2 offset = (iResolution.x > iResolution.y)
            ? vec2(aspectRatio,1.0)*0.5
            : vec2(1.0, 1.0/aspectRatio)*0.5;

        vec2 uv = (fragCoord / shorterSide - offset);
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.8));

        // Jupiter
        vec4 jupiterSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(0.2, 0.15), 0.6);
        float jupiterLight = pow(max(dot(lightDirection, jupiterSurfaceWithMask.xyz), 0.0), 0.8);
        vec4 jupiterAtmos = atmosphere(jupiterSurfaceWithMask, lightDirection, vec3(1.0, 0.7, 0.4)*3.0,
                                       0.2, 0.05, 0.6, 2.0);
        float jupiterMask = clamp(jupiterSurfaceWithMask.w, 0.0,1.0);

        mat3 jupiterRotationMatrix = createRotationMatrix(-0.2, 0.3);
        vec3 rotatedJupiter = jupiterRotationMatrix * (jupiterSurfaceWithMask.xyz * jupiterMask);
        vec2 jupiterUV = generateSphericalUV(rotatedJupiter, iTime*0.02);
        vec2 newUV = jupiterUV * 0.8 + vec2(0.1, 0.2);
        newUV = clamp(newUV, 0.0, 1.0);
        vec3 jupiterTexture = texture(iChannel0, newUV).xyz;
        jupiterTexture = vec3(
        pow(jupiterTexture.x, 3.5),
        pow(jupiterTexture.y, 6.0),
        pow(jupiterTexture.z, 8.0)
        )*3.5;


        // Io
        vec4 ioSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(-0.32, -0.2), 0.07);
        float ioLight = pow(max(dot(lightDirection, ioSurfaceWithMask.xyz), 0.0), 0.4);
        vec4 ioAtmos = atmosphere(ioSurfaceWithMask, lightDirection, vec3(1.0, 0.9, 0.8)*1.5,
                                  0.06, 0.03, 1.0, 4.0);
        float ioMask = clamp(ioSurfaceWithMask.w, 0.0,1.0);

        mat3 ioRotationMatrix = createRotationMatrix(0.4, -0.1);
        vec3 rotatedIo = ioRotationMatrix * (ioSurfaceWithMask.xyz * ioMask);
        vec2 ioUV = generateSphericalUV(rotatedIo, -iTime*0.05);

        // iChannel2 => Io texture
        vec3 ioTexture = texture(iChannel2, fract(ioUV + vec2(0.0,0.8))).xyz;
        ioTexture = vec3(min(pow(1.0 - ioTexture.x, 5.5)*2.0, 1.0));

        // iChannel1 => we use as "stars"
        vec3 stars = vec3(pow(texture(iChannel1, uv).x, 25.0)) * vec3(1.0,0.4,0.3)*3.0;

        // iChannel3 => Nebula
        vec2 nebulaUV = uv; 
        vec3 nebulaTexture = texture(iChannel3, nebulaUV).xyz;
        float nebulaFade = pow(max(1.0 - uv.y, 0.0), 2.5)*0.5;
        vec3 nebulaTint = vec3(0.9, 0.3, 0.4);
        vec3 nebula = vec3(pow(nebulaTexture.x, 2.0)) * nebulaFade * nebulaTint;
        stars += nebula; // add the nebula over the star field

        // Combine Jupiter with background
        vec3 jupiterWithBackground = mix(stars, jupiterTexture*jupiterLight, jupiterMask);
        vec3 jupiterWithAtmosphere = mix(jupiterWithBackground, jupiterAtmos.xyz, jupiterAtmos.w);

        // Add Io
        vec3 jupiterWithIo = mix(jupiterWithAtmosphere, ioTexture * ioLight, ioMask);
        vec3 jupiterWithIoAtmos = mix(jupiterWithIo, ioAtmos.xyz, ioAtmos.w);

        // Some overlay effect
        vec2 overlayUV = fragCoord.xy / iResolution.xy;
        vec3 overlayColor = mix(0.3, 0.9, pow(overlayUV.x,1.7)) * vec3(1.0,0.35,0.1)*1.4;
        vec3 imageWithOverlay = mix(
            jupiterWithIoAtmos, 
            overlayColor, 
            pow(1.0 - overlayUV.y*0.5, 5.0)*0.7 + 0.1
        );

        fragColor = vec4(imageWithOverlay, 1.0);
    }

    void main() {
        mainImage(fragColor, gl_FragCoord.xy);
    }
    `;

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

    // ---------- 7) Create Pass Programs (A, B, Final) ----------
    const vs = QUAD_VS;
    const fsA = COMMON_GLSL + BUFFER_A_FS;
    const fsB = COMMON_GLSL + BUFFER_B_FS;
    const fsFinal = COMMON_GLSL + IMAGE_FS;

    const progA = createProgram(vs, fsA);    // Buffer A
    const progB = createProgram(vs, fsB);    // Buffer B
    const progFinal = createProgram(vs, fsFinal); // Final

    if (!progA || !progB || !progFinal) {
        console.error('Failed to create all programs.');
        return;
    }

    // ---------- 8) Full-Screen Quad Setup ----------
    const quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
    const quadVerts = new Float32Array([
        -1,-1,  1,-1,  -1, 1,
        -1, 1,  1,-1,   1, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // Prepare a small helper function
    function setupVertexAttrib(program) {
        const loc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    // ---------- 9) Create framebuffers for A & B ----------
    const BUFFER_WIDTH = 512;   // can increase for higher quality
    const BUFFER_HEIGHT = 512;  // can increase for higher quality

    function createFBO(width, height) {
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, tex, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { fbo, tex };
    }

    // We need 2 FBOs for A because we do a feedback (ping-pong).
    const fboA0 = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);
    const fboA1 = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);
    let currentA = 0; // which FBO is “current frame” vs “previous frame”

    // Single FBO for B output
    const fboB = createFBO(BUFFER_WIDTH, BUFFER_HEIGHT);

    // ---------- 10) Create noise texture (for iChannel0 in Buffer A) ----------
    // We’ll generate a small random 2D texture. Shadertoy often has a 256x256 noise.
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        NOISE_WIDTH, NOISE_HEIGHT, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, noiseData);

    // ---------- 11) Create placeholders for Io + Nebula (iChannel2 + iChannel3) ----------
    // If you have actual images, load them instead.
    function createPlaceholderTexture(color) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        const placeholder = new Uint8Array([ 
            Math.round(color[0]*255),
            Math.round(color[1]*255),
            Math.round(color[2]*255),
            255
        ]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1,1, 0,
                      gl.RGBA, gl.UNSIGNED_BYTE, placeholder);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tex;
    }
    const ioTex = createPlaceholderTexture([0.8, 0.7, 0.5]);
    const nebulaTex = createPlaceholderTexture([0.3, 0.05, 0.2]);

    // ---------- 12) Rendering variables ----------
    let iFrame = 0;
    const startTime = performance.now();

    // ---------- 13) The Render Loop ----------
    function render() {
        const timeNow = performance.now();
        const iTime = (timeNow - startTime)*0.001;

        // === Pass A: produce swirling Jupiter ===
        //   iChannel0 = noiseTex
        //   iChannel1 = previous frame of A
        const prevA = currentA;
        const nextA = 1 - currentA; 
        // so if currentA=0 => nextA=1, else nextA=0
        const prevFboA = (prevA===0) ? fboA0 : fboA1;
        const nextFboA = (nextA===0) ? fboA0 : fboA1;

        gl.bindFramebuffer(gl.FRAMEBUFFER, nextFboA.fbo);
        gl.viewport(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);
        gl.useProgram(progA);

        // VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progA);

        // Uniforms
        let loc = gl.getUniformLocation(progA, 'iTime');
        gl.uniform1f(loc, iTime);
        loc = gl.getUniformLocation(progA, 'iResolution');
        gl.uniform3f(loc, BUFFER_WIDTH, BUFFER_HEIGHT, 1.0);
        loc = gl.getUniformLocation(progA, 'iFrame');
        gl.uniform1i(loc, iFrame);

        // Bind iChannel0 (noise)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        loc = gl.getUniformLocation(progA, 'iChannel0');
        gl.uniform1i(loc, 0);

        // Bind iChannel1 (previous swirl)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, prevFboA.tex);
        loc = gl.getUniformLocation(progA, 'iChannel1');
        gl.uniform1i(loc, 1);

        // Draw
        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // === Pass B: sharpen that swirl ===
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);
        gl.viewport(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);
        gl.useProgram(progB);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progB);

        loc = gl.getUniformLocation(progB, 'iResolution');
        gl.uniform3f(loc, BUFFER_WIDTH, BUFFER_HEIGHT, 1.0);

        // iChannel0 = swirl from pass A
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, nextFboA.tex);
        loc = gl.getUniformLocation(progB, 'iChannel0');
        gl.uniform1i(loc, 0);

        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // === Final Pass: draw to screen ===
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(progFinal);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        setupVertexAttrib(progFinal);

        // iResolution, iTime
        loc = gl.getUniformLocation(progFinal, 'iResolution');
        gl.uniform3f(loc, canvas.width, canvas.height, 1.0);
        loc = gl.getUniformLocation(progFinal, 'iTime');
        gl.uniform1f(loc, iTime);

        // iChannel0 => buffer B's output (sharpened Jupiter)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fboB.tex);
        loc = gl.getUniformLocation(progFinal, 'iChannel0');
        gl.uniform1i(loc, 0);

        // iChannel1 => buffer A's swirl (for star field usage in final code)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, nextFboA.tex);
        loc = gl.getUniformLocation(progFinal, 'iChannel1');
        gl.uniform1i(loc, 1);

        // iChannel2 => Io texture (placeholder)
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, ioTex);
        loc = gl.getUniformLocation(progFinal, 'iChannel2');
        gl.uniform1i(loc, 2);

        // iChannel3 => nebula texture (placeholder)
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, nebulaTex);
        loc = gl.getUniformLocation(progFinal, 'iChannel3');
        gl.uniform1i(loc, 3);

        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // swap ping-pong
        currentA = nextA;

        iFrame++;
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

})();