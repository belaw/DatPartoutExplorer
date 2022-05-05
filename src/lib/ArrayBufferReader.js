export class ArrayBufferReader {
    /**
     * Class for reading from an array buffer.
     * @param {ArrayBuffer} buffer The array buffer.
     */
    constructor(buffer) {
        this.buffer = buffer;
        /**
         * @type {Number}
         */
        this.pointer = 0;
    }

    /**
     * Reads a number from the file.
     * @param {Number} nBytes Number of bytes to read.
     * @param {Boolean} advancePointer Whether to advance the file pointer or not.
     * @returns {Number} The number.
     */
    readNumber(nBytes, advancePointer = true) {
        return this.bytesToNumber(this.readBytes(nBytes, advancePointer));
    }

    /**
     * Reads a float from the file.
     * @param {Boolean} advancePointer Whether to advance the file pointer or not.
     * @returns {Number} The float.
     */
    readFloat(advancePointer = true) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        const bytes = this.readBytes(4, advancePointer);
        for (const i in bytes) {
            view.setUint8(i, bytes[i]);
        }

        return view.getFloat32(0, true);
    }

    /**
     * Reads a string from the file.
     * @param {Number} nBytes Number of bytes to read.
     * @param {Boolean} advancePointer Whether to advance the file pointer or not.
     * @returns {String} The string.
     */
    readString(nBytes, advancePointer = true) {
        return this.bytesToString(this.readBytes(nBytes, advancePointer));
    }

    /**
     * Reads bytes from the file.
     * @param {Number} n Number of bytes to read.
     * @param {Boolean} advancePointer Whether to advance the file pointer or not.
     * @returns {Uint8Array} The bytes.
     */
    readBytes(n, advancePointer = true) {
        const data = new Uint8Array(this.buffer.slice(this.pointer, this.pointer + n));
        if (advancePointer) {
            this.pointer += n;
        }
        return data;
    }

    /**
     * @param {Uint8Array} bytes
     * @return {Number}
     */
    bytesToNumber(bytes) {
        let result = 0;

        for (let byte = 0; byte < bytes.length; byte++)
            result += bytes[byte] << byte * 8;

        return result;
    }

    /**
     * @param {Array<Number>} charCodes
     * @return {String}
     */
    bytesToString(charCodes) {
        let result = "";
        for (let i = 0; i < charCodes.length; i++)
            result += String.fromCharCode(charCodes[i]);
        return result;
    }
}
