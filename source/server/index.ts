import Express, { static as estatic, json } from "express";
import { join } from "path";
import Webpack from "webpack"
import WebpackDevMiddleware from "webpack-dev-middleware"
import { existsSync, readFile, readFileSync } from "fs";
import http from "http"
import https from "https"
import expressWs from "express-ws";
import { PADDLE_SIZE, POLYGON_RADIUS, TICKRATE } from "../global";

interface Paddle {
    position: number,
    score: number,
    ws: any
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
        var t_paddle: Paddle = { ws, position: 0, score: 0 }
        var t_ball: Ball = { x: 0, y: 0, vx: 2, vy: 2 }

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
        p.ws.send(JSON.stringify({
            balls,
            paddles: paddles.map(p => ({
                position: p.position,
                score: p.score 
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
                Math.sin(ang) * POLYGON_RADIUS,
                Math.cos(ang) * POLYGON_RADIUS
            ]
            var [px1, py1, px2, py2] = [
                pcx + Math.sin(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (PADDLE_SIZE * 0.5 + p.position),
                pcx + Math.sin(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
                pcy + Math.cos(ang + Math.PI * 0.5) * (-PADDLE_SIZE * 0.5 + p.position),
            ]
            var collision = intersects(px1, py1, px2, py2, b.x, b.y, b.x + b.vx, b.y + b.vy)
            if (collision) {
                console.log("we have a collision !!!");
                // flip velocity vector on axis of (px1,py1)->(px2,py2)
                var paddle_normal = [
                    Math.sin(ang),
                    Math.cos(ang)
                ]
                var paddle_ball_dot = paddle_normal[0] * b.vx + paddle_normal[1] * b.vy
                var new_vx = b.vx - 2 * paddle_normal[0] * paddle_ball_dot
                var new_vy = b.vx - 2 * paddle_normal[1] * paddle_ball_dot
                b.vx = new_vx
                b.vy = new_vy
                p.score += 1
            }
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
};

main();