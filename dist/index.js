#! /usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
const events = new EventEmitter();
const argv = parseArgs(process.argv.splice(2));
events.addListener("start", getFile);
events.addListener("write", writeEmails);
async function getFile({ _, file, }) {
    const readImportFile = await fs.readFile(file, { encoding: "utf-8" });
    const dom = new JSDOM(readImportFile);
    const query = Array.from(dom.window.document.querySelectorAll("span"));
    const mapQuery = query.map((item) => item);
    events.emit("write", mapQuery);
}
async function writeEmails(emails) {
    const extractEmails = emails.map((email) => `\n${email.title}`);
    try {
        const write = await fs.writeFile("output.txt", extractEmails);
        console.log("success");
        console.log(write);
    }
    catch (err) {
        console.log("yikes");
        console.log(err);
    }
}
events.emit("start", argv);
