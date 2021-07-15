import { ArrayBufferReader } from "../ArrayBufferReader";
import { PaletteEntry } from "./PaletteEntry";

export class ImageEntry {
    /**
     * @param {ArrayBufferReader} reader
     */
    constructor(reader) {
        /** @type {Number} */
        this.dataLength = reader.readNumber(4);
        /** @type {Number} */
        this.tableSize = reader.readNumber(1);
        /** @type {Number} */
        this.width = reader.readNumber(2);
        /** @type {Number} */
        this.height = reader.readNumber(2);
        /** @type {Number} */
        this.mp1 = reader.readNumber(2);
        /** @type {Number} */
        this.mp2 = reader.readNumber(2);
        /** @type {Number} */
        this.imageSize = reader.readNumber(4);
        /** @type {Number} */
        this.imageType = reader.readNumber(1);
        /**
         * The palette indexes for each pixel.
         * @type {Uint8Array}
         */
        this.data = [];
        /** @type {ImageData} */
        this.imageData = new ImageData(this.width, this.height);
        /** @type {Number[]} */
        this.zBuffer = [];

        if (this.imageType === 5) {
            this.readAlphaChannelImage(reader);
        } else {
            this.readImage(reader);
        }
    }

    /**
     * @param {ArrayBufferReader} reader
     */
    readImage(reader) {
        const padding = Math.ceil(-((this.height * this.width - this.imageSize) / this.height));
        const data = reader.readBytes(this.imageSize);

        let byte = 0;
        for (let v = this.height - 1; v >= 0; v--) {
            for (let u = 0; u < this.width; u++, byte++) {
                const index = u + v * this.width;
                this.data[index] = data[byte];
            }
            byte += padding;
        }
    }

    /**
     * @param {ArrayBufferReader} reader
     */
    readAlphaChannelImage(reader) {
        const maxLine = this.tableSize == 0 ? 600 : this.tableSize == 1 ? 752 : 960;

        let currentOffset = 0;

        while (reader.readNumber(2, false) !== 0xFFFF) {
            currentOffset += reader.readNumber(2);
            const lineSize = reader.readNumber(2);

            for (let i = 0; i < lineSize; i++) {
                const dist = reader.readNumber(2);
                const color = reader.readNumber(1);

                const u = currentOffset % maxLine;
                const v = (this.height - 1) - Math.floor(currentOffset / maxLine);
                const index = u + v * this.width;
                this.data[index] = color;
                this.zBuffer[index] = dist;
                currentOffset++;
            }
        }

        reader.readNumber(2);
    }

    /**
     * @param {PaletteEntry} palette
     */
    makeImageData(palette) {
        for (const i in this.data) {
            const pI = this.data[i];
            const pExists = typeof pI !== 'undefined';
            const index = i * 4;
            const c = pExists ? palette.colors[pI] : { r: 0, g: 0, b: 0 };
            this.imageData.data[index + 0] = c.r;
            this.imageData.data[index + 1] = c.g;
            this.imageData.data[index + 2] = c.b;
            this.imageData.data[index + 3] = pExists ? 255 : 0;
        }
    }
}

