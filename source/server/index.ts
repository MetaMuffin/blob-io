import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { GLOBAL_CONFIG, PROFILING, VERBOSE } from "../global";
import { Game } from "./game";
import { id, normalize_for } from "./helper";

var spectator_websockets: { [key: string]: { ws: any, x: number, y: number, r: number } } = {}
var player_websockets: { [key: string]: any } = {}
var game: Game = new Game()

function send_err(ws: any, message: any) {
    ws.send(JSON.stringify({ error: message }))
    // ws.close()
}

const PACKET_TYPES: { [key: string]: (ws: any, nick: string, j: any) => void } = {
    target: (ws, nick, j) => {
        if (typeof j.y != "number" || typeof j.x != "number") return send_err(ws, "invalid x or y target position");
        game.name_lookup.get(nick)?.forEach(c => {
            c.tx = j.x
            c.ty = j.y
        })
    },
    split: (ws, nick, j) => {
        [...game.name_lookup.get(nick) || []].forEach(c => {
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

    app_ws.ws("/play/:nickname", function (ws, req) {
        var nick = req.params.nickname || "unnamed"
        var has_config = false
        var spawned = false
        
        const on_open = () => {
            var nick_o = nick
            while (player_websockets[nick]) {
                nick = `${nick_o}#${Math.floor(Math.random() * 10000)}`
            }
            if (VERBOSE) console.log(`${nick} connected`);
            player_websockets[nick] = ws
            game.spawn_player(nick)
        }

        ws.onmessage = (ev) => {
            var j: any;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            
            if (!has_config) ws.send(JSON.stringify({ config: GLOBAL_CONFIG }))
            has_config = true
            if (!spawned) on_open()
            spawned = true

            if (PACKET_TYPES[j.type])
                PACKET_TYPES[j.type](ws, nick, j)
        }
        ws.onclose = () => {
            delete player_websockets[nick]
            if (VERBOSE) console.log(`${nick} disconnected with ${game.name_lookup.get(nick)?.length} cells`);
            [...game.name_lookup.get(nick) || []].forEach(c => {
                game.remove_cell(c)
            })
        }
    })

    app_ws.ws("/spectate", function (ws, req) {
        if (VERBOSE) console.log(`spectator joined`);
        var spec_id = id()
        var spec_info = spectator_websockets[spec_id] = {
            ws, r: 0, x: 0, y: 0
        }
        var has_config = false

        ws.onmessage = (ev) => {
            var j: any;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            if (!has_config) ws.send(JSON.stringify({ config: GLOBAL_CONFIG }))
            has_config = true
            if (j.type != "view") return send_err(ws, "as a spectator you can only use the 'view' packet")
            if (typeof j.x != "number" || typeof j.y != "number" || typeof j.r != "number") return send_err(ws, "one or more values of x,y and r aren't numbers")
            spec_info.x = j.x
            spec_info.y = j.y
            spec_info.r = j.r
        }
        ws.onclose = () => {
            delete spectator_websockets[spec_id]
            if (VERBOSE) console.log(`spectator left`);
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
    if (PROFILING) console.clear()
    if (PROFILING) console.time("tick")
    game.tick()
    if (PROFILING) console.timeEnd("tick")
    if (PROFILING) console.time("send-view-player")
    Object.entries(player_websockets).forEach(([nick, ws]) => {
        var view = game.get_player_view(nick).map(c => c.props)
        try {
            ws.send(JSON.stringify({ view, nick }))
        } catch (e) {
            console.log("Caught some errors of the shitty websocket library");
        }
    })
    if (PROFILING) console.timeEnd("send-view-player")
    if (PROFILING) console.time("send-view-spectator")
    Object.entries(spectator_websockets).forEach(([spec_id, spec_info]) => {
        var view = game.get_spectator_view(spec_info.x, spec_info.y, spec_info.r).map(c => c.props)
        try {
            spec_info.ws.send(JSON.stringify({
                view,
                meta: {
                    x: spec_info.x,
                    y: spec_info.y,
                    r: spec_info.r
                }
            }))
        } catch (e) {
            console.log("Caught some errors of the shitty websocket library");
        }
    })
    if (PROFILING) console.timeEnd("send-view-spectator")
}

main();