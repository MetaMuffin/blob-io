import { Field } from "serialize-ts";
import { GLOBAL_CONFIG } from "../global";
import { id } from "./helper";


export type CellType = "player" | "food"


export class Cell {
    @Field() public id: string = id();
    @Field() public x: number = 0
    @Field() public y: number = 0
    @Field() public vx: number = 0
    @Field() public vy: number = 0
    @Field() public radius: number = 0
    @Field() public name?: string
    @Field() public type: CellType

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
}

