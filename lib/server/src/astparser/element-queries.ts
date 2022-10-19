import * as ts from "typescript";
import { initParser } from "./parser";

async function test() {

    // Boiler
    const fileNames = ["test-project/src/TestProject.ts"];

    const parser = initParser(fileNames);

    const sourceFile = parser.getSourceFile(fileNames[0]);

    const nodes: ts.Node[] = [];

    function visitAndAddNode(node: ts.Node) {
        nodes.push(node);
        node.forEachChild(visitAndAddNode);
    }

    sourceFile?.forEachChild(visitAndAddNode);


    console.log("Nodes:");
    nodes.forEach(node => console.log(node.kind + "\n"))
    // TODO: Map nodes on file to a position range -> node map so we can find nodes by their position

    const parseOutput = "";

    console.log("Parser output: ", parseOutput);
}

test();

