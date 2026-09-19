# 3D Canopy Configurator

Test assignment: a page with three parameters (width, height, depth, 2-8 m)
that parametrically rebuild a 3D model of a wooden canopy. Vanilla Three.js,
no React, no 3D frameworks.

## Run

```bash
npm install
npm run dev
```

## Structure

```
src/
  main.js                 - entry point, wires the form to the scene
  ui/
    dimensionsForm.js     - three inputs, validation, on-change callback
  3d/
    createScene.js        - scene, camera, light, shadows, OrbitControls, render loop
    assetLoad.js           - loads .obj models
    materials.js           - PBR materials (wood / roof / aluminium)
    buildCanopy.js         - all the parametric canopy geometry
  script.js                - CLI script to measure a model's bounding box (node src/script.js <path>)
```

## How it works

The form holds three numbers (`width`, `height`, `depth`). On every input
change it calls `buildCanopy(dimensions, assets)`, the old mesh group is
removed from the scene, the new one is added. No React needed here — the
entire state is three numbers, Three.js redraws the scene on its own in the
render loop.

`buildCanopy.js` is a set of separate `buildX()` functions, each responsible
for one layer of the structure bottom to top: columns → perimeter beams →
corner braces → frieze → decking + lattice → roof cover → perimeter profile.
Each function knows nothing about its neighbors — the only connection is
`dimensions` and shared height constants (`BEAM_SIZE`, `FRIEZE_RISE`, etc).

### Placing parts

Every `.obj` model has a pivot (local origin) at some specific point — mostly
a corner, sometimes the center of the cross-section. This was measured
upfront with a script (`node src/script.js models/xxx.obj` prints the
bounding box). Knowing that:

- long parts (beams, boards) are simply scaled (`scale.x`) to the needed
  length, since the pivot sits at the edge;
- direction is set via `rotation.y = θ`, where the formula
  `+X → (cos θ, 0, -sin θ)` gives the right angle for any side of the
  perimeter;
- each layer's height is computed from the one below it (`getFrameTopY`,
  `FRIEZE_RISE`, etc), not set independently per part.

### Corner joints of the beams

The trickiest part. Two perimeter beams meet at a corner flush against each
other, not at the column's center — otherwise they'd either overlap or leave
a gap (beam thickness isn't zero). Solved by extending the side running along
the width by half the beam thickness at each corner, and shortening the side
running along the depth by the same amount. Implemented in
`getPerimeterSegments` (the `cornerJoint` parameter).

## Deliberate simplifications

- **Inner frieze height** above the frame is set equal to the lattice beam's
  height (`FRIEZE_RISE = LATTICE_HEIGHT`), not a fixed value. Reason: the
  lattice beam sits on top of the perimeter beam, and the decking rests on
  both the lattice beam and the frieze at once — if the frieze were lower
  than the beam, the decking would sink into it.
- Short lattice filler pieces (between the frieze and the long beam) aren't
  implemented — they don't affect how readable the model is in the
  configurator.
- Column count and beam spacing are computed by formula (step ≤ limit),
  not hand-picked per size.

## AI use

Most of this project was written and debugged by hand
Concretely, with AI help:

- Understanding the assignment itself — what the final result actually
  needed to look like — was worked out with AI assistance.
- `src/script.js` (the bounding box CLI tool) was AI-generated.
- The functions that carry a JSDoc comment in `buildCanopy.js`
  (`getPerimeterSegments`, `buildFrieze`, `buildLattice`, `buildDecking`, added the same way) were implemented with direct AI help, not written from scratch by
  hand — under time pressure, after understanding what they needed to do.

