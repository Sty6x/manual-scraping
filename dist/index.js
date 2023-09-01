#! /usr/bin/env node
import fs from "fs/promises";
import parseArgs from "minimist";
import EventEmitter from "events";
const events = new EventEmitter();
const argv = parseArgs(process.argv.splice(2));
console.log(argv);
events.addListener("start", getFile);
async function getFile({ _, file, }) {
    const readImportFile = await fs.readFile(file, { encoding: "utf-8" });
    console.log(readImportFile);
}
events.emit("start", argv);
