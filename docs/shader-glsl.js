// shader-glsl.js
// COMBINED SHADERS for AVSupport (Classic + Ring Modes)

window.QUAD_VS = `#version 300 es
    precision highp float;
    layout(location = 0) in vec2 position;
    out vec2 vUV;
    void main() {
        vUV = (position + 1.0) * 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }`;

window.QUAD_FS = `#version 300 es
    precision highp float;

    in vec2 vUV;

    uniform float uTime;
    uniform vec2 uRandomOffset;
    uniform float uBeatPhase;
    uniform sampler2D iChannel0;

    out vec4 fragColor;

    vec2 QuakeLavaUV(vec2 coords, float amplitude, float speed, float frequency, float time) {
        float scaledTime = time * speed;
        vec2 scaledCoords = coords * frequency;
        float x = sin(scaledTime + scaledCoords.x) * amplitude;
        float y = sin(scaledTime + scaledCoords.y) * amplitude;
        return coords + vec2(y, x);
    }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float simplexNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
        vec2 jitteredUV = vUV + uRandomOffset * 0.05;
        jitteredUV += vec2(
            simplexNoise(vUV * 8.0 + uTime * 0.5),
            simplexNoise(vUV * 8.0 + uTime * 0.5 + 77.0)
        ) * 0.015;

        vec2 finalUV = QuakeLavaUV(jitteredUV, 0.03, 1.5, 2.0, uTime + uBeatPhase);
        fragColor = texture(iChannel0, finalUV);
    }`;


window.COMMON_GLSL = `#version 300 es
precision highp float;

// ----------- BEGIN COMMON CODE -----------
#define TILING 1.0

int WrapIndexX(int index){
    return (index % 16 + 16) % 16;
}
int WrapIndexY(int index){
    return (index % 16 + 16) % 16;
}

// Noise Functions
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float simplexNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * simplexNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec2 QuakeLavaUV(vec2 coords, float amplitude, float speed, float frequency, float time)
{
    float scaledTime = time * speed;
    vec2 scaledCoords = coords * frequency;
    float x = sin(scaledTime + scaledCoords.x) * amplitude;
    float y = sin(scaledTime + scaledCoords.y) * amplitude;
    return coords + vec2(y, x);
}
// ----------- END COMMON CODE -----------
`;

