import { ArrayBufferReader } from "../ArrayBufferReader";

export class FloatTableEntry {
    /**
     * @param {ArrayBufferReader} reader 
     */
    constructor(reader) {
        this.dataLength = reader.readNumber(4);
        /**
         * @type {Number[]}
         */
        this.table = [];
        const tableLength = this.dataLength / 4;
        for (let i = 0; i < tableLength; i++) {
            this.table.push(reader.readFloat());
        }
    }
}