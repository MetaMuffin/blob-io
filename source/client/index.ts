import { GLOBAL_CONFIG } from "../global";
import { ICell } from "../types";

var [canvas_sx, canvas_sy] = [0, 0];
var ws: WebSocket;

var mousex: number, mousey: number;

var last_view_cache: { [key: string]: ICell } = {}
var view: ICell[] = []
var nick: string = ""

var targetx = 50;
var targety = 50;
var do_target_update = true;

var CLIENT_CONFIG: any

var inverted_transform_matrix: number[]

window.onload = async () => {
    nick = prompt("Please choose a nickname", "an unnamed cell") || "an unnamed cell"
    //var nick = `nickname#${Math.floor(Math.random() * 10000)}`
    ws = new WebSocket(`ws://${window.location.host}/ws/${encodeURIComponent(nick)}`)

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
        if (ev.code == "KeyW") split(CLIENT_CONFIG.player_radius, false)
        if (ev.code == "KeyX") do_target_update = !do_target_update
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
    window.onclick = (ev: any) => split(100000, true)

    resize()

    let p = document.createElement("p")
    p.textContent = "websocket connecting..."
    document.body.appendChild(p)
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "spawn" }))
        p.textContent = "awaiting spawn..."
    }
    ws.onclose = () => {
        document.body.innerHTML = "websocket closed :("
        setTimeout(() => window.location.reload(), 1000)
    }
    ws.onmessage = (ev) => {
        var j: any = JSON.parse(ev.data.toString())
        if (j.view) {
            last_view_cache = {}
            for (const c of view) {
                last_view_cache[c.id] = c
            }
            view = j.view
        }
        if (j.nick) nick = j.nick
        if (j.config && !CLIENT_CONFIG) {
            CLIENT_CONFIG = j.config
            setInterval(() => tick(), 1000 / CLIENT_CONFIG.tickrate)
            redraw(ctx)
            document.body.removeChild(p)
        }
    }
}

function tick() {
    if (!do_target_update) return
    var imatrix = inverted_transform_matrix
    targetx = mousex * imatrix[0] + mousey * imatrix[2] + imatrix[4];
    targety = mousex * imatrix[1] + mousey * imatrix[3] + imatrix[5];
    update_target()
}

function split(r: number, owned: boolean) {
    ws.send(JSON.stringify({
        type: "split",
        r, owned
    }))
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
        if (cell.name == nick) ctx.fillStyle = "#f0f"
        ctx.font = "5px sans-serif"

        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "white"
        if (cell.name) ctx.fillText(cell.name, cell.x, cell.y)
    }


    ctx.restore()

    if (!do_target_update) {
        ctx.font = "20px sans-serif"
        ctx.fillStyle = "white"
        ctx.fillText("Target updating disabled", 10, 50, canvas_sx)
    }


    requestAnimationFrame(() => redraw(ctx));
}



