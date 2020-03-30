import { ArrayBufferReader } from "../ArrayBufferReader";

export class DefaultEntry {
    /**
     * @param {ArrayBufferReader} reader 
     */
    constructor(reader) {
        const length = reader.readNumber(4);
        this.data = reader.readBytes(length);
    }
}
