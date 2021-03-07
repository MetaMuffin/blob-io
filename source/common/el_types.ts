import { Ball } from "./ball";
import { GameElement } from "./common";
import { Player } from "./player";

export const element_types: { [key: string]: (new (props: any) => GameElement) } = {
    player: Player,
    ball: Ball
}
