/**
 * Created by jonas on 05.04.2017.
 */

function base64ArrayBuffer(arrayBuffer) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63;               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder === 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

function PAL(colors) {
    this.header = {
        riffSignature: "RIFF", // 4 bytes
        fileSize: 12 + colors.length * 4, // 4 bytes
        palSignature: "PAL " // 4 bytes
    };

    this.dataChunk = {
        signature: "data", // 4 bytes
        chunkSize: colors.length * 4, // 4 bytes
        palVersion: 0x0300, // 2 bytes
        colorCount: colors.length // 2 bytes
    };

    this.colors = colors;

    var DATA = new ArrayBuffer(24 + colors.length * 4);
    var filePointer = 0;

    this.make = function () {
        filePointer = 0;
        writeString(this.header.riffSignature);
        writeUint32(this.header.fileSize);
        writeString(this.header.palSignature);
        writeString(this.dataChunk.signature);
        writeUint32(this.dataChunk.chunkSize);
        writeUint16(this.dataChunk.palVersion);
        writeUint16(this.dataChunk.colorCount);
        this.colors.forEach(function (color) {
            writeUint8(color.r);
            writeUint8(color.g);
            writeUint8(color.b);
            writeUint8(color.a);
        });
        return "data:application/octet-stream;base64," + base64ArrayBuffer(DATA);
    };

    function writeString(str) {
        var view = new Uint8Array(DATA, filePointer);
        for (var i = 0; i < str.length; i++) {
            view[i] = str.charCodeAt(i);
        }
        filePointer += str.length;
    }

    function writeUint32(n) {
        var view = new DataView(DATA, filePointer);
        view.setUint32(0, n);
        filePointer += 4;
    }

    function writeUint16(n) {
        var view = new DataView(DATA, filePointer);
        view.setUint16(0, n);
        filePointer += 2;
    }

    function writeUint8(n) {
        var view = new DataView(DATA, filePointer);
        view.setUint8(0, n);
        filePointer++;
    }
}