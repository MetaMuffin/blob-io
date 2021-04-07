

export function id(): string {
    return Math.random().toString().substring(2)
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return len(x1 - x2, y1 - y2)
}
export function len(x: number, y: number): number {
    return Math.sqrt(x * x + y * y) + 0.001
}

export function normalize_for(a: number, o: number): number {
    return a / len(a, o)
}