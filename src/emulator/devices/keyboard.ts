import { IO_Port } from "../instructions.js";
import { Device } from "./device.js";

export class Keyboard implements Device {
    bits: number = 8;
    down: Uint8Array = new Uint8Array(256);
    keymap: Record<string, number> = usb;
    offset: number = 0;
    constructor (){
        addEventListener("keydown", this.onkeydown.bind(this));
        addEventListener("keyup", this.onkeyup.bind(this));
    }
    inputs = {
        [IO_Port.KEY]: () => this.down.slice(this.offset, this.offset + this.bits)
            .reduceRight((acc, v) => (acc << 1) + v, 0),
    }
    outputs = {
        [IO_Port.KEY]: (i: number) => this.offset = i,
    }
    private key(k: string) {
        return this.keymap[k];
    }
    private onkeydown(e: KeyboardEvent){
        const k = this.key(e.code);
        if (k !== undefined){
            this.down[k] = 1;
        }
    }
    private onkeyup(e: KeyboardEvent){
        const k = this.key(e.code);
        if (k !== undefined){
            this.down[k] = 0;
        }
    }
}

const digits = {
    Digit1: 1,
    Digit2: 2,
    Digit3: 3,
    Digit4: 4,
    Digit5: 5,
    Digit6: 6,
    Digit7: 7,
    Digit8: 8,
    Digit9: 9,
    Digit0: 10,
}

const usb = {
KeyA: 0x04,
KeyB: 0x05,
KeyC: 0x06,
KeyD: 0x07,
KeyE: 0x08,
KeyF: 0x09,
KeyG: 0x0A,
KeyH: 0x0B,
KeyI: 0x0C,
KeyJ: 0x0D,
KeyK: 0x0E,
KeyL: 0x0F,
KeyM: 0x10,
KeyN: 0x11,
KeyO: 0x12,
KeyP: 0x13,
KeyQ: 0x14,
KeyR: 0x15,
KeyS: 0x16,
KeyT: 0x17,
KeyU: 0x18,
KeyV: 0x19,
KeyW: 0x1A,
KeyX: 0x1B,
KeyY: 0x1C,
KeyZ: 0x1D,
Digit1: 0x1E,
Digit2: 0x1F,
Digit3: 0x20,
Digit4: 0x21,
Digit5: 0x22,
Digit6: 0x23,
Digit7: 0x24,
Digit8: 0x25,
Digit9: 0x26,
Digit0: 0x27,
Enter: 0x28,
Escape: 0x29,
Backspace: 0x2A,
Tab: 0x2B,
Space: 0x2C,
Minus: 0x2D,
Equal: 0x2E,
BracketLeft: 0x2F,
BracketRight: 0x30,
Backslash: 0x31,
Semicolon: 0x33,
Quote: 0x34,
Backquote: 0x35,
Comma: 0x36,
Period: 0x37,
Slash: 0x38,
CapsLock: 0x39,
F1: 0x3A,
F2: 0x3B,
F3: 0x3C,
F4: 0x3D,
F5: 0x3E,
F6: 0x3F,
F7: 0x40,
F8: 0x41,
F9: 0x42,
F10: 0x43,
F11: 0x44,
F12: 0x45,
PrintScreen: 0x46,
ScrollLock: 0x47,
Pause: 0x48,
Insert: 0x49,
Home: 0x4A,
PageUp: 0x4B,
Delete: 0x4C,
End: 0x4D,
PageDown: 0x4E,
ArrowRight: 0x4F,
ArrowLeft: 0x50,
ArrowDown: 0x51,
ArrowUp: 0x52,
NumLock: 0x53,
NumpadDivide: 0x54,
NumpadMultiply: 0x55,
NumpadSubtract: 0x56,
NumpadAdd: 0x57,
NumpadEnter: 0x58,
Numpad1: 0x59,
Numpad2: 0x5A,
Numpad3: 0x5B,
Numpad4: 0x5C,
Numpad5: 0x5D,
Numpad6: 0x5E,
Numpad7: 0x5F,
Numpad8: 0x60,
Numpad9: 0x61,
Numpad0: 0x62,
NumpadDecimal: 0x63,
IntlBackslash: 0x64,
Power: 0x66,
NumpadEqual: 0x67,
F13: 0x68,
F14: 0x69,
F15: 0x6A,
F16: 0x6B,
F17: 0x6C,
F18: 0x6D,
F19: 0x6E,
F20: 0x6F,
F21: 0x70,
F22: 0x71,
F23: 0x72,
F24: 0x73,
Help: 0x75,
ContextMenu: 0x76,
Props: 0x76,
Select: 0x77,
BrowserStop: 0x78,
MediaStop: 0x78,
Again: 0x79,
Undo: 0x7A,
Copy: 0x7C,
Paste: 0x7D,
Find: 0x7E,
AudioVolumeMute: 0x7F,
VolumeMute: 0x7F,
AudioVolumeUp: 0x80,
AudioVolumeDown: 0x81,
NumpadComma: 0x85,
IntlRo: 0x87,
IntlYen: 0x84,
Lang1: 0x90,
HangulMode: 0x90,
Lang2: 0x91,
Hanja: 0x91,
Lang3: 0x92,
Lang4: 0x93,
Cancel: 0x9B,
NumpadParenLeft: 0xB6,
NumpadParenRight: 0xB7,
ControlLeft: 0xE0,
ShiftLeft: 0xE1,
AltLeft: 0xE2,
OSLeft: 0xE3,
MetaLeft: 0xE3,
ControlRight: 0xE4,
ShiftRight: 0xE5,
AltRight: 0xE6,
OSRight: 0xE7,
MetaRight: 0xE7
};