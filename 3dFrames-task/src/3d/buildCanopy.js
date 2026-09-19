import * as THREE from 'three';
import { createMaterials } from './materials.js';

const materials = createMaterials();

const COLUMN_MODEL_HEIGHT = 2.2;
const MAX_COLUMN_SPACING = 2.5;
const BEAM_SIZE = 0.15;
const DECK_THICKNESS = 0.02;
const LATTICE_HEIGHT = 0.15;
const LATTICE_THICKNESS = 0.05;

function getFrameTopY(dimensions) {
  return dimensions.height + BEAM_SIZE;
}

function getPointsAlongSide(sideLength, allowIntermediate) {
	const count = allowIntermediate
		? Math.max(2, Math.ceil(sideLength / MAX_COLUMN_SPACING) + 1)
		: 2;
	return Array.from(
		{ length: count },
		(_, i) => -sideLength / 2 + (i * sideLength) / (count - 1),
	);
}

function getColumnPositions(width, depth) {
	const positions = [];
	const xs = getPointsAlongSide(width, false);
	const zs = getPointsAlongSide(depth, true);

	for (let zi = 0; zi < zs.length; zi++) {
		const isEdgeRow = zi === 0 || zi === zs.length - 1;
		for (let xi = 0; xi < xs.length; xi++) {
			const isEdgeCol = xi === 0 || xi === xs.length - 1;
			if (isEdgeRow || isEdgeCol) {
				positions.push(new THREE.Vector2(xs[xi], zs[zi]));
			}
		}
	}
	return positions;
}
function buildColumns(dimensions, assets) {
  const group = new THREE.Group();
  const scaleY = dimensions.height / COLUMN_MODEL_HEIGHT;

  for (const pos of getColumnPositions(dimensions.width, dimensions.depth)) {
    const column = new THREE.Mesh(assets.column, materials.wood);
    column.scale.set(1, scaleY, 1);
    column.position.set(pos.x, 0, pos.y);
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);
  }

  return group;
}
/**
 * Splits the rectangle perimeter (width x depth) into beam segments.
 *
 * @param {number} width
 * @param {number} depth
 * @param {number} [offset=0] - expands the outline outward (e.g. frieze overhang).
 * @param {number} [cornerJoint=0] - half beam thickness; extends width-runs and
 *   shrinks depth-runs at each corner so beams meet flush instead of overlapping.
 * @returns {{start: THREE.Vector2, length: number, angle: number}[]}
 */
function getPerimeterSegments(width, depth, { offset = 0, cornerJoint = 0 } = {}) {
  const w = width + offset * 2;
  const d = depth + offset * 2;
  const xs = getPointsAlongSide(width, false).map((x) => (x * w) / width);
  const zs = getPointsAlongSide(depth, true).map((z) => (z * d) / depth);
  const segments = [];

  const addRun = (points, toVector) => {
    for (let i = 0; i < points.length - 1; i++) {
      const start = toVector(points[i]);
      const end = toVector(points[i + 1]);
      segments.push({ start, length: end.distanceTo(start), angle: Math.atan2(end.y - start.y, end.x - start.x) });
    }
  };

  addRun(xs, (x) => new THREE.Vector2(x, -d / 2)); 
  addRun(zs, (z) => new THREE.Vector2(w / 2, z)); 
  addRun([...xs].reverse(), (x) => new THREE.Vector2(x, d / 2)); 
  addRun([...zs].reverse(), (z) => new THREE.Vector2(-w / 2, z)); 

  if (cornerJoint > 0) {
    const xsSegCount = xs.length - 1;
    const zsSegCount = zs.length - 1;
    const bottomRun = { start: 0, count: xsSegCount, sign: 1 };
    const rightRun = { start: xsSegCount, count: zsSegCount, sign: -1 };
    const topRun = { start: xsSegCount + zsSegCount, count: xsSegCount, sign: 1 };
    const leftRun = { start: xsSegCount + zsSegCount + xsSegCount, count: zsSegCount, sign: -1 };

    for (const run of [bottomRun, rightRun, topRun, leftRun]) {
      const first = segments[run.start];
      const last = segments[run.start + run.count - 1];
      const dir = new THREE.Vector2(Math.cos(first.angle), Math.sin(first.angle));
      const delta = run.sign * cornerJoint;

      first.start = first.start.clone().addScaledVector(dir, -delta);
      if (first === last) {
        first.length += delta * 2;
      } else {
        first.length += delta;
        last.length += delta;
      }
    }
  }

  return segments;
}

