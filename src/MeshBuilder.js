import * as THREE from 'three';
import * as VertexBuilder from './VertexBuilder'
import {SceneUtils} from 'three/examples/jsm/utils/SceneUtils.js'

export class MeshBuilder {
    constructor() {
        this.width = 100;
        this.height = 100;
        this.centerX = 0.5;
        this.centerY = 0.5;
        this.fov = 75;
        this.size = 100;
        this.minDistance = 0;
        this.maxEdgeLength = 100;
        this.wireframe = false;
        /** @type {THREE.Texture[]} */
        this.textureCache = [];
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
     * @param {ImageData} textureImageData The texture.
     * @param {number} [offsetX]
     * @param {number} [offsetY]
     * @param {number} [childWidth]
     * @param {number} [childHeight]
     * @returns {THREE.Mesh} The mesh.
     */
    buildMesh(zBuffer, textureImageData, offsetX = 0, offsetY = 0, childWidth = this.width, childHeight = this.height) {
        // Exporter can't work with ImageData textures so I convert it to an HTMLImageElement
        const canvas = document.createElement("canvas");
        canvas.width = textureImageData.width;
        canvas.height = textureImageData.height;
        canvas.getContext("2d").putImageData(textureImageData, 0, 0);
        const image = document.createElement("img");
        image.src = canvas.toDataURL("image/png");

        const texture = new THREE.Texture(image);
        this.textureCache.push(texture);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        const geometry = new THREE.BufferGeometry();
        const wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x0A0A0A, wireframe: true, transparent: true, visible: this.wireframe});
        //const material = new THREE.MeshStandardMaterial({
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: texture
            //flatShading: false,
            //reflectivity: 0,
            //metalness: 0
        });
        const mesh = SceneUtils.createMultiMaterialObject( geometry, [wireframeMaterial, material] );
        //const mesh = new THREE.Mesh(geometry, material);

        const vertices = this.getVertices(zBuffer, offsetX, offsetY, childWidth);
        const faces = VertexBuilder.getFaceVertexIndices(vertices, childWidth, childHeight, this.maxEdgeLength);
        const uvs = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            const u = ((i % textureImageData.width) + 0.5) / textureImageData.width;
            const v = 1 - ((Math.floor(i / textureImageData.width) + 0.5) / textureImageData.height);
            uvs.push(u, v);
        }
        // const vertexColors = this.getColors(colors);

        for (const i in vertices) {
            if (vertices[i] === undefined) {
                vertices[i] = 0;
            }
        }

        geometry.setIndex(faces);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        // geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

        return mesh;
    }

    /**
     * 
     * @param {number[]} zBuffer The distances.
     * @param {number[]} colors The colors.
     * @param {number} [offsetX]
     * @param {number} [offsetY]
     * @param {number} [childWidth]
     * @param {number} [childHeight]
     * @returns {THREE.Points} The points.
     */
    buildPoints(zBuffer, colors, offsetX = 0, offsetY = 0, childWidth = this.width, childHeight = this.height) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({ vertexColors: true });
        const mesh = new THREE.Points(geometry, material);

        const vertices = this.getVertices(zBuffer, offsetX, offsetY, childWidth);
        const vertexColors = this.getColors(colors);

        for (const i in vertices) {
            if (vertices[i] === undefined) {
                vertices[i] = 0;
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));

        return mesh;
    }

    /**
     * Converts the distances of a z Buffer to points in 3D space.
     * The optional parameters can be provided if the distances cover a smaller area within the bounds of the MeshBuilder (width x height).
     * @param {Number[]} distances Z Buffer.
     * @param {Number} [offsetX]
     * @param {Number} [offsetY]
     * @param {Number} [childWidth]
     * @returns {Number[]} x, y, z, x, y, z, ...
     */
    getVertices(
        distances,
        offsetX = 0,
        offsetY = 0,
        childWidth = this.width
    ) {
        const vertices = [];
        for (let i = 0; i < distances.length; i++) {
            const d = distances[i];
            if (d === undefined) {
                vertices.push(undefined, undefined, undefined);
            } else {
                const u = offsetX + (i % childWidth) + 1;
                const v = offsetY + Math.floor(i / childWidth);
                Array.prototype.push.apply(vertices, this.getVertex(u / this.width, v / this.height, d));
            }
        }

        return vertices;
    }

    /**
     * Converts UV Coordinates + Distance to a Point in 3D space.
     * @param {Number} u U Coordinate.
     * @param {Number} v V Coordinate.
     * @param {Number} d Distance.
     * @returns {Number[]} x, y, z
     */
    getVertex(u, v, d) {
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
        return Array.from(imageData.data)
            //               [ discard alpha  ]  [  discard rgba groups where a = 0  ]
            .filter((_, i) => (i + 1) % 4 != 0 /*&& imageData[i + (4 - i % 4) - 1] != 0*/)
            .map(c => c / 255);
    }

    /** @param {number} fov */
    getFocalLength(fov) {
        return 0.5 / (Math.tan((fov / 2) * Math.PI / 180));
    }

    clearTextureCache() {
        for (const i in this.textureCache) {
            this.textureCache[i].dispose();
        }
        this.textureCache = [];
    }
}
