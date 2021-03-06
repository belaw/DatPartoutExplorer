import { DATPARTOUT } from './DATPARTOUT'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ImageEntry } from './Entries/ImageEntry';
import { ZBufferEntry } from './Entries/ZBufferEntry';

const fileElm = document.getElementById("file");
const viewFovElm = document.getElementById("viewFov");
const fovElm = document.getElementById("fov");
const centerXElm = document.getElementById("centerX");
const centerYElm = document.getElementById("centerY");
const minZElm = document.getElementById("minZ");
const pSizeElm = document.getElementById("pSize");
const sizeAttentuationElm = document.getElementById("sizeAttentuation");
const cameraElm = document.getElementById("camera");
const showHelperElm = document.getElementById("showHelper");
const showRenderElm = document.getElementById("showRender");

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
const frustumSize = 600;
let distancesWidth = 100;
let distancesHeight = 100;
const maxDist = 100;

const scene = new THREE.Scene();
const cameraR = new THREE.PerspectiveCamera(parseFloat(fovElm.value), distancesWidth / distancesHeight, 0.1, maxDist);
const cameraRHelper = new THREE.CameraHelper(cameraR);
const cameraP = new THREE.PerspectiveCamera(parseFloat(viewFovElm.value), aspect, 0.1, 2000);
const cameraO = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 2000);
const raycaster = new THREE.Raycaster();

scene.background = new THREE.Color(0.2, 0.1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.zIndex = '-1';

const renderer2 = new THREE.WebGLRenderer({ antialias: false });
renderer2.setSize(distancesWidth, distancesHeight);
document.body.appendChild(renderer2.domElement);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.right = '0px';
renderer2.domElement.style.display = showRenderElm.checked ? 'block' : 'none';

const controlsP = new OrbitControls(cameraP, renderer.domElement);
controlsP.enableDamping = true;
controlsP.dampingFactor = 0.25;
controlsP.zoomSpeed = 0.5;
controlsP.rotateSpeed = 1;
controlsP.screenSpacePanning = true;
controlsP.panSpeed = 5;
controlsP.enabled = true;

const controlsO = new OrbitControls(cameraO, renderer.domElement);
controlsO.enableDamping = true;
controlsO.dampingFactor = 0.25;
controlsO.zoomSpeed = 0.5;
controlsO.rotateSpeed = 0.1;
controlsO.screenSpacePanning = true;
controlsO.panSpeed = 5;
controlsO.enabled = false;

const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({ size: parseFloat(pSizeElm.value), vertexColors: true });
const mesh = new THREE.Points(geometry, material);

scene.add(cameraRHelper);
scene.add(mesh);

cameraR.lookAt(0, 0, 1);
cameraR.updateMatrixWorld();
cameraP.position.z = -5;
cameraO.position.z = -1000;

let activeCamera = cameraP;
let activeControls = controlsP;
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("mousemove", event => {
    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.height) * 2 + 1;
});

