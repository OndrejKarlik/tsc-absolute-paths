#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

// forward all arguments after node run-tsc.js ...
const args = process.argv.slice(2);

const tscBin = process.platform === "win32" ? "tsc.cmd" : "tsc";

const child = spawn(tscBin, args, { shell: true });

let stdout = "";
let stderr = "";
child.stdout.on("data", (data) => { stdout += data.toString(); });
child.stderr.on("data", (data) => { stderr += data.toString(); });

function fix(str )  {
    let result = "";
    const REGEX = /^(?<filename>[^/][^:]+)(?<rest>\(\d+,\d+\):.*)$/;

    for(const line of str.split(os.EOL)) {
        const match = line.match(REGEX);
        if (match) {
            result += `${path.join(process.cwd(), match.groups.filename)}${match.groups.rest})\n`;
        } else {
            result += `${line}\n`;
        }
    }
    return result;
}


child.on("exit", (code) => {
    console.log(fix(stdout));
    console.error(fix(stderr));
    process.exit(code);
});
