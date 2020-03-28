/* Created by jonas on 07.04.2017. */

import { DATPARTOUT } from "./DATPARTOUT";
import * as EntryUtils from "./EntryUtils";

/**
 * 
 * @param {DATPARTOUT} file 
 */
function makeDAT(file) {
    var palette = false;
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
        groupElm.innerHTML = "Group " + groupID + " <span class='base0C'>[" + group.nEntries + " Entr" + (group.nEntries === 1 ? "y" : "ies") + "]</span>";
        groupElm.appendChild(groupLinkElm);
        groupListElm.appendChild(groupElm);

        var entryListElm = document.createElement(elmContainer);
        groupElm.appendChild(entryListElm);

        if (group.nEntries > 0) {

            for (var entryID = 0; entryID < group.nEntries; entryID++) {
                var entry = group.entries[entryID];
                var entryElm = document.createElement(elmItem);

                var entryType = type(entry.type);
                entryElm.innerHTML = "Entry " + entryID + ", Type: " + entry.type + " (<span class='" + entryType.color + "'>" + entryType.name + "</span>)";
                entryListElm.appendChild(entryElm);

                var dataListElm = document.createElement(elmContainer);
                entryElm.appendChild(dataListElm);

                // List data
                var typeElm = document.createElement(elmItem);
                var entryType = type(entry.type);
                typeElm.innerHTML = "Type: " + entry.type + " (<span class='" + entryType.color + "'>" + entryType.name + "</span>)";
                dataListElm.appendChild(typeElm);

                switch (entry.type) {
                    case 0: // RESOURCE IDENTIFIER
                        createElement(elmItem, dataListElm, entry.data);
                        break;
                    case 1: // IMAGE
                        createElement(elmItem, dataListElm, "Width: " + entry.width + "px");
                        createElement(elmItem, dataListElm, "Height: " + entry.height + "px");
                        createElement(elmItem, dataListElm, "Padding: " + entry.padding + "px");
                        createElement(elmItem, dataListElm, "Data Length: " + entry.dataLength);
                        createElement(elmItem, dataListElm, "Image Size: " + entry.imageSize);
                        createElement(elmItem, dataListElm, "Table Size: " + entry.tableSize);
                        createElement(elmItem, dataListElm, "unk2: " + entry.fullWidth);
                        createElement(elmItem, dataListElm, "unk3: " + entry.unk3);
                        createElement(elmItem, dataListElm, "unk4: " + entry.unk4);
                        images.push({
                            elm: createElement(elmItem, dataListElm, ""),
                            group: groupID,
                            entry: entryID
                        });
                        break;
                    case 3: // TEXT
                    case 9: // TEXT2
                        createElement(elmItem, dataListElm, "<div class='container'>" + entry.data + "</div>");
                        break;
                    case 5: // PALETTE
                        palette = entry;
                        //palFile = new PAL(entry.data.colors);
                        dataListElm.appendChild(EntryUtils.paletteFromEntry(entry));
                        break;
                    case 12: // Z BUFFER DATA
                        createElement(elmItem, dataListElm, "Width: " + entry.width + "px");
                        createElement(elmItem, dataListElm, "Height: " + entry.height + "px");
                        zBuffers.push({
                            elm: createElement(elmItem, dataListElm, ""),
                            group: groupID,
                            entry: entryID
                        });
                        break;
                    default:
                        createElement(elmItem, dataListElm, "Length: " + entry.dataLength);
                        break;
                }
            }
        }
    }

    images.forEach(function (img) {
        var entry = file.groups[img.group].entries[img.entry];
        var image = entry.unk4 == 5 ? EntryUtils.paletteXImgFromEntry(entry, palette) : EntryUtils.paletteImgFromEntry(entry, palette);
        image.title = img.group + "-" + img.entry + ".png";
        if (entry.width > 0 && entry.height > 0) {
            img.elm.appendChild(image);
        }
    });

    zBuffers.forEach(function (zBuffer) {
        var entry = file.groups[zBuffer.group].entries[zBuffer.entry];
        var image = EntryUtils.zBufferImgFromEntry(entry);
        image.title = zBuffer.group + "-" + zBuffer.entry + ".png";
        if (entry.width > 0 && entry.height > 0) {
            zBuffer.elm.appendChild(image);
        }
    });

    return groupListElm;
}

function type(type) {
    switch (type) {
        case 0:
            return { name: "RESOURCE IDENTIFIER", color: 'base08' };
        case 1:
            return { name: "IMAGE", color: 'base09' };
        case 3:
        case 9:
            return { name: "TEXT", color: 'base0A' };
        case 5:
            return { name: "PALETTE", color: 'base0B' };
        case 11:
            return { name: "CAMERA DATA", color: 'base0C' };
        case 12:
            return { name: "Z BUFFER DATA", color: 'base0D' };
        default:
            return { name: "UNKNOWN", color: 'base04' };
    }
}

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
