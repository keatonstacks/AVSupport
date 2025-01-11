// ---------- 1) Basic Setup ----------
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
    uniform sampler2D iChannel0; 
    uniform sampler2D iChannel1; 
    uniform vec3 iResolution;
    uniform float iTime;
    uniform int iFrame;

    uniform float uColorBoost;  
    uniform float uSwirlFactor;

    uniform float smoothedFrequency; 
    uniform float bass; 
    uniform float midrange; 
    uniform float treble;

    out vec4 fragColor;

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        // Check if this is the first frame or resolution change
        bool firstFrame = (iFrame == 0);
        float oldTextureSeed = texture(iChannel1, vec2(0.0, 0.0)).w;
        float newTextureSeed = length(iResolution);
        bool resolutionChange = (oldTextureSeed != newTextureSeed);

        // Convert fragCoord to UV space
        float shorterSide = min(iResolution.x, iResolution.y);
        vec2 uv = fract(fragCoord / shorterSide - vec2(0.5, 0.5));

        // Default fallback for music uniforms when no audio is playing
        float bassValue = max(bass, 0.1);           // Default to 0.1
        float midrangeValue = max(midrange, 0.1);   // Default to 0.1
        float trebleValue = max(treble, 0.1);       // Default to 0.1
        float smoothedFrequencyValue = max(smoothedFrequency, 0.1);

        // Noise and swirling effects
        float sourceNoise = texture(iChannel0, uv + vec2(-0.03, 0.0) * iTime).x * (1.0 + bassValue * 0.2);
        float sourceMask = clamp(((sourceNoise - 0.5) * 10.0) + 0.5, 0.0, 1.0);

        vec2 turbulenceUVA = uv + vec2(0.01, 0.02) * sin(iTime + bassValue * 5.0);
        vec2 turbulenceA = vec2(dFdy(sin(turbulenceUVA.x * 10.0)), -dFdx(sin(turbulenceUVA.y * 10.0)));

        vec2 turbulenceUVB = uv * 2.0 + vec2(0.02, 0.01) * sin(iTime + trebleValue * 3.0);
        vec2 turbulenceB = vec2(dFdy(cos(turbulenceUVB.x * 20.0)), -dFdx(cos(turbulenceUVB.y * 20.0)));

        vec2 combinedVelocity = turbulenceA * (0.02 + uSwirlFactor) + turbulenceB * 0.01;

        // Adjust colors based on midrange
        vec3 jupiterA = vec3(0.9, 0.6, 0.4) * (1.0 + uColorBoost + midrangeValue * 0.3);
        vec3 jupiterB = vec3(0.8, 0.5, 0.3) * (1.0 + uColorBoost + midrangeValue * 0.3);

        vec3 sourceColor = mix(jupiterA, jupiterB, sourceMask);

        // Frame blending
        if (firstFrame || resolutionChange) {
            fragColor = vec4(sourceColor, newTextureSeed);
        } else {
            vec3 previousFrame = texture(iChannel1, uv + combinedVelocity).xyz;
            fragColor = vec4(mix(previousFrame, sourceColor, sourceMask), newTextureSeed);
        }
    }


    void main() {
        mainImage(fragColor, gl_FragCoord.xy);
    }
`;

    // ---------- 4) Buffer B Fragment Shader (Sharpen) ----------
    const BUFFER_B_FS = `
    uniform sampler2D iChannel0; 
    uniform vec3 iResolution;

    uniform float smoothedFrequency;

    out vec4 fragColor;

    #define strength 5.0
    #define clampValue 0.02

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / iResolution.xy;

        // Default fallback for music uniforms
        float smoothedFrequencyValue = max(smoothedFrequency, 0.1);

        // Apply sharpen with optional noise adjustment based on frequency
        vec3 centerSample = texture(iChannel0, uv).xyz;
        vec3 northSample  = texture(iChannel0, uv + vec2(0.0,  1.0 / iResolution.y)).xyz;
        vec3 southSample  = texture(iChannel0, uv + vec2(0.0, -1.0 / iResolution.y)).xyz;
        vec3 eastSample   = texture(iChannel0, uv + vec2(1.0 / iResolution.x, 0.0)).xyz;
        vec3 westSample   = texture(iChannel0, uv + vec2(-1.0 / iResolution.x, 0.0)).xyz;

        vec3 sharpen = (4.0 * centerSample - northSample - southSample - eastSample - westSample) * strength;
        sharpen += vec3(smoothedFrequencyValue * 0.01); // Adjust based on smoothed frequency
        sharpen = clamp(sharpen, -clampValue, clampValue);

        fragColor = vec4(centerSample + sharpen, 1.0);
    }


    void main() {
        mainImage(fragColor, gl_FragCoord.xy);
    }
