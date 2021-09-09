import { Word } from "../util.js";

export class Console_IO {
    constructor(
        public input: {
            read: (callback: ()=>void) => void,
            text: string,
        },
        public write: (value: string) => void,
    ){
    }

    private async read(): Promise<void>{
        return new Promise((res) => {
            this.input.read(() => {
                this.fully_read = false;
                res();
            })
        });
    }
    private fully_read = true;
    async text_in(): Promise<Word>{
        if (!this.input.text && !this.fully_read){
            this.fully_read = true;
            return 0;
        }
        if (!this.input.text){
            await this.read();
        }
        const char_code = this.input.text.charCodeAt(0);
        this.input.text = this.input.text.slice(1);
        return char_code;
    }
    text_out(value: Word): void {
        this.write(String.fromCharCode(value));
    }

    async numb_in(): Promise<Word>{
        let num = NaN;
        while (Number.isNaN(num)){
            await this.read();
            num = parseInt(this.input.text);
        }
        this.input.text = this.input.text.trimStart().slice(num.toString().length);
        return num;
    }
    numb_out(value: Word): void {
        this.write(""+value);
    }
}
