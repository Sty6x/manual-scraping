#!/usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
import removeChar from "./utils/removeChar.js";
import logResults from "./utils/logResults.js";
const events = new EventEmitter();
const argv = parseArgs(process.argv.slice(2));
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.getWorksheet("Person List") === undefined
    ? workbook.addWorksheet("Person list")
    : workbook.getWorksheet("Person list");
events.addListener("start", getFile);
events.emit("start", argv);
events.addListener("write", writeEmails);
const COLUMNS = [
    "Prefix",
    "Primary Position",
    "Primary Company",
    "Primary Company Type",
    "Country/Territory",
    "Email",
    "Phone",
    "Linkedin URL",
];
const STARTING_DATA_COUNTER = 0;
let mappedDataArray = [];
let newData = {};
async function getFile({ _, f, v, i, }) {
    const readImportFile = await fs.readFile(f, {
        encoding: "utf-8",
    });
    const dom = new JSDOM(readImportFile);
    const queryDataTableContainer = dom.window.document.getElementsByClassName("native-scroll__container_resizable")[0];
    const queryNameTableContainer = dom.window.document.querySelector("#search-results-data-table-fixed-table > .data-table__tbody");
    const nameTable = Array.from(queryNameTableContainer.querySelectorAll("span.entity-format__entity-profile > a"));
    const dataTable = Array.from(queryDataTableContainer.querySelectorAll(".cell-editable__content"));
    let dataCounter = STARTING_DATA_COUNTER;
    const mapData = dataTable.forEach((item) => {
        // length 8
        const evaluateSpan = item.querySelector("span") !== null
            ? item.querySelector("span")?.lastChild?.textContent
            : "";
        newData = {
            ...newData,
            [COLUMNS[dataCounter]]: evaluateSpan,
        };
        dataCounter++;
        if (dataCounter >= 8) {
            mappedDataArray.push({
                Name: nameTable[mappedDataArray.length].textContent,
                ...newData,
                Industries: removeChar(i),
                Verticals: removeChar(v),
            });
            dataCounter = STARTING_DATA_COUNTER;
            newData = {};
        }
    });
    events.emit("write", mappedDataArray);
}
async function writeEmails(personData) {
    try {
        worksheet.columns = ["Name", ...COLUMNS, "Industries", "Verticals"].map((column) => ({
            header: "",
            key: column,
            width: 20,
        }));
        personData.forEach((row) => worksheet.addRow(row));
        await workbook.xlsx.writeFile("output.xlsx");
        logResults("Passed", {
            arr: [...personData],
            sampleSchema: mappedDataArray[0],
        });
    }
    catch (err) {
        logResults("Fail");
        console.log(err);
    }
}
