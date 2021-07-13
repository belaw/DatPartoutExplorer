import { ArrayBufferReader } from "../ArrayBufferReader";

export class TextEntry {
    /**
     * @param {ArrayBufferReader} reader 
     */
    constructor(reader) {
        const length = reader.readNumber(4);
        this.text = reader.readString(length);
        this.text = this.text.substring(0, length - 1);
    }
}