import { GLOBAL_CONFIG } from "../../global"
import { Cell } from "../cell"
import { Game } from "../game"
import { distance, len, normalize_for } from "../helper"
import { FoodCell } from "./food"


export class PlayerCell extends Cell {

    public vx: number = 0
    public vy: number = 0
    public tx: number = 0
    public ty: number = 0
    public name: string
    public split_timer: number = 0

    constructor(game: Game, name: string) {
        super(game)
        this.name = name
        this.radius = GLOBAL_CONFIG.player_radius
    }

    on_eat(other: Cell): void { }
    on_eaten(eater: Cell): void { }
    type_tick(near_cells: Cell[]) {
        var tdx = this.tx - this.x
        var tdy = this.ty - this.y
        var speed = Math.min(1, len(tdx, tdy))
        this.vx = normalize_for(tdx, tdy) * speed
        this.vy = normalize_for(tdy, tdx) * speed
        // console.log(`Target for ${this.name} (${this.id}) is (${this.tx}|${this.ty}). results in velocity of (${this.vx}|${this.vy}).`);
        this.x += this.vx
        this.y += this.vy
        this.split_timer += 1

        for (const c of near_cells) {
            if (!(c instanceof PlayerCell)) continue
            if (c.name != this.name) continue
            if (c.split_timer > GLOBAL_CONFIG.merge_cooldown && this.split_timer > GLOBAL_CONFIG.merge_cooldown) continue
            var d = distance(this.x, this.y, c.x, c.y)
            if (d >= this.radius + c.radius) continue
            var tdx = c.x - this.x
            var tdy = c.y - this.y
            var vl = len(this.vx, this.vy)
            this.x -= normalize_for(tdx, tdy) * vl
            this.y -= normalize_for(tdy, tdx) * vl
        }
    }

    split(eject_radius: number, keep_owner: boolean) {
        if (this.radius < Math.sqrt(2) * GLOBAL_CONFIG.player_radius) return
        eject_radius = Math.min(this.radius / 2, Math.max(GLOBAL_CONFIG.player_radius, eject_radius))
        this.radius = Math.sqrt(this.radius ** 2 - eject_radius ** 2)

        var tdx = this.tx - this.x
        var tdy = this.ty - this.y
        var distance = GLOBAL_CONFIG.split_distance * this.radius

        var new_cell: Cell;
        if (keep_owner) new_cell = new PlayerCell(this.game, this.name)
        else new_cell = new FoodCell(this.game)
        new_cell.x = this.x + normalize_for(tdx, tdy) * distance
        new_cell.y = this.y + normalize_for(tdy, tdx) * distance
        new_cell.radius = eject_radius
        this.game.add_cell(new_cell)
    }


    get props(): any {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius,
            type: "player",
            name: this.name,
        }
    }
}