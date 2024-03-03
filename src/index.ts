#! /usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
import removeChar from "./utils/removeChar.js";
import logResults from "./utils/logResults.js";
import { t_person } from "./utils/types/t_person.js";
const events = new EventEmitter();
const argv = parseArgs(process.argv.slice(2));
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

let mappedDataArray: Array<t_person> = [];

let newData: { [key: string]: string } = {};

async function getFile({
  _,
  f,
  v,
  i,
}: {
  _: Array<string | "">;
  f?: string;
  v: string;
  i: string;
}): Promise<void> {
  const fe = "src/sampledataNames.txt";
  const readImportFile = await fs.readFile(f !== undefined ? f : fe, {
    encoding: "utf-8",
  });
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

  const mapData = dataTable.forEach((item) => {
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
        Industries: removeChar(i),
        Verticals: removeChar(v),
      } as t_person);
      dataCounter = STARTING_DATA_COUNTER;
      newData = {};
    }
  });

  events.emit("write", mappedDataArray);
}

async function writeEmails(personData: Array<t_person>) {
  try {
    worksheet.columns = ["Name", ...COLUMNS, "Industries", "Verticals"].map(
      (column) => ({
        header: "",
        key: column,
        width: 20,
      })
    );
    personData.forEach((row) => worksheet.addRow(row));
    await workbook.xlsx.writeFile("output.xlsx");
    logResults("Passed", {
      arr: [...personData],
      sampleSchema: mappedDataArray[0],
    });
  } catch (err) {
    logResults("Fail");
    console.log(err);
  }
}
