/**
 * Created by Jonas on 05.06.2015.
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

    /**
     * @return {number}
     */
    function ArrayToNumber(array) {
        let power = 0, result = 0;

        for (let byte = 0; byte < array.length; byte++, power += 8)
            result += array[byte] << power;

        return result;
    }

    /**
     * @return {string}
     */
    function Uint8ToString(array) {
        let erg = "";
        for (let byte = 0; byte < array.length; byte++)
            erg += String.fromCharCode(array[byte]);
        return erg;
    }

    const DATA = data;

    /**
     * Get data from file and advance file pointer
     * @param {number} nBytes
     * @param {number} [type]
     * @returns {*}
     */
    function getData(nBytes, type) {
        const data = new Uint8Array(DATA.slice(filePointer, filePointer += nBytes));
        switch (type) {
            case 0:
                return Uint8ToString(data);
            case 1:
                return ArrayToNumber(data);
            default:
                return data;
        }
    }

    /**
     * Get data from file without advancing the file pointer
     * @param {number} nBytes
     * @param {number} [type]
     * @returns {*}
     */
    function readData(nBytes, type) {
        const data = new Uint8Array(DATA.slice(filePointer, filePointer + nBytes));
        switch (type) {
            case 0:
                return Uint8ToString(data);
            case 1:
                return ArrayToNumber(data);
            default:
                return data;
        }
    }

    let filePointer = 21;
    this.header.appName = getData(50, 0);
    this.header.description = getData(100, 0);
    this.header.fileSize = getData(4, 1);
    this.header.nGroups = getData(2, 1);
    this.header.tableSize = getData(2);
    this.header.fullWidth = getData(4);
    for (let groupID = 0; groupID < this.header.nGroups; groupID++) {
        this.groups[groupID] = {
            nEntries: getData(1, 1),
            entries: []
        };
        for (let entryID = 0; entryID < this.groups[groupID].nEntries; entryID++) {
            const entry = {
                type: getData(1, 1)
            };
            switch (entry.type) {
                case 0: // RESOURCE IDENTIFIER
                    entry.data = getData(2, 1);
                    break;
                case 1: // IMAGE
                    entry.dataLength = getData(4, 1);
                    entry.tableSize = getData(1, 1);
                    entry.width = getData(2, 1);
                    entry.height = getData(2, 1);
                    entry.fullWidth = getData(2, 1);
                    entry.unk3 = getData(2, 1);
                    entry.imageSize = getData(4, 1);
                    entry.unk4 = getData(1, 1);

                    if (entry.unk4 === 5) {
                        entry.lines = [];
                        for (let i = 0; readData(2, 1) !== 0xFFFF; i++) {
                            entry.lines[i] = {
                                offset: getData(2, 1),
                                lineSize: getData(2, 1),
                                pixels: [],
                            };

                            for (let j = 0; j < entry.lines[i].lineSize; j++) {
                                entry.lines[i].pixels[j] = {
                                    dist: getData(2, 1),
                                    color: getData(1, 1)
                                };
                            }
                        }
                        entry.endboi = getData(2, 1);
                    } else {
                        entry.padding = Math.ceil(-((entry.height * entry.width - entry.imageSize) / entry.height));
                        entry.data = getData(entry.imageSize);
                    }
                    break;
                case 5: // PALETTE
                    entry.dataLength = getData(4, 1);
                    entry.data = {
                        colors: []
                    };
                    for (let color = 0; color < entry.dataLength / 4; color++) {
                        entry.data.colors[color] = {};
                        entry.data.colors[color].b = getData(1, 1);
                        entry.data.colors[color].g = getData(1, 1);
                        entry.data.colors[color].r = getData(1, 1);
                        entry.data.colors[color].a = getData(1, 1);
                    }
                    break;
                case 3: // TEXT
                case 9: // TEXT2
                    entry.dataLength = getData(4, 1);
                    entry.data = getData(entry.dataLength, 0);
                    break;
                case 12: // Z BUFFER DATA
                    entry.dataLength = getData(4, 1);
                    entry.unk1 = getData(1, 1);
                    entry.width = getData(2, 1);
                    entry.height = getData(2, 1);
                    entry.fullWidth = getData(2, 1);
                    entry.unk3 = getData(4, 1);
                    entry.unk4 = getData(2, 1);
                    entry.unk5 = getData(2, 1);
                    entry.data = [];
                    for (let i = 0; i < entry.fullWidth * entry.height; i++) {
                        entry.data.push(getData(2, 1));
                    }
                    break;
                default:
                    entry.dataLength = getData(4, 1);
                    entry.data = getData(entry.dataLength);
                    break;
            }
            this.groups[groupID].entries[entryID] = entry;
        }
    }

    function u32ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF];
    }

    function u16ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF];
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

    function strToArray(s) {
        const array = [];
        for (let l = 0; l < s.length; l++) {
            array.push(s.charCodeAt(l));
        }
        return array;
    }

    function add(data, array) {
        array.forEach(function (i) {
            data.push(i);
        });
    }

    this.make = function () {
        const data = [];
        add(data, strToArray(this.header.signature));
        data.push(0);
        add(data, strToArray(this.header.appName));
        add(data, zeroArray(50 - this.header.appName.length));
        add(data, strToArray(this.header.description));
        add(data, zeroArray(100 - this.header.description.length));
        add(data, u32ToArray(this.header.fileSize));
        add(data, u16ToArray(this.header.nGroups));
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
                        add(data, u16ToArray(entry.data));
                        break;
                    case 1: // IMAGE
                        add(data, u32ToArray(entry.dataLength));
                        add(data, u8toNormal(entry.tableSize));
                        add(data, u16ToArray(entry.width));
                        add(data, u16ToArray(entry.height));
                        add(data, u8toNormal(entry.fullWidth));
                        add(data, u8toNormal(entry.data));
                        break;
                    case 5: // PALETTE
                        add(data, u32ToArray(entry.dataLength));
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
                        add(data, u32ToArray(entry.dataLength));
                        add(data, strToArray(entry.data));
                        break;
                    default:
                        add(data, u32ToArray(entry.dataLength));
                        add(data, u8toNormal(entry.data));
                        break;
                }
            }
        }
        //this.dataURI = "data:application/octet-stream;base64," + FastBase64.Encode(data);
        this.uriData = data;
    }
};