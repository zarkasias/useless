import { AdditiveBlending, ShaderMaterial } from "three";

/**
 * A soft diagonal band of light, drawn additively over a card face. `sweep`
 * moves it across the card (about -0.3 to 1.3 crosses it fully); outside
 * that range it draws nothing.
 */
export function createSheenMaterial() {
  return new ShaderMaterial({
    uniforms: {
      sweep: { value: -1 },
      width: { value: 0.12 },
      intensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float sweep;
      uniform float width;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        // A band tilted across the card, from bottom-left to top-right.
        float along = (vUv.x * 0.8 + vUv.y * 0.6) / 1.4;
        float band = exp(-pow((along - sweep) / max(width, 0.01), 2.0));
        // A brighter thin core inside the soft glow, like foil.
        float core = exp(-pow((along - sweep) / max(width * 0.25, 0.005), 2.0));
        float light = (band * 0.7 + core * 0.5) * intensity;
        // A faint foil tint: warm on the leading edge, cool on the trailing
        // one, white in the core. It reads on light surfaces where pure white
        // light would not.
        float side = clamp((along - sweep) / max(width, 0.01), -1.0, 1.0);
        vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.86, 0.7), side * 0.5 + 0.5);
        vec3 color = mix(tint, vec3(1.0), core);

        gl_FragColor = vec4(color * light, light);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}
