/**
 * Created by jonas on 07.04.2017.
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
                        dataListElm.appendChild(paletteFromEntry(entry));
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
        var image = paletteImgFromEntry(entry, palette);
        var linkElm = document.createElement("a");
        linkElm.download = img.group + "-" + img.entry + ".png";
        linkElm.href = image.src;
        linkElm.appendChild(image);
        if (entry.width > 0 && entry.height > 0) {
            img.elm.appendChild(linkElm);
        }
    });

    zBuffers.forEach(function (zBuffer) {
        var entry = file.groups[zBuffer.group].entries[zBuffer.entry];
        var image = zBufferImgFromEntry(entry);
        var linkElm = document.createElement("a");
        linkElm.download = zBuffer.group + "-" + zBuffer.entry + ".png";
        linkElm.href = image.src;
        linkElm.appendChild(image);
        if (entry.width > 0 && entry.height > 0) {
            zBuffer.elm.appendChild(linkElm);
        }
    });

    return groupListElm;
}

function zBufferImgFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    var byte = 0;
    var ass = [];
    for (var y = H; y > 0; y--) {
        var poop = [];
        for (var x = 0; x < W; x++, byte++) {
            poop.push(entry.data[byte]);
            var index = (x + y * W) * 4;
            var value = (entry.data[byte] / 0xFFFF) * 255;
            data[index] = value; // RED
            data[index + 1] = value; // GREEN
            data[index + 2] = value; // BLUE
            data[index + 3] = 255; // ALPHA
        }
        byte += entry.fullWidth - entry.width;
        ass.push(poop);
    }
    ass = ass.reverse();
    console.log(ass.map(x => x.join(";")).join("\n"));
    var output = new Image();
    ctx.putImageData(image, 0, 0);
    output.src = canvas.toDataURL("image/png");
    return output;
}

function paletteImgFromEntry(entry, palette) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var W = entry.width, H = entry.height;
    canvas.width = W;
    canvas.height = H;
    var image = ctx.getImageData(0, 0, W, H);
    var data = image.data;
    var byte = 0;
    for (var y = H; y > 0; y--) {
        for (var x = 0; x < W; x++, byte++) {
            var index = (x + y * W) * 4;
            var color = palette.data.colors[entry.data[byte] || 0] || 0;
            data[index] = color.r; // RED
            data[index + 1] = color.g; // GREEN
            data[index + 2] = color.b; // BLUE
            data[index + 3] = 255; // ALPHA
        }
        byte += entry.padding;
    }
    var output = new Image();
    ctx.putImageData(image, 0, 0);
    output.src = canvas.toDataURL("image/png");
    return output;
}

function paletteFromEntry(entry) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var colorSize = 10;
    var A = Math.sqrt(entry.dataLength / 4) * colorSize;
    canvas.width = canvas.height = A;
    var image = ctx.getImageData(0, 0, A, A);
    var data = image.data;
    var byte = 0;
    for (var y = A / colorSize; y > 0; y--) for (var x = 0; x < A / colorSize; x++, byte++) {
        var index = (x * colorSize + y * colorSize * A) * 4;
        var color = entry.data.colors[byte];
        for (var X = 0; X < colorSize; X++) for (var Y = 0; Y < colorSize; Y++) {
            var INDEX = index + (X + Y * A) * 4;
            data[INDEX] = color.r; // RED
            data[INDEX + 1] = color.g; // GREEN
            data[INDEX + 2] = color.b; // BLUE
            data[INDEX + 3] = 255; // ALPHA
        }
    }
    var output = new Image();
    ctx.putImageData(image, 0, 0);
    output.src = canvas.toDataURL("image/png");
    return output;
}

function type(type) {
    switch (type) {
        case 0:
            return {name: "RESOURCE IDENTIFIER", color: 'base08'};
        case 1:
            return {name: "IMAGE", color: 'base09'};
        case 3:
        case 9:
            return {name: "TEXT", color: 'base0A'};
        case 5:
            return {name: "PALETTE", color: 'base0B'};
        case 11:
            return {name: "CAMERA DATA", color: 'base0C'};
        case 12:
            return {name: "Z BUFFER DATA", color: 'base0D'};
        default:
            return {name: "UNKNOWN", color: 'base04'};
    }
}

function createElement(tag, parent, innerHTML) {
    var element = document.createElement(tag);
    element.innerHTML = innerHTML;
    parent.appendChild(element);
    return element;
}