import { Field } from "serialize-ts";
import { GLOBAL_CONFIG, VERBOSE } from "../global";
import { CellType } from "../types";
import { PlayerCell } from "./cell_types/player";
import { Game } from "./game";
import { distance, id, len, normalize_for } from "./helper";




export abstract class Cell {
    public id: string = id();
    public x: number = 0
    public y: number = 0
    public radius: number = 0
    public alive: boolean = false

    protected game: Game

    constructor(game: Game) {
        this.game = game
    }

    tick(near_cells: Cell[]) {
        this.type_tick(near_cells)
        this.eat_tick(near_cells)
    }

    eat_tick(near_cells: Cell[]) {
        near_cells = [...near_cells]
        for (const c of near_cells) {
            //@ts-ignore
            if (c.name && this.name && c.name == this.name && c.id != this.id) {
                if (c.radius > this.radius) continue
            } else {
                if (c.radius * GLOBAL_CONFIG.min_eat_factor >= this.radius) continue
            }
            if (!c.alive) continue
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
