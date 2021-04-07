import { Field } from "serialize-ts";
import { GLOBAL_CONFIG } from "../global";
import { CellType } from "../types";
import { id } from "./helper";




export class Cell {
    public id: string = id();
    public x: number = 0
    public y: number = 0
    public vx: number = 0
    public vy: number = 0
    public radius: number = 0
    public name?: string
    public type: CellType

    constructor(type: CellType, name?: string) {
        this.type = type
        this.name = name
        if (type == "food") this.radius = GLOBAL_CONFIG.food_radius
        else if (type == "player") this.radius = GLOBAL_CONFIG.player_radius
    }

    tick(near_cells: Cell[]) {
        this.x += this.vx
        this.y += this.vy

    }

    get props(): any {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius,
            type: this.type,
            name: this.name,
        }
    }
}

