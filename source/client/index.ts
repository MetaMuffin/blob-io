import { ICell } from "../types";

var [canvas_sx, canvas_sy] = [0, 0];
var ws: WebSocket;
var you: string;

var view: ICell[] = []

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
    }
    window.onkeyup = (ev: KeyboardEvent) => {
        ev.preventDefault()
    }

    resize()

    ws = new WebSocket(`ws://${window.location.host}/ws/kek`)
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
        console.log(j.view.map((e:any) => e.id).join(", "));
        
        if (j.view) view = j.view
    }
}

export function tick() {
    var packet_out = {}
    ws.send(JSON.stringify(packet_out))
}


export function redraw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvas_sx, canvas_sy);
    ctx.fillRect(0, 0, canvas_sx, canvas_sy);

    ctx.save()
    ctx.transform(2, 0, 0, 2, 0, 0)

    ctx.fillStyle = "#333"
    ctx.fillRect(0, 0, 100, 100)

    for (const cell of view) {
        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.restore()


    requestAnimationFrame(() => redraw(ctx));
}



