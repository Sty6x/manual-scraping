#! /usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
const events = new EventEmitter();
const argv = parseArgs(process.argv.splice(2));
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.getWorksheet("Email list") === undefined
    ? workbook.addWorksheet("Email list")
    : workbook.getWorksheet("Email list");
events.addListener("start", getFile);
events.emit("start", argv);
events.addListener("write", writeEmails);
async function getFile({ _, file, }) {
    const readImportFile = await fs.readFile(file, { encoding: "utf-8" });
    const dom = new JSDOM(readImportFile);
    const query = Array.from(dom.window.document.querySelectorAll("span"));
    const mapQuery = query.map((item) => item);
    events.emit("write", mapQuery);
}
async function writeEmails(emails) {
    try {
        worksheet.columns = [{ header: "", key: "emails" }];
        const filteredEmails = emails.filter((email) => email.title !== "");
        const emailCol = worksheet.getColumn(1);
        emailCol.width = 50;
        const newRows = filteredEmails.map((email) => ({
            emails: email.title,
        }));
        // if (worksheet.rowCount !== 0) {
        //   worksheet.eachRow((row, i) => {
        //     console.log(row.values);
        //   });
        //   return;
        // }
        newRows.forEach((row) => worksheet.addRow(row));
        await workbook.xlsx.writeFile("output.xlsx");
        console.log(newRows);
    }
    catch (err) {
        console.log("yikes");
        console.log(err);
    }
}
