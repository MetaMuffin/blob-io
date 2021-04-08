import { Field } from "serialize-ts";
import { GLOBAL_CONFIG, VERBOSE } from "../global";
import { CellType } from "../types";
import { Game } from "./game";
import { distance, id, len, normalize_for } from "./helper";




export abstract class Cell {
    public id: string = id();
    public x: number = 0
    public y: number = 0
    public radius: number = 0
    
    protected game: Game

    constructor(game: Game) {
        this.game = game
    }

    tick(near_cells: Cell[]) {
        this.type_tick(near_cells)
        this.eat_tick(near_cells)
    }

    eat_tick(near_cells: Cell[]) {
        var eatable_cells = near_cells.filter(c => c.radius * GLOBAL_CONFIG.min_eat_factor < this.radius)
        for (const c of eatable_cells) {
            var d = distance(this.x, this.y, c.x, c.y)
            if (d < this.radius) {
                this.on_eat(c)
                c.on_eaten(this)
                this.game.remove_cell(c)
                this.radius = len(this.radius, c.radius)
                if (VERBOSE) console.log(`${this.id} has eaten ${c.id}`);
            }
        }
    }

    abstract type_tick(near_cells: Cell[]): void
    abstract on_eat(other: Cell): void
    abstract on_eaten(eater: Cell): void

    abstract get props(): any
}
