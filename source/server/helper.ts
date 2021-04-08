

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

export function rect_circle_intersection_test(
    circle_x: number, circle_y: number, circle_r: number,
    rect_x: number, rect_y: number, rect_w: number, rect_h: number
) {
    var cdx = Math.abs(circle_x - (rect_x + rect_w / 2));
    var cdy = Math.abs(circle_y - (rect_y + rect_h / 2));
    
    if (cdx > (rect_w / 2 + circle_r)) return false
    if (cdy > (rect_h / 2 + circle_r)) return false

    if (cdx <= (rect_w / 2)) return true
    if (cdy <= (rect_h / 2)) return true

    var cornerDistance_sq = (cdx - rect_w / 2) ^ 2 +
        (cdy - rect_h / 2) ^ 2;

    return cornerDistance_sq <= (circle_r ^ 2);
}
