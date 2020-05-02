/* Created by jonas on 07.04.2017. */

import { DATPARTOUT } from "./DATPARTOUT";
import * as EntryUtils from "./EntryUtils";
import { ResourceIdentifierEntry } from "./Entries/ResourceIdentifierEntry";
import { ImageEntry } from "./Entries/ImageEntry";
import { TextEntry } from "./Entries/TextEntry";
import { PaletteEntry } from "./Entries/PaletteEntry";
import { ZBufferEntry } from "./Entries/ZBufferEntry";
import { FloatTableEntry } from "./Entries/FloatTableEntry";
import { IntTableEntry } from "./Entries/IntTableEntry";

/**
 * 
 * @param {DATPARTOUT} file 
 */
function makeDAT(file) {
    var images = [];
    var zBuffers = [];
    var elmContainer = "ul";
    var elmItem = "li";
    var groupListElm = document.createElement(elmContainer);

    for (var groupID = 0; groupID < file.groups.length; groupID++) {
        var group = file.groups[groupID];
        var groupElm = document.createElement(elmItem);
        var groupLinkElm = document.createElement("a");

        groupLinkElm.name = groupID + "";
        groupElm.innerHTML = "Group " + groupID + " <span class='base0C'>[" + group.length + " Entr" + (group.length === 1 ? "y" : "ies") + "]</span>";
        groupElm.appendChild(groupLinkElm);
        groupListElm.appendChild(groupElm);

        var entryListElm = document.createElement(elmContainer);
        groupElm.appendChild(entryListElm);

        if (group.length <= 0) { continue; }

        for (var entryID = 0; entryID < group.length; entryID++) {
            var entry = group[entryID];
            var entryElm = document.createElement(elmItem);

            var entryType = type(entry);
            entryElm.innerHTML = "Entry " + entryID + ", Type: (<span class='" + entryType.color + "'>" + entryType.name + "</span>)";
            entryListElm.appendChild(entryElm);

            var dataListElm = document.createElement(elmContainer);
            entryElm.appendChild(dataListElm);

            // List data
            if (entry instanceof ResourceIdentifierEntry) {
                createElement(elmItem, dataListElm, entry.value);
            } else if (entry instanceof ImageEntry) {
                createElement(elmItem, dataListElm, "Width: " + entry.width + "px");
                createElement(elmItem, dataListElm, "Height: " + entry.height + "px");
                createElement(elmItem, dataListElm, "Table Size: " + entry.tableSize);
                createElement(elmItem, dataListElm, "Multi-Purpose 1: " + entry.mp1);
                createElement(elmItem, dataListElm, "Multi-Purpose 2: " + entry.mp2);
                images.push({
                    elm: createElement(elmItem, dataListElm, ""),
                    group: groupID,
                    entry: entryID
                });
            } else if (entry instanceof TextEntry) {
                createElement(elmItem, dataListElm, "<div class='container'>" + entry.text + "</div>");
            } else if (entry instanceof PaletteEntry) {
                //palFile = new PAL(entry.data.colors);
                dataListElm.appendChild(EntryUtils.paletteFromEntry(entry));
            } else if (entry instanceof FloatTableEntry) {
                createElement(elmItem, dataListElm, `Elements: ${entry.table.length}`);
                createElement(elmItem, dataListElm, entry.table.join(", "));
                if (entry.table[0] == 600 || entry.table[0] == 1300) {
                    const x = EntryUtils.collisionBoxImgFromEntry(entry);
                    x.style.border = "1px solid white";
                    dataListElm.appendChild(x);
                }
            } else if (entry instanceof IntTableEntry) {
                createElement(elmItem, dataListElm, `Elements: ${entry.table.length}`);
                createElement(elmItem, dataListElm, entry.table.join(", "));
            } else if (entry instanceof ZBufferEntry) {
                createElement(elmItem, dataListElm, "Width: " + entry.width + "px");
                createElement(elmItem, dataListElm, "Height: " + entry.height + "px");
                zBuffers.push({
                    elm: createElement(elmItem, dataListElm, ""),
                    group: groupID,
                    entry: entryID
                });
            } else {
                createElement(elmItem, dataListElm, "");
            }
        }
    }

    images.forEach(function (img) {
        var entry = file.groups[img.group][img.entry];
        var image = EntryUtils.paletteImgFromEntry(entry);
        image.title = `${img.group}-${img.entry}`;
        if (entry.width > 0 && entry.height > 0) {
            img.elm.appendChild(image);
        }
    });

    zBuffers.forEach(function (zBuffer) {
        var entry = file.groups[zBuffer.group][zBuffer.entry];
        var image = EntryUtils.zBufferImgFromEntry(entry);
        image.title = `${zBuffer.group}-${zBuffer.entry}`;
        if (entry.width > 0 && entry.height > 0) {
            zBuffer.elm.appendChild(image);
        }
    });

    return groupListElm;
}

function type(entry) {
    if (entry instanceof ResourceIdentifierEntry) {
        return { name: "RESOURCE IDENTIFIER", color: 'base08' };
    } else if (entry instanceof ImageEntry) {
        return { name: "IMAGE", color: 'base09' };
    } else if (entry instanceof TextEntry) {
        return { name: "TEXT", color: 'base0A' };
    } else if (entry instanceof PaletteEntry) {
        return { name: "PALETTE", color: 'base0B' };
    } else if (entry instanceof IntTableEntry) {
        return { name: "INT TABLE", color: 'base0E' };
    } else if (entry instanceof FloatTableEntry) {
        return { name: "FLOAT TABLE", color: 'base0C' };
    } else if (entry instanceof ZBufferEntry) {
        return { name: "Z BUFFER DATA", color: 'base0D' };
    } else {
        return { name: "UNKNOWN", color: 'base04' };
    }

    // case 11: return { name: "CAMERA DATA", color: 'base0C' };
}

/**
 * Create a DOM element.
 * @param {String} tag The tag name.
 * @param {HTMLElement} parent Element to add the element to.
 * @param {String} innerHTML HTML content of the element.
 * @returns {HTMLElement} The element.
 */
function createElement(tag, parent, innerHTML) {
    var element = document.createElement(tag);
    element.innerHTML = innerHTML;
    parent.appendChild(element);
    return element;
}

var fileElm = document.getElementById("file");

fileElm.onchange = function () {
    var f = fileElm.files[0],
        r = new FileReader();
    r.onload = function () {
        var DATFILE = new DATPARTOUT(r.result);
        document.body.appendChild(makeDAT(DATFILE));
    };
    r.readAsArrayBuffer(f);
};
