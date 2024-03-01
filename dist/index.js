#! /usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
const events = new EventEmitter();
const argv = parseArgs(process.argv.slice(2));
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.getWorksheet("Email list") === undefined
    ? workbook.addWorksheet("Email list")
    : workbook.getWorksheet("Email list");
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
async function getFile({ _, v, i, }) {
    console.log(v);
    const f = "src/sampledataNames.txt";
    const readImportFile = await fs.readFile(f, { encoding: "utf-8" });
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
                Industries: i === undefined ? "" : parseSpacedArguments(i),
                Verticals: parseSpacedArguments(v),
            });
            dataCounter = STARTING_DATA_COUNTER;
            newData = {};
        }
    });
    console.log(mappedDataArray[0]);
    console.log(mappedDataArray[1]);
    events.emit("write", mappedDataArray);
}
function parseSpacedArguments(argument) {
    let tmpHolder = "";
    for (let i = 0; i < argument.length; i++) {
        if (argument[i] !== "-") {
            tmpHolder += argument[i];
        }
        else {
            tmpHolder += " ";
        }
    }
    console.log(tmpHolder);
    return tmpHolder;
}
async function writeEmails(personDatas) {
    try {
        worksheet.columns = ["Name", ...COLUMNS, "Industries", "Verticals"].map((column) => ({
            header: "",
            key: column,
            width: 50,
        }));
        personDatas.forEach((row) => worksheet.addRow(row));
        await workbook.xlsx.writeFile("output.xlsx");
    }
    catch (err) {
        console.log("yikes");
        console.log(err);
    }
}
