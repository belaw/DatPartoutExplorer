import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function init() {
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;
    const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    const frustumSize = 600;

    const scene = new THREE.Scene();
    const cameraX = new THREE.PerspectiveCamera(75, 583 / 751, 0.1, 100);
    const cameraXHelper = new THREE.CameraHelper(cameraX);
    const cameraP = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
    const cameraO = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 2000);

    scene.background = new THREE.Color(0.2, 0.1, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.body.appendChild(renderer.domElement);

    const controlsP = new OrbitControls(cameraP, renderer.domElement);
    controlsP.enableDamping = true;
    controlsP.dampingFactor = 0.25;
    controlsP.zoomSpeed = 0.5;
    controlsP.rotateSpeed = 1;
    controlsP.autoRotate = false;
    controlsP.autoRotateSpeed = 20;
    controlsP.enableKeys = true;
    controlsP.screenSpacePanning = true;
    controlsP.panSpeed = 5;
    controlsP.enabled = true;

    const controlsO = new OrbitControls(cameraO, renderer.domElement);
    controlsO.enableDamping = true;
    controlsO.dampingFactor = 0.25;
    controlsO.zoomSpeed = 0.5;
    controlsO.rotateSpeed = 0.1;
    controlsO.autoRotate = false;
    controlsO.autoRotateSpeed = 20;
    controlsO.enableKeys = true;
    controlsO.screenSpacePanning = true;
    controlsO.panSpeed = 5;
    controlsO.enabled = false;

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array();
    const colors = new Float32Array();

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });
    const mesh = new THREE.Points(geometry, material);

    scene.add(cameraXHelper);
    scene.add(mesh);

    cameraX.lookAt(0, 0, 1);
    //cameraX.updateMatrix();
    cameraX.updateMatrixWorld();
    //cameraX.updateProjectionMatrix();
    //cameraX.updateWorldMatrix();
    cameraP.position.z = -5;
    cameraO.position.z = -1000;

    return {
        scene: scene,
        cameraP: cameraP,
        cameraO: cameraO,
        cameraX: cameraX,
        cameraXHelper: cameraXHelper,
        renderer: renderer,
        controlsP: controlsP,
        controlsO: controlsO,
        geometry: geometry,
        material: material
    };
}

const ctx = init();
let activeCamera = ctx.cameraP;

function animate() {
    requestAnimationFrame(animate);
    ctx.controlsP.update();
    ctx.controlsO.update();
    ctx.renderer.render(ctx.scene, activeCamera);
}

const fileElm = document.getElementById("file");
const fovElm = document.getElementById("fov");
const centerXElm = document.getElementById("centerX");
const centerYElm = document.getElementById("centerY");
const minZElm = document.getElementById("minZ");
const maxZElm = document.getElementById("maxZ");
const pSizeElm = document.getElementById("pSize");
const sizeAttentuationElm = document.getElementById("sizeAttentuation");
const orthoElm = document.getElementById("ortho");

let pointsEntry, colors, palette;

fovElm.onchange = () => {
    ctx.cameraX.fov = parseFloat(fovElm.value);
    ctx.cameraX.updateProjectionMatrix();
    ctx.cameraX.updateMatrix();
    ctx.cameraX.updateMatrixWorld();
    ctx.cameraX.updateWorldMatrix();
    ctx.cameraXHelper.update();
    updateScene();
}
centerXElm.onchange = () => updateScene();
centerYElm.onchange = () => updateScene();
minZElm.onchange = () => updateScene();
maxZElm.onchange = () => updateScene();
pSizeElm.onchange = () => {
    ctx.material.size = parseFloat(pSizeElm.value);
};
sizeAttentuationElm.onchange = () => {
    ctx.material.sizeAttenuation = sizeAttentuationElm.checked;
    ctx.material.needsUpdate = true;
};
orthoElm.onchange = () => {
    activeCamera = orthoElm.checked ? ctx.cameraO : ctx.cameraP
    ctx.controlsO.enabled = orthoElm.checked;
    ctx.controlsP.enabled = !orthoElm.checked;
};

document.getElementById("dl").onclick = file;

