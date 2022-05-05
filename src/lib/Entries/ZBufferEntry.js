import { ArrayBufferReader } from "../ArrayBufferReader";

export class ZBufferEntry {
    /**
     * @param {ArrayBufferReader} reader
     */
    constructor(reader) {
        this.dataLength = reader.readNumber(4);
        this.tableSize = reader.readNumber(1);
        this.width = reader.readNumber(2);
        this.height = reader.readNumber(2);
        this.fullWidth = reader.readNumber(2);
        this.unk3 = reader.readNumber(4);
        this.unk4 = reader.readNumber(2);
        this.unk5 = reader.readNumber(2);
        this.zBuffer = [];

        const data = [];
        for (let i = 0; i < this.fullWidth * this.height; i++) {
            const dist = reader.readNumber(2);
            if (i % this.fullWidth >= this.width) continue;
            data.push(dist);
        }

        for (const i in data) {
            const u = (i % this.width);
            const v = this.height - 1 - Math.floor(i / this.width);
            const index = v * this.width + u;

            this.zBuffer.push(data[index]);
        }
    }
}

