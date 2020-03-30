import { ArrayBufferReader } from "../ArrayBufferReader";

export class ResourceIdentifierEntry {
    /**
     * @param {ArrayBufferReader} reader
     */
    constructor(reader) {
        this.value = reader.readNumber(2);
    }
}