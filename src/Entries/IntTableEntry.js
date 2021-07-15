import { ArrayBufferReader } from "../ArrayBufferReader";

export class IntTableEntry {
    /**
     * @param {ArrayBufferReader} reader 
     */
    constructor(reader) {
        this.dataLength = reader.readNumber(4);
        const tableLength = this.dataLength / 2;
        this.table = [];
        for (let i = 0; i < tableLength; i++) {
            this.table.push(reader.readNumber(2));
        }
    }
}