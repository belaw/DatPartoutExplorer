import { ArrayBufferReader } from "../ArrayBufferReader";

export class TextEntry {
    /**
     * @param {ArrayBufferReader} reader 
     */
    constructor(reader) {
        const length = reader.readNumber(4);
        this.text = reader.readString(length);
    }
}