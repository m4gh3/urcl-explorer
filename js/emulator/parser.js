import { Constants, Header_Operant, IO_Port as IO_Port, Opcode, Opcodes_operant_lengths as Opcodes_operant_counts, Operant_Type, Register, register_count, URCL_Header, urcl_headers } from "./instructions.js";
import { enum_count, enum_from_str, enum_strings, is_digit, warn } from "./util.js";
function my_parse_int(x) {
    x = x.replace(/\_/g, "");
    if (x.startsWith("0b")) {
        return parseInt(x.slice(2), 2);
    }
    return parseInt(x);
}
export class Parser_output {
    errors = [];
    warnings = [];
    lines = [];
    headers = {};
    label_line_nrs = {};
    label_inst_i = {};
    instr_line_nrs = [];
    opcodes = [];
    operant_strings = [];
    operant_types = [];
    operant_values = [];
}
export function parse(source) {
    const out = new Parser_output();
    out.lines = source.split('\n').map(line => line.replace(/,/g, "").replace(/  /g, " ").replace(/\/\/.*/g, "").trim());
    //TODO: multiline comments
    for (let i = 0; i < enum_count(URCL_Header); i++) {
        out.headers[i] = { value: urcl_headers[i].def };
        out.headers[i].operant = urcl_headers[i].def_operant;
    }
    for (let line_nr = 0, inst_i = 0; line_nr < out.lines.length; line_nr++) {
        const line = out.lines[line_nr];
        if (line === "") {
            continue;
        }
        ;
        if (parse_header(line, line_nr, out.headers, out.warnings)) {
            continue;
        }
        if (parse_label(line, line_nr, inst_i, out, out.warnings)) {
            continue;
        }
        if (split_instruction(line, line_nr, inst_i, out, out.errors)) {
            inst_i++;
            continue;
        }
        out.errors.push(warn(line_nr, `Unknown identifier ${line.split(" ")[0]}`));
    }
    for (let inst_i = 0; inst_i < out.opcodes.length; inst_i++) {
        parse_instructions(out.instr_line_nrs[inst_i], inst_i, out, out.errors);
    }
    return out;
}
// return whether the line contains a header
function parse_header(line, line_nr, headers, errors) {
    const [header_str, opOrVal_str, val_str] = line.split(" ");
    if (header_str === undefined) {
        return false;
    }
    const header = URCL_Header[header_str.toUpperCase()];
    if (header === undefined) {
        return false;
    }
    const header_def = urcl_headers[header];
    if (header_def.def_operant !== undefined) {
        if (opOrVal_str === undefined) {
            errors.push(warn(line_nr, `Missing operant for header ${header_str}, must be ${enum_strings(Header_Operant)}`));
        }
        const operant = enum_from_str(Header_Operant, opOrVal_str || "");
        if (operant === undefined && opOrVal_str !== undefined) {
            errors.push(warn(line_nr, `Unknown operant ${opOrVal_str} for header ${header_str}, must be ${enum_strings(Header_Operant)}`));
        }
        const value = check_value(val_str);
        if (operant !== undefined && value !== undefined) {
            headers[header] = { line_nr, operant, value };
        }
    }
    else {
        let value = check_value(opOrVal_str);
        if (value !== undefined) {
            headers[header] = { line_nr, value };
        }
    }
    return true;
    function check_value(value) {
        if (value === undefined) {
            errors.push(warn(line_nr, `Missing value for header ${header_str}`));
            return undefined;
        }
        if (header_def.in) {
            const num = enum_from_str(header_def.in, value.toUpperCase());
            if (num === undefined) {
                errors.push(warn(line_nr, `Value ${value} for header ${header_str} most be one of: ${enum_strings(header_def.in)}`));
                return undefined;
            }
            return num;
        }
        else {
            const num = my_parse_int(value);
            if (!Number.isInteger(num)) {
                errors.push(warn(line_nr, `Value ${value} for header ${header_str} must be an integer`));
                return undefined;
            }
            return num;
        }
    }
}
// returns whether the line contains a label
function parse_label(line, line_nr, inst_i, out, warnings) {
    if (!line.startsWith(".")) {
        return false;
    }
    ;
    const label = str_until(str_until(line, " ").slice(0), "//");
    if (label === ".") {
        warnings.push(warn(line_nr, `Empty label`));
    }
    if (out.label_line_nrs[label] !== undefined) {
        warnings.push(warn(line_nr, `Duplicate label ${label}`));
    }
    out.label_line_nrs[label] = line_nr;
    out.label_inst_i[label] = inst_i;
    return true;
}
// returns the length of the instruction or 0 if there is an error
function split_instruction(line, line_nr, inst_i, out, errors) {
    const [opcode_str, ...ops] = line
        .replace(/' /g, "'\xA0").replace(/,/g, "").split(" ");
    const opcode = enum_from_str(Opcode, opcode_str.toUpperCase());
    if (opcode === undefined) {
        return false;
    }
    const operant_count = Opcodes_operant_counts[opcode];
    if (ops.length != operant_count) {
        errors.push(warn(line_nr, `Expected ${operant_count} operants but got [${ops}] for opcode ${opcode_str}`));
    }
    out.opcodes[inst_i] = opcode;
    out.operant_strings[inst_i] = ops;
    out.instr_line_nrs[inst_i] = line_nr;
    return true;
}
function parse_instructions(line_nr, inst_i, out, errors) {
    const types = out.operant_types[inst_i] = [];
    const values = out.operant_values[inst_i] = [];
    for (const operant of out.operant_strings[inst_i]) {
        const [type, value] = parse_operant(operant, line_nr, inst_i, out.label_inst_i, errors) ?? [];
        if (type !== undefined) {
            types.push(type);
            values.push(value);
        }
    }
    return 0;
}
function parse_operant(operant, line_nr, inst_i, labels, errors) {
    switch (operant) {
        case "R0":
        case "r0":
        case "$0": return [Operant_Type.Imm, 0];
        case "PC": return [Operant_Type.Reg, Register.PC];
        case "SP": return [Operant_Type.Reg, Register.SP];
    }
    switch (operant[0]) {
        case '.': {
            const value = labels[operant];
            if (value === undefined) {
                errors.push(warn(line_nr, `Undefined label ${operant}`));
                return undefined;
            }
            return [Operant_Type.Imm, value];
        }
        case '+':
        case '-': {
            const value = my_parse_int(operant);
            if (!Number.isInteger(value)) {
                errors.push(warn(line_nr, `Invalid relative address ${operant}`));
                return undefined;
            }
            return [Operant_Type.Label, value + inst_i];
        }
        case 'R':
        case 'r':
        case '$': {
            const value = my_parse_int(operant.slice(1));
            if (!Number.isInteger(value)) {
                errors.push(warn(line_nr, `Invalid register ${operant}`));
                return undefined;
            }
            return [Operant_Type.Reg, value + register_count - 1];
        }
        case 'M':
        case 'm':
        case '#': {
            const value = my_parse_int(operant.slice(1));
            if (!Number.isInteger(value)) {
                errors.push(warn(line_nr, `Invalid memory address ${operant}`));
                return undefined;
            }
            return [Operant_Type.Memory, value];
        }
        case '%': {
            let port;
            if (is_digit(operant, 1)) {
                port = my_parse_int(operant.slice(1));
                if (!Number.isInteger(port)) {
                    errors.push(warn(line_nr, `Invalid port number ${operant}`));
                    return undefined;
                }
            }
            else {
                port = enum_from_str(IO_Port, operant.slice(1).toUpperCase());
                if (port === undefined) {
                    errors.push(warn(line_nr, `Unkown port ${operant}`));
                    return undefined;
                }
            }
            return [Operant_Type.Imm, port];
        }
        case '\'':
        case '"': {
            let char_lit;
            try {
                char_lit = JSON.parse(operant.replace(/"/g, "\\\"").replace(/'/g, '"'));
            }
            catch (e) {
                errors.push(warn(line_nr, `Invalid character ${operant}\n  ${e}`));
                return undefined;
            }
            return [Operant_Type.Imm, char_lit.charCodeAt(0)];
        }
        case '@':
        case '&': {
            const constant = enum_from_str(Constants, operant.slice(1).toUpperCase());
            if (constant === undefined) {
                errors.push(warn(line_nr, `Unkown Compiler Constant ${operant}`));
                return undefined;
            }
            return [Operant_Type.Constant, constant];
        }
        default: {
            const value = my_parse_int(operant);
            if (!Number.isInteger(value)) {
                errors.push(warn(line_nr, `Invalid immediate ${operant}`));
                return undefined;
            }
            return [Operant_Type.Imm, value];
        }
    }
}
function str_until(string, sub_string) {
    const end = string.indexOf(sub_string);
    if (end < 0) {
        return string;
    }
    return string.slice(0, end);
}
//# sourceMappingURL=parser.js.map