renderer.domElement.addEventListener("keydown", event => {
    if (event.keyCode == 83) {
        raycaster.setFromCamera(mouse, activeCamera);
        const intersections = raycaster.intersectObject(mesh);
        if (intersections.length > 0) {
            activeControls.target = intersections[0].point;
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    controlsP.update();
    controlsO.update();
    renderer.render(scene, activeCamera);
    if (showRenderElm.checked)
        renderer2.render(scene, cameraR);
}

function getFocalLength(fov) {
    return 0.5 / (Math.tan((fov / 2) * Math.PI / 180));
}

let distances;
let colors;
let fov = parseFloat(fovElm.value);
let focalLength = getFocalLength(fov);
let minZ = parseFloat(minZElm.value);
let centerX = parseFloat(centerXElm.value);
let centerY = parseFloat(centerYElm.value);

fovElm.onchange = () => {
    fov = parseFloat(fovElm.value);
    focalLength = getFocalLength(fov);
    cameraR.fov = fov;
    cameraR.updateProjectionMatrix();
    cameraRHelper.update();
    updateScene();
}
viewFovElm.onchange = () => {
    cameraP.fov = parseFloat(viewFovElm.value);
    cameraP.updateProjectionMatrix();
};
centerXElm.onchange = () => {
    centerX = parseFloat(centerXElm.value);
    updateScene();
};
centerYElm.onchange = () => {
    centerY = parseFloat(centerYElm.value);
    updateScene();
};
minZElm.onchange = () => {
    minZ = parseFloat(minZElm.value);
    updateScene();
};
pSizeElm.onchange = () => {
    material.size = parseFloat(pSizeElm.value);
};
sizeAttentuationElm.onchange = () => {
    material.sizeAttenuation = sizeAttentuationElm.checked;
    material.needsUpdate = true;
};
cameraElm.onchange = () => {
    switch (cameraElm.value) {
        case 'p':
            activeCamera = cameraP;
            activeControls = controlsP;
            break;
        case 'o':
            activeCamera = cameraO;
            activeControls = controlsO;
            break;
        default:
            break;
    }

    controlsP.enabled = cameraElm.value === 'p';
    controlsO.enabled = cameraElm.value === 'o';
};
showHelperElm.onchange = () => cameraRHelper.visible = showHelperElm.checked;
showRenderElm.onchange = () => renderer2.domElement.style.display = showRenderElm.checked ? 'block' : 'none';

/**
 * Converts the distances of a z Buffer to points in 3D space.
 * @param {Number[]} distances Z Buffer.
 * @param {Number} width Width of Z Buffer.
 * @param {Number} height Height of Z Buffer.
 * @param {Number} offsetX 
 * @param {Number} offsetY 
 * @param {Number} parentWidth 
 * @param {Number} parentHeight 
 */
function getPoints(
    distances,
    width,
    height,
    offsetX = 0,
    offsetY = 0,
    parentWidth = width,
    parentHeight = height
) {
    const distancesAspect = parentWidth / parentHeight;

    const points = distances.flatMap((d, i) => {
        const u = offsetX + (i % width) + 1;
        const v = offsetY + Math.floor(i / width);
        return getPoint(u / parentWidth, v / parentHeight, d, distancesAspect);
    });

    return points;
}

/**
 * Converts UV Coordinates + Distance to a Point in 3D space.
 * @param {Number} u U Coordinate.
 * @param {Number} v V Coordinate.
 * @param {Number} d Distance.
 * @param {Number} a Aspect ratio.
 */
function getPoint(u, v, d, a) {
    let x = (-u + centerX) * a;
    let y = -v + centerY;
    let z = focalLength;

    const vLength = Math.sqrt((x * x) + (y * y) + (z * z));

    x /= vLength;
    y /= vLength;
    z /= vLength;

    const dN = ((d * (1 - minZ) + 0xFFFF * minZ) / 0xFFFF) * maxDist;

    return [x * dN, y * dN, z * dN];
}

function updateScene() {
    const points = getPoints(distances, distancesWidth, distancesHeight);
    for (const i in points) {
        geometry.attributes.position.array[i] = points[i];
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
}

document.getElementById("camReset").onclick = () => {
    controlsP.reset();
    controlsO.reset();
    cameraP.position.z = -5;
    cameraO.position.z = -1000;
};

const tableObjects = [
    // { name: "lite84", group: 299, entry: 3 },
    // { name: "lite85", group: 300, entry: 3 },

    { name: "a_flip1", group: 474, entry: 3 },
    { name: "a_flip2", group: 482, entry: 3 },

    { name: "a_bump1", group: 491, entry: 3 },
    { name: "a_bump2", group: 499, entry: 3 },
    { name: "a_bump3", group: 507, entry: 3 },
    { name: "a_bump4", group: 515, entry: 3 },
    { name: "a_bump5", group: 524, entry: 3 },
    { name: "a_bump6", group: 532, entry: 3 },
    { name: "a_bump7", group: 540, entry: 3 },

    { name: "a_targ1", group: 551, entry: 3 },
    { name: "a_targ2", group: 552, entry: 3 },
    { name: "a_targ3", group: 553, entry: 3 },
    { name: "a_targ4", group: 554, entry: 3 },
    { name: "a_targ5", group: 555, entry: 3 },
    { name: "a_targ6", group: 556, entry: 3 },
    { name: "a_targ7", group: 557, entry: 3 },
    { name: "a_targ8", group: 558, entry: 3 },
    { name: "a_targ9", group: 559, entry: 3 },

    { name: "a_targ10", group: 561, entry: 3 },
    { name: "a_targ11", group: 563, entry: 3 },
    { name: "a_targ12", group: 565, entry: 3 },
    { name: "a_targ13", group: 567, entry: 3 },
    { name: "a_targ14", group: 569, entry: 3 },
    { name: "a_targ15", group: 571, entry: 3 },
    { name: "a_targ16", group: 573, entry: 3 },
    { name: "a_targ17", group: 575, entry: 3 },
    { name: "a_targ18", group: 577, entry: 3 },
    { name: "a_targ19", group: 579, entry: 3 },
    { name: "a_targ20", group: 581, entry: 3 },
    { name: "a_targ21", group: 583, entry: 3 },
    { name: "a_targ22", group: 585, entry: 3 },

    // { name: "v_rebo1", group: 588, entry: 3 },
    // { name: "v_rebo2", group: 589, entry: 3 },

    { name: "plunger", group: 592, entry: 3 },

    { name: "a_flag1", group: 600, entry: 3 },
    { name: "a_flag2", group: 615, entry: 3 },

    { name: "a_kick1", group: 622, entry: 3 },
    { name: "a_kick2", group: 624, entry: 3 },
];

function getColors(imageData) {
    return Array.from(imageData)
        //               [ discard alpha  ]  [  discard rgba groups where a = 0  ]
        .filter((_, i) => (i + 1) % 4 != 0 && imageData[i + (4 - i % 4) - 1] != 0)
        .map(c => c / 255);
}

fileElm.onchange = () => {
    const f = fileElm.files[0];
    const r = new FileReader();

    r.readAsArrayBuffer(f);
    r.onload = () => {
        const datFile = new DATPARTOUT(r.result);

        /** @type {ZBufferEntry} */
        const distancesEntry = datFile.groups[212][14];
        distancesWidth = distancesEntry.width;
        distancesHeight = distancesEntry.height;

        renderer2.setSize(distancesWidth, distancesHeight);
        cameraR.aspect = distancesWidth / distancesHeight;
        cameraR.updateProjectionMatrix();
        cameraRHelper.update();

        distances = distancesEntry.zBuffer;
        const points = getPoints(distances, distancesWidth, distancesHeight);

        /** @type {ImageEntry} */
        const colorsEntry = datFile.groups[212][3];
        colors = getColors(colorsEntry.imageData.data);

        for (const tableObject of tableObjects) {
            /** @type {ImageEntry} */
            const entry = datFile.groups[tableObject.group][tableObject.entry];
            Array.prototype.push.apply(colors, getColors(entry.imageData.data));
            Array.prototype.push.apply(points, getPoints(
                entry.zBuffer,
                entry.width,
                entry.height,
                entry.mp1 - 220,
                entry.mp2 - 4,
                distancesWidth,
                distancesHeight));
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(points), 3).setUsage(THREE.DynamicDrawUsage));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(colors), 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.setDrawRange(0, points.length);

        updateScene();
    };
};

animate();
