import { CIRCLE_RADIUS_FAC } from "../global";
import { Ball } from "./ball";
import { GameElement } from "./common";
import { cache } from "./helper";
import { Player } from "./player";

export var players: { [key: string]: Player } = {}
export var balls: { [key: string]: Ball } = {}

export const element_types: { [key: string]: (new (props: any) => GameElement) } = {
    player: Player,
    ball: Ball
}

export function updateCache() {
    cache.player_count = Object.values(players).length
    cache.circle_radius = CIRCLE_RADIUS_FAC * cache.player_count
}
