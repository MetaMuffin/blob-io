import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { BALL_SPEED_INCREASE, BALL_SPEED_INITIAL, BALL_VEL_RANDOMIZATION, PADDLE_SIZE, POLYGON_RADIUS_FAC, TICKRATE } from "../global";
import { Paddle, paddles, updateIndecies } from "../common/paddle";
import { Ball, balls } from "../common/ball";


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
        var t_paddle: Paddle

        ws.onmessage = (ev) => {
            var j;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            if (!spawned) {
                console.log("SPAWN");
                spawned = true;
                t_paddle = new Paddle()
                t_paddle.ws = ws
                new Ball()
            }
            t_paddle.position = j.position || 0
            if (j.nick) t_paddle.nick = j.nick
        }
        ws.onclose = () => {
            console.log("DISCONNECT");
            Object.values(balls)[0].destroy()
            t_paddle.destroy()
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
    for (const id in paddles) {
        if (Object.prototype.hasOwnProperty.call(paddles, id)) {
            const p = paddles[id];
            p.server_tick()
        }
    }
    for (const id in balls) {
        if (Object.prototype.hasOwnProperty.call(balls, id)) {
            const b = balls[id];
            b.server_tick()
        }
    }
}

main();