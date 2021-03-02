import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { BALL_SPEED_INCREASE, BALL_SPEED_INITIAL, BALL_VEL_RANDOMIZATION, PADDLE_SIZE, POLYGON_RADIUS_FAC, TICKRATE } from "../global";

interface Paddle {
    position: number,
    score: number,
    ws: any
    nick: string,
}
interface Ball {
    x: number,
    y: number,
    vx: number,
    vy: number
}

var paddles: Paddle[] = []
var balls: Ball[] = []

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
        res.sendFile(join(__dirname, "../../public/index.html"));
    });

    app.use("/static", estatic(join(__dirname, "../../public")));

    app.get("/favicon.ico", (req, res) => {
        res.sendFile(join(__dirname, "../../public/favicon.ico"));
    });

    app_ws.ws("/ws", function (ws, req) {
        var spawned = false
        console.log("CONNECT");
        var t_paddle: Paddle = { ws, position: 0, score: 0, nick: "an unnamed paddle" }
        var speed = initialBallSpeed()
        var t_ball: Ball = { x: 0, y: 0, vx: speed[0], vy: speed[1] }

        ws.onmessage = (ev) => {
            var j;
            try {
                j = JSON.parse(ev.data.toString())
            } catch (e) { ws.close(); console.log("INVALID JSON") }
            if (!spawned) {
                console.log("SPAWN")
                paddles.push(t_paddle)
                balls.push(t_ball)
                spawned = true;
            }
            t_paddle.position = j.position || 0
            if (j.nick) t_paddle.nick = j.nick
        }
        ws.onclose = () => {
            console.log("DISCONNECT");
            paddles.splice(paddles.findIndex(e => e == t_paddle), 1)
            balls.splice(balls.findIndex(e => e == t_ball), 1)
        }
    })


    app.use((req, res, next) => {
        res.status(404);
        res.send(
            "Sadly, we cant find anything associated to the link you manually typed in the url-bar to get this error."
        );
    });

    app_ws.listen(8080, "0.0.0.0", () => console.log("listening..."))

    // var mode = readFileSync(join(__dirname, "../../mode")).toString().trim()
    // var hostname = readFileSync(join(__dirname, "../../hostname")).toString().trim()

    // const srv = http.createServer(app)
    // srv.listen(mode == "production" ? 80 : 8080, hostname, () => {
    //     console.log("listening with http service");
    // })
    // if (existsSync(join(__dirname, "../../../certs"))) {
    //     const srvs = https.createServer({
    //         cert: readFileSync(join(__dirname, "../certs/cert.pem")),
    //         key: readFileSync(join(__dirname, "../certs/key.pem")),
    //     }, app)
    //     srvs.listen(mode == "production" ? 443 : 8443, hostname, () => {
    //         console.log("listening with https service on");
    //     })
    // }
    setInterval(() => update(), 1000 / TICKRATE);
}

function update() {
    for (let pi = 0; pi < paddles.length; pi++) {
        const p = paddles[pi];
        if (!p.ws.readyState) return
        p.ws.send(JSON.stringify({
            balls,
            paddles: paddles.map(p => ({
                position: p.position,
                score: p.score,
                nick: p.nick
            })),
            you: pi
        }))
    }
    for (const b of balls) {
        for (let pi = 0; pi < paddles.length; pi++) {
            const p = paddles[pi];
            // the surface of the paddle as a line
            var ang = (pi / paddles.length) * 2 * Math.PI
            var [pcx, pcy] = [
                Math.sin(ang) * POLYGON_RADIUS_FAC * paddles.length,
                Math.cos(ang) * POLYGON_RADIUS_FAC * paddles.length
            ]
            var [px1, py1, px2, py2] = [
                pcx + Math.sin(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcx + Math.sin(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
            ]
            var collision = intersects(px1, py1, px2, py2, b.x, b.y, b.x + b.vx, b.y + b.vy)
            if (collision) {
                // flip velocity vector on normal of (px1,py1)->(px2,py2)
                var paddle_normal = [
                    Math.sin(ang),
                    Math.cos(ang)
                ]
                var paddle_ball_dot = paddle_normal[0] * b.vx + paddle_normal[1] * b.vy
                var new_vx = b.vx - 2 * paddle_normal[0] * paddle_ball_dot
                var new_vy = b.vx - 2 * paddle_normal[1] * paddle_ball_dot
                b.vx = new_vx * BALL_SPEED_INCREASE + Math.random() * BALL_VEL_RANDOMIZATION
                b.vy = new_vy * BALL_SPEED_INCREASE + Math.random() * BALL_VEL_RANDOMIZATION
                p.score += 1
            }
        }
        var ball_distance = Math.sqrt(b.x * b.x + b.y * b.y);
        if (ball_distance > POLYGON_RADIUS_FAC * paddles.length * 2) {
            b.x = 0;
            b.y = 0;
            [b.vx, b.vy] = initialBallSpeed()
        }
        b.x += b.vx
        b.y += b.vy
    }
}

// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function intersects(a: number, b: number, c: number, d: number, p: number, q: number, r: number, s: number) {
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

function initialBallSpeed(): [number, number] {
    var [vx, vy] = [Math.random() * 2 - 1, Math.random() * 2 - 1]
    var l = 1 / Math.sqrt(vx * vx + vy * vy);
    vx *= l * BALL_SPEED_INITIAL;
    vy *= l * BALL_SPEED_INITIAL;
    return [vx, vy]
}

main();