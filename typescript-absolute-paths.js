#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

function fix(str) {
    str = str.trim(); // Remove trailing newline(s)
    if (str.length === 0) {
        return "";
    }
    let result = "";
    const REGEX = /^(?<filename>[^\/][^:]+)(?<rest>\(\d+,\d+\):.*)$/;

    for (const line of str.split("\n")) {
        if (line.length > 0 && line[line.length - 1] === '\r') { // Windows newlines can be passed here, normalize them...
            line = line.slice(0, -1);
        }
        // console.log("BEFORE: " + line, [...line].map(char => char.charCodeAt(0)));

        const match = line.match(REGEX);
        if (match) {
            result += `${path.join(process.cwd(), match.groups.filename)}${match.groups.rest}\n`;
        } else {
            result += `${line}\n`;
        }
    }
    result = result.slice(0, -1); // Remove last \n
    // console.log("AFTER: {" + result + "}");
    return result;
}

exports.run = function run(tscBin) {
    // forward all arguments after node run-tsc.js ...
    const args = process.argv.slice(2);

    if (process.platform === "win32") {
        tscBin = tscBin + ".cmd";
    }

    // There is a nodejs warning when using args with shell:true. 
    // There is no way to disable the warning, so we must concatenate the arguments ourselves.
    // The argument joining seems to be too simplified, it is however taken directly from nodejs:
    // https://github.com/nodejs/node/blob/1da054d99bb16d35c54d759f36ccc125b90070bd/lib/child_process.js#L652
    const child = spawn(`${tscBin} ${args.join(" ")}`, { shell: true });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("exit", (code) => {
        stdout = fix(stdout);
        if (stdout.length > 0) { // Only print when non-empty, to avoid an extra newline
            console.log(stdout);
        }
        stderr = fix(stderr);
        if (stderr.length > 0) { // Dtto
            console.error(stderr);
        }
        process.exit(code);
    });
}
