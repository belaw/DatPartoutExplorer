import { ZBufferEntry } from "./Entries/ZBufferEntry";
import { ImageEntry } from "./Entries/ImageEntry";
import { PaletteEntry } from "./Entries/PaletteEntry";
import { FloatTableEntry } from "./Entries/FloatTableEntry";

/**
 * @param {ZBufferEntry} entry
 */
function zBufferImgFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    for (let i = 0; i < entry.width * entry.height; i++) {
        var index = i * 4;
        var value = (entry.zBuffer[i] / 0xFFFF) * 255;
        data[index + 0] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

/**
 * @param {ImageEntry} entry
 */
function paletteImgFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = entry.width;
    canvas.height = entry.height;
    ctx.putImageData(entry.imageData, 0, 0);
    return canvas;
}

const colors = [
    //"#000000",
    //"#000080",
    //"#0000FF",
    //"#008000",
    //"#008080",
    "#0080FF",
    "#00FF00",
    "#00FF80",
    "#00FFFF",
    //"#800000",
    //"#800080",
    "#8000FF",
    //"#808000",
    //"#808080",
    "#8080FF",
    "#80FF00",
    "#80FF80",
    "#80FFFF",
    "#FF0000",
    "#FF0080",
    "#FF00FF",
    "#FF8000",
    "#FF8080",
    "#FF80FF",
    "#FFFF00",
    "#FFFF80"
    //"#FFFFFF",
];
let colorCounter = 0;

/**
 * @param {FloatTableEntry} entry 
 */
function collisionBoxImgFromEntry(canvas, entry, counter) {
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const coords = entry.table.slice(2, 2 + entry.table[1] * 2);
    const scale = 50;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = colors[colorCounter % colors.length];
    ctx.fillText(counter, -coords[0] * scale, coords[1] * scale);
    ctx.scale(-1, 1);
    ctx.strokeStyle = colors[colorCounter % colors.length];
    ctx.lineWidth = 1;

    for (let i = 0; i < coords.length - 1; i += 2) {
        ctx.beginPath();
        ctx.arc(coords[i] * scale, coords[i + 1] * scale, 1.5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    ctx.beginPath();
    if (entry.table[1] == 1) {
        ctx.arc(entry.table[2] * scale, entry.table[3] * scale, entry.table[4] * scale, 0, 2 * Math.PI);
    } else {
        ctx.moveTo(coords[0] * scale, coords[1] * scale);
        for (let i = 2; i < coords.length - 1; i += 2) {
            ctx.lineTo(coords[i] * scale, coords[i + 1] * scale);
        }
    }
    ctx.closePath();
    ctx.stroke();
    colorCounter++;
}

/**
 * @param {PaletteEntry} entry
 */
function paletteFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var colorSize = 10;
    var A = Math.sqrt(entry.colors.length) * colorSize;
    canvas.width = canvas.height = A;
    var image = ctx.getImageData(0, 0, A, A);
    var data = image.data;
    var byte = 0;
    for (var y = A / colorSize; y > 0; y--) for (var x = 0; x < A / colorSize; x++, byte++) {
        var index = (x * colorSize + y * colorSize * A) * 4;
        var color = entry.colors[byte];
        for (var X = 0; X < colorSize; X++) for (var Y = 0; Y < colorSize; Y++) {
            var INDEX = index + (X + Y * A) * 4;
            data[INDEX] = color.r; // RED
            data[INDEX + 1] = color.g; // GREEN
            data[INDEX + 2] = color.b; // BLUE
            data[INDEX + 3] = 255; // ALPHA
        }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

export { paletteFromEntry, paletteImgFromEntry, zBufferImgFromEntry, collisionBoxImgFromEntry };
