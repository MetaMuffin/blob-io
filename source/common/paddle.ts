import { PADDLE_SIZE, POLYGON_RADIUS_FAC } from "../global"
import { balls } from "./ball"
import { draw_rect_rotated, draw_text_rotated, id, paddle_count, polygon_radius } from "./helper"

export var paddles: { [key: string]: Paddle } = {}
export var removed: string[] = []

export class Paddle {
    position: number = 0
    nick: string = "an unnamed paddle"
    ws: any
    score: number = 0
    index: number = 0
    id: string

    constructor(i?: string) {
        this.id = i || id()
        paddles[this.id] = this
        console.log(`[${this.id}] paddle spawned`);
        updateIndecies()
    }
    destroy() {
        delete paddles[this.id]
        removed.push(this.id)
        console.log(`[${this.id}] paddle removed`);
        updateIndecies()
    }

    draw(ctx: CanvasRenderingContext2D, is_you?: boolean) {
        var ang = (this.index / Object.values(paddles).length) * 2 * Math.PI
        ctx.fillStyle = is_you ? "#99ff99" : "#00dd00"
        draw_rect_rotated(ctx, this.position, polygon_radius, PADDLE_SIZE, 10, ang);
        draw_text_rotated(ctx, this.position, polygon_radius + 30, this.nick, ang)
        ctx.fillStyle = "white"
        draw_rect_rotated(ctx, 0, polygon_radius + 10, POLYGON_RADIUS_FAC * 10, 1, ang);
    }

    server_tick() {
        var o = JSON.stringify({
            balls: Object.values(balls).map(b => ({
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                id: b.id
            })),
            paddles: Object.values(paddles).map(p => ({
                position: p.position,
                score: p.score,
                nick: p.nick,
                id: p.id,
                index: p.index
            })),
            removed,
            you: this.id
        })
        try { this.ws.send(o) } catch (e) { }
    }
}

export function updateIndecies() {
    var order = Object.values(paddles)
    for (let i = 0; i < order.length; i++) {
        const p = order[i];
        p.index = i
    }
}