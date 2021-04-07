import { GLOBAL_CONFIG } from "../../global"
import { Cell } from "../cell"
import { Game } from "../game"
import { len, normalize_for } from "../helper"


export class FoodCell extends Cell {

    constructor(game: Game) {
        super(game)
        this.radius = GLOBAL_CONFIG.food_radius
    }

    on_eat(other: Cell): void { }
    on_eaten(eater: Cell): void {
        this.game.spawn_food()
    }
    type_tick(near_cells: Cell[]) {}

    get props(): any {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            radius: this.radius,
            type: "food",
        }
    }
}