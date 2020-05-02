/* Created by Jonas on 05.06.2015. */

import { ArrayBufferReader } from './ArrayBufferReader';
import { ImageEntry } from './Entries/ImageEntry';
import { PaletteEntry } from './Entries/PaletteEntry';
import { TextEntry } from './Entries/TextEntry';
import { ZBufferEntry } from './Entries/ZBufferEntry';
import { ResourceIdentifierEntry } from './Entries/ResourceIdentifierEntry';
import { DefaultEntry } from './Entries/DefaultEntry';
import { FloatTableEntry } from './Entries/FloatTableEntry';
import { IntTableEntry } from './Entries/IntTableEntry';

export class DATPARTOUT {

    /**
     * Reads a datpartout file.
     * @param {ArrayBuffer} fileBuffer The data.
     * @constructor
     */
    constructor(fileBuffer) {
        this.dataURI = "";
        this.header = {
            signature: "PARTOUT(4.0)RESOURCE",
            appName: "",
            description: "",
            fileSize: 0,
            nGroups: 0,
            tableSize: 0,
            fullWidth: 0 // [4 bytes] unknown2 (some small integer, seen values 0 through 25)
        };

        const reader = new ArrayBufferReader(fileBuffer);

        /**
         * @type {Array.<Array>}
         */
        this.groups = [];

        let palette;

        reader.pointer = 21;
        this.header.appName = reader.readString(50);
        this.header.description = reader.readString(100);
        this.header.fileSize = reader.readNumber(4);
        this.header.nGroups = reader.readNumber(2);
        this.header.tableSize = reader.readNumber(2);
        this.header.fullWidth = reader.readNumber(4);

        /**
         * @type {{group: Number, entry: Number}[]}
         */
        const imageEntries = [];

        for (let groupID = 0; groupID < this.header.nGroups; groupID++) {
            const group = [];
            const nEntries = reader.readNumber(1);
            for (let entryID = 0; entryID < nEntries; entryID++) {
                let entry;
                const entryType = reader.readNumber(1);
                switch (entryType) {
                    case 0: // RESOURCE IDENTIFIER
                        entry = new ResourceIdentifierEntry(reader);
                        break;
                    case 1: // IMAGE
                        entry = new ImageEntry(reader);
                        imageEntries.push({ group: groupID, entry: entryID });
                        break;
                    case 5: // PALETTE
                        entry = new PaletteEntry(reader);
                        palette = entry;
                        break;
                    case 3: // TEXT
                    case 9: // TEXT2
                        entry = new TextEntry(reader);
                        break;
                    case 10: // INT TABLE
                        entry = new IntTableEntry(reader);
                        break;
                    case 11: // FLOAT TABLE
                        entry = new FloatTableEntry(reader);
                        break;
                    case 12: // Z BUFFER DATA
                        entry = new ZBufferEntry(reader);
                        break;
                    default:
                        entry = new DefaultEntry(reader);
                        break;
                }
                group.push(entry);
            }
            this.groups.push(group);
        }

        for (const e of imageEntries) {
            /**
             * @type {ImageEntry}
             */
            const entry = this.groups[e.group][e.entry];

            entry.makeImageData(palette);
        }
    }
}
