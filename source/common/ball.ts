import { BALL_RADIUS, BALL_SPEED_INCREASE, BALL_SPEED_INITIAL, BALL_VEL_RANDOMIZATION, CIRCLE_RADIUS_FAC } from "../global"
import { elements, GameElement } from "./common"
import { balls, players } from "./el_types"
import { id, intersects } from "./helper"


export class Ball extends GameElement {
    x: number = 0
    y: number = 0
    vx: number = 0
    vy: number = 0

    constructor(props: any) {
        super("ball", props)
        balls[this.id] = this
    }

    destroy() {
        delete elements[this.id]
        delete balls[this.id]
    }

    public static get default_props() {
        var [vx, vy] = [Math.random() * 2 - 1, Math.random() * 2 - 1]
        var l = 1 / Math.sqrt(vx * vx + vy * vy);
        vx *= l * BALL_SPEED_INITIAL
        vy *= l * BALL_SPEED_INITIAL
        return {
            x: 0, y: 0, vx, vy, id: id()
        }
    }

    client_draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.fillStyle = "#ff9999"
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.fill()
    }
    client_tick() {

    }

    server_tick() {
        var player_count = Object.values(players).length
        for (const key in players) {
            if (!Object.prototype.hasOwnProperty.call(players, key)) continue
            const p = players[key];

            // TODO
        }
        var ball_distance = Math.sqrt(this.x * this.x + this.y * this.y);
        if (ball_distance > CIRCLE_RADIUS_FAC * player_count * 2) {
            this.destroy()
            new Ball(Ball.default_props)
        }
        this.x += this.vx
        this.y += this.vy
    }
}
