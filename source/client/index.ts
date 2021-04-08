import { GLOBAL_CONFIG } from "../global";
import { ICell } from "../types";

var [canvas_sx, canvas_sy] = [0, 0];
var ws: WebSocket;

var mousex: number, mousey: number;

var last_view_cache: { [key: string]: ICell } = {}
var view: ICell[] = []
var nick: string = ""

var spectator_meta: undefined | { x: number, y: number, r: number };
var spectator_view_radius = 100

var targetx = 50;
var targety = 50;
var do_target_update = true;
var do_view_update = true;

var viewx = 0;
var viewy = 0;
var viewzoom = 1;

var last_frame = performance.now()

var CLIENT_CONFIG: any

var inverted_transform_matrix: number[]

var spectator = false

window.onload = async () => {
    spectator = window.location.hash.includes("spectator")
    if (spectator) {
        ws = new WebSocket(`ws://${window.location.host}/spectate`)
    } else {
        nick = prompt("Please choose a nickname", "an unnamed cell") || "an unnamed cell"
        ws = new WebSocket(`ws://${window.location.host}/play/${encodeURIComponent(nick)}`)
    }

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
        if (!spectator) if (ev.code == "KeyW") split(CLIENT_CONFIG.player_radius, false)
        if (ev.code == "KeyX") do_target_update = !do_target_update
        if (ev.code == "KeyC") do_view_update = !do_view_update
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
    window.onclick = (ev: any) => {
        if (spectator) update_target()
        else split(100000, true)
    }
    window.onmousewheel = (ev: any) => {
        spectator_view_radius *= 1 + 0.2 * Math.sign(ev.deltaY)
    }
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
        if (j.meta) spectator_meta = j.meta
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
    update_target()
}

function split(r: number, owned: boolean) {
    ws.send(JSON.stringify({
        type: "split",
        r, owned
    }))
}

export function update_target() {
    var imatrix = inverted_transform_matrix
    targetx = mousex * imatrix[0] + mousey * imatrix[2] + imatrix[4];
    targety = mousex * imatrix[1] + mousey * imatrix[3] + imatrix[5];
    if (!spectator) {
        ws.send(JSON.stringify({
            type: "target",
            x: targetx,
            y: targety,
        }))
    } else {
        ws.send(JSON.stringify({
            type: "view",
            x: targetx,
            y: targety,
            r: spectator_view_radius
        }))
    }
}

export function redraw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    var now = performance.now()
    var delta = now - last_frame
    last_frame = now

    var cx, cy, view_dist
    if (spectator) {
        cx = (spectator_meta?.x || 0)
        cy = (spectator_meta?.y || 0)
        view_dist = spectator_meta?.r || 1
    } else {
        var owned_cells = view.filter(c => c.name == nick)
        var d = owned_cells.reduce((a, v) => a + v.radius ** 2, 0) * owned_cells.length
        cx = owned_cells.reduce((a, v) => a + v.x * v.radius ** 2, 0) / d
        cy = owned_cells.reduce((a, v) => a + v.y * v.radius ** 2, 0) / d
        view_dist = owned_cells.reduce((a, v) => Math.max(a, v.radius), 0) * CLIENT_CONFIG.view_radius
        if (Number.isNaN(cx)) cx = 0
        if (Number.isNaN(cy)) cy = 0
    }

    if (do_view_update) {
        viewx += (cx - viewx) * 0.002 * delta
        viewy += (cy - viewy) * 0.002 * delta
    }

    var zoom = Math.min(canvas_sx, canvas_sy) / view_dist
    if (Number.isNaN(zoom)) zoom = 1;
    viewzoom += (zoom - viewzoom) * 0.02 * delta

    ctx.save()
    ctx.transform(viewzoom, 0, 0, viewzoom, -viewx * viewzoom + canvas_sx / 2, -viewy * viewzoom + canvas_sy / 2)

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
        ctx.textAlign = "center"

        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "white"
        if (cell.name) ctx.fillText(cell.name, cell.x, cell.y)
    }

    ctx.restore()

    ctx.textAlign = "left"
    ctx.font = "10px sans-serif"
    ctx.fillStyle = "#9f9"
    if (!do_target_update) {
        ctx.fillText("Target updating disabled", 10, 50, canvas_sx)
    }
    if (!do_view_update) {
        ctx.fillText("View updating disabled", 10, 100, canvas_sx)
    }

    ctx.textAlign = "center"
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#f99"
    if (spectator) ctx.fillText("Spectator", canvas_sx / 2, 20)
    else ctx.fillText(`Player: ${nick}`, canvas_sx / 2, 20)

    requestAnimationFrame(() => redraw(ctx));
}



