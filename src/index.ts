#!/usr/bin/env node
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import parseArgs from "minimist";
import EventEmitter from "events";
import ExcelJS from "exceljs";
import removeChar from "./utils/removeChar.js";
import logResults from "./utils/logResults.js";
import { t_person } from "./utils/types/t_person.js";
import { exec } from "child_process";

const events = new EventEmitter();
const argv = parseArgs(process.argv.slice(2));

const workbook = new ExcelJS.Workbook();
const worksheet =
  workbook.getWorksheet("Person List") === undefined
    ? workbook.addWorksheet("Person list")
    : workbook.getWorksheet("Person list");

events.addListener("start", getFile);
events.emit("start", argv);
events.addListener("write", writeEmails);

const COLUMNS = [
  "First Name",
  "Last Name",
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
  n,
}: {
  _: Array<string | "">;
  f: string;
  v?: string;
  i?: string;
  n: number;
}): Promise<void> {
  const readImportFile = await fs.readFile(f, {
    encoding: "utf-8",
  });
  const dom = new JSDOM(readImportFile);
  const queryDataTableContainer = dom.window.document.getElementsByClassName(
    "native-scroll__container_resizable",
  )[0];

  const dataTable: Array<HTMLSpanElement> = Array.from(
    queryDataTableContainer.querySelectorAll(".cell-editable__content"),
  );
  let dataCounter = STARTING_DATA_COUNTER;

  dataTable.forEach((item) => {
    const evaluateSpan =
      item.querySelector("span") !== null
        ? item.querySelector("span")?.lastChild?.textContent
        : "";

    newData = {
      ...newData,
      [dataCounter]: evaluateSpan as string,
    };
    dataCounter++;
    if (dataCounter >= n) {
      mappedDataArray.push({
        ...newData,
        Industries: i !== undefined ? removeChar(i) : "",
        Verticals: v !== undefined ? removeChar(v) : "",
      } as t_person);
      dataCounter = STARTING_DATA_COUNTER;
      newData = {};
    }
  });

  events.emit(
    "write",
    mappedDataArray.filter((item) => item.Email !== "" && item),
    n,
  );
}

async function writeEmails(
  personData: Array<t_person>,
  numberOfColumns: number,
) {
  try {
    let columnsArr: Array<string> = [];
    for (let i = 0; i < numberOfColumns; i++) {
      columnsArr.push(i.toString());
    }
    worksheet.columns = [
      ...(columnsArr as Array<string>),
      "Industries",
      "Verticals",
    ].map((column) => ({
      header: "",
      key: column,
      width: 20,
    }));

    // 2^2
    personData.forEach((row) =>
      worksheet.addRow({
        ...row,
      }),
    );
    await workbook.xlsx.writeFile("output.xlsx");
    logResults("Passed", {
      arr: [...personData],
      sampleSchema: personData[0],
    });

    exec(
      "xdg-open /home/francis-lp/repos/manual-scraping/output.xlsx",
      (err) => {
        if (err) {
          console.log(`Error ${err}`);
          return;
        }
        console.log("Application running");
      },
    );
  } catch (err) {
    logResults("Fail");
    console.log(err);
  }
}