`;

// ---------- Final Image Fragment Shader ----------
const IMAGE_FS = `
// Final pass that draws Jupiter, Io, stars, and nebula
uniform sampler2D iChannel0; // Sharpened Jupiter (Buffer B)
uniform sampler2D iChannel1; // Unsharpened swirl (Buffer A)
uniform sampler2D iChannel2; // Io texture
uniform sampler2D iChannel3; // Nebula (or star) texture

uniform vec3 iResolution;
uniform float iTime;

// Audio uniforms (fallback included for safety)
uniform float bass;
uniform float midrange;
uniform float treble;
uniform float smoothedFrequency;

out vec4 fragColor;

#define BackgroundColor vec3(0.0941, 0.1019, 0.0901)

vec4 generateSphereSurfaceWithMask(vec2 uv, float radius) {
    float radiusSquared = radius * radius;
    float uvLengthSquared = dot(uv, uv);
    float uvLength = sqrt(uvLengthSquared);
    float mask = step(uvLength, radius);
    vec3 surface = vec3(0.0);
    if (mask > 0.0) {
        surface = vec3(uv / radius, sqrt(radiusSquared - uvLengthSquared));
    } else {
        surface = vec3(uv / uvLength, uvLength - radius);
    }
    return vec4(surface, mask);
}

vec2 generateSphericalUV(vec3 position, float spin) {
    float width = sqrt(1.0 - position.y * position.y);
    float generatrixX = position.x / width;
    vec2 generatrix = vec2(generatrixX, position.y);
    vec2 uv = fract(asin(generatrix) / 3.14159 + vec2(0.5 + spin, 0.5)); // Use fract
    return uv;
}

mat3 createRotationMatrix(float pitch, float roll) {
    float cosPitch = cos(pitch);
    float sinPitch = sin(pitch);
    float cosRoll = cos(roll);
    float sinRoll = sin(roll);
    return mat3(
        cosRoll, -sinRoll * cosPitch, sinRoll * sinPitch,
        sinRoll, cosRoll * cosPitch, -cosRoll * sinPitch,
        0.0, sinPitch, cosPitch
    );
}

