import * as ts from "typescript";
import { initParser } from "./parser";

async function test() {

    // Boiler
    const fileNames = ["test-project/src/test.ts"];

    const parser = initParser(fileNames);
    parser.parseNodes(fileNames[0])

    const parseOutput = "";

    console.log("Parser output: ", parseOutput);
}

test();

