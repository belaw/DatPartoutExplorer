import { DATPARTOUT } from './DATPARTOUT'
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';//'three/examples/jsm/controls/OrbitControls.js';
import { ColladaExporter } from 'three/examples/jsm/exporters/ColladaExporter.js';
import { ImageEntry } from './Entries/ImageEntry';
import { ZBufferEntry } from './Entries/ZBufferEntry';
import { saveString, saveArrayBuffer } from "./Saver";
import { getMesh } from './MeshBuilder';

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

/** @type {THREE.Mesh} */
let mesh;
/** @type {ZBufferEntry} */
let distancesEntry;
/** @type {ImageEntry} */
let colorsEntry;


const scene = new THREE.Scene();
const cameraR = new THREE.PerspectiveCamera(parseFloat(fovElm.value), distancesWidth / distancesHeight, 0.1, maxDist);
const cameraRHelper = new THREE.CameraHelper(cameraR);
cameraRHelper.layers.disable(0);
cameraRHelper.layers.enable(1);
const cameraP = new THREE.PerspectiveCamera(parseFloat(viewFovElm.value), aspect, 0.1, 2000);
cameraP.layers.enable(1);
const cameraO = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 2000);
cameraO.layers.enable(1);
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
controlsP.enableDamping = false;
controlsP.zoomSpeed = 0.5;
controlsP.rotateSpeed = 1;
controlsP.screenSpacePanning = true;
controlsP.panSpeed = 5;
controlsP.enabled = true;

const controlsO = new OrbitControls(cameraO, renderer.domElement);
controlsO.enableDamping = false;
controlsO.zoomSpeed = 0.5;
controlsO.rotateSpeed = 0.1;
controlsO.screenSpacePanning = true;
controlsO.panSpeed = 5;
controlsO.enabled = false;

scene.add(cameraRHelper);

cameraR.lookAt(0, 0, 1);
cameraR.updateMatrixWorld();
controlsP.target = new THREE.Vector3(0, 0, maxDist / 2);
cameraO.position.z = -1000;

let activeCamera = cameraP;
let activeControls = controlsP;
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("mousemove", event => {
    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.width) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.height) * 2 + 1;
});

function raycastTarget(coords) {
    raycaster.setFromCamera(coords, activeCamera);
    const intersections = raycaster.intersectObject(mesh);
    const validIntersections = intersections.filter(v => v.distance > 0);
    if (validIntersections.length > 0) {
        activeControls.target = validIntersections[0].point;
    }
}

renderer.domElement.addEventListener("dblclick", () => raycastTarget(mouse));

