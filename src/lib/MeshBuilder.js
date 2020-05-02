import * as THREE from 'three';
import * as VertexBuilder from './VertexBuilder'

export class MeshBuilder {
    constructor() {
        this.width = 100;
        this.height = 100;
        this.centerX = 0.5;
        this.centerY = 0.5;
        this.fov = 75;
        this.size = 100;
        this.minDistance = 0;
    }

    /**
     * @param {number} value
     */
    set width(value) {
        this.widthVal = value;
        this.aspect = this.width / this.height;
    }

    get width() { return this.widthVal; }

    /**
     * @param {number} value
     */
    set height(value) {
        this.heightVal = value;
        this.aspect = this.width / this.height;
    }

    get height() { return this.heightVal; }

    /**
     * @param {number} value
     */
    set fov(value) {
        this.fovVal = value;
        this.focalLength = this.getFocalLength(this.fov);
    }

    get fov() { return this.fovVal; }

    /**
     * 
     * @param {number[]} zBuffer The distances.
     * @param {number[]} colors The colors.
     * @returns {THREE.Mesh} The mesh.
     */
    buildMesh(zBuffer, colors) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        const mesh = new THREE.Mesh(geometry, material);

        const points = this.getPoints(zBuffer);
        const vertexIndices = VertexBuilder.getVertexIndices(points, this.width, this.height);
        const vertices = VertexBuilder.getVertices(points, vertexIndices);
        const vertexColors = VertexBuilder.getVertices(this.getColors(colors), vertexIndices);

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
     * @param {Number} offsetX 
     * @param {Number} offsetY 
     * @param {Number} parentWidth 
     * @param {Number} parentHeight
     * @returns {Number[]} x, y, z, x, y, z, ...
     */
    getPoints(
        distances,
        offsetX = 0,
        offsetY = 0,
        parentWidth = this.width,
        parentHeight = this.height
    ) {
        const points = distances.flatMap((d, i) => {
            const u = offsetX + (i % this.width) + 1;
            const v = offsetY + Math.floor(i / this.width);
            return this.getPoint(u / parentWidth, v / parentHeight, d);
        });

        return points;
    }

    /**
     * Converts UV Coordinates + Distance to a Point in 3D space.
     * @param {Number} u U Coordinate.
     * @param {Number} v V Coordinate.
     * @param {Number} d Distance.
     * @returns {Number[]} x, y, z
     */
    getPoint(u, v, d) {
        let x = (-u + this.centerX) * this.aspect;
        let y = -v + this.centerY;
        let z = this.focalLength;

        const vLength = Math.sqrt((x * x) + (y * y) + (z * z));

        x /= vLength;
        y /= vLength;
        z /= vLength;

        const dN = ((d * (1 - this.minDistance) + 0xFFFF * this.minDistance) / 0xFFFF) * this.size;

        return [x * dN, y * dN, z * dN];
    }

    getColors(imageData) {
        return Array.from(imageData)
            //               [ discard alpha  ]  [  discard rgba groups where a = 0  ]
            .filter((_, i) => (i + 1) % 4 != 0 && imageData[i + (4 - i % 4) - 1] != 0)
            .map(c => c / 255);
    }

    /** @param {number} fov */
    getFocalLength(fov) {
        return 0.5 / (Math.tan((fov / 2) * Math.PI / 180));
    }
}
