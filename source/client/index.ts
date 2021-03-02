import { BALL_RADIUS, PADDLE_MOVE_SPEED, PADDLE_SIZE, POLYGON_RADIUS_FAC, TICKRATE } from "../global";

var [canvas_sx, canvas_sy] = [0, 0];
var paddle_vel = 0;
var paddle_pos = 0;
var ws: WebSocket;

interface Paddle {
    score: number,
    position: number,
    nick: string
}

var balls: { x: number, y: number }[] = []
var paddles: Paddle[] = []
var you: number


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
        paddles = j.paddles;
        balls = j.balls
        you = j.you
    }

    setInterval(() => {
        tick()
    }, 1000 / TICKRATE)
}

export function tick() {
    paddle_pos += paddle_vel * PADDLE_MOVE_SPEED
    const packet_out = { position: paddle_pos }
    ws.send(JSON.stringify(packet_out))
}


export function redraw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    var scoreboard: [number, string][] = paddles.map(p => [p.score, p.nick])
    scoreboard.sort((b, a) => a[0] - b[0])
    ctx.fillStyle = "white"
    ctx.font = "20px sans-serif"
    ctx.fillText("Multipong Scoreboard:", 20, 30);
    scoreboard.forEach((e, i) => ctx.fillText(`${i + 1}. ${e[0]} ${e[1]}`, 20, i * 20 + 60))

    ctx.save()
    var scale = canvas_sx / POLYGON_RADIUS_FAC / paddles.length / 5;

    ctx.transform(scale, 0, 0, scale, canvas_sx / 2, canvas_sy / 2);

    ctx.fillStyle = "red"
    for (const b of balls) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.fill()
    }
    for (let pi = 0; pi < paddles.length; pi++) {
        const p = paddles[pi];
        var ang = (pi / paddles.length) * 2 * Math.PI
        ctx.fillStyle = "green"
        draw_rect_rotated(ctx, p.position, POLYGON_RADIUS_FAC * paddles.length, PADDLE_SIZE, 10, ang);
        ctx.fillStyle = "white"
        draw_rect_rotated(ctx, 0, POLYGON_RADIUS_FAC * paddles.length + 10, 1000, 1, ang);
    }


    ctx.restore()

    requestAnimationFrame(() => redraw(ctx));
}



export function draw_rect_rotated(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ang: number) {
    ctx.save()
    // ctx.translate(x - w / 2, y - h / 2)
    ctx.rotate(-ang)
    // ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillRect(-w / 2 + x, y, w, h);

    ctx.restore()
}
