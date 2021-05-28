import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import coordinates from './isomorphisms/coordinates.js'
import renderLine from './views/line.js'
import renderCircle from './views/circle.js'
import renderPolygon from './views/polygon.js'
import { seed, noise } from './utilities/noise.js'
import { BLUE } from './constants/colors.js'
import {
  ZOOM, FPS, TIME_THRESHOLD, Δt, FREQUENCY, AMPLITUDE, INCREMENTS, θdeg
} from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')

const { sin, cos } = Math

const perspective = FourByFour.identity()
  .rotX(angles.toRadians(45))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: ZOOM
})

const θ = angles.toRadians(θdeg)

seed(Math.random())

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  perspective.rotZ(angles.toRadians(0.5))

  const points = []

  for (let r = 1; r < 8; r++) {
    const distortion = noise(r * 50 * FREQUENCY, θdeg * FREQUENCY, time * FREQUENCY) * 40

    for (let φdeg = 0; φdeg <= 360; φdeg = φdeg + INCREMENTS[r]) {
      const φ = angles.toRadians(φdeg)
      const Δθ = angles.toRadians(distortion * sin(φ))
      const spherical = Vector.from([r, θ + Δθ, φ])
      const cartesian = coordinates.toCartesian(spherical)
      const projected = camera.project(cartesian.transform(perspective))
      const baseline = camera.project(coordinates.toCartesian(Vector.from([r, θ, φ])).transform(perspective))

      if (φdeg) {
        const prev = points[points.length - 1]
        const polygon = [projected, prev.projected, prev.baseline, baseline]

        Δθ > 0 ?
          renderPolygon(context, polygon, BLUE, BLUE, 1) :
          renderLine(context, prev.baseline, baseline, BLUE, 1)
      }

      points.push({ projected, baseline })
    }
  }

  if (time > TIME_THRESHOLD) time = 0
  time += Δt
}

let time = 0
let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
