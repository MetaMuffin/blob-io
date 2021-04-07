import { Field } from "serialize-ts";
import { GLOBAL_CONFIG } from "../global";
import { CellType } from "../types";
import { Game } from "./game";
import { id, len, normalize_for } from "./helper";




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

    }

    abstract type_tick(near_cells: Cell[]): void
    abstract on_eat(other: Cell): void
    abstract on_eaten(eater: Cell): void

    abstract get props(): any
}