window.addEventListener("resize", e => {
    cameraO.aspect = window.innerWidth / window.innerHeight;
    cameraO.updateProjectionMatrix();
    cameraP.aspect = window.innerWidth / window.innerHeight;
    cameraP.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controlsP.update();
    controlsO.update();
    renderer.render(scene, activeCamera);
    if (showRenderElm.checked)
        renderer2.render(scene, cameraR);
}

let fov = parseFloat(fovElm.value);
let minZ = parseFloat(minZElm.value);
let centerX = parseFloat(centerXElm.value);
let centerY = parseFloat(centerYElm.value);

renderer.domElement.addEventListener("keydown", e => {
    switch (e.keyCode) {
        case 97: // Numpad 1
            activeControls.setPolarAngle(rad(90));
            activeControls.setAzimuthalAngle(rad(180));
            break;

        case 103: // Numpad 7
            activeControls.setPolarAngle(rad(0));
            activeControls.setAzimuthalAngle(rad(180));
            break;

        case 99: // Numpad 3
            activeControls.setPolarAngle(rad(90));
            activeControls.setAzimuthalAngle(rad(90));
            break;

        case 105: // Numpad 9
            activeControls.setPolarAngle(Math.PI - activeControls.getPolarAngle());
            activeControls.setAzimuthalAngle(activeControls.getAzimuthalAngle() - rad(180));
            break;

        case 100: // numpad 4
            activeControls.setAzimuthalAngle(rad(deg(activeControls.getAzimuthalAngle()) - 0.1));
            break;

        case 102: // Numpad 6
            activeControls.setAzimuthalAngle(rad(deg(activeControls.getAzimuthalAngle()) + 0.1));
            break;

        case 104: // Numpad 8
            activeControls.setPolarAngle(rad(deg(activeControls.getPolarAngle()) - 0.1));
            break;

        case 98: // Numpad 2
            activeControls.setPolarAngle(rad(deg(activeControls.getPolarAngle()) + 0.1));
            break;
    }
});

function rad(deg) {
    return deg * (Math.PI / 180);
}

function deg(rad) {
    return rad * (180 / Math.PI);
}

fovElm.onchange = () => {
    fov = parseFloat(fovElm.value);
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
    mesh.material.size = parseFloat(pSizeElm.value);
};
sizeAttentuationElm.onchange = () => {
    mesh.material.sizeAttenuation = sizeAttentuationElm.checked;
    mesh.material.needsUpdate = true;
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
document.getElementById("export").onclick = () => {
    const exporter = new ColladaExporter();
    exporter.parse(mesh, result => {
        saveString(result.data, "cadet.dae");
        result.textures.forEach(tex => {
            saveArrayBuffer(tex.data, `${tex.name}.${tex.ext}`);
        });
    });
}

document.getElementById("camReset").onclick = () => {
    controlsP.reset();
    controlsO.reset();
    controlsP.target = new THREE.Vector3(0, 0, maxDist / 2);
    controlsP.update();
    cameraO.position.z = -1000;
    raycastTarget(new THREE.Vector2(0, 0));
};

function updateScene(){
    scene.remove(mesh);
    mesh = getMesh(
        distancesEntry.zBuffer,
        colorsEntry.imageData.data,
        distancesEntry.width,
        distancesEntry.height,
        fov,
        maxDist,
        minZ);

    renderer2.setSize(distancesWidth, distancesHeight);
    cameraR.aspect = distancesWidth / distancesHeight;
    cameraR.updateProjectionMatrix();
    cameraRHelper.update();

    //for (const tableObject of tableObjects) {
    //    /** @type {ImageEntry} */
    //    const entry = datFile.groups[tableObject.group][tableObject.entry];
    //    const objectPoints = getPoints(
    //        entry.zBuffer,
    //        entry.width,
    //        entry.height,
    //        entry.mp1 - 220,
    //        entry.mp2 - 4,
    //        distancesWidth,
    //        distancesHeight);
    //    const objectIndices = VertexBuilder.getVertexIndices(objectPoints, entry.width, entry.height);
    //    const objectColors = VertexBuilder.getVertices(getColors(entry.imageData.data), objectIndices);
    //    const objectVertices = VertexBuilder.getVertices(objectPoints, objectIndices);
    //    Array.prototype.push.apply(colors, objectColors);
    //    Array.prototype.push.apply(vertices, objectVertices);
    //}

    scene.add(mesh);
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

    { name: "v_bloc1", group: 617, entry: 3 },

    { name: "v_gate1", group: 618, entry: 3 },
    { name: "v_gate2", group: 619, entry: 3 },

    { name: "a_kick1", group: 622, entry: 3 },
    { name: "a_kick2", group: 624, entry: 3 },
];

fileElm.onchange = () => {
    const f = fileElm.files[0];
    const r = new FileReader();

    r.readAsArrayBuffer(f);
    r.onload = () => {
        const datFile = new DATPARTOUT(r.result);

        distancesEntry = datFile.groups[212][14];
        colorsEntry = datFile.groups[212][3];

        distancesWidth = distancesEntry.width;
        distancesHeight = distancesEntry.height;

        updateScene();

        raycastTarget(new THREE.Vector2(0, 0));
    };
};

animate();
