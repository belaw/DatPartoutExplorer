/* Created by Jonas on 05.06.2015. */

/**
 * @typedef {Number} types
 */

/**
 * Enum for data types.
 * @readonly
 * @enum {types}
 */
const types = Object.freeze({
    STRING: 0,
    NUMBER: 1
});

/**
 * Reads a datpartout file.
 * @param {ArrayBuffer} data The data.
 */
const DATPARTOUT = function (data) {

    this.dataURI = "";

    this.header = {
        signature: "PARTOUT(4.0)RESOURCE", // [21 bytes] zero-terminated string, signature: "PARTOUT(4.0)RESOURCE"
        appName: "",                       // [50 bytes] zero-terminated string, application name
        description: "",                   // [100 bytes] zero-terminated string, file description
        fileSize: 0,                       // [4 bytes] file size, integer - total size of this file
        nGroups: 0,                        // [2 bytes] nGroups, integer - number of item groups in this file
        tableSize: 0,                      // [2 bytes] unknown1 (seemingly random, maybe checksum of some kind)
        fullWidth: 0                       // [4 bytes] unknown2 (some small integer, seen values 0 through 25)
    };

    this.groups = [];

    const DATA = data;

    /**
     * Get data from file.
     * @param {number} nBytes Number of bytes to read.
     * @param {types} [type] Type of the data.
     * @param {Boolean} advancePointer Whether to advance the file pointer or not.
     * @returns {*} The data.
     */
    function getData(nBytes, type, advancePointer = true) {
        const data = new Uint8Array(DATA.slice(filePointer, filePointer + nBytes));
        
        if (advancePointer) {
            filePointer += nBytes;
        }

        switch (type) {
            case 0:
                return charCodesToString(data);
            case 1:
                return bytesToNumber(data);
            default:
                return data;
        }
    }

    let filePointer = 21;
    this.header.appName = getData(50, types.STRING);
    this.header.description = getData(100, types.STRING);
    this.header.fileSize = getData(4, types.NUMBER);
    this.header.nGroups = getData(2, types.NUMBER);
    this.header.tableSize = getData(2);
    this.header.fullWidth = getData(4);
    for (let groupID = 0; groupID < this.header.nGroups; groupID++) {
        this.groups[groupID] = {
            nEntries: getData(1, types.NUMBER),
            entries: []
        };
        for (let entryID = 0; entryID < this.groups[groupID].nEntries; entryID++) {
            const entry = {
                type: getData(1, types.NUMBER)
            };
            switch (entry.type) {
                case 0: // RESOURCE IDENTIFIER
                    entry.data = getData(2, types.NUMBER);
                    break;
                case 1: // IMAGE
                    entry.dataLength = getData(4, types.NUMBER);
                    entry.tableSize = getData(1, types.NUMBER);
                    entry.width = getData(2, types.NUMBER);
                    entry.height = getData(2, types.NUMBER);
                    entry.fullWidth = getData(2, types.NUMBER);
                    entry.unk3 = getData(2, types.NUMBER);
                    entry.imageSize = getData(4, types.NUMBER);
                    entry.unk4 = getData(1, types.NUMBER);

                    if (entry.unk4 === 5) {
                        entry.lines = [];
                        for (let i = 0; getData(2, types.NUMBER, false) !== 0xFFFF; i++) {
                            entry.lines[i] = {
                                offset: getData(2, types.NUMBER),
                                lineSize: getData(2, types.NUMBER),
                                pixels: [],
                            };

                            for (let j = 0; j < entry.lines[i].lineSize; j++) {
                                entry.lines[i].pixels[j] = {
                                    dist: getData(2, types.NUMBER),
                                    color: getData(1, types.NUMBER)
                                };
                            }
                        }
                        entry.endboi = getData(2, types.NUMBER);
                    } else {
                        entry.padding = Math.ceil(-((entry.height * entry.width - entry.imageSize) / entry.height));
                        entry.data = getData(entry.imageSize);
                    }
                    break;
                case 5: // PALETTE
                    entry.dataLength = getData(4, types.NUMBER);
                    entry.data = {
                        colors: []
                    };
                    for (let color = 0; color < entry.dataLength / 4; color++) {
                        entry.data.colors[color] = {};
                        entry.data.colors[color].b = getData(1, types.NUMBER);
                        entry.data.colors[color].g = getData(1, types.NUMBER);
                        entry.data.colors[color].r = getData(1, types.NUMBER);
                        entry.data.colors[color].a = getData(1, types.NUMBER);
                    }
                    break;
                case 3: // TEXT
                case 9: // TEXT2
                    entry.dataLength = getData(4, types.NUMBER);
                    entry.data = getData(entry.dataLength, 0);
                    break;
                case 12: // Z BUFFER DATA
                    entry.dataLength = getData(4, types.NUMBER);
                    entry.unk1 = getData(1, types.NUMBER);
                    entry.width = getData(2, types.NUMBER);
                    entry.height = getData(2, types.NUMBER);
                    entry.fullWidth = getData(2, types.NUMBER);
                    entry.unk3 = getData(4, types.NUMBER);
                    entry.unk4 = getData(2, types.NUMBER);
                    entry.unk5 = getData(2, types.NUMBER);
                    entry.data = [];
                    for (let i = 0; i < entry.fullWidth * entry.height; i++) {
                        entry.data.push(getData(2, types.NUMBER));
                    }
                    break;
                default:
                    entry.dataLength = getData(4, types.NUMBER);
                    entry.data = getData(entry.dataLength);
                    break;
            }
            this.groups[groupID].entries[entryID] = entry;
        }
    }

    function add(data, array) {
        array.forEach(function (i) {
            data.push(i);
        });
    }

    this.make = function () {
        const data = [];
        add(data, getCharCodes(this.header.signature));
        data.push(0);
        add(data, getCharCodes(this.header.appName));
        add(data, zeroArray(50 - this.header.appName.length));
        add(data, getCharCodes(this.header.description));
        add(data, zeroArray(100 - this.header.description.length));
        add(data, uint32ToArray(this.header.fileSize));
        add(data, uint16ToArray(this.header.nGroups));
        add(data, u8toNormal(this.header.tableSize));
        add(data, u8toNormal(this.header.fullWidth));
        for (let groupID = 0; groupID < this.header.nGroups; groupID++) {
            const group = this.groups[groupID];
            data.push(group.nEntries);
            for (let entryID = 0; entryID < group.nEntries; entryID++) {
                const entry = group.entries[entryID];
                data.push(entry.type);
                switch (entry.type) {
                    case 0: // RESOURCE IDENTIFIER
                        add(data, uint16ToArray(entry.data));
                        break;
                    case 1: // IMAGE
                        add(data, uint32ToArray(entry.dataLength));
                        add(data, u8toNormal(entry.tableSize));
                        add(data, uint16ToArray(entry.width));
                        add(data, uint16ToArray(entry.height));
                        add(data, u8toNormal(entry.fullWidth));
                        add(data, u8toNormal(entry.data));
                        break;
                    case 5: // PALETTE
                        add(data, uint32ToArray(entry.dataLength));
                        for (let color = 0; color < entry.dataLength / 4; color++) {
                            data.push(
                                entry.data.colors[color].b,
                                entry.data.colors[color].g,
                                entry.data.colors[color].r,
                                entry.data.colors[color].a
                            );
                        }
                        break;
                    case 3: // TEXT
                    case 9: // TEXT2
                        add(data, uint32ToArray(entry.dataLength));
                        add(data, getCharCodes(entry.data));
                        break;
                    default:
                        add(data, uint32ToArray(entry.dataLength));
                        add(data, u8toNormal(entry.data));
                        break;
                }
            }
        }
        //this.dataURI = "data:application/octet-stream;base64," + FastBase64.Encode(data);
        this.uriData = data;
    }
};

