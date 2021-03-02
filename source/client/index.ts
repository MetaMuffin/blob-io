import { Ball, balls } from "../common/ball";
import { paddle_count, updateCache } from "../common/helper";
import { Paddle, paddles, removed } from "../common/paddle";
import { BALL_RADIUS, PADDLE_MOVE_SPEED, PADDLE_SIZE, POLYGON_RADIUS_FAC, TICKRATE } from "../global";

var [canvas_sx, canvas_sy] = [0, 0];
var paddle_vel = 0;
var paddle_pos = 0;
var ws: WebSocket;
var you: string;

window.onload = async () => {
    const canvas = document.getElementById("canvas")
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) throw new Error("asdasdas");
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("asdass");

    const resize = () => {
        canvas_sx = canvas.width = window.innerWidth;
        canvas_sy = canvas.height = window.innerHeight;

    }
    window.onresize = resize

    window.onkeydown = (ev: KeyboardEvent) => {
        if (ev.repeat) return
        if (ev.key == "a" && paddle_vel > -1) paddle_vel += -1
        if (ev.key == "d" && paddle_vel < 1) paddle_vel += 1
    }
    window.onkeyup = (ev: KeyboardEvent) => {
        if (ev.key == "a") paddle_vel -= -1
        if (ev.key == "d") paddle_vel -= 1
        ev.preventDefault()
    }

    resize()

    ws = new WebSocket(`ws://${window.location.host}/ws`)
    let p = document.createElement("p")
    p.textContent = "websocket connecting..."
    document.body.appendChild(p)
    ws.onopen = () => {
        var nick = prompt("Please choose a nickname", "an unnamed paddle") || "an unnamed paddle"
        ws.send(JSON.stringify({ nick }))
        document.body.removeChild(p)
        redraw(ctx)
    }
    ws.onclose = () => {
        document.body.innerHTML = "websocket closed :("
        window.location.reload()
    }
    ws.onmessage = (ev) => {
        var j: any = JSON.parse(ev.data.toString())
        j.balls.forEach((bn: Ball) => {
            let ref = balls[bn.id]
            if (!ref) { ref = new Ball(bn.id); }
            ref.x = bn.x
            ref.y = bn.y
            ref.vx = bn.vx
            ref.vy = bn.vy
        })
        j.paddles.forEach((bn: Paddle) => {
            let ref = paddles[bn.id]
            if (!ref) { ref = new Paddle(bn.id) }
            ref.position = bn.position
            ref.nick = bn.nick
            ref.index = bn.index
            ref.score = bn.score
        })
        j.removed.forEach((id: string) => {
            if (paddles[id]) paddles[id].destroy()
            if (balls[id]) balls[id].destroy()
        })
        you = j.you
    }

    setInterval(() => {
        tick()
    }, 1000 / TICKRATE)
}

export function tick() {
    removed.forEach(e => removed.pop())

    paddle_pos += paddle_vel * PADDLE_MOVE_SPEED
    const packet_out = { position: paddle_pos }
    ws.send(JSON.stringify(packet_out))
}


export function redraw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    updateCache()
    drawScoreboard(ctx)

    ctx.save()
    var scale = ((canvas_sx > canvas_sy) ? canvas_sy : canvas_sx) / POLYGON_RADIUS_FAC / Object.values(paddles).length / 5;
    ctx.transform(scale, 0, 0, scale, canvas_sx / 2, canvas_sy / 2);
    if (paddles[you]) {
        var rot = paddles[you].index / paddle_count * 2 * Math.PI
        ctx.rotate(rot)
    }

    ctx.fillStyle = "red"
    for (const id in balls) {
        if (!Object.prototype.hasOwnProperty.call(balls, id)) continue
        const b = balls[id];
        b.draw(ctx)
    }

    for (const id in paddles) {
        if (!Object.prototype.hasOwnProperty.call(paddles, id)) continue
        const p = paddles[id];
        p.draw(ctx, you == id)
    }

    ctx.beginPath()
    ctx.strokeStyle = "#dd0000"
    ctx.arc(0, 0, POLYGON_RADIUS_FAC * paddle_count * 2, 0, 2 * Math.PI);
    ctx.stroke()


    ctx.restore()


    requestAnimationFrame(() => redraw(ctx));
}

export function drawScoreboard(ctx: CanvasRenderingContext2D) {
    var scoreboard: [number, string][] = Object.values(paddles).map(p => [p.score, p.nick])
    scoreboard.sort((b, a) => a[0] - b[0])
    ctx.fillStyle = "white"
    ctx.font = "20px sans-serif"
    ctx.fillText("Multipong Scoreboard:", 20, 30);
    scoreboard.forEach((e, i) => ctx.fillText(`${i + 1}. ${e[0]} ${e[1]}`, 20, i * 20 + 60))
}



