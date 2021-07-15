import { ArrayBufferReader } from "../ArrayBufferReader";

export class PaletteEntry {
    /**
     * @param {ArrayBufferReader} reader
     */
    constructor(reader) {
        const nColors = reader.readNumber(4) / 4;

        /**
         * @type {{r: number, g: number, b: number, a: number}[]}
         */
        this.colors = [];

        for (let color = 0; color < nColors; color++) {
            this.colors[color] = {};
            this.colors[color].b = reader.readNumber(1);
            this.colors[color].g = reader.readNumber(1);
            this.colors[color].r = reader.readNumber(1);
            this.colors[color].a = reader.readNumber(1);
        }
    }
}
