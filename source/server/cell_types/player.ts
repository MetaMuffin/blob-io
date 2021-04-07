import { GLOBAL_CONFIG } from "../../global"
import { Cell } from "../cell"
import { Game } from "../game"
import { len, normalize_for } from "../helper"


export class PlayerCell extends Cell {

    public vx: number = 0
    public vy: number = 0
    public tx: number = 0
    public ty: number = 0
    public name: string

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
    }

    split() {
        if (this.radius < 2 * GLOBAL_CONFIG.player_radius) return
        this.radius *= Math.sqrt(0.5)
        
        var tdx = this.tx - this.x
        var tdy = this.ty - this.y
        var distance = GLOBAL_CONFIG.split_distance * this.radius
        
        var new_cell = new PlayerCell(this.game, this.name)
        new_cell.x = this.x + normalize_for(tdx, tdy) * distance
        new_cell.y = this.y + normalize_for(tdy, tdx) * distance
        new_cell.radius = this.radius
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