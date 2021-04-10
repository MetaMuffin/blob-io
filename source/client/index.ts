import { GLOBAL_CONFIG } from "../global";
import { ICell } from "../types";
import { ClientCell } from "./cell_render";
import { COLOR_SCHEME } from "./config";
import { cell_distance } from "./helper";

var [canvas_sx, canvas_sy] = [0, 0];
var ws: WebSocket;

var mousex: number, mousey: number;

var view: Map<string, ClientCell> = new Map()
export var own_name: string = ""

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
        own_name = prompt("Please choose a nickname", "an unnamed cell") || "an unnamed cell"
        ws = new WebSocket(`ws://${window.location.host}/play/${encodeURIComponent(own_name)}`)
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
        if (!spectator) if (ev.code == "Space") split(10000, true)
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
        update_target()
    }
    window.onwheel = (ev: any) => {
        spectator_view_radius *= 1 + 0.2 * Math.sign(ev.deltaY)
    }
    resize()

    let p = document.createElement("p")
    p.textContent = "websocket connecting..."
    document.body.appendChild(p)

    var ping_interval: any;
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "spawn" }))
        ping_interval = setInterval(() => ws.send(JSON.stringify({ type: "ping" })), 100)
        p.textContent = "awaiting spawn..."
    }
    ws.onclose = () => {
        document.body.innerHTML = "<h1>websocket closed :(</h1>"
        setTimeout(() => window.location.reload(), 1000)
    }
    ws.onmessage = (ev) => {
        var j: any = JSON.parse(ev.data.toString())
        if (j.view) {
            for (const c of j.view) {
                var local = view.get(c.id)
                if (!local) {
                    var cc = new ClientCell(c)
                    view.set(c.id, cc)
                    return
                }
                local.update_props(c)
            }
            for (const [id, cell] of view.entries()) {
                cell.cleanup_timeout += 1
                if (cell.cleanup_timeout > 10) {
                    view.delete(id)
                }
            }
        }
        if (j.meta) spectator_meta = j.meta
        if (j.nick) own_name = j.nick
        if (j.config && !CLIENT_CONFIG) {
            clearInterval(ping_interval)
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
    ctx.fillStyle = COLOR_SCHEME.background.lightness(0.5).toString();
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    var now = performance.now()
    var delta = now - last_frame
    last_frame = now
    var owned_cells = [...view.entries()].map(([i, c]) => c).filter(c => c.name == own_name)

    var cx, cy, view_dist
    if (spectator) {
        cx = (spectator_meta?.x || 0)
        cy = (spectator_meta?.y || 0)
        view_dist = spectator_meta?.r || 1
    } else {
        // var d = owned_cells.reduce((a, v) => a + v.radius ** 2, 0) * owned_cells.length
        // cx = owned_cells.reduce((a, v) => a + v.x * v.radius ** 2, 0) / d
        // cy = owned_cells.reduce((a, v) => a + v.y * v.radius ** 2, 0) / d        
        cx = owned_cells.reduce((a, v) => a + v.x.value, 0) / owned_cells.length
        cy = owned_cells.reduce((a, v) => a + v.y.value, 0) / owned_cells.length
        view_dist = Math.sqrt(owned_cells.reduce((a, v) => a + v.radius.value, 0)) * CLIENT_CONFIG.view_radius
        if (owned_cells.length == 0) view_dist = 1
        if (Number.isNaN(cx)) cx = 0
        if (Number.isNaN(cy)) cy = 0
    }

    if (do_view_update) {
        viewx += (cx - viewx) * 0.002 * delta
        viewy += (cy - viewy) * 0.002 * delta
    }

    var zoom = Math.min(canvas_sx, canvas_sy) / Math.max(view_dist, 100)

    if (Number.isNaN(viewzoom) || !Number.isFinite(viewzoom)) throw new Error("Some number went NaN again....a uff");
    if (Number.isNaN(viewx) || !Number.isFinite(viewx)) throw new Error("Some number went NaN again....b uff");
    if (Number.isNaN(viewy) || !Number.isFinite(viewy)) throw new Error("Some number went NaN again....c uff");

    viewzoom += (zoom - viewzoom) * 0.02 * delta

    ctx.save()
    ctx.transform(viewzoom, 0, 0, viewzoom, -viewx * viewzoom + canvas_sx / 2, -viewy * viewzoom + canvas_sy / 2)

    var tm = ctx.getTransform()
    var itm = tm.inverse()
    inverted_transform_matrix = [itm.a, itm.b, itm.c, itm.d, itm.e, itm.f]
    tm.inverse()

    ctx.fillStyle = COLOR_SCHEME.background.toString()
    ctx.fillRect(0, 0, CLIENT_CONFIG.map_size, CLIENT_CONFIG.map_size)

    var draw_order = [...view.values()].sort((a, b) => a.radius.value - b.radius.value)
    for (const cell of draw_order) {
        cell.draw(ctx, delta, draw_order)
    }

    ctx.restore()

    ctx.textAlign = "left"
    ctx.font = "10px sans-serif"
    ctx.fillStyle = "#9f9"
    if (!do_target_update) {
        ctx.fillText("Target updating disabled (click to perform a single update)", 10, 50, canvas_sx)
    }
    if (!do_view_update) {
        ctx.fillText("View updating disabled", 10, 100, canvas_sx)
    }
    if (owned_cells.length == 0 && !spectator) {
        ctx.fillText("You dont have any cells left. You should respawn", 10, 150)
    }

    ctx.textAlign = "center"
    ctx.font = "30px sans-serif"
    ctx.fillStyle = "#f99"
    if (spectator) ctx.fillText("Spectator", canvas_sx / 2, 20)
    else ctx.fillText(`Player: ${own_name}`, canvas_sx / 2, 20)

    requestAnimationFrame(() => redraw(ctx));
}
