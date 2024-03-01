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
  "Name",
  "Prefix",
  "Primary Position",
  "Primary Company",
  "Primary Company Type",
  "Country/Territory",
  "Email",
  "Phone",
  "Linkedin URL",
];
const STARTING_DATA_COUNTER = 1;

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
  // need to start from the prefix becuase the Name
  // property will be handled differently
  // data counter starts with 1 to skip the Name property

  const mapData = dataTable.forEach((item, i) => {
    const evaluateSpan =
      item.querySelector("span") !== null
        ? item.querySelector("span")?.lastChild?.textContent
        : "";

    // length 8
    if (dataCounter < COLUMNS.length - 1) {
      newData = {
        ...newData,
        [COLUMNS[dataCounter]]: evaluateSpan as string,
      };
      dataCounter++;
    } else {
      mappedDataArray.push({
        Name: nameTable[mappedDataArray.length].textContent,
        ...newData,
      });
      // next iteration is fucked apparently
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
    worksheet.columns = COLUMNS.map((column) => ({
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
