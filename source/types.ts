
export type CellType = "player" | "food"
export interface ICell {
    id: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    name?: string ,
    type: CellType
}