/**
 * @param {Uint8Array} bytes
 * @return {Number}
 */
function bytesToNumber(bytes) {
    let result = 0;

    for (let byte = 0; byte < bytes.length; byte++)
        result += bytes[byte] << byte * 8;

    return result;
}

/**
 * @param {Array<Number>} charCodes
 * @return {String}
 */
function charCodesToString(charCodes) {
    let result = "";
    for (let i = 0; i < charCodes.length; i++)
        result += String.fromCharCode(charCodes[i]);
    return result;
}

/**
 * Turns a number into 4 bytes.
 * @param {Number} n The number.
 * @returns {Uint8Array} The bytes.
 */
function uint32ToArray(n) {
    return [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF];
}

/**
 * Turns a number into 2 bytes.
 * @param {Number} n The number.
 * @returns {Uint8Array} The bytes.
 */
function uint16ToArray(n) {
    return [n & 0xFF, (n >> 8) & 0xFF];
}

function zeroArray(length) {
    const array = [];
    for (let i = 0; i < length; i++)
        array.push(0);
    return array;
}

function u8toNormal(u8) {
    const array = [];
    for (let i = 0; i < u8.length; i++)
        array.push(u8[i]);
    return array;
}

/**
 * Turns a string into an array of char codes.
 * @param {String} s The string.
 * @returns {Array<Number>} The char codes.
 */
function getCharCodes(s) {
    const result = [];
    for (let l = 0; l < s.length; l++) {
        result.push(s.charCodeAt(l));
    }
    return result;
}

export { DATPARTOUT };
