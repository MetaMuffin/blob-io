import { BALL_SPEED_INITIAL, POLYGON_RADIUS_FAC } from "../global";
import { paddles } from "./paddle";

// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
export function intersects(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) {
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
    }
}

export function id(): string {
    return Math.random().toString()
}


export function draw_rect_rotated(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ang: number) {
    ctx.save()
    ctx.rotate(-ang)
    ctx.fillRect(-w / 2 + x, y, w, h);
    ctx.restore()
}
export function draw_text_rotated(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, ang: number) {
    ctx.save()
    ctx.rotate(-ang)
    ctx.fillText(text, x, y);
    ctx.restore()
}


export var polygon_radius: number = 0
export var paddle_count: number = 0
export function updateCache() {
    paddle_count = Object.values(paddles).length
    polygon_radius = POLYGON_RADIUS_FAC * paddle_count
}