vec4 atmosphere(vec4 sphereSurfaceWithMask, vec3 lightDirection, vec3 atmosphereColor, float haloWidth, float minAtmosphere, float maxAtmosphere, float falloff) {
    vec3 absorbtion = vec3(2.0, 3.0, 4.0);
    float inverseWidth = 1.0 / haloWidth;
    float fresnelBlend = pow(1.0 - sphereSurfaceWithMask.z, falloff);
    float amount = mix(minAtmosphere, maxAtmosphere, fresnelBlend);
    vec3 normal = sphereSurfaceWithMask.xyz;
    if (sphereSurfaceWithMask.w < 0.5) {
        float haloBlend = pow(max(1.0 - sphereSurfaceWithMask.z * inverseWidth, 0.0), 5.0);
        amount = haloBlend * maxAtmosphere;
        normal = vec3(sphereSurfaceWithMask.xy, 0.0);
    }
    float light = max((dot(normal, lightDirection) + 0.3) / 1.3, 0.0);
    vec3 absorbedLight = vec3(pow(light, absorbtion.x), pow(light, absorbtion.y), pow(light, absorbtion.z));
    vec3 litAtmosphere = absorbedLight * atmosphereColor;
    return vec4(litAtmosphere, amount);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float shorterSide = min(iResolution.x, iResolution.y);
    float aspectRatio = iResolution.x / iResolution.y;
    vec2 offset = iResolution.x > iResolution.y ? vec2(aspectRatio, 1.0) * 0.5 : vec2(1.0, 1.0 / aspectRatio) * 0.5;

    vec2 uv = (fragCoord / shorterSide - offset);
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.8));

    // Fallback audio values to ensure stability
    float bassValue = max(bass, 0.1);
    float midrangeValue = max(midrange, 0.1);
    float trebleValue = max(treble, 0.1);
    float smoothedFrequencyValue = max(smoothedFrequency, 0.1);

    // Jupiter Surface and Lighting
    vec4 jupiterSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(0.2, 0.15), 0.6);
    float jupiterLight = pow(max(dot(lightDirection, jupiterSurfaceWithMask.xyz), 0.0), 0.8);
    vec4 jupiterAtmosphere = atmosphere(
        jupiterSurfaceWithMask, 
        lightDirection, 
        vec3(1.0, 0.8, 0.6) * (2.0 + bassValue * 0.2), // Audio-driven brightness
        0.3,
        0.1,
        0.8,
        3.0
    );
    float jupiterMask = clamp(jupiterSurfaceWithMask.w, 0.0, 1.0);
    mat3 jupiterRotationMatrix = createRotationMatrix(-0.2, 0.3);
    vec3 rotatedJupiter = jupiterRotationMatrix * (jupiterSurfaceWithMask.xyz * jupiterMask);
    vec2 jupiterUV = generateSphericalUV(rotatedJupiter, iTime * 0.02 + smoothedFrequencyValue * 0.05);

    // Scale and Wrap UVs
    vec2 scaledUV = fract(jupiterUV * 2.2 + vec2(0.0, 0.8));
    vec3 jupiterTexture = texture(iChannel0, scaledUV).xyz;

    // Enhance Jupiter Texture with treble
    jupiterTexture *= vec3(
        pow(jupiterTexture.r, 3.0 + trebleValue * 0.5),
        pow(jupiterTexture.g, 6.0 + trebleValue * 0.5),
        pow(jupiterTexture.b, 8.0 + trebleValue * 0.5)
    ) * 3.0;

    // Io Moon
    vec4 ioSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(-0.32, -0.2), 0.07);
    float ioLight = pow(max(dot(lightDirection, ioSurfaceWithMask.xyz), 0.0), 0.4);
    vec4 ioAtmosphere = atmosphere(ioSurfaceWithMask, lightDirection, vec3(1.0, 0.9, 0.8) * 1.5, 0.06, 0.03, 1.0, 4.0);
    vec3 ioTexture = texture(iChannel2, fract((generateSphericalUV(ioSurfaceWithMask.xyz, -iTime * 0.05)))).xyz;

    // Stars and Nebula
    vec3 stars = vec3(pow(texture(iChannel1, uv).x, 30.0)) * vec3(1.2, 0.5, 0.4) * 4.0;
    vec3 nebulaTexture = texture(iChannel3, uv).xyz;
    vec3 nebula = nebulaTexture * pow(max(1.0 - uv.y, 0.0), 2.5) * vec3(0.9, 0.3, 0.4);

    // Dynamic nebula effect
    nebula *= (1.0 + smoothedFrequencyValue * 0.3);

    stars += nebula;

    // Combining Layers
    vec3 jupiterWithBackground = mix(stars, jupiterTexture * jupiterLight, jupiterMask);
    vec3 jupiterWithAtmosphere = mix(jupiterWithBackground, jupiterAtmosphere.rgb, jupiterAtmosphere.a);
    vec3 ioWithAtmosphere = mix(ioTexture * ioLight, ioAtmosphere.rgb, ioAtmosphere.a);

    fragColor = vec4(jupiterWithAtmosphere + ioWithAtmosphere, 1.0);
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
    image.onload = function() {
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

    image.onerror = function() {
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
      colorFactor
    };

    // === Pass A ===
    gl.useProgram(progA);
    updatePassUniforms(gl, progA, [BUFFER_WIDTH, BUFFER_HEIGHT, 1.0], iTime, [
        { texture: noiseTex, uniformName: "iChannel0" },
        { texture: currentA === 0 ? fboA1.tex : fboA0.tex, uniformName: "iChannel1" }
    ]);
    
    // Pass the updated uniform data (includes swirlFactor & colorFactor):
    updateShaderUniforms(gl, progA, uniformData);

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
    updatePassUniforms(gl, progFinal, [canvas.width, canvas.height, 1.0], iTime, [
        { texture: fboB.tex,  uniformName: "iChannel0" },
        { texture: starsTex,  uniformName: "iChannel1" },
        { texture: ioTex,     uniformName: "iChannel2" },
        { texture: nebulaTex, uniformName: "iChannel3" }
    ]);
    
    updateShaderUniforms(gl, progFinal, uniformData);

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