function buildPerimeterBeams(dimensions, assets) {
  const group = new THREE.Group();
  const beamY = dimensions.height;

  const segments = getPerimeterSegments(dimensions.width, dimensions.depth, {
    cornerJoint: BEAM_SIZE / 2,
  });

  for (const segment of segments) {
    const beam = new THREE.Mesh(assets.perimeterBeam, materials.wood);
    beam.scale.set(segment.length, 1, 1);
    beam.position.set(segment.start.x, beamY, segment.start.y);
    beam.rotation.y = -segment.angle;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);
  }

  return group;
}
function buildCornerBraces(dimensions, assets) {
  const group = new THREE.Group();
  const halfW = dimensions.width / 2;
  const halfD = dimensions.depth / 2;

  const scaleY = dimensions.height / COLUMN_MODEL_HEIGHT;

  const corners = [
    { x: -halfW, z: -halfD, angles: [0, -Math.PI / 2] },
    { x: halfW, z: -halfD, angles: [Math.PI, -Math.PI / 2] },
    { x: halfW, z: halfD, angles: [Math.PI, Math.PI / 2] },
    { x: -halfW, z: halfD, angles: [0, Math.PI / 2] },
  ];

  for (const corner of corners) {
    for (const angle of corner.angles) {
      const brace = new THREE.Mesh(assets.cornerBrace, materials.wood);
      brace.scale.set(1, scaleY, 1);
      brace.position.set(corner.x, 0, corner.z);
      brace.rotation.y = angle;
      brace.castShadow = true;
      brace.receiveShadow = true;
      group.add(brace);
    }
  }

  return group;
}
const FRIEZE_THICKNESS = 0.02;

const FRIEZE_HEIGHT = 0.2;

const FRIEZE_OVERHANG = 0.18;

const FRIEZE_RISE = LATTICE_HEIGHT;

/**
 * Builds the two-ring frieze (inner + outer board) that wraps the roof
 * perimeter outside the frame, at FRIEZE_RISE above the beam top.
 *
 * @param {{width: number, height: number, depth: number}} dimensions
 * @param {Record<string, THREE.BufferGeometry>} assets
 * @returns {THREE.Group}
 */
function buildFrieze(dimensions, assets) {
  const group = new THREE.Group();

  const innerHalfW = dimensions.width / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;
  const innerHalfD = dimensions.depth / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;

  const innerTopY = getFrameTopY(dimensions) + FRIEZE_RISE;

  const rings = [
    { part: "friezeInner", halfW: innerHalfW, halfD: innerHalfD, topY: innerTopY },
    {
      part: "friezeOuter",
      halfW: innerHalfW + FRIEZE_THICKNESS,
      halfD: innerHalfD + FRIEZE_THICKNESS,
      topY: innerTopY + FRIEZE_HEIGHT,
    },
  ];

  for (const ring of rings) {
    const y = ring.topY - FRIEZE_HEIGHT;
    const widthLength = ring.halfW * 2;
    const depthLength = ring.halfD * 2 - FRIEZE_THICKNESS * 2;

    const boards = [
      { x: -ring.halfW, z: -ring.halfD, angle: 0, length: widthLength },
      { x: ring.halfW, z: -ring.halfD + FRIEZE_THICKNESS, angle: Math.PI / 2, length: depthLength },
      { x: ring.halfW, z: ring.halfD, angle: Math.PI, length: widthLength },
      { x: -ring.halfW, z: ring.halfD - FRIEZE_THICKNESS, angle: -Math.PI / 2, length: depthLength },
    ];

    for (const b of boards) {
      const board = new THREE.Mesh(assets.frieze, materials.wood);
      board.scale.set(b.length, 1, 1);
      board.position.set(b.x, y, b.z);
      board.rotation.y = -b.angle;
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }
  }

  return group;
}
const LATTICE_SPACING = 0.5;
const LATTICE_OVERHANG = 0.15;


/**
 * Lays a row of long lattice beams across the roof, spaced ≤ LATTICE_SPACING
 * along X, each beam running along Z to span the depth (with overhang).
 *
 * @param {{width: number, height: number, depth: number}} dimensions
 * @param {Record<string, THREE.BufferGeometry>} assets
 * @returns {THREE.Group}
 */
function buildLattice(dimensions, assets) {
  const group = new THREE.Group();
  const y = getFrameTopY(dimensions);

  const halfD = dimensions.depth / 2 + BEAM_SIZE / 2;
  const beamLength = halfD * 2 + LATTICE_OVERHANG * 2;

  const halfW = dimensions.width / 2 + BEAM_SIZE / 2;
  const span = halfW * 2;
  const count = Math.max(2, Math.ceil(span / LATTICE_SPACING) + 1);

  for (let i = 0; i < count; i++) {
    const x = -halfW + (i * span) / (count - 1);

    const beam = new THREE.Mesh(assets.latticeBeamLong, materials.wood);
    beam.scale.set(beamLength, 1, 1);
    beam.rotation.y = -Math.PI / 2;
    beam.position.set(x - LATTICE_THICKNESS / 2, y, -halfD - LATTICE_OVERHANG);
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);
  }

  return group;
}



const DECK_BOARD_WIDTH = 0.19;

/**
 * Lays decking boards across the internal frieze, running along X, stacked
 * in rows along Z. The last row is trimmed to fit exactly.
 *
 * @param {{width: number, height: number, depth: number}} dimensions
 * @param {Record<string, THREE.BufferGeometry>} assets
 * @returns {THREE.Group}
 */
function buildDecking(dimensions, assets) {
  const group = new THREE.Group();

  const halfW = dimensions.width / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;
  const halfD = dimensions.depth / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;

  const y = getFrameTopY(dimensions) + FRIEZE_RISE;
  const boardLength = halfW * 2;
  const totalDepth = halfD * 2;
  const boardCount = Math.ceil(totalDepth / DECK_BOARD_WIDTH);

  for (let i = 0; i < boardCount; i++) {
    const rowStart = -halfD + i * DECK_BOARD_WIDTH;
    const rowWidth = Math.min(DECK_BOARD_WIDTH, halfD - rowStart);

    const board = new THREE.Mesh(assets.decking, materials.wood);
    board.scale.set(rowWidth / DECK_BOARD_WIDTH, 1, boardLength);
    board.rotation.y = Math.PI / 2;
    board.position.set(halfW, y, rowStart + rowWidth / 2);
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);
  }

  return group;
}

const ROOF_THICKNESS = 0.002;

function buildRoofCover(dimensions, assets) {
  const group = new THREE.Group();

  const halfW = dimensions.width / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;
  const halfD = dimensions.depth / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;

  const y = getFrameTopY(dimensions) + FRIEZE_RISE + DECK_THICKNESS;

  const cover = new THREE.Mesh(assets.roofCover, materials.roof);
  cover.scale.set(halfW * 2, 1, halfD * 2);
  cover.position.set(-halfW, y, halfD);
  cover.receiveShadow = true;
  group.add(cover);

  return group;
}

const PROFILE_DEPTH = 0.0867;
const PROFILE_CORNER_ARM = 0.0859;

function buildPerimeterProfile(dimensions, assets) {
  const group = new THREE.Group();

  const halfW = dimensions.width / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;
  const halfD = dimensions.depth / 2 + BEAM_SIZE / 2 + FRIEZE_OVERHANG;

  const y = getFrameTopY(dimensions) + FRIEZE_RISE + DECK_THICKNESS + ROOF_THICKNESS;

  const lineW = halfW - PROFILE_DEPTH;
  const lineD = halfD - PROFILE_DEPTH;

  const corners = [
    { x: -lineW, z: -lineD, angle: 0, mirrorZ: false },
    { x: lineW, z: -lineD, angle: Math.PI, mirrorZ: true },
    { x: lineW, z: lineD, angle: Math.PI, mirrorZ: false },
    { x: -lineW, z: lineD, angle: 0, mirrorZ: true },
  ];

  for (const corner of corners) {
    const piece = new THREE.Mesh(assets.perimeterProfileCorner, materials.aluminium);
    piece.scale.set(1, 1, corner.mirrorZ ? -1 : 1);
    piece.position.set(corner.x, y, corner.z);
    piece.rotation.y = -corner.angle;
    piece.castShadow = true;
    piece.receiveShadow = true;
    group.add(piece);
  }

  const widthLength = lineW * 2 - PROFILE_CORNER_ARM * 2;
  const depthLength = lineD * 2 - PROFILE_CORNER_ARM * 2;

  const runs = [
    { x: -lineW + PROFILE_CORNER_ARM, z: -lineD, angle: 0, length: widthLength },
    { x: lineW, z: -lineD + PROFILE_CORNER_ARM, angle: Math.PI / 2, length: depthLength },
    { x: lineW - PROFILE_CORNER_ARM, z: lineD, angle: Math.PI, length: widthLength },
    { x: -lineW, z: lineD - PROFILE_CORNER_ARM, angle: -Math.PI / 2, length: depthLength },
  ];

  for (const run of runs) {
    const profile = new THREE.Mesh(assets.perimeterProfile, materials.aluminium);
    profile.scale.set(run.length, 1, 1);
    profile.position.set(run.x, y, run.z);
    profile.rotation.y = -run.angle;
    profile.castShadow = true;
    profile.receiveShadow = true;
    group.add(profile);
  }

  return group;
}

export function buildCanopy(dimensions, assets) {
    const canopyGroup = new THREE.Group();
    canopyGroup.add(buildColumns(dimensions, assets));
    canopyGroup.add(buildPerimeterBeams(dimensions, assets));
    canopyGroup.add(buildCornerBraces(dimensions, assets));
    canopyGroup.add(buildFrieze(dimensions, assets));
    canopyGroup.add(buildDecking(dimensions, assets));
    canopyGroup.add(buildLattice(dimensions, assets));
    canopyGroup.add(buildRoofCover(dimensions, assets));
    canopyGroup.add(buildPerimeterProfile(dimensions, assets));
    return canopyGroup;
}
