import { useEffect, useRef } from 'react'

const vertexShaderSource = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;

out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotation * p * 2.03 + 8.17;
    amplitude *= 0.5;
  }

  return value;
}

float ribbon(vec2 p, float phase, float width, float bend) {
  float contour = sin(p.x * 1.05 + phase) * 0.27;
  contour += sin(p.x * 2.15 - phase * 0.65) * 0.08;
  contour += (fbm(vec2(p.x * 0.55 + phase, phase * 0.07)) - 0.5) * bend;
  return exp(-abs(p.y - contour) * width);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / max(u_resolution.y, 1.0);
  p -= (u_pointer - 0.5) * vec2(0.12, 0.08);

  float time = u_time * 0.075;
  float cloud = fbm(p * 1.35 + vec2(time * 0.34, -time * 0.2));
  vec3 deep = vec3(0.018, 0.074, 0.155);
  vec3 blue = vec3(0.055, 0.205, 0.405);
  vec3 color = mix(deep, blue, 0.48 + cloud * 0.36 + uv.y * 0.12);

  vec2 a = mat2(0.90, -0.43, 0.43, 0.90) * p;
  a.y -= 0.23;
  float upperRibbon = ribbon(a * vec2(0.84, 1.0), 0.6 + time, 6.4, 0.52);

  vec2 b = mat2(0.48, 0.88, -0.88, 0.48) * p;
  b.y += 0.34;
  float centerRibbon = ribbon(b * vec2(0.73, 1.0), 2.8 - time * 0.72, 7.4, 0.44);

  vec2 c = mat2(0.94, 0.34, -0.34, 0.94) * p;
  c.y += 0.62;
  float lowerRibbon = ribbon(c * vec2(0.65, 1.0), 4.1 + time * 0.55, 5.8, 0.6);

  color += vec3(0.72, 0.77, 0.75) * upperRibbon * 0.52;
  color += vec3(0.58, 0.66, 0.69) * centerRibbon * 0.4;
  color += vec3(0.56, 0.62, 0.60) * lowerRibbon * 0.24;

  vec2 gridUv = gl_FragCoord.xy / 36.0;
  vec2 gridDistance = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
  float grid = 1.0 - min(min(gridDistance.x, gridDistance.y), 1.0);
  color += vec3(0.38, 0.58, 0.77) * grid * 0.075;

  float grain = hash(gl_FragCoord.xy + floor(u_time * 12.0));
  color += (grain - 0.5) * 0.018;

  float vignette = 1.0 - smoothstep(0.34, 0.94, length((uv - 0.5) * vec2(0.82, 1.0)));
  color *= 0.64 + vignette * 0.46;
  color *= 0.72 + smoothstep(0.0, 0.44, uv.y) * 0.28;

  outColor = vec4(color, 1.0);
}
`

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader)
    return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Kerros shader compile failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

/** Full-viewport WebGL atmosphere, with a solid CSS fallback when unavailable. */
export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
    })

    if (!canvas || !gl)
      return

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader)
      return

    const program = gl.createProgram()
    if (!program)
      return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Kerros shader link failed:', gl.getProgramInfoLog(program))
      return
    }

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const pointerLocation = gl.getUniformLocation(program, 'u_pointer')
    const buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { x: 0.5, y: 0.5 }
    let frame = 0
    let startTime = performance.now()

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio))
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    const draw = (now: number) => {
      resize()
      const elapsed = reducedMotion.matches ? 0 : (now - startTime) / 1000
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, elapsed)
      gl.uniform2f(pointerLocation, pointer.x, pointer.y)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      if (!reducedMotion.matches)
        frame = requestAnimationFrame(draw)
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x += (event.clientX / window.innerWidth - pointer.x) * 0.12
      pointer.y += (1 - event.clientY / window.innerHeight - pointer.y) * 0.12
    }

    const handleMotionChange = () => {
      cancelAnimationFrame(frame)
      startTime = performance.now()
      frame = requestAnimationFrame(draw)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    reducedMotion.addEventListener('change', handleMotionChange)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handlePointerMove)
      reducedMotion.removeEventListener('change', handleMotionChange)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return <canvas aria-hidden="true" className="kerros-shader" ref={canvasRef} />
}
