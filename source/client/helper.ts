

function parse_hex6_color(col: string): [number, number, number] {
    return [
        parseInt(col.substr(1, 2), 16),
        parseInt(col.substr(3, 2), 16),
        parseInt(col.substr(5, 2), 16)
    ];
}

export function hue_variation(col: string, variation: number, random: number): string {
    var [r, g, b] = parse_hex6_color(col)
    var [h, s, l] = rgb2hsl(r, g, b)
    h += (random * 2 - 1) * variation
    return `hsl(${h},${s}%,${l}%)`
}

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
    r = r / 255
    g = g / 255
    b = b / 255
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var lum = (max + min) / 2;
    var hue: number = 0;
    var sat;
    if (max == min) {
        hue = 0;
        sat = 0;
    } else {
        var c = max - min;
        sat = c / (1 - Math.abs(2 * lum - 1));
        switch (max) {
            case r:
                hue = (g - b) / c;
                // hue = ((g - b) / c) % 6;
                // hue = (g - b) / c + (g < b ? 6 : 0);
                break;
            case g:
                hue = (b - r) / c + 2;
                break;
            case b:
                hue = (r - g) / c + 4;
                break;
        }
    }
    hue = Math.round(hue * 60); // °
    sat = Math.round(sat * 100); // %
    lum = Math.round(lum * 100); // %
    return [hue, sat, lum];
}


export function random_seeded(str: string): () => number {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return () => {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        var s = (h ^= h >>> 16) >>> 0;
        return (s * 0.00001) % 1
    }
}