// BUFFER A: COMBINED
window.BUFFER_A_FS = `
    uniform sampler2D iChannel0; // Noise
    uniform sampler2D iChannel1; // Feedback (Self)
    uniform vec3 iResolution;
    uniform float iTime;
    uniform int iFrame;
    uniform int uVisualMode; // 0 = Classic, 1 = Ring

    uniform float uColorBoost;  
    uniform float uSwirlFactor;

    uniform float smoothedFrequency; 
    uniform float bass; 
    uniform float midrange; 
    uniform float treble;

    out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    bool firstFrame = (iFrame == 0);
    float oldTextureSeed = texture(iChannel1, vec2(0.0, 0.0)).w;
    float newTextureSeed = length(iResolution);
    bool resolutionChange = (oldTextureSeed != newTextureSeed);

    vec2 uv = fragCoord / iResolution.xy;
    vec2 scaledUV = uv; // 0..1

    float bassValue = max(bass, 0.1) / 255.0;
    float midrangeValue = max(midrange, 0.1) / 255.0;
    float trebleValue = max(treble, 0.1) / 255.0;
    float smoothedFrequencyValue = max(smoothedFrequency, 0.1) / 255.0;

    vec3 finalColor = vec3(0.0);

    if (uVisualMode == 0) {
        // --- CLASSIC MODE (Swirling Fractal) ---
        // FIX SEAM: Mirror UVs to make noise generation seamless horizontally
        vec2 seamlessUV = vec2(abs(uv.x * 2.0 - 1.0), uv.y);
        
        float sourceNoise = texture(iChannel0, seamlessUV + vec2(-0.03, 0.0) * iTime).x * (1.0 + bassValue * 0.2);
        float sourceMask = clamp(((sourceNoise - 0.5) * 10.0) + 0.5, 0.0, 1.0);

        // Usage of seamlessUV ensures left/right match perfectly
        vec2 turbulenceUVA = seamlessUV + vec2(0.01, 0.02) * sin(iTime + bassValue * 8.0); 
        vec2 turbulenceA = vec2(
            sin(turbulenceUVA.x * 15.0 + smoothedFrequencyValue * 3.0),
            cos(turbulenceUVA.y * 15.0 + smoothedFrequencyValue * 3.0)
        );

        vec2 turbulenceUVB = seamlessUV * 2.0 + vec2(0.02, 0.01) * cos(iTime + trebleValue * 3.0);
        vec2 turbulenceB = vec2(
            sin(turbulenceUVB.x * 25.0 + smoothedFrequencyValue * 2.0),
            cos(turbulenceUVB.y * 25.0 + smoothedFrequencyValue * 2.0)
        );

        vec2 combinedVelocity = turbulenceA * (0.03 + bassValue * 0.03) + turbulenceB * (0.015 + trebleValue * 0.01);

        vec3 jupiterA = vec3(0.9, 0.6, 0.4) * (1.0 + uColorBoost + midrangeValue * 0.3);
        vec3 jupiterB = vec3(0.8, 0.5, 0.3) * (1.0 + uColorBoost + midrangeValue * 0.3);
        
        vec3 sourceColor = mix(jupiterA, jupiterB, smoothstep(0.4, 0.6, sourceMask));
        
        if (firstFrame || resolutionChange) {
            finalColor = sourceColor;
        } else {
            // Sample self with mirror logic for flow
            // Actually standard UV flow is fine if the source texture is mirror-seamless
            vec3 previousFrame = texture(iChannel1, uv + combinedVelocity).xyz; 
            finalColor = mix(previousFrame, sourceColor, sourceMask * 0.3);
        }

    } else {
        // --- RING MODE (Seamless Banded) ---
        vec2 seamlessUV = vec2(abs(uv.x * 2.0 - 1.0), uv.y);
        
        vec2 warp = vec2(
            fbm(seamlessUV * 3.0 + iTime * 0.05),
            fbm(seamlessUV * 3.0 + iTime * 0.06 + 32.4)
        );
        vec2 warpedUV = seamlessUV + warp * (0.1 + bassValue * 0.1);

        float bandNoise = fbm(warpedUV * vec2(1.0, 10.0));
        float bands = sin(warpedUV.y * 20.0 + bandNoise * 2.0);
        float storms = fbm(warpedUV * 6.0);
        float pattern = mix(bands * 0.5 + 0.5, storms, 0.4);
        
        vec3 colDark = vec3(0.3, 0.1, 0.05);
        vec3 colMid  = vec3(0.7, 0.4, 0.2);
        vec3 colLight= vec3(0.9, 0.8, 0.6);
        
        finalColor = mix(colDark, colMid, smoothstep(0.2, 0.5, pattern));
        finalColor = mix(finalColor, colLight, smoothstep(0.5, 0.8, pattern));
        finalColor += hash(uv * iTime) * 0.05; // grain

        if (firstFrame || resolutionChange) {
            // just finalColor
        } else {
            vec2 flow = vec2(0.001 * (1.0+trebleValue), 0.0);
            vec3 previousFrame = texture(iChannel1, uv + flow).xyz;
            finalColor = mix(previousFrame, finalColor, 0.05);
        }
    }

    fragColor = vec4(finalColor, newTextureSeed);
}
    void main() { mainImage(fragColor, gl_FragCoord.xy); }
`;

window.BUFFER_B_FS = `
    uniform sampler2D iChannel0; 
    uniform vec3 iResolution;
    uniform float smoothedFrequency;
    out vec4 fragColor;
    
    uniform int uVisualMode;

    #define strengthRing 2.0
    #define strengthClassic 5.0
    #define clampValue 0.02

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float smoothedFrequencyValue = max(smoothedFrequency, 0.1) / 255.0;
    
    // Select base strength based on mode
    float baseStrength = (uVisualMode == 0) ? strengthClassic : strengthRing;

    // Dynamic sharpening strength
    float dynamicStrength = mix(baseStrength, baseStrength * 1.5, smoothedFrequencyValue * 0.1);
    
    vec3 centerSample = texture(iChannel0, uv).xyz;
    vec3 northSample = texture(iChannel0, uv + vec2(0.0, 1.0 / iResolution.y)).xyz;
    vec3 southSample = texture(iChannel0, uv + vec2(0.0, -1.0 / iResolution.y)).xyz;
    vec3 eastSample = texture(iChannel0, uv + vec2(1.0 / iResolution.x, 0.0)).xyz;
    vec3 westSample = texture(iChannel0, uv + vec2(-1.0 / iResolution.x, 0.0)).xyz;
    
    vec3 gradient = abs(northSample + southSample - eastSample - westSample);
    float edgeFactor = smoothstep(0.2, 0.5, length(gradient));
    
    vec3 sharpen = (4.0 * centerSample - northSample - southSample - eastSample - westSample) * dynamicStrength * (1.0 - edgeFactor);
    vec3 noise = vec3(fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453));
    sharpen += noise * smoothedFrequencyValue * 0.005;
    sharpen = clamp(sharpen, -clampValue, clampValue);
    
    vec3 finalColor = centerSample + sharpen;
    finalColor = mix(centerSample, finalColor, 0.8 + smoothedFrequencyValue * 0.2);
    
    fragColor = vec4(finalColor, 1.0);
}
void main() { mainImage(fragColor, gl_FragCoord.xy); }
`;

