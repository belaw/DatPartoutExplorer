import { ZBufferEntry } from "./Entries/ZBufferEntry";
import { ImageEntry } from "./Entries/ImageEntry";
import { PaletteEntry } from "./Entries/PaletteEntry";

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

export { paletteFromEntry, paletteImgFromEntry, zBufferImgFromEntry };
