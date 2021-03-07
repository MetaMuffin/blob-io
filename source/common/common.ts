import { serialized, serializedMembers } from "./helper";

export var elements: { [key: string]: GameElement } = {}
export var removed_elements: GameElement[] = []


export abstract class GameElement {
    @serialized public id: string;
    @serialized protected type: string;

    constructor(type: string, p: any) { this.type = type; this.id = p.id; elements[this.id] = this }

    get props(): any {
        var s: any = {}
        var serialized = serializedMembers.get(this)
        if (!serialized) throw new Error("aajkhfjkasdhkfjhslfasdjk serializer");
        console.log(serialized);
        for (const key of serialized) {
            //@ts-ignore
            s[key] = this[key]
        }
        return s
    }

    set props(p: any) {
        Object.assign(this, p)
    }

    abstract client_draw(ctx: CanvasRenderingContext2D): void
    abstract client_tick(): void
    abstract server_tick(): void

    destroy() { delete elements[this.id] }
}