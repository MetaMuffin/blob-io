import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { BALL_SPEED_INCREASE, BALL_SPEED_INITIAL, BALL_VEL_RANDOMIZATION, CIRCLE_RADIUS_FAC, TICKRATE } from "../global";
import { Player, updateIndecies } from "../common/player";
import { Ball} from "../common/ball";
import { id } from "../common/helper";
import { elements, removed_elements } from "../common/common";
import { balls, players } from "../common/el_types";


var websockets: any[] = []

async function main() {
    const app = Express();
    const app_ws = expressWs(app).app;

    const webpackConfig = require('../../webpack.config');
    const compiler = Webpack(webpackConfig)
    const devMiddleware = WebpackDevMiddleware(compiler, {
        publicPath: webpackConfig.output.publicPath
    })
    app.use("/scripts", devMiddleware)


    app.disable("x-powered-by");
    app.use(json());
    //app.use(urlencoded({ extended: true }));

    app.get("/", (req, res) => {
        res.sendFile(join(__dirname, "../../public/hub.html"));
    });
    app.get("/game", (req, res) => {
        res.sendFile(join(__dirname, "../../public/game.html"));
    });


    app.use("/static", estatic(join(__dirname, "../../public")));

    app.get("/favicon.ico", (req, res) => {
        res.sendFile(join(__dirname, "../../public/favicon.ico"));
    });

    app_ws.ws("/ws", function (ws, req) {
        var spawned = false
        console.log("CONNECT");
        var t_paddle: Player
        websockets.push(ws)

        ws.onmessage = (ev) => {
            var j;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            if (!spawned) {
                console.log("SPAWN");
                spawned = true;
                t_paddle = new Player({ nick: "asd", position: 0, score: 0, id: id() })
                t_paddle.ws = ws
                new Ball(Ball.default_props)
            }
            t_paddle.position = j.position || 0
            if (j.nick) t_paddle.nick = j.nick
        }
        ws.onclose = () => {
            console.log("DISCONNECT");
            Object.values(balls)[0].destroy()
            t_paddle.destroy()
            websockets.splice(websockets.findIndex(e => e == ws))
        }
    })

    app.use((req, res, next) => {
        res.status(404);
        res.send(
            "Sadly, we cant find anything associated to the link you manually typed in the url-bar to get this error."
        );
    });

    app_ws.listen(8080, "0.0.0.0", () => console.log("listening..."))
    setInterval(() => tick(), 1000 / TICKRATE);
}

function tick() {
    for (const id in players) {
        if (Object.prototype.hasOwnProperty.call(players, id)) {
            const p = players[id];
            p.server_tick()
        }
    }
    for (const id in balls) {
        if (Object.prototype.hasOwnProperty.call(balls, id)) {
            const b = balls[id];
            b.server_tick()
        }
    }

    for (const w of websockets) {
        var s = JSON.stringify({
            removed: removed_elements.map(e => e.id),
            updates: Object.values(elements).map(e => e.props)
        })
        try{
            w.send(s)
        } catch (e) {
            console.log(e);
        }
        
    }
    while (removed_elements.length > 0) removed_elements.pop()
}

main();