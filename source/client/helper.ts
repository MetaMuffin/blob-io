import { ClientCell } from "./cell_render";


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
export function cell_distance(a: ClientCell, b: ClientCell): number {
    return cell_center_distance(a, b) - a.radius.value - b.radius.value
}
export function cell_center_distance(a: ClientCell, b: ClientCell): number {
    return Math.sqrt((a.x.value - b.x.value) ** 2 + (a.y.value - b.y.value) ** 2)
}
export function point_cell_distance(x: number, y: number, c: ClientCell) {
    return Math.sqrt((x - c.x.value) ** 2 + (y - c.y.value) ** 2) - c.radius.value
}
export function distance(x: number, y: number, x2: number, y2: number) {
    return Math.sqrt((x - x2) ** 2 + (y - y2) ** 2)
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

export class Color {
    public h: number
    public s: number
    public l: number
    constructor(h: number,s:number,l:number) {
        this.h = h; this.s = s; this.l = l
    }
    public static from_hex(hex: string): Color {
        var p = rgb2hsl(...parse_hex6_color(hex))
        return new Color(...p)
    }
    toString(): string {
        return `hsl(${this.h},${this.s}%,${this.l}%)`
    }
    hue_variation(f: number, seed: string): Color {
        return new Color(
            this.h + (random_seeded(seed)() * 2 - 1) * f,
            this.s,
            this.l
        )
    }
    lightness(factor: number): Color {
        return new Color(
            this.h,
            this.s,
            this.l * factor
        )
    }
    saturation(factor: number): Color {
        return new Color(
            this.h,
            this.s * factor,
            this.l,
        )
    }
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