import { GLOBAL_CONFIG } from "../global";
import { Cell } from "./cell";
import { Box, Quadtree } from "./quadtree";


export class Game {
    public cells: Cell[] = []
    public name_lookup: { [key: string]: Cell[] } = {}


    public tick() {
        var qt = new Quadtree(new Box(0, 0, GLOBAL_CONFIG.map_size, GLOBAL_CONFIG.map_size))
        this.cells.forEach(c => qt.insert(c))
        
    }



}

