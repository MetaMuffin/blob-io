import { own_name } from "."
import { CellType, ICell } from "../types"
import { COLOR_SCHEME } from "./config"
import { cell_distance, Color, hue_variation, point_cell_distance, random_seeded } from "./helper"

const FAST_CELL_DRAW = false

export class InterpolatedValue {
    private _value: number
    private _target_value: number
    private animation_speed: number

    constructor(initial_value: number, animation_speed: number, initial_target?: number) {
        this._value = initial_value
        this.animation_speed = animation_speed
        this._target_value = initial_target ?? initial_value
    }
    tick(delta: number) {
        this._value += (this._target_value - this._value) * this.animation_speed * delta
    }
    get value() {
        return this._value
    }
    set value(target: number) {
        this._target_value = target
    }
}


export class ClientCell {
    public id: string
    public x: InterpolatedValue
    public y: InterpolatedValue
    public radius: InterpolatedValue
    public type: CellType
    public name?: string
    public cleanup_timeout: number
    public transparency: InterpolatedValue
    public fill_color: Color
    public stroke_color: Color

    constructor(initial_props: ICell) {
        this.id = initial_props.id
        this.x = new InterpolatedValue(initial_props.x, 0.01)
        this.y = new InterpolatedValue(initial_props.y, 0.01)
        this.radius = new InterpolatedValue(0, 0.01, initial_props.radius)
        this.transparency = new InterpolatedValue(0, 0.01, 1)
        this.type = initial_props.type
        this.name = initial_props.name
        this.cleanup_timeout = 0

        var color = COLOR_SCHEME.food
        var variation = 30
        if (this.type == "food") variation = 60
        if (this.type == "player") color = COLOR_SCHEME.player
        if (this.name == own_name) color = COLOR_SCHEME.own_cells
        this.fill_color = color.hue_variation(variation, this.id)
        this.stroke_color = this.fill_color.lightness(0.3).saturation(0.5)
    }

    update_props(update: ICell) {
        this.cleanup_timeout = 0
        this.x.value = update.x
        this.y.value = update.y
        this.radius.value = update.radius
    }


    draw(ctx: CanvasRenderingContext2D, delta: number, near_cells: ClientCell[]) {
        this.x.tick(delta)
        this.y.tick(delta)
        this.radius.tick(delta)
        this.transparency.tick(delta)

        if (this.cleanup_timeout > 1) {
            this.radius.value = 0
            this.transparency.value = 0
        }

        ctx.globalAlpha = this.transparency.value
        ctx.fillStyle = this.fill_color.toString()
        ctx.strokeStyle = this.stroke_color.toString()
        ctx.lineWidth = 0.3
        ctx.font = "5px sans-serif"
        ctx.textAlign = "center"


        var x = this.x.value
        var y = this.y.value
        var r = this.radius.value
        ctx.beginPath()

        if (FAST_CELL_DRAW) ctx.arc(this.x.value, this.y.value, Math.max(0.01, this.radius.value), 0, Math.PI * 2)
        else {
            var n_segments = Math.max(20, r * 10)
            for (let i = 0; i < n_segments + 1; i++) {
                var angle = i / n_segments * Math.PI * 2
                var local_r = r
                var seg_pre_x = x + Math.sin(angle) * local_r
                var seg_pre_y = y + Math.cos(angle) * local_r
                for (const c of near_cells) {
                    if (c.id == this.id) continue
                    var d = point_cell_distance(seg_pre_x, seg_pre_y, c)
                    if (c.radius.value > this.radius.value) continue
                    // local_r -= Math.min(c.radius.value, -d)
                    // local_r -= Math.max(0, (this.radius.value / 3) - Math.abs(d) * 3)
                    var v = -d / 2
                    local_r += (v > 0) ? v : 0
                }
                var seg_x = x + Math.sin(angle) * local_r
                var seg_y = y + Math.cos(angle) * local_r
                if (i == 0) ctx.moveTo(x, y + r)
                else ctx.lineTo(seg_x, seg_y)
            }
        }

        ctx.fill()
        if (this.type == "player") ctx.stroke()
        ctx.fillStyle = `white`
        if (this.name) ctx.fillText(this.name, this.x.value, this.y.value)
    }
}