// IMAGE FS: COMBINED
window.IMAGE_FS = `
uniform sampler2D iChannel0; // Buffer B (Planet)
uniform sampler2D iChannel1; // NEBULA / GALAXY Background
uniform sampler2D iChannel2; // Io / Stars noise
uniform sampler2D iChannel3; // Audio Texture (Luminance)
uniform sampler2D iChannel4; // Stars Texture (Classic Mode)

uniform vec3 iResolution;
uniform float iTime;
uniform float bass;
uniform float midrange;
uniform float treble;
uniform float smoothedFrequency;
uniform int uVisualMode; // 0 = Classic, 1 = Ring

out vec4 fragColor;

// --- GEOMETRY HELPERS ---
vec4 generateSphereSurfaceWithMask(vec2 uv, float radius) {
    float radiusSquared = radius * radius;
    float uvLengthSquared = dot(uv, uv);
    if(uvLengthSquared > radiusSquared) return vec4(uv / sqrt(uvLengthSquared), 0.0, 0.0); // Outside
    float z = sqrt(radiusSquared - uvLengthSquared);
    return vec4(uv / radius, z, 1.0); 
}

vec2 generateSphericalUV(vec3 position, float spin) {
    float u = 0.5 + atan(position.z, position.x) / (6.28318);
    float v = 0.5 - asin(position.y) / 3.14159;
    u = fract(u + spin);
    return vec2(u, v);
}

mat3 createRotationMatrix(float pitch, float roll) {
    float cP = cos(pitch), sP = sin(pitch);
    float cR = cos(roll), sR = sin(roll);
    return mat3(cR, -sR*cP, sR*sP, sR, cR*cP, -cR*sP, 0.0, sP, cP);
}

vec4 atmosphere(vec3 normal, vec3 lightDirection, vec3 atmosphereColor, float falloff) {
    float fresnel = pow(1.0 - normal.z, falloff); 
    float light = max(dot(normal, lightDirection), 0.0);
    vec3 litAtmosphere = atmosphereColor * (0.2 + 0.8*light); 
    return vec4(litAtmosphere, fresnel); // w is alpha/amount
}

// Overloaded atmosphere for Classic Mode (uses vec4 sphereData input)
vec4 atmosphereClassic(vec4 sphereSurfaceWithMask, vec3 lightDirection, vec3 atmosphereColor, float haloWidth, float minAtmosphere, float maxAtmosphere, float falloff) {
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

float intersectPlane(vec3 ro, vec3 rd, vec3 n) {
    float denom = dot(rd, n);
    if (abs(denom) < 0.0001) return -1.0; 
    return -dot(ro, n) / denom;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float shorterSide = min(iResolution.x, iResolution.y);
    // Universal UV calc (Classic used offset, Ring used center)
    vec2 uv = (fragCoord / shorterSide - (iResolution.x > iResolution.y ? vec2(iResolution.x/iResolution.y, 1.0) : vec2(1.0, iResolution.y/iResolution.x)) * 0.5);
    
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.8));
    float bassVal = max(bass, 0.1) / 255.0;
    float midrangeVal = max(midrange, 0.1) / 255.0;
    float trebleVal = max(treble, 0.1) / 255.0;

    vec3 finalComp = vec3(0.0);

    if (uVisualMode == 0) {
        // --- CLASSIC MODE ---
        
        vec4 jupiterSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(0.2, 0.15), 0.6);
        float lightIntensity = max(dot(lightDirection, jupiterSurfaceWithMask.xyz), 0.0);
        
        // FIX LIGHTING: Darker shadows
        float gradientFade = pow(1.0 - lightIntensity, 3.0);
        float jupiterLight = mix(0.01, pow(lightIntensity, 0.8), lightIntensity); // Reduced ambient from 0.05 to 0.01
        
        // FIX AMBIENT: Much darker, blue-ish
        vec3 ambientLight = vec3(0.01, 0.01, 0.02) * gradientFade; // Further Reduced
        
        // REDUCED BRIGHTNESS
        vec4 jupiterAtmosphere = atmosphereClassic(
            jupiterSurfaceWithMask, lightDirection, 
            vec3(1.0, 0.8, 0.6) * (1.2 + bassVal * 0.2), // Reduced from 2.0 to 1.2
            0.3, 0.1, 0.8, 3.0
        );

        float jupiterMask = clamp(jupiterSurfaceWithMask.w, 0.0, 1.0);
        mat3 jupiterRotationMatrix = createRotationMatrix(-0.2, 0.3);
        vec3 rotatedJupiter = jupiterRotationMatrix * (jupiterSurfaceWithMask.xyz * jupiterMask);

        // Nautilus / Spiral Logic
        float phi = 1.618;
        float angle = atan(rotatedJupiter.y, rotatedJupiter.x);
        float radius = length(rotatedJupiter.xy);
        float dynamicPhi = phi + (bassVal * 0.05); 
        float spiralFactor = radius * dynamicPhi; 
        
        vec2 nautilusUV = vec2(
            radius * cos(angle + iTime * 0.3 + spiralFactor), 
            radius * sin(angle + iTime * 0.3 + spiralFactor)
        ) * (0.4 + bassVal * 0.02);

        vec2 jupiterUV = generateSphericalUV(rotatedJupiter, iTime * 0.02) + nautilusUV;
        vec2 noiseSwirl = texture(iChannel0, fract(uv * 3.0 + nautilusUV * 5.0 + vec2(iTime * 0.1, -iTime * 0.1))).rg;
        jupiterUV += noiseSwirl * 0.01;
        vec2 scaledUV = fract(jupiterUV * 2.2 + vec2(0.0, 0.8));
        
        // FIX SEAM: compute derivatives manually to handle wrapping
        vec2 ddx = dFdx(scaledUV);
        vec2 ddy = dFdy(scaledUV);
        // If derivative is too large (wrap occurred), ignore it or clamp it logic
        if (abs(ddx.x) > 0.5) ddx.x = 0.0; // Cheap fix for wrap artifact
        if (abs(ddy.y) > 0.5) ddy.y = 0.0;
        
        vec3 jupiterTexture = textureGrad(iChannel0, scaledUV, ddx, ddy).xyz;

        float baseExponent = 4.0;
        float dynamicExponent = baseExponent + (trebleVal * 0.5); 
        jupiterTexture = vec3(
            pow(jupiterTexture.r, dynamicExponent),
            pow(jupiterTexture.g, dynamicExponent + 1.0),
            pow(jupiterTexture.b, dynamicExponent + 1.5)
        ) * 4.0; 
        jupiterTexture *= (1.0 + midrangeVal * 0.2);

        // Io
        vec4 ioSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(-0.32, -0.2), 0.07);
        float ioLight = pow(max(dot(lightDirection, ioSurfaceWithMask.xyz), 0.0), 0.5);
        vec4 ioAtmosphere = atmosphereClassic(ioSurfaceWithMask, lightDirection, vec3(1.0, 0.9, 0.8) * 1.5, 0.06, 0.03, 1.0, 4.0);
        float ioMask = clamp(ioSurfaceWithMask.w, 0.0, 1.0);
        mat3 ioRotationMatrix = createRotationMatrix(0.4, -0.1);
        vec3 rotatedIo = ioRotationMatrix * (ioSurfaceWithMask.xyz * ioMask);
        vec2 ioUV = generateSphericalUV(rotatedIo, -iTime * 0.05);
        vec3 ioTexture = texture(iChannel2, fract(ioUV)).xyz;

        // Background
        vec3 stars = vec3(pow(texture(iChannel4, uv).x, 20.0)) * vec3(1.2, 0.5, 0.4) * 2.0;
        vec3 nebula = texture(iChannel1, uv).xyz * vec3(0.9, 0.3, 0.4);
        stars += nebula;

        vec3 jupiterWithBackground = mix(stars, jupiterTexture * (ambientLight + jupiterLight * vec3(1.0, 0.9, 0.8)), jupiterMask);
        vec3 jupiterWithAtmosphere = mix(jupiterWithBackground, jupiterAtmosphere.rgb, jupiterAtmosphere.a);
        vec3 ioWithAtmosphere = mix(ioTexture * ioLight, ioAtmosphere.rgb, ioAtmosphere.a);
        
        finalComp = jupiterWithAtmosphere + ioWithAtmosphere;

    } else {
        // --- RING MODE ---
        // Common Planet Setup for Ring Mode (Simpler)
        vec2 planetUV = uv + vec2(0.2, 0.15); 
        float radius = 0.6;
        vec4 sphereData = generateSphereSurfaceWithMask(planetUV, radius);
        bool hitPlanet = (sphereData.w > 0.5);
        
        mat3 rotMat = createRotationMatrix(-0.2, 0.3);
        vec3 surfaceNormal = vec3(sphereData.xy, sphereData.z); 
        vec3 rotatedNormal = rotMat * surfaceNormal;
        
        float lightIntensity = max(dot(lightDirection, surfaceNormal), 0.0);
        float jupiterLight = mix(0.05, 1.0, lightIntensity); 
        
        vec2 texUV = generateSphericalUV(rotatedNormal, iTime * 0.02);
        vec3 planetTex = texture(iChannel0, texUV).xyz;
        
        vec3 atmColor = vec3(1.0, 0.7, 0.4) * (1.5 + bassVal*2.0); 
        vec4 atmData = atmosphere(surfaceNormal, lightDirection, atmColor, 3.0);
        vec3 planetFinal = mix(planetTex * jupiterLight, atmData.rgb, atmData.a * 0.6);

        // Ring
        vec3 ro = vec3(planetUV, 2.0);
        vec3 rd = vec3(0.0, 0.0, -1.0);
        vec3 ringNormal = rotMat * vec3(0.0, 1.0, 0.0);
        float t = intersectPlane(ro, rd, ringNormal);
        vec3 ringCol = vec3(0.0);
        float ringAlpha = 0.0;
        float ringZ = -999.0;

        if (t > 0.0) {
            vec3 hitPos = ro + rd * t;
            ringZ = hitPos.z;
            float dist = length(hitPos);
            float innerR = 0.85; 
            float outerR = 1.6;
            
            if (dist > innerR && dist < outerR) {
                float rUV = (dist - innerR) / (outerR - innerR);
                float audioVal = texture(iChannel3, vec2(rUV, 0.5)).r;
                float ridges = sin(dist * 200.0) * 0.5 + 0.5;
                float intensity = audioVal * 3.0;
                vec3 ringBase = vec3(1.0, 0.8, 0.5); 
                vec3 ringHigh = vec3(1.0, 1.0, 1.0);
                ringCol = mix(ringBase, ringHigh, intensity);
                ringAlpha = (0.4 + intensity * 0.6) * ridges;
                ringAlpha *= smoothstep(0.0, 0.1, rUV) * smoothstep(1.0, 0.9, rUV);
            }
        }

        // Galaxy Background
        vec3 bgNoise = texture(iChannel2, uv * 2.0).xyz; 
        vec3 nebula = texture(iChannel1, uv * 0.5 + vec2(iTime*0.01)).xyz;
        vec3 background = mix(bgNoise * 0.3, nebula * 0.6, 0.5);

        // Composite
        float planetZ = hitPlanet ? sphereData.z : -1000.0; 
        
        if (hitPlanet) {
             if (ringAlpha > 0.0) {
                 if (ringZ > planetZ) {
                     finalComp = mix(planetFinal, ringCol, ringAlpha);
                 } else {
                     finalComp = planetFinal;
                 }
             } else {
                 finalComp = planetFinal;
             }
        } else {
             if (ringAlpha > 0.0) {
                 finalComp = mix(background, ringCol, ringAlpha);
             } else {
                 finalComp = background;
             }
        }
    }

    fragColor = vec4(finalComp, 1.0);
}
void main() { mainImage(fragColor, gl_FragCoord.xy); }
`;
