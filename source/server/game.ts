import { GLOBAL_CONFIG } from "../global";
import { Cell } from "./cell";
import { distance } from "./helper";
import { Box, Quadtree } from "./quadtree";


export class Game {
    public cells: Cell[] = []
    public cell_lookup: { [key: string]: Cell } = {}
    public name_lookup: { [key: string]: Cell[] } = {}
    public quadtree: Quadtree

    constructor() {
        this.quadtree = new Quadtree(new Box(0, 0, 0, 0))
    }

    add_cell(c: Cell) {
        console.log(`Add cell ${c.id}`);
        this.cells.push(c)
        this.cell_lookup[c.id] = c
        if (c.name && !this.name_lookup[c.name]) this.name_lookup[c.name] = []
        if (c.name) this.name_lookup[c.name].push(c)
    }
    remove_cell(c: Cell) {
        console.log(`Remove cell ${c.id}`);
        let si = this.cells.findIndex(a => a === c)
        console.log(si);
        this.cells.splice(si, 1)
        delete this.cell_lookup[c.id]
        if (c.name) {
            let si = this.name_lookup[c.name].findIndex(a => a === c)
            console.log(si);
            this.name_lookup[c.name].splice(si, 1)
            if (this.name_lookup[c.name].length == 0) delete this.name_lookup[c.name]
        }
    }

    public tick() {
        this.quadtree = new Quadtree(new Box(0, 0, GLOBAL_CONFIG.map_size, GLOBAL_CONFIG.map_size))
        this.cells.forEach(c => this.quadtree.insert(c))
        this.cells.forEach(c => {
            var near_box = new Box(c.x - c.radius * 1.2, c.y - c.radius * 1.2, c.x + c.radius * 1.2, c.y + c.radius * 1.2)
            var near_cells = this.quadtree.query(near_box)
            c.tick(near_cells)
        })
    }

    get_cell_view(c: Cell): Cell[] {
        let box = new Box(c.x - c.radius * GLOBAL_CONFIG.view_radius, c.y - c.radius * GLOBAL_CONFIG.view_radius, c.x + c.radius * GLOBAL_CONFIG.view_radius, c.y + c.radius * GLOBAL_CONFIG.view_radius)
        var rough = this.quadtree.query(box)
        return rough.filter(cell => {
            var d = distance(cell.x, cell.y, c.x, c.y)
            return d <= GLOBAL_CONFIG.view_radius
        })
    }

    get_player_view(name: string): Cell[] {
        var player_cells = this.name_lookup[name]
        if (!player_cells) return []
        var view: { [key: string]: Cell } = {}
        for (const c of player_cells) {
            for (const d of this.get_cell_view(c)) {
                view[d.id] = d
            }
        }
        return Object.values(view)
    }

    spawn_player(name: string) {
        console.log("Spawn player: " + name);
        var cell = new Cell("player", name)
        cell.x = GLOBAL_CONFIG.map_size * Math.random()
        cell.y = GLOBAL_CONFIG.map_size * Math.random()
        this.add_cell(cell)
    }
}

