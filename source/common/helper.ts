import { BALL_SPEED_INITIAL, CIRCLE_RADIUS_FAC } from "../global";
import { GameElement } from "./common";

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
export function intersects(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) {
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
    }
}

export function id(): string {
    return Math.random().toString()
}


export var cache = {
    circle_radius: 0,
    player_count: 0,
}

export interface InterpolatorConfig {
    duration: number,
    timing_function: (a: number) => number
}

export class Interpolator {
    private keyframes: [number, number][] = []
    public config: InterpolatorConfig

    constructor(initial: number, config?: InterpolatorConfig) {
        this.config = config || {
            duration: 1000,
            timing_function: a => a
        }
        this.keyframes.push([Interpolator.reltime(), initial])
    }

    public static reltime() {
        return Date.now()
    }

    get value() {
        if (this.keyframes.length < 1) return 0
        if (this.keyframes.length == 1) return this.keyframes[0][1]

        var now = Interpolator.reltime()
        var progress = (now - this.keyframes[0][0])
        var timed_progress = this.config.timing_function(progress)
        var gap = (this.keyframes[0][1] - this.keyframes[1][1])
        var adjust = gap * timed_progress
        return this.keyframes[0][1] + adjust
    }

    set value(v: number) {
        this.keyframes.push([
            Interpolator.reltime() + this.config.duration,
            v
        ])
    }
}


export var serializedMembers = new Map<GameElement, string[]>();
export function serialized(target: any, key: string) {
    console.log(target);

    let map = serializedMembers.get(target);
    if (!map) {
        map = [];
        serializedMembers.set(target, map);
    }
    map.push(key);
}