import { BALL_RADIUS, BALL_SPEED_INCREASE, BALL_SPEED_INITIAL, BALL_VEL_RANDOMIZATION, PADDLE_SIZE, POLYGON_RADIUS_FAC } from "../global"
import { id, intersects } from "./helper"
import { paddles, removed } from "./paddle"

export var balls: { [key: string]: Ball } = {}

export class Ball {
    x: number = 0
    y: number = 0
    vx: number = 0
    vy: number = 0
    id: string

    constructor(i?: string) {

        this.id = i || id()
        balls[this.id] = this

        var [vx, vy] = [Math.random() * 2 - 1, Math.random() * 2 - 1]
        var l = 1 / Math.sqrt(vx * vx + vy * vy);
        vx *= l * BALL_SPEED_INITIAL
        vy *= l * BALL_SPEED_INITIAL
        this.vx = vx; this.vy = vy;

        console.log(`[${this.id}] ball spawned`);
    }
    destroy() {
        delete balls[this.id]
        removed.push(this.id)
        console.log(`[${this.id}] ball removed`);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.fillStyle = "#ff9999"
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.fill()
    }

    server_tick() {
        var paddle_count = Object.values(paddles).length
        for (const key in paddles) {
            if (!Object.prototype.hasOwnProperty.call(paddles, key)) continue
            const p = paddles[key];

            // the surface of the paddle as a line
            var ang = (p.index / paddle_count) * 2 * Math.PI
            var [pcx, pcy] = [
                Math.sin(ang) * POLYGON_RADIUS_FAC * paddle_count,
                Math.cos(ang) * POLYGON_RADIUS_FAC * paddle_count
            ]
            var [px1, py1, px2, py2] = [
                pcx + Math.sin(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcx + Math.sin(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
            ]
            var collision = ((a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) => {
                var det, gamma, lambda;
                det = (c - a) * (s - q) - (r - p) * (d - b);
                if (det === 0) {
                    return false;
                } else {
                    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
                    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
                    return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
                }
            })(px1, py1, px2, py2, this.x, this.y, this.x + this.vx, this.y + this.vy)
            if (collision) {
                var paddle_normal = [Math.sin(ang), Math.cos(ang)]
                var paddle_ball_dot = paddle_normal[0] * this.vx + paddle_normal[1] * this.vy
                var new_vx = this.vx - 2 * paddle_normal[0] * paddle_ball_dot
                var new_vy = this.vx - 2 * paddle_normal[1] * paddle_ball_dot
                this.vx = new_vx * BALL_SPEED_INCREASE + Math.random() * BALL_VEL_RANDOMIZATION
                this.vy = new_vy * BALL_SPEED_INCREASE + Math.random() * BALL_VEL_RANDOMIZATION
                p.score += 1
            }
        }
        var ball_distance = Math.sqrt(this.x * this.x + this.y * this.y);
        if (ball_distance > POLYGON_RADIUS_FAC * paddle_count * 2) {
            this.destroy()
            new Ball()
        }
        this.x += this.vx
        this.y += this.vy
    }
}
