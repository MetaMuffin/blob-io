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

var websockets: { [key: string]: any } = { }
var game: Game = new Game()


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
        while (websockets[nick]) {
            nick = `unnamed#${Math.floor(Math.random() * 10000)}`
        }
        websockets[nick] = ws
        game.spawn_player(nick)


        ws.onmessage = (ev) => {
            var j;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
        }
        ws.onclose = () => {
            delete websockets[nick]
            game.name_lookup[nick].forEach(c => game.remove_cell(c))
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
            ws.send(JSON.stringify({ view }))
        } catch (e) {
            console.log("Caught some errors of the shitty websocket library");

        }
    })
}

main();