function file() {
    const points = getPoints(pointsEntry);

    let f = `ply
format ascii 1.0
element vertex ${points.length / 3}
property double x
property double y
property double z
property uchar red
property uchar green
property uchar blue
end_header
`;

    let vertex = [];

    for (const i in colors) {
        if (!colors.hasOwnProperty(i)) continue;

        if (i % 3 === 0 && i > 0) {
            f += `${vertex.join(' ')}\n`;
            vertex = [];
        }

        vertex[i % 3] = points[i];
        vertex[(i % 3) + 3] = Math.floor(colors[i] * 255);
    }
    f += `${vertex.join(' ')}\n`;

    console.log(f);
    return f;
}

function getPoints(entry) {
    const points = [];
    const centerX = parseFloat(centerXElm.value);
    const centerY = parseFloat(centerYElm.value);
    const fov = parseFloat(fovElm.value);
    const minZ = parseFloat(minZElm.value);
    const maxZ = parseFloat(maxZElm.value);
    const fullWidth = entry.fullWidth;

    for (const i in entry.data) {
        const u = (i % fullWidth);
        if (u > entry.width) continue;
        const v = Math.floor(i / fullWidth);
        const index = v * fullWidth + (fullWidth - 1 - u);

        //if (!entry.data.hasOwnProperty(index)) continue;
        const d = entry.data[index];

        const fl = 0.5 / (Math.tan((fov / 2) * Math.PI / 180));

        const entryAspect = entry.width / entry.height;
        let x = ((u / entry.width) - centerX) * entryAspect;
        let y = (v / entry.height) - centerY;
        let z = fl;

        const vLength = Math.sqrt((x * x) + (y * y) + (z * z));

        x /= vLength;
        y /= vLength;
        z /= vLength;

        //const dN = (((d / 0xFFFF) * ((1 - minZ) * maxZ)) + minZ) * 100;
        //const dN = (((d / 0xFFFF) * 1 - minZ) + minZ) * 100;
        //const dN = ((d * (1 - minZ) + 0xFFFF * minZ) / 0xFFFF) * 100;
        const dN = ((d * (1 - minZ) + 0xFFFF * minZ) / 0xFFFF) * 100;
        //const dN = (d / 0xFFFF) * 100;

        points.push(x * dN, y * dN, z * dN);
    }

    return points;
}

function getColors(entry, palette) {
    const colors = [];

    for (const i in entry.data) {

        let fullWidth = entry.width + entry.padding;
        const u = i % fullWidth;
        if (u > entry.width) continue;
        const v = Math.floor(i / fullWidth);
        const index = v * fullWidth + (fullWidth - 1 - u);

        if (!entry.data.hasOwnProperty(index)) continue;
        const color = palette[entry.data[index]];

        colors.push(color.r / 255, color.g / 255, color.b / 255);
    }

    return new Float32Array(colors);
}

function updateScene() {
    const points = getPoints(pointsEntry);
    for (const i in points) {
        ctx.geometry.attributes.position.array[i] = points[i];
    }

    ctx.geometry.attributes.position.needsUpdate = true;
    ctx.geometry.computeBoundingSphere();
}

document.getElementById("camReset").onclick = () => {
    ctx.controlsP.reset();
    ctx.controlsO.reset();
    ctx.cameraP.position.z = -5;
    ctx.cameraO.position.z = -1000;
};

fileElm.onchange = () => {
    const f = fileElm.files[0];
    const r = new FileReader();

    r.readAsArrayBuffer(f);
    r.onload = () => {
        const datFile = new DATPARTOUT(r.result);
        pointsEntry = datFile.groups[212].entries[14];
        const points = getPoints(pointsEntry);
        palette = datFile.groups[1].entries[4].data.colors;
        const colorsEntry = datFile.groups[212].entries[3];
        colors = getColors(colorsEntry, palette);

        ctx.geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3).setUsage(THREE.DynamicDrawUsage));
        ctx.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        ctx.geometry.attributes.position.needsUpdate = true;
        ctx.geometry.attributes.color.needsUpdate = true;
        ctx.geometry.setDrawRange(0, points.length);

        updateScene(colors, points);
    };
};

animate();
