
var [canvas_sx, canvas_sy] = [0, 0];
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
    }
    window.onkeyup = (ev: KeyboardEvent) => {
        ev.preventDefault()
    }

    resize()

    ws = new WebSocket(`ws://${window.location.host}/ws`)
    let p = document.createElement("p")
    p.textContent = "websocket connecting..."
    document.body.appendChild(p)
    ws.onopen = () => {
        //var nick = prompt("Please choose a nickname", "an unnamed paddle") || "an unnamed paddle"
        var nick = `nickname#${Math.floor(Math.random() * 10000)}`
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


    ctx.restore()


    requestAnimationFrame(() => redraw(ctx));
}



