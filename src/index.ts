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
  const f = "src/sampledata.txt";
  const readImportFile = await fs.readFile(f, { encoding: "utf-8" });
  const dom = new JSDOM(readImportFile);
  const queryDataContainer = dom.window.document.getElementsByClassName(
    "native-scroll__container_resizable"
  )[0];

  const data: Array<HTMLSpanElement> = Array.from(
    queryDataContainer.querySelectorAll(".cell-editable__content")
  );
  let dataCounter = 0;
  const mapData = data.forEach((item, i) => {
    const evaluateSpan =
      item.querySelector("span") !== null
        ? item.querySelector("span")?.lastChild?.textContent
        : "";

    if (dataCounter < COLUMNS.length - 1) {
      newData = {
        ...newData,
        [COLUMNS[dataCounter]]: evaluateSpan as string,
      };
      dataCounter++;
    } else {
      mappedDataArray.push({ ...newData });
      // next iteration is fucked apparently
      dataCounter = 0;
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
