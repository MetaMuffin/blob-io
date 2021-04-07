import { Cell } from "./cell";

export class Box {
    public x1: number
    public x2: number
    public y1: number
    public y2: number
    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1; this.x2 = x2; this.y1 = y1; this.y2 = y2
    }
    contains(x: number, y: number): boolean {
        return (x >= this.x1 && x < this.x2) && (y >= this.y1 && y < this.y2)
    }
    intersects(other: Box): boolean {
        return (
            (this.x1 > other.x1 && this.x1 < other.x2)
            || (this.x2 < other.x2 && this.x2 > other.x1)
        ) && (
                (this.y1 > other.y1 && this.y1 < other.y2)
                || (this.y2 < other.y2 && this.y2 > other.y1)
            );
    }
    get center_x(): number {
        return (this.x1 + this.x2) * 0.5
    }
    get center_y(): number {
        return (this.y1 + this.y2) * 0.5
    }
}

const QUAD_MAX_NODES = 4
export class Quadtree {
    private box: Box

    private nodes: Cell[] = []

    private split: boolean = false
    private tl?: Quadtree
    private tr?: Quadtree
    private bl?: Quadtree
    private br?: Quadtree

    constructor(box: Box) {
        this.box = box
    }

    insert(node: Cell): boolean {
        if (!this.box.contains(node.x, node.y)) return false
        if (this.split) {
            if (this.tl?.insert(node)) return true
            if (this.tr?.insert(node)) return true
            if (this.bl?.insert(node)) return true
            if (this.br?.insert(node)) return true
            throw new Error("Oh no. The quadtree implementation is incorrect");
        }
        this.nodes.push(node)
        if (this.nodes.length > QUAD_MAX_NODES) {
            this.split = true
            var cx = this.box.center_x
            var cy = this.box.center_x
            this.tl = new Quadtree(new Box(this.box.x1, this.box.y1, cx, cy))
            this.tr = new Quadtree(new Box(cx, this.box.y1, this.box.x2, cy))
            this.bl = new Quadtree(new Box(this.box.x1, cy, cx, this.box.y2))
            this.br = new Quadtree(new Box(cx, cy, this.box.x2, this.box.y2))
            this.nodes.forEach(n => this.insert(n))
            this.nodes = []
        }
        return true
    }

    query(selection: Box): Cell[] {
        if (!this.split) return this.nodes
        if (!this.box.intersects(selection)) return []
        return [
            ...this.tl?.query(selection) || [],
            ...this.tr?.query(selection) || [],
            ...this.bl?.query(selection) || [],
            ...this.br?.query(selection) || [],
        ]
    }
}