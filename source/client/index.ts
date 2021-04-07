import { GLOBAL_CONFIG } from "../global";
import { ICell } from "../types";

var [canvas_sx, canvas_sy] = [0, 0];
var ws: WebSocket;

var mousex: number, mousey: number;
var view: ICell[] = []
var nick: string = ""
var targetx = 0;
var targety = 0;

var CLIENT_CONFIG: any

var inverted_transform_matrix: number[]

window.onload = async () => {
    ws = new WebSocket(`ws://${window.location.host}/ws/kek`)

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
    }
    window.onkeyup = (ev: KeyboardEvent) => {
        ev.preventDefault()
    }
    window.onmousemove = (ev: any) => {
        var rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;

        mousex = (ev.clientX - rect.left) * scaleX
        mousey = (ev.clientY - rect.top) * scaleY
    }

    resize()

    let p = document.createElement("p")
    p.textContent = "websocket connecting..."
    document.body.appendChild(p)
    ws.onopen = () => {
        //var nick = prompt("Please choose a nickname", "an unnamed paddle") || "an unnamed paddle"
        var nick = `nickname#${Math.floor(Math.random() * 10000)}`
        ws.send(JSON.stringify({ type: "spawn", name: nick }))
        document.body.removeChild(p)
        redraw(ctx)
    }
    ws.onclose = () => {
        document.body.innerHTML = "websocket closed :("
        window.location.reload()
    }
    ws.onmessage = (ev) => {
        var j: any = JSON.parse(ev.data.toString())
        if (j.view) view = j.view
        if (j.nick) nick = j.nick
        if (j.config) CLIENT_CONFIG = j.config
    }
    setInterval(() => tick(), 1000 / CLIENT_CONFIG.tickrate)
}

function tick() {
    var imatrix = inverted_transform_matrix
    targetx = mousex * imatrix[0] + mousey * imatrix[2] + imatrix[4];
    targety = mousex * imatrix[1] + mousey * imatrix[3] + imatrix[5];
    update_target()
}

export function update_target() {
    ws.send(JSON.stringify({
        type: "target",
        x: targetx,
        y: targety,
    }))
}

export function redraw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    var owned_cells = view.filter(c => c.name == nick)
    var cx = owned_cells.reduce((a, v) => a + v.x, 0) / owned_cells.length
    var cy = owned_cells.reduce((a, v) => a + v.y, 0) / owned_cells.length

    ctx.save()
    var zoom = 3
    ctx.transform(zoom, 0, 0, zoom, -cx * zoom + canvas_sx / 2, -cy * zoom + canvas_sy / 2)

    var tm = ctx.getTransform()
    var itm = tm.inverse()
    inverted_transform_matrix = [itm.a, itm.b, itm.c, itm.d, itm.e, itm.f]
    tm.inverse()

    ctx.fillStyle = "#333"
    ctx.fillRect(0, 0, 100, 100)

    for (const cell of view) {
        ctx.fillStyle = cell.type == "player" ? "#f00" : "#0f0"
        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.restore()

    requestAnimationFrame(() => redraw(ctx));
}



