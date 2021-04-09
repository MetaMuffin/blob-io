import { own_name } from "."
import { CellType, ICell } from "../types"
import { COLOR_SCHEME } from "./config"
import { hue_variation, random_seeded } from "./helper"


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
    public color: string

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
        this.color = hue_variation(color, variation, random_seeded(this.id)())
    }

    update_props(update: ICell) {
        this.cleanup_timeout = 0
        this.x.value = update.x
        this.y.value = update.y
        this.radius.value = update.radius
    }


    draw(ctx: CanvasRenderingContext2D, delta: number) {
        this.x.tick(delta)
        this.y.tick(delta)
        this.radius.tick(delta)
        this.transparency.tick(delta)

        if (this.cleanup_timeout > 1) {
            this.radius.value = 0
            this.transparency.value = 0
        }

        ctx.globalAlpha = this.transparency.value
        ctx.fillStyle = this.color
        ctx.font = "5px sans-serif"
        ctx.textAlign = "center"

        ctx.beginPath()
        ctx.arc(this.x.value, this.y.value, Math.max(0.01, this.radius.value), 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `white`
        if (this.name) ctx.fillText(this.name, this.x.value, this.y.value)
    }
}