import ts from "typescript";
import { Location, Position, Range, TextDocumentPositionParams } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments } from "vscode-languageserver/node.js";
import { scanDocument } from "./text-documents.js";

export interface UsableTextDocumentData {
    fileName: string;
    position: number;
    fileContent: string;
}

export function uriToFileName(uri: string) {
    // TODO: Other cases handled?
    const fileName = uri.replace("file://", "");
    return fileName;
}

export function fileNameToUri(fileName: string) {
    return "file://" + fileName;
}

export function textDocumentDataToUsableData(documents: TextDocuments<TextDocument>, textDocumentData: TextDocumentPositionParams): UsableTextDocumentData {
    const fileName = uriToFileName(textDocumentData.textDocument.uri);
    const doc = documents.get(textDocumentData.textDocument.uri);

    return {
        fileName,
        position: doc?.offsetAt(textDocumentData.position) ?? 0,
        fileContent: doc?.getText() ?? ''
    }
}

export function offsetToPosition(documents: TextDocuments<TextDocument>, uri: string, offset: number): Position {
    return documents.get(uri)?.positionAt(offset) ?? Position.create(0, 0);
}

export function positionToOffset(documents: TextDocuments<TextDocument>, uri: string, position: Position): number {
    return documents.get(uri)?.offsetAt(position) ?? 0;
}

export function definitionInfoToDefinition(definition: ts.DefinitionInfo, documents: TextDocuments<TextDocument>): Location {
    const uri = fileNameToUri(definition.fileName);
    const textDocument = scanDocument(definition.fileName);

    // TODO .Continue
    debugger;

    return {
        uri,
        range: Range.create(Position.create(2, 13), Position.create(2, 19))
    }
}
