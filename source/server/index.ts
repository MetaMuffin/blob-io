import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { GLOBAL_CONFIG } from "../global";
import { Game } from "./game";
import { normalize_for } from "./helper";

var websockets: { [key: string]: any } = {}
var game: Game = new Game()

function send_err(ws: any, message: any) {
    ws.send(JSON.stringify({ error: message }))
    // ws.close()
}

const PACKET_TYPES: { [key: string]: (ws: any, nick: string, j: any) => void } = {
    target: (ws, nick, j) => {
        if (typeof j.y != "number" || typeof j.x != "number") return send_err(ws, "invalid x or y target position");
        game.name_lookup[nick]?.forEach(c => {
            c.tx = j.x
            c.ty = j.y
        })
    },
    split: (ws, nick, j) => {
        [...game.name_lookup[nick]].forEach(c => {
            if (typeof j.r != "number") return send_err(ws, "invalid eject radius")
            c.split(j.r, !!j.owned)
        })
    },
    ping: (ws, nick, j) => { ws.send(JSON.stringify({ pong: true })) },
}

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

    app_ws.ws("/ws/:nickname", function (ws, req) {
        console.log("somebody connected");
        var nick = req.params.nickname || "unnamed"
        var nick_o = nick
        while (websockets[nick]) {
            nick = `${nick_o}d#${Math.floor(Math.random() * 10000)}`
        }
        websockets[nick] = ws
        game.spawn_player(nick)
        var has_config = false


        ws.onmessage = (ev) => {
            var j: any;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            if (!has_config) ws.send(JSON.stringify({ config: GLOBAL_CONFIG }))
            has_config = true
            if (PACKET_TYPES[j.type])
                PACKET_TYPES[j.type](ws, nick, j)
        }
        ws.onclose = () => {
            delete websockets[nick]
            game.name_lookup[nick]?.forEach(c => game.remove_cell(c))
            console.log(`somebody disconnected ${nick}`);
        }
    })

    app.use((req, res, next) => {
        res.status(404);
        res.send(
            "Sadly, we cant find anything associated to the link you manually typed in the url-bar to get this error."
        );
    });

    app_ws.listen(8080, "0.0.0.0", () => console.log("listening..."))
    setInterval(() => tick(), 1000 / GLOBAL_CONFIG.tickrate);
}

function tick() {
    game.tick()
    Object.entries(websockets).forEach(([nick, ws]) => {
        var view = game.get_player_view(nick).map(c => c.props)
        try {
            ws.send(JSON.stringify({ view, nick }))
        } catch (e) {
            console.log("Caught some errors of the shitty websocket library");
        }
    })
}

main();