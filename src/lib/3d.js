import { DATPARTOUT } from './DATPARTOUT'
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';//'three/examples/jsm/controls/OrbitControls.js';
import { ColladaExporter } from 'three/examples/jsm/exporters/ColladaExporter.js';
// import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { ImageEntry } from './Entries/ImageEntry';
import { ZBufferEntry } from './Entries/ZBufferEntry';
import { save, saveArrayBuffer, saveString } from "./Saver";
import { MeshBuilder } from './MeshBuilder';
/*import px from "url:../img/px.png";
import nx from "url:../img/nx.png";
import py from "url:../img/py.png";
import ny from "url:../img/ny.png";
import pz from "url:../img/pz.png";
import nz from "url:../img/nz.png";*/
import JSZip from 'jszip';

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
const maxEdgeLengthElm = document.getElementById("maxEdgeLength");
const wireframeElm = document.getElementById("wireframe");

const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
const frustumSize = 600;
const meshBuilder = new MeshBuilder();
meshBuilder.width = 100;
meshBuilder.height = 100;
meshBuilder.fov = parseFloat(fovElm.value);
meshBuilder.minDistance = parseFloat(minZElm.value);
meshBuilder.centerX = parseFloat(centerXElm.value);
meshBuilder.centerY = parseFloat(centerYElm.value);
meshBuilder.size = 100;
meshBuilder.maxEdgeLength = parseFloat(maxEdgeLengthElm.value);
meshBuilder.wireframe = wireframeElm.checked;

/** @type {THREE.Mesh[]} */
let meshes = [];
/** @type {ZBufferEntry} */
let distancesEntry;
/** @type {ImageEntry} */
let colorsEntry;
/** @type {ImageEntry[]} */
let objectEntries = [];

const scene = new THREE.Scene();
const cameraR = new THREE.PerspectiveCamera(parseFloat(fovElm.value), meshBuilder.width / meshBuilder.height, 0.1, meshBuilder.size);
const cameraRHelper = new THREE.CameraHelper(cameraR);
cameraRHelper.layers.disable(0);
cameraRHelper.layers.enable(1);
const cameraP = new THREE.PerspectiveCamera(parseFloat(viewFovElm.value), aspect, 0.1, 2000);
cameraP.layers.enable(1);
const cameraO = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 2000);
cameraO.layers.enable(1);
const raycaster = new THREE.Raycaster();

const bgtex = new THREE.CubeTextureLoader().load([
    '../img/px.png',
    '../img/nx.png',
    '../img/py.png',
    '../img/ny.png',
    '../img/pz.png',
    '../img/nz.png'
]);
bgtex.minFilter = THREE.LinearFilter;
scene.background = bgtex;
//scene.background = new THREE.Color("black");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.zIndex = '-1';

const renderer2 = new THREE.WebGLRenderer({ antialias: false });
renderer2.setSize(meshBuilder.width, meshBuilder.height);
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
controlsP.target = new THREE.Vector3(0, 0, meshBuilder.size / 2);
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
    const intersections = raycaster.intersectObjects(meshes);
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

renderer.domElement.addEventListener("keydown", e => {
    switch (e.code) {
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
    const fov = parseFloat(fovElm.value);
    meshBuilder.fov = fov;
    cameraR.fov = fov;
    cameraR.updateProjectionMatrix();
    cameraRHelper.update();
    updateScene();
};
viewFovElm.onchange = () => {
    cameraP.fov = parseFloat(viewFovElm.value);
    cameraP.updateProjectionMatrix();
};
centerXElm.onchange = () => {
    meshBuilder.centerX = parseFloat(centerXElm.value);
    updateScene();
};
centerYElm.onchange = () => {
    meshBuilder.centerY = parseFloat(centerYElm.value);
    updateScene();
};
minZElm.onchange = () => {
    meshBuilder.minDistance = parseFloat(minZElm.value);
    updateScene();
};
pSizeElm.onchange = () => {
    for (const mesh of meshes) {
        mesh.material.size = parseFloat(pSizeElm.value);
    }
};
sizeAttentuationElm.onchange = () => {
    for (const mesh of meshes) {
        mesh.material.sizeAttenuation = sizeAttentuationElm.checked;
        mesh.material.needsUpdate = true;
    }
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
    const zip = new JSZip();
    const exporter = new ColladaExporter();
    exporter.parse(scene, result => {
        zip.file("cadet.dae", result.data);
        result.textures.forEach(tex => {
            zip.file(`textures/${tex.name}.${tex.ext}`, tex.data);
        });
        zip.generateAsync({ compression: "STORE", type: "blob" }).then(blob => save(blob, "cadet.zip"));
    }, { textureDirectory: "textures" });
};
maxEdgeLengthElm.onchange = () => {
    meshBuilder.maxEdgeLength = parseFloat(maxEdgeLengthElm.value);
    updateScene();
};
wireframeElm.onchange = () => {
    meshBuilder.wireframe = wireframeElm.checked;
    for (const mesh of meshes) {
        mesh.material.wireframe = wireframeElm.checked;
    }
};

document.getElementById("camReset").onclick = () => {
    controlsP.reset();
    controlsO.reset();
    controlsP.target = new THREE.Vector3(0, 0, meshBuilder.size / 2);
    controlsP.update();
    cameraO.position.z = -1000;
    raycastTarget(new THREE.Vector2(0, 0));
};

function updateScene() {
    for (const mesh of meshes) {
        if (mesh !== undefined) {
            scene.remove(mesh);
            mesh.material.dispose();
            mesh.geometry.dispose();
        }
    }
    meshBuilder.clearTextureCache();
    meshes = [];
    // meshes.push(meshBuilder.buildMesh(distancesEntry.zBuffer, colorsEntry.imageData));
    meshes.push(meshBuilder.buildPoints(distancesEntry.zBuffer, colorsEntry.imageData));

    renderer2.setSize(meshBuilder.width, meshBuilder.height);
    cameraR.aspect = meshBuilder.width / meshBuilder.height;
    cameraR.updateProjectionMatrix();
    cameraRHelper.update();

    for (const oe of objectEntries) {
        // const m = meshBuilder.buildMesh(
        const m = meshBuilder.buildPoints(
            oe.entry.zBuffer,
            oe.entry.imageData,
            oe.entry.mp1 - 220,
            oe.entry.mp2 - 4,
            oe.entry.width,
            oe.entry.height);
        m.name = oe.name;
        meshes.push(m);
    }

    for (const mesh of meshes) {
        scene.add(mesh);
    }
}

const tableObjects = [
    { name: "lite1", group: 234, entry: 3 },
    { name: "lite2", group: 235, entry: 3 },
    { name: "lite2_1", group: 236, entry: 3 },
    { name: "lite2_2", group: 237, entry: 3 },
    { name: "lite3", group: 238, entry: 3 },
    { name: "lite3_1", group: 239, entry: 3 },
    { name: "lite3_2", group: 240, entry: 3 },
    { name: "lite4", group: 241, entry: 3 },
    { name: "lite4_1", group: 242, entry: 3 },
    { name: "lite4_2", group: 243, entry: 3 },
    { name: "lite5", group: 244, entry: 3 },
    { name: "lite6", group: 245, entry: 3 },
    { name: "lite7", group: 246, entry: 3 },
    { name: "lite8", group: 247, entry: 3 },
    { name: "lite9", group: 248, entry: 3 },
    { name: "lite10", group: 249, entry: 3 },
    { name: "lite11", group: 250, entry: 3 },
    { name: "lite12", group: 251, entry: 3 },
    { name: "lite13", group: 252, entry: 3 },
    { name: "lite16", group: 253, entry: 3 },
    { name: "lite17", group: 254, entry: 3 },
    { name: "lite18", group: 255, entry: 3 },
    { name: "lite19", group: 256, entry: 3 },
    { name: "lite20", group: 257, entry: 3 },
    { name: "lite21", group: 258, entry: 3 },
    { name: "lite22", group: 259, entry: 3 },
    { name: "lite23", group: 260, entry: 3 },
    { name: "lite24", group: 261, entry: 3 },
    { name: "lite25", group: 262, entry: 3 },
    { name: "lite26", group: 263, entry: 3 },
    { name: "lite27", group: 264, entry: 3 },
    { name: "lite28", group: 265, entry: 3 },
    { name: "lite29", group: 266, entry: 3 },
    { name: "lite30", group: 267, entry: 3 },
    { name: "lite38", group: 268, entry: 3 },
    { name: "lite39", group: 269, entry: 3 },
    { name: "lite40", group: 270, entry: 3 },
    { name: "lite44", group: 271, entry: 3 },
    { name: "lite45", group: 272, entry: 3 },
    { name: "lite46", group: 273, entry: 3 },
    { name: "lite47", group: 274, entry: 3 },
    { name: "lite48", group: 275, entry: 3 },
    { name: "lite49", group: 276, entry: 3 },
    { name: "lite50", group: 277, entry: 3 },
    { name: "lite51", group: 278, entry: 3 },
    { name: "lite52", group: 279, entry: 3 },
    { name: "lite54", group: 280, entry: 3 },
    { name: "lite55", group: 281, entry: 3 },
    { name: "lite56", group: 282, entry: 3 },
    { name: "lite58", group: 283, entry: 3 },
    { name: "lite59", group: 284, entry: 3 },
    { name: "lite60", group: 285, entry: 3 },
    { name: "lite61", group: 286, entry: 3 },
    { name: "lite62", group: 287, entry: 3 },
    { name: "lite63", group: 288, entry: 3 },
    { name: "lite64", group: 289, entry: 3 },
    { name: "lite65", group: 290, entry: 3 },
    { name: "lite66", group: 291, entry: 3 },
    { name: "lite67", group: 292, entry: 3 },
    { name: "lite68", group: 293, entry: 3 },
    { name: "lite69", group: 294, entry: 3 },
    { name: "lite70", group: 295, entry: 3 },
    { name: "lite71", group: 296, entry: 3 },
    { name: "lite72", group: 297, entry: 3 },
    { name: "lite77", group: 298, entry: 3 },
    { name: "lite84", group: 299, entry: 3 },
    { name: "lite85", group: 300, entry: 3 },
    { name: "lite101", group: 301, entry: 3 },
    { name: "lite102", group: 302, entry: 3 },
    { name: "lite103", group: 303, entry: 3 },
    { name: "lite104", group: 304, entry: 3 },
    { name: "lite105", group: 305, entry: 3 },
    { name: "lite106", group: 306, entry: 3 },
    { name: "lite107", group: 307, entry: 3 },
    { name: "lite108", group: 308, entry: 3 },
    { name: "lite109", group: 309, entry: 3 },
    { name: "lite110", group: 310, entry: 3 },
    { name: "lite130", group: 311, entry: 3 },
    { name: "lite131", group: 312, entry: 3 },
    { name: "lite132", group: 313, entry: 3 },
    { name: "lite133", group: 314, entry: 3 },
    { name: "lite144", group: 315, entry: 3 },
    { name: "lite145", group: 316, entry: 3 },
    { name: "lite146", group: 317, entry: 3 },
    { name: "lite147", group: 318, entry: 3 },
    { name: "lite148", group: 319, entry: 3 },
    { name: "lite149", group: 320, entry: 3 },
    { name: "lite150", group: 321, entry: 3 },
    { name: "lite151", group: 322, entry: 3 },
    { name: "lite152", group: 323, entry: 3 },
    { name: "lite154", group: 324, entry: 3 },
    { name: "lite155", group: 325, entry: 3 },
    { name: "lite156", group: 326, entry: 3 },
    { name: "lite157", group: 327, entry: 3 },
    { name: "lite158", group: 328, entry: 3 },
    { name: "lite159", group: 329, entry: 3 },
    { name: "lite160", group: 330, entry: 3 },
    { name: "lite161", group: 331, entry: 3 },
    { name: "lite162", group: 332, entry: 3 },
    { name: "lite169", group: 333, entry: 3 },
    { name: "lite170", group: 334, entry: 3 },
    { name: "lite171", group: 335, entry: 3 },
    { name: "lite185", group: 336, entry: 3 },
    { name: "lite186", group: 337, entry: 3 },
    { name: "lite187", group: 338, entry: 3 },
    { name: "lite188", group: 339, entry: 3 },
    { name: "lite189", group: 340, entry: 3 },
    { name: "lite190", group: 341, entry: 3 },
    { name: "lite191", group: 342, entry: 3 },
    { name: "lite193", group: 344, entry: 3 },
    { name: "lite194", group: 345, entry: 3 },
    { name: "lite195", group: 346, entry: 3 },
    { name: "lite196", group: 347, entry: 3 },
    { name: "lite198", group: 348, entry: 3 },
    { name: "lite199", group: 349, entry: 3 },
    { name: "lite200", group: 350, entry: 3 },
    { name: "lite300", group: 351, entry: 3 },
    { name: "lite301", group: 352, entry: 3 },
    { name: "lite302", group: 353, entry: 3 },
    { name: "lite303", group: 354, entry: 3 },
    { name: "lite304", group: 355, entry: 3 },
    { name: "lite305", group: 356, entry: 3 },
    { name: "lite306", group: 357, entry: 3 },
    { name: "lite307", group: 358, entry: 3 },
    { name: "lite308", group: 359, entry: 3 },
    { name: "lite309", group: 360, entry: 3 },
    { name: "lite310", group: 361, entry: 3 },
    { name: "lite311", group: 362, entry: 3 },
    { name: "lite312", group: 363, entry: 3 },
    { name: "lite313", group: 364, entry: 3 },
    { name: "lite314", group: 365, entry: 3 },
    { name: "lite315", group: 366, entry: 3 },
    { name: "lite316", group: 367, entry: 3 },
    { name: "lite317", group: 368, entry: 3 },
    { name: "lite318", group: 369, entry: 3 },
    { name: "lite319", group: 370, entry: 3 },
    { name: "lite320", group: 371, entry: 3 },
    { name: "lite321", group: 372, entry: 3 },
    { name: "lite322", group: 373, entry: 3 },
    { name: "literoll179", group: 374, entry: 3 },
    { name: "literoll180", group: 375, entry: 3 },
    { name: "literoll181", group: 376, entry: 3 },
    { name: "literoll182", group: 377, entry: 3 },
    { name: "literoll183", group: 378, entry: 3 },
    { name: "literoll184", group: 379, entry: 3 },
    { name: "a_flip1", group: 474, entry: 3 },
    { name: "a_flip1_1", group: 475, entry: 3 },
    { name: "a_flip1_2", group: 476, entry: 3 },
    { name: "a_flip1_3", group: 477, entry: 3 },
    { name: "a_flip1_4", group: 478, entry: 3 },
    { name: "a_flip1_5", group: 479, entry: 3 },
    { name: "a_flip1_6", group: 480, entry: 3 },
    { name: "a_flip1_7", group: 481, entry: 3 },
    { name: "a_flip2", group: 482, entry: 3 },
    { name: "a_flip2_1", group: 483, entry: 3 },
    { name: "a_flip2_2", group: 484, entry: 3 },
    { name: "a_flip2_3", group: 485, entry: 3 },
    { name: "a_flip2_4", group: 486, entry: 3 },
    { name: "a_flip2_5", group: 487, entry: 3 },
    { name: "a_flip2_6", group: 488, entry: 3 },
    { name: "a_flip2_7", group: 489, entry: 3 },
    { name: "a_bump1", group: 491, entry: 3 },
    { name: "a_bump1_1", group: 492, entry: 3 },
    { name: "a_bump1_2", group: 493, entry: 3 },
    { name: "a_bump1_3", group: 494, entry: 3 },
    { name: "a_bump1_4", group: 495, entry: 3 },
    { name: "a_bump1_5", group: 496, entry: 3 },
    { name: "a_bump1_6", group: 497, entry: 3 },
    { name: "a_bump1_7", group: 498, entry: 3 },
    { name: "a_bump2", group: 499, entry: 3 },
    { name: "a_bump2_1", group: 500, entry: 3 },
    { name: "a_bump2_2", group: 501, entry: 3 },
    { name: "a_bump2_3", group: 502, entry: 3 },
    { name: "a_bump2_4", group: 503, entry: 3 },
    { name: "a_bump2_5", group: 504, entry: 3 },
    { name: "a_bump2_6", group: 505, entry: 3 },
    { name: "a_bump2_7", group: 506, entry: 3 },
    { name: "a_bump3", group: 507, entry: 3 },
    { name: "a_bump3_1", group: 508, entry: 3 },
    { name: "a_bump3_2", group: 509, entry: 3 },
    { name: "a_bump3_3", group: 510, entry: 3 },
    { name: "a_bump3_4", group: 511, entry: 3 },
    { name: "a_bump3_5", group: 512, entry: 3 },
    { name: "a_bump3_6", group: 513, entry: 3 },
    { name: "a_bump3_7", group: 514, entry: 3 },
    { name: "a_bump4", group: 515, entry: 3 },
    { name: "a_bump4_1", group: 516, entry: 3 },
    { name: "a_bump4_2", group: 517, entry: 3 },
    { name: "a_bump4_3", group: 518, entry: 3 },
    { name: "a_bump4_4", group: 519, entry: 3 },
    { name: "a_bump4_5", group: 520, entry: 3 },
    { name: "a_bump4_6", group: 521, entry: 3 },
    { name: "a_bump4_7", group: 522, entry: 3 },
    { name: "a_bump5", group: 524, entry: 3 },
    { name: "a_bump5_1", group: 525, entry: 3 },
    { name: "a_bump5_2", group: 526, entry: 3 },
    { name: "a_bump5_3", group: 527, entry: 3 },
    { name: "a_bump5_4", group: 528, entry: 3 },
    { name: "a_bump5_5", group: 529, entry: 3 },
    { name: "a_bump5_6", group: 530, entry: 3 },
    { name: "a_bump5_7", group: 531, entry: 3 },
    { name: "a_bump6", group: 532, entry: 3 },
    { name: "a_bump6_1", group: 533, entry: 3 },
    { name: "a_bump6_2", group: 534, entry: 3 },
    { name: "a_bump6_3", group: 535, entry: 3 },
    { name: "a_bump6_4", group: 536, entry: 3 },
    { name: "a_bump6_5", group: 537, entry: 3 },
    { name: "a_bump6_6", group: 538, entry: 3 },
    { name: "a_bump6_7", group: 539, entry: 3 },
    { name: "a_bump7", group: 540, entry: 3 },
    { name: "a_bump7_1", group: 541, entry: 3 },
    { name: "a_bump7_2", group: 542, entry: 3 },
    { name: "a_bump7_3", group: 543, entry: 3 },
    { name: "a_bump7_4", group: 544, entry: 3 },
    { name: "a_bump7_5", group: 545, entry: 3 },
    { name: "a_bump7_6", group: 546, entry: 3 },
    { name: "a_bump7_7", group: 547, entry: 3 },
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
    { name: "a_targ10_1", group: 562, entry: 3 },
    { name: "a_targ11", group: 563, entry: 3 },
    { name: "a_targ11_1", group: 564, entry: 3 },
    { name: "a_targ12", group: 565, entry: 3 },
    { name: "a_targ12_1", group: 566, entry: 3 },
    { name: "a_targ13", group: 567, entry: 3 },
    { name: "a_targ13_1", group: 568, entry: 3 },
    { name: "a_targ14", group: 569, entry: 3 },
    { name: "a_targ14_1", group: 570, entry: 3 },
    { name: "a_targ15", group: 571, entry: 3 },
    { name: "a_targ15_1", group: 572, entry: 3 },
    { name: "a_targ16", group: 573, entry: 3 },
    { name: "a_targ16_1", group: 574, entry: 3 },
    { name: "a_targ17", group: 575, entry: 3 },
    { name: "a_targ17_1", group: 576, entry: 3 },
    { name: "a_targ18", group: 577, entry: 3 },
    { name: "a_targ18_1", group: 578, entry: 3 },
    { name: "a_targ19", group: 579, entry: 3 },
    { name: "a_targ19_1", group: 580, entry: 3 },
    { name: "a_targ20", group: 581, entry: 3 },
    { name: "a_targ20_1", group: 582, entry: 3 },
    { name: "a_targ21", group: 583, entry: 3 },
    { name: "a_targ21_1", group: 584, entry: 3 },
    { name: "a_targ22", group: 585, entry: 3 },
    { name: "a_targ22_1", group: 586, entry: 3 },
    { name: "v_rebo1", group: 588, entry: 3 },
    { name: "v_rebo2", group: 589, entry: 3 },
    { name: "v_rebo3", group: 590, entry: 3 },
    { name: "v_rebo4", group: 591, entry: 3 },
    { name: "plunger", group: 592, entry: 3 },
    { name: "plunger_1", group: 593, entry: 3 },
    { name: "plunger_2", group: 594, entry: 3 },
    { name: "plunger_3", group: 595, entry: 3 },
    { name: "plunger_4", group: 596, entry: 3 },
    { name: "plunger_5", group: 597, entry: 3 },
    { name: "plunger_6", group: 598, entry: 3 },
    { name: "plunger_7", group: 599, entry: 3 },
    { name: "a_flag1", group: 600, entry: 3 },
    { name: "a_flag1_1", group: 601, entry: 3 },
    { name: "a_flag1_2", group: 602, entry: 3 },
    { name: "a_flag1_3", group: 603, entry: 3 },
    { name: "a_flag1_4", group: 604, entry: 3 },
    { name: "a_flag1_5", group: 605, entry: 3 },
    { name: "a_flag1_6", group: 606, entry: 3 },
    { name: "a_flag1_7", group: 607, entry: 3 },
    { name: "a_flag2", group: 608, entry: 3 },
    { name: "a_flag2_1", group: 609, entry: 3 },
    { name: "a_flag2_2", group: 610, entry: 3 },
    { name: "a_flag2_3", group: 611, entry: 3 },
    { name: "a_flag2_4", group: 612, entry: 3 },
    { name: "a_flag2_5", group: 613, entry: 3 },
    { name: "a_flag2_6", group: 614, entry: 3 },
    { name: "a_flag2_7", group: 615, entry: 3 },
    { name: "v_bloc1", group: 617, entry: 3 },
    { name: "v_gate1", group: 618, entry: 3 },
    { name: "v_gate2", group: 619, entry: 3 },
    { name: "a_kick1", group: 622, entry: 3 },
    { name: "a_kick1_1", group: 623, entry: 3 },
    { name: "a_kick2", group: 624, entry: 3 },
    { name: "a_kick2_1", group: 625, entry: 3 },
    { name: "a_roll1", group: 637, entry: 3 },
    { name: "a_roll2", group: 638, entry: 3 },
    { name: "a_roll3", group: 639, entry: 3 },
    { name: "a_roll4", group: 640, entry: 3 },
    { name: "a_roll5", group: 641, entry: 3 },
    { name: "a_roll6", group: 642, entry: 3 },
    { name: "a_roll7", group: 643, entry: 3 },
    { name: "a_roll8", group: 644, entry: 3 },
    { name: "a_roll110", group: 645, entry: 3 },
    { name: "a_roll111", group: 646, entry: 3 },
    { name: "a_roll112", group: 647, entry: 3 },
    { name: "a_roll9", group: 654, entry: 3 },
];

fileElm.onchange = () => {
    const f = fileElm.files[0];
    const r = new FileReader();

    r.readAsArrayBuffer(f);
    r.onload = () => {
        const datFile = new DATPARTOUT(r.result);

        distancesEntry = datFile.groups[212][14];
        colorsEntry = datFile.groups[212][3];
        objectEntries = [];
        for (const tableObject of tableObjects) {
            /** @type {ImageEntry} */
            objectEntries.push({ name: tableObject.name, entry: datFile.groups[tableObject.group][tableObject.entry] });
        }

        meshBuilder.width = distancesEntry.width;
        meshBuilder.height = distancesEntry.height;

        updateScene();

        raycastTarget(new THREE.Vector2(0, 0));
    };
};

animate();
