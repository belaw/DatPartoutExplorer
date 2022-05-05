/**
 * @param {number[]} points
 * @param {number} width
 * @param {number} height
 * @param {number} maxLength
 * @returns {number[]} vertex indices
 */
export function getFaceVertexIndices(points, width, height, maxLength) {
    /** @type {number[]} */
    const result = [];
    const indexMap = [];

    function p(x, y) {
        const i = (y * width + x) * 3;

        if (points[i] === undefined) return undefined;

        return {
            x: points[i + 0],
            y: points[i + 1],
            z: points[i + 2],
            i: i
        };
    }

    function addTri(p1, p2, p3) {
        if (length(p1, p2) > maxLength
            || length(p2, p3) > maxLength
            || length(p3, p1) > maxLength) return;
        result.push(indexMap[p1.i] / 3, indexMap[p2.i] / 3, indexMap[p3.i] / 3);
    }

    for (let i = 0, j = 0; i < points.length; i++) {
        indexMap[i] = j;
        if (points[i] !== undefined) j++;
    }

    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            // center, right, bottom, bottom right
            const neighbourhood = [p(x, y), p(x + 1, y), p(x, y + 1), p(x + 1, y + 1)];
            const missingCount = neighbourhood.map(p => p === undefined ? 1 : 0).reduce((a, b) => a + b);

            if (missingCount > 1) continue;

            const c = neighbourhood[0];
            const r = neighbourhood[1];
            const b = neighbourhood[2];
            const br = neighbourhood[3];

            if (missingCount == 0) {
                if (length(c, br) > length(b, r)) {
                    addTri(c, b, r);
                    addTri(r, b, br);
                } else {
                    addTri(c, b, br);
                    addTri(c, br, r);
                }
            } else if (c === undefined) {
                addTri(r, b, br);
            } else if (r === undefined) {
                addTri(c, b, br);
            } else if (b === undefined) {
                addTri(c, br, r);
            } else if (br === undefined) {
                addTri(c, b, r);
            }
        }
    }

    return result;
}

function length(p1, p2) {
    const x = p1.x - p2.x;
    const y = p1.y - p2.y;
    const z = p1.z - p2.z;
    return Math.sqrt(x * x + y * y + z * z);
}
