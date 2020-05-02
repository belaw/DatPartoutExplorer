import * as THREE from 'three';
import * as VertexBuilder from './VertexBuilder'

/**
 * 
 * @param {number[]} zBuffer 
 * @param {number[]} colors 
 * @param {number} width 
 * @param {number} height 
 * @param {number} fov
 * @returns {THREE.Mesh}
 */
export function getMesh(zBuffer, colors, width, height, fov, size, minZ) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geometry, material);

    const points = getPoints(zBuffer, width, height, fov, size, minZ);
    const vertexIndices = VertexBuilder.getVertexIndices(points, width, height);
    const vertices = VertexBuilder.getVertices(points, vertexIndices);
    const vertexColors = VertexBuilder.getVertices(getColors(colors), vertexIndices);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(vertexColors), 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, vertices.length);

    return mesh;
}

/**
 * Converts the distances of a z Buffer to points in 3D space.
 * @param {Number[]} distances Z Buffer.
 * @param {Number} width Width of Z Buffer.
 * @param {Number} height Height of Z Buffer.
 * @param {number} fov
 * @param {number} size
 * @param {Number} offsetX 
 * @param {Number} offsetY 
 * @param {Number} parentWidth 
 * @param {Number} parentHeight
 * @returns {Number[]} x, y, z, x, y, z, ...
 */
function getPoints(
    distances,
    width,
    height,
    fov,
    size,
    minZ,
    offsetX = 0,
    offsetY = 0,
    parentWidth = width,
    parentHeight = height
) {
    const distancesAspect = parentWidth / parentHeight;
    const fl = getFocalLength(fov);

    const points = distances.flatMap((d, i) => {
        const u = offsetX + (i % width) + 1;
        const v = offsetY + Math.floor(i / width);
        return getPoint(u / parentWidth, v / parentHeight, d, distancesAspect, fl, size, minZ);
    });

    return points;
}

/**
 * Converts UV Coordinates + Distance to a Point in 3D space.
 * @param {Number} u U Coordinate.
 * @param {Number} v V Coordinate.
 * @param {Number} d Distance.
 * @param {Number} a Aspect ratio.
 * @param {Number} fl Focal length.
 * @param {Number} s Size.
 * @returns {Number[]} x, y, z
 */
function getPoint(u, v, d, a, fl, s, minZ) {
    let x = (-u + 0.5) * a;
    let y = -v + 0.5;
    let z = fl;

    const vLength = Math.sqrt((x * x) + (y * y) + (z * z));

    x /= vLength;
    y /= vLength;
    z /= vLength;

    const dN = ((d * (1 - minZ) + 0xFFFF * minZ) / 0xFFFF) * s;

    return [x * dN, y * dN, z * dN];
}

function getColors(imageData) {
    return Array.from(imageData)
        //               [ discard alpha  ]  [  discard rgba groups where a = 0  ]
        .filter((_, i) => (i + 1) % 4 != 0 && imageData[i + (4 - i % 4) - 1] != 0)
        .map(c => c / 255);
}

function getFocalLength(fov) {
    return 0.5 / (Math.tan((fov / 2) * Math.PI / 180));
}
