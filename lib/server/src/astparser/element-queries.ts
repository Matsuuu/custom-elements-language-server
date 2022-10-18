import * as ts from "typescript";

async function test() {

    // Boiler
    const fileNames = ["test-project/src/TestProject.ts"];
    const options: ts.CompilerOptions = {};

    const createdFiles: Record<string, string> = {}
    const host = ts.createCompilerHost(options);
    host.writeFile = (fileName: string, contents: string) => createdFiles[fileName] = contents

    const program = ts.createProgram(fileNames, options);

    const sourceFile = program.getSourceFile(fileNames[0]);

    const nodes: ts.Node[] = [];

    function visitAndAddNode(node: ts.Node) {
        nodes.push(node);
        node.forEachChild(visitAndAddNode);
    }

    sourceFile?.forEachChild(visitAndAddNode);


    console.log("Nodes:");
    nodes.forEach(node => console.log(node.kind + "\n"))

    const parseOutput = "";

    console.log("Parser output: ", parseOutput);
}

test();

