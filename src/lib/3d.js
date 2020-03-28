import { DATPARTOUT } from './DATPARTOUT'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
    renderer2.render(scene, cameraR);
}

function getFocalLength(fov) {
    return 0.5 / (Math.tan((fov / 2) * Math.PI / 180));
}

let distances;
let colors;
let palette;
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

document.getElementById("dl").onclick = file;

function file() {
    const points = getPoints(distances, distancesWidth, distancesHeight);

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

function convertDistancesEntry(data, fullWidth, width) {
    const result = [];
    const padding = fullWidth - width;

    for (const i in data) {
        const u = (i % fullWidth);
        if (u >= width) continue;
        const v = Math.floor(i / fullWidth);
        const index = v * fullWidth + (fullWidth - 1 - (u + padding));

        result.push(data[index]);
    }

    return result;
}

function getPoints(distances, width, height, offsetX = 0, offsetY = 0) {
    const distancesAspect = width / height;

    const points = distances.flatMap((d, i) => {
        const u = offsetX + (i % width);
        const v = offsetY + Math.floor(i / width) + 1;
        return getPoint(u / width, v / height, d, distancesAspect);
    });

    return points;
}

function getPoint(u, v, d, a) {
    let x = (u - centerX) * a;
    let y = v - centerY;
    let z = focalLength;

    const vLength = Math.sqrt((x * x) + (y * y) + (z * z));

    x /= vLength;
    y /= vLength;
    z /= vLength;

    const dN = ((d * (1 - minZ) + 0xFFFF * minZ) / 0xFFFF) * maxDist;

    return [x * dN, y * dN, z * dN];
}

function getColors(entry, palette) {
    const colors = [];

    for (const i in entry.data) {
        let fullWidth = entry.width + entry.padding;
        const u = i % fullWidth;
        if (u >= entry.width) continue;
        const v = Math.floor(i / fullWidth);
        const index = v * fullWidth + (fullWidth - 1 - (u + entry.padding));

        if (!entry.data.hasOwnProperty(index)) continue;
        const color = palette[entry.data[index]];

        colors.push(color.r / 255, color.g / 255, color.b / 255);
    }

    return colors;
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

function getColorsAndPoints(entry) {
    const colors = [];
    const points = [];

    const maxLine = entry.tableSize == 0 ? 600 : entry.tableSize == 1 ? 752 : 960;
    let currentOffset = 0;
    const a = distancesWidth / distancesHeight;
    const xPos = entry.fullWidth - 220;
    const yPos = entry.unk3 - 4;

    for (const line of entry.lines) {
        currentOffset += line.offset;
        for (let i = 0; i < line.pixels.length; i++) {
            const pixel = line.pixels[i];
            const color = palette[pixel.color || 0] || 0;
            colors.push(color.r / 255, color.g / 255, color.b / 255);

            const u = (currentOffset + i) % maxLine;
            const v = (entry.height - 1) - Math.floor((currentOffset + i) / maxLine);
            const uN = ((distancesWidth - xPos) - u - 1) / distancesWidth;
            const vN = ((distancesHeight - yPos) - v) / distancesHeight;

            Array.prototype.push.apply(points, getPoint(uN, vN, pixel.dist, a));
        }
        currentOffset += line.pixels.length;
    }

    return { points, colors };
}

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

fileElm.onchange = () => {
    const f = fileElm.files[0];
    const r = new FileReader();

    r.readAsArrayBuffer(f);
    r.onload = () => {
        const datFile = new DATPARTOUT(r.result);

        const distancesEntry = datFile.groups[212].entries[14];
        distancesWidth = distancesEntry.width;
        distancesHeight = distancesEntry.height;
        renderer2.setSize(distancesWidth, distancesHeight);
        cameraR.aspect = distancesWidth / distancesHeight;
        cameraR.updateProjectionMatrix();
        cameraRHelper.update();
        distances = convertDistancesEntry(
            distancesEntry.data,
            distancesEntry.fullWidth,
            distancesEntry.width
        );
        const points = getPoints(distances, distancesWidth, distancesHeight);

        palette = datFile.groups[1].entries[4].data.colors;
        const colorsEntry = datFile.groups[212].entries[3];
        colors = getColors(colorsEntry, palette);

        for (const tableObject of tableObjects) {
            var bois = getColorsAndPoints(datFile.groups[tableObject.group].entries[tableObject.entry]);
            Array.prototype.push.apply(colors, bois.colors);
            Array.prototype.push.apply(points, bois.points);
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
