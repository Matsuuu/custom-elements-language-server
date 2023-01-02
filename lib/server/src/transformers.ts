import ts from "typescript";
import { Hover, Location, Position, Range, TextDocumentPositionParams } from "vscode-languageserver";
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
        fileContent: doc?.getText() ?? "",
    };
}

export function offsetToPosition(document: TextDocument, offset: number): Position {
    return document.positionAt(offset) ?? Position.create(0, 0);
}

export function positionToOffset(document: TextDocument, position: Position): number {
    return document.offsetAt(position) ?? 0;
}

export function documentSpanToLocation(documentSpan: ts.DocumentSpan): Location {
    const uri = fileNameToUri(documentSpan.fileName);
    const textDocument = scanDocument(documentSpan.fileName);

    const contextSpan = documentSpan.contextSpan;
    if (contextSpan === undefined) {
        return { uri, range: ZERO_RANGE };
    }

    const endOffset = contextSpan.start + contextSpan.length;

    const startPosition = offsetToPosition(textDocument, contextSpan.start);
    const endPosition = offsetToPosition(textDocument, endOffset);

    return {
        uri,
        range: Range.create(startPosition, endPosition),
    };
}

export function quickInfoToHover(quickInfo: ts.QuickInfo | undefined): Hover | undefined {
    if (!quickInfo) return undefined;

    return {
        contents: quickInfo.documentation?.map(doc => doc.text) ?? [],
        range: ZERO_RANGE
    }
}

const ZERO_RANGE = Range.create(Position.create(0, 0), Position.create(0, 0));
