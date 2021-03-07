import { CIRCLE_RADIUS_FAC, PLAYER_RADIUS } from "../global"
import { elements, GameElement } from "./common"
import { players } from "./el_types"
import { cache, serialized } from "./helper"


export class Player extends GameElement {

    @serialized position: number = 0
    @serialized nick: string = "an unnamed paddle"
    @serialized score: number = 0
    ws: any
    index: number = 0

    constructor(p: any) {
        super("player", p);
        players[this.id] = this
        updateCache()
    }

    destroy() {
        delete players[this.id]
        delete elements[this.id]
        updateCache()
    }

    client_tick(): void {

    }

    client_draw(ctx: CanvasRenderingContext2D) {
        var ang = (this.index / cache.player_count) * 2 * Math.PI
        ctx.fillStyle = "#00dd00"
        var pos = this.pos
        ctx.beginPath()
        ctx.arc(pos[0], pos[1], PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill()
    }

    server_tick() {

    }

    get pos(): [number, number] {
        var ang = ((this.position + this.index) / cache.player_count) * 2 * Math.PI
        return [
            Math.sin(ang) * CIRCLE_RADIUS_FAC * cache.player_count,
            Math.cos(ang) * CIRCLE_RADIUS_FAC * cache.player_count
        ]
    }

}

export function updateIndecies() {
    var order = Object.values(players)
    for (let i = 0; i < order.length; i++) {
        const p = order[i];
        p.index = i
    }
}

function draw_rect_rotated(ctx: CanvasRenderingContext2D, position: number, polygon_radius: any, PADDLE_SIZE: number, arg4: number, ang: number) {
    throw new Error("Function not implemented.")
}
function updateCache() {
    throw new Error("Function not implemented.")
}

