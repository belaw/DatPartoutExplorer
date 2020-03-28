function zBufferImgFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    var byte = 0;
    for (var y = H; y > 0; y--) {
        for (var x = 0; x < W; x++, byte++) {
            var index = (x + y * W) * 4;
            var value = (entry.data[byte] / 0xFFFF) * 255;
            data[index] = value; // RED
            data[index + 1] = value; // GREEN
            data[index + 2] = value; // BLUE
            data[index + 3] = 255; // ALPHA
        }
        byte += entry.fullWidth - entry.width;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

function paletteImgFromEntry(entry, palette) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    var byte = 0;
    for (var y = H - 1; y >= 0; y--) {
        for (var x = 0; x < W; x++, byte++) {
            var index = (x + y * W) * 4;
            var color = palette.data.colors[entry.data[byte] || 0] || 0;
            data[index] = color.r; // RED
            data[index + 1] = color.g; // GREEN
            data[index + 2] = color.b; // BLUE
            data[index + 3] = 255; // ALPHA
        }
        byte += entry.padding;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

function paletteXImgFromEntry(entry, palette) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;

    const maxLine = entry.tableSize == 0 ? 600 : entry.tableSize == 1 ? 752 : 960;
    let currentOffset = 0;
    for (const line of entry.lines) {
        currentOffset += line.offset;
        for (let i = 0; i < line.pixels.length; i++) {
            const x = (currentOffset + i) % maxLine;
            const y = (H - 1) - Math.floor((currentOffset + i) / maxLine);
            const index = (x + y * W) * 4;
            const pixel = line.pixels[i];
            const color = palette.data.colors[pixel.color || 0] || 0;
            data[index + 0] = color.r; // RED
            data[index + 1] = color.g; // GREEN
            data[index + 2] = color.b; // BLUE
            data[index + 3] = 255; // ALPHA
        }
        currentOffset += line.pixels.length;
    }

    ctx.putImageData(image, 0, 0);
    return canvas;
}

function paletteFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var colorSize = 10;
    var A = Math.sqrt(entry.dataLength / 4) * colorSize;
    canvas.width = canvas.height = A;
    var image = ctx.getImageData(0, 0, A, A);
    var data = image.data;
    var byte = 0;
    for (var y = A / colorSize; y > 0; y--) for (var x = 0; x < A / colorSize; x++, byte++) {
        var index = (x * colorSize + y * colorSize * A) * 4;
        var color = entry.data.colors[byte];
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

export { paletteFromEntry, paletteXImgFromEntry, paletteImgFromEntry, zBufferImgFromEntry };
