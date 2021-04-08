import e from "express";
import { Cell } from "./cell";
import { rect_circle_intersection_test } from "./helper";

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
        return this.x1 < other.x2
            && this.x2 > other.x1
            && this.y1 < other.y2
            && this.y2 > other.y1
    }
    intersects_circle(x: number, y: number, r: number): boolean {
        var i = rect_circle_intersection_test(
            x, y, r,
            this.x1,
            this.y1,
            this.x2 - this.x1,
            this.y2 - this.y1
        )
        return i
    }
    get center_x(): number {
        return (this.x1 + this.x2) * 0.5
    }
    get center_y(): number {
        return (this.y1 + this.y2) * 0.5
    }
}

const QUAD_MAX_NODES = 100
export class Quadtree {
    private box: Box

    private nodes: Cell[] = []

    private split: boolean = false
    private tl?: Quadtree
    private tr?: Quadtree
    private bl?: Quadtree
    private br?: Quadtree

    private nodes_included: Cell[] = []

    constructor(box: Box) {
        this.box = box
    }

    insert(node: Cell, depth?: number): boolean {
        if (!depth) depth = 0
        if (!this.box.intersects_circle(node.x, node.y, node.radius)) return false
        if (this.split) {
            var insert_success = [
                this.tl?.insert(node, depth + 1),
                this.tr?.insert(node, depth + 1),
                this.bl?.insert(node, depth + 1),
                this.br?.insert(node, depth + 1)
            ]
            console.log(`${depth} ${insert_success.join(",")}`);
        }
        this.nodes.push(node)
        if (this.box.contains(node.x, node.y)) this.nodes_included.push(node)
        if (this.nodes_included.length > QUAD_MAX_NODES) {
            this.split = true
            var cx = this.box.center_x
            var cy = this.box.center_x
            this.tl = new Quadtree(new Box(this.box.x1, this.box.y1, cx, cy))
            this.tr = new Quadtree(new Box(cx, this.box.y1, this.box.x2, cy))
            this.bl = new Quadtree(new Box(this.box.x1, cy, cx, this.box.y2))
            this.br = new Quadtree(new Box(cx, cy, this.box.x2, this.box.y2))
            this.nodes.forEach(n => this.insert(n, depth))
            this.nodes = []
        }
        return true
    }

    remove(node: Cell): number {
        if (!this.box.intersects_circle(node.x, node.y, node.radius)) return 0
        if (!this.split) {
            var si = this.nodes.findIndex(c => c.id == node.id)
            var sii = this.nodes_included.findIndex(c => c.id == node.id)
            if (si == -1) return 0
            this.nodes.splice(si, 1)
            this.nodes_included.splice(sii, 1)
            return 1
        } else {
            return (this.tl?.remove(node) || 0)
                + (this.tr?.remove(node) || 0)
                + (this.bl?.remove(node) || 0)
                + (this.br?.remove(node) || 0)
        }
    }

    query(selection: Box): Cell[] {
        if (!this.split) return this.nodes
        if (!this.box.intersects(selection)) return []
        const e = () => { throw new Error("ekekkekekek"); }
        return [
            ...this.tl?.query(selection) || e(),
            ...this.tr?.query(selection) || e(),
            ...this.bl?.query(selection) || e(),
            ...this.br?.query(selection) || e(),
        ]
    }

    for_each_group(f: (near_cells: Cell[]) => void) {
        if (this.split) {
            this.tl?.for_each_group(f)
            this.tr?.for_each_group(f)
            this.tl?.for_each_group(f)
            this.tl?.for_each_group(f)
        } else {
            f(this.nodes_included)
        }
    }

    for_each(f: (cell: Cell) => void) {
        if (this.split) {
            this.tl?.for_each(f)
            this.tr?.for_each(f)
            this.tl?.for_each(f)
            this.tl?.for_each(f)
        } else {
            this.nodes.forEach(c => f(c))
        }
    }
}