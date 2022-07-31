import { bound } from "../emulator/util.js";

const max_size = 1_000_000_000
export class Scroll_Out extends HTMLElement {
    scroll_div = document.createElement("div");
    content = document.createElement("div");
    char = document.createElement("div");
    cw: number = 8;
    ch: number = 8;
    lines: string[] = [""];
    size = 0;
    constructor(){
        super();
        this.appendChild(this.scroll_div);
        this.scroll_div.appendChild(this.content);
        this.onscroll = ()=>this.update();
        this.onresize = ()=>this.resize();
    
    
        this.char.textContent = "a";
        this.char.style.position = "absolute";
        this.char.style.visibility = "hidden";
        this.appendChild(this.char);
    }
    update(){
        const {ceil: c, floor: f} = Math;
        const {clientWidth: cw, clientHeight: ch} = this.char;
        const x = this.scrollLeft, y = this.scrollTop;
        const w = this.clientWidth, h = this.clientHeight;

        this.render(f(x/cw), f(y/ch), c((w+1)+1/cw), c((h+2)/ch));
    }
    resize(){
        const {clientWidth: cw, clientHeight: ch} = this.char;
        this.cw = cw; this.ch = ch
        const scroll = this.scrollTop === this.scrollHeight - this.clientHeight;
        const W = this.text_width, H = this.lines.length;
        this.scroll_div.style.height = `${H*ch}px`;
        this.scroll_div.style.width = `${W*cw}px`;
        this.update();
        if (scroll){
            this.scrollTop = this.scrollHeight*2;
        }
        return scroll;
    }
    private buf = "";
    private text_width = 0;
    clear(){
        this.buf = ""
        this.text_width = 0;
        this.lines = [""];
        this.size = 0;
        this.resize();
    }
    public write(text_to_add: string){
        this.buf += text_to_add;
        const clear_escape = "\x1b[2J";
        let i = this.buf.lastIndexOf(clear_escape);
        if (i >= 0) {
            this.buf = this.buf.substring(i + clear_escape.length);
            this.flush();
        }

    }
    public flush(){
        if (this.buf.length === 0){
            this.lines = [""];
            return;
        }
        let j = 0;
        for(let i = this.buf.indexOf("\n") + 1; i > 0; j = i, i = this.buf.indexOf("\n", i)+1){
            const line = this.buf.substring(j, i-1);
            const full_line = this.lines[this.lines.length-1] += line; 
            this.text_width = Math.max(full_line.length, this.text_width);
            this.size += line.length;
            this.lines.push("");
        }
        const full_line = this.lines[this.lines.length-1] += this.buf.substring(j, this.buf.length);
        this.text_width = Math.max(full_line.length, this.text_width);
        this.size += this.buf.length-j;
        this.buf = "";
        let i = 0;
        for (; this.size > max_size && i + 1 < this.lines.length; i++){
            this.size -= this.lines[i].length;
        }
        this.lines.splice(0, i);
        if (this.lines.length === 1 && this.lines[0].length > max_size){
            this.lines[0] = this.lines[0].substring(this.lines[0].length - max_size);
            this.size = max_size;
        }

        if (!this.resize()){
            this.scrollTop -= this.ch * i;
        }
    }
    public render(x: number, y: number, w: number, h: number){
        const W = this.text_width, H = this.lines.length;
        const sx = bound(x, 0, W), ex = bound(x+w, 0, W);
        const sy = bound(y, 0, H), ey = bound(y+h, 0, H);
        this.content.style.top = `${sy*this.ch}px`;
        this.content.style.left = `${sx*this.cw}px`;
        let text = "";
        for (let y = sy; y < ey; y++){
            const line = this.lines[y];
            text += line.substring(sx, ex) + "\n";
        }
        this.content.textContent = text;
    }
}

customElements.define("scroll-out", Scroll_Out);
