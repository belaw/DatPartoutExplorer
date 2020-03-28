import { DATPARTOUT } from "./DATPARTOUT";
import * as EntryUtils from "./EntryUtils"

function imageList(file) {
    var listElm = document.createElement("div");
    var palette;
    var images = [];
    file.groups.forEach(function (group, groupID) {
        group.entries.forEach(function (entry, entryID) {
            if (entry.type === 1) {
                images.push({
                    entry: entry,
                    entryID: entryID,
                    groupID: groupID
                });
            } else if (entry.type === 5) {
                palette = entry;
            }
        });
    });
    images.filter(image => image.entry.tableSize === 2).forEach(function (image) {
        var imageElm = image.entry.unk4 == 5 ? EntryUtils.paletteXImgFromEntry(image.entry, palette) : EntryUtils.paletteImgFromEntry(image.entry, palette);
        imageElm.title = image.groupID + "-" + image.entryID;
        listElm.appendChild(imageElm);
    });
    return listElm;
}

var fileElm = document.getElementById("file");
var imagesElm = document.getElementById("images");

fileElm.onchange = function () {
    var f = fileElm.files[0],
        r = new FileReader();
    r.onload = function () {
        var DATFILE = new DATPARTOUT(r.result);
        imagesElm.innerHTML = "";
        imagesElm.appendChild(imageList(DATFILE));
    };
    r.readAsArrayBuffer(f);
};
