#! /usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
const events = new EventEmitter();
const argv = parseArgs(process.argv.splice(2));
const workbook = new ExcelJS.Workbook();
const worksheet =
  workbook.getWorksheet("Email list") === undefined
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

let mappedDataArray: Array<any> = [];

let newData: { [key: string]: string } = {};

async function getFile({
  _,
  file,
}: {
  _: Array<string | "">;
  file: string;
}): Promise<void> {
  console.log(file);
  const f = "src/sampledataNames.txt";
  const readImportFile = await fs.readFile(f, { encoding: "utf-8" });
  const dom = new JSDOM(readImportFile);
  const queryDataTableContainer = dom.window.document.getElementsByClassName(
    "native-scroll__container_resizable"
  )[0];

  const queryNameTableContainer: HTMLDivElement =
    dom.window.document.querySelector(
      "#search-results-data-table-fixed-table > .data-table__tbody"
    ) as HTMLDivElement;

  const nameTable: Array<HTMLAnchorElement> = Array.from(
    queryNameTableContainer.querySelectorAll(
      "span.entity-format__entity-profile > a"
    )
  );

  const dataTable: Array<HTMLSpanElement> = Array.from(
    queryDataTableContainer.querySelectorAll(".cell-editable__content")
  );
  let dataCounter = STARTING_DATA_COUNTER;

  const mapData = dataTable.forEach((item, i) => {
    // length 8
    const evaluateSpan =
      item.querySelector("span") !== null
        ? item.querySelector("span")?.lastChild?.textContent
        : "";

    newData = {
      ...newData,
      [COLUMNS[dataCounter]]: evaluateSpan as string,
    };
    dataCounter++;
    if (dataCounter >= 8) {
      mappedDataArray.push({
        Name: nameTable[mappedDataArray.length].textContent,
        ...newData,
      });
      dataCounter = STARTING_DATA_COUNTER;
      newData = {};
    }
  });

  console.log(mappedDataArray[0]);
  console.log(mappedDataArray[1]);

  events.emit("write", mappedDataArray);
}

async function writeEmails(
  personDatas: Array<{
    [key: string]: string;
  }>
) {
  try {
    worksheet.columns = ["Name", ...COLUMNS].map((column) => ({
      header: column,
      key: column,
      width: 50,
    }));
    personDatas.forEach((row) => worksheet.addRow(row));
    await workbook.xlsx.writeFile("output.xlsx");
  } catch (err) {
    console.log("yikes");
    console.log(err);
  }
}
