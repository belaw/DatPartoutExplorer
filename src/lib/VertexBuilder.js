/**
 * @param {number[]} points
 * @returns {number[]} vertex indices
 */
export function getVertexIndices(points, width, height) {
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

    const result = [];

    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            // center, right, bottom, bottom right
            const points = [p(x, y), p(x + 1, y), p(x, y + 1), p(x + 1, y + 1)];
            const missingCount = points.map(p => p === undefined ? 1 : 0).reduce((a, b) => a + b);

            if (missingCount > 1) continue;

            const c = points[0];
            const r = points[1];
            const b = points[2];
            const br = points[3];

            if (missingCount == 0) {
                if (length(c, br) > length(b, r)) {
                    result.push(c.i, b.i, r.i);
                    result.push(r.i, b.i, br.i);
                } else {
                    result.push(c.i, b.i, br.i);
                    result.push(c.i, br.i, r.i);
                }
            } else if (c === undefined) {
                result.push(r.i, b.i, br.i);
            } else if (r === undefined) {
                result.push(c.i, b.i, br.i);
            } else if (b === undefined) {
                result.push(c.i, br.i, r.i);
            } else if (br === undefined) {
                result.push(c.i, b.i, r.i);
            }
        }
    }

    return result;
}

export function getVertices(points, indices) {
    const result = [];
    for (const i of indices) {
        result.push(
            points[i],
            points[i + 1],
            points[i + 2]
        );
    }
    return result;
}

function length(p1, p2) {
    const x = p1.x - p2.x;
    const y = p1.y - p2.y;
    const z = p1.z - p2.z;
    return Math.sqrt(x * x + y * y + z * z);
}
