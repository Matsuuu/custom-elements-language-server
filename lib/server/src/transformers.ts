import { CODE_ACTIONS } from "custom-elements-languageserver-core";
import ts from "typescript";
import url from "url";
import { Hover, Location, Position, Range, TextDocumentPositionParams, Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments } from "vscode-languageserver";
import { scanDocument } from "./text-documents.js";

export interface UsableTextDocumentData {
    fileName: string;
    position: number;
    fileContent: string;
}

export function fileNameToUri(fileName: string) {
    // TODO: Check if we could change this to this
    url.pathToFileURL(fileName);
    //
    return "file://" + fileName;
}

export function textDocumentDataToUsableDataFromUri(documents: TextDocuments<TextDocument>, uri: string): UsableTextDocumentData {

    const fileName = url.fileURLToPath(uri);
    const doc = documents.get(uri);

    return {
        fileName,
        position: 0,
        fileContent: doc?.getText() ?? "",
    };
}

export function textDocumentDataToUsableData(documents: TextDocuments<TextDocument>, textDocumentData: TextDocumentPositionParams): UsableTextDocumentData {
    const fileName = url.fileURLToPath(textDocumentData.textDocument.uri);
    const doc = documents.get(textDocumentData.textDocument.uri);

    return {
        fileName,
        position: doc?.offsetAt(textDocumentData.position) ?? 0,
        fileContent: doc?.getText() ?? "",
    };
}

export function textSpanToRange(textDocument: TextDocument, textSpan: ts.TextSpan): Range {
    const endOffset = textSpan.start + textSpan.length;

    const startPosition = offsetToPosition(textDocument, textSpan.start);
    const endPosition = offsetToPosition(textDocument, endOffset);

    return Range.create(startPosition, endPosition)
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

    let contextSpan = documentSpan.contextSpan;
    if (contextSpan === undefined) {
        contextSpan = documentSpan.textSpan;
    }

    if (contextSpan == undefined) {
        return { uri, range: ZERO_RANGE };
    }

    const range = textSpanToRange(textDocument, contextSpan);

    return {
        uri,
        range
    };
}

export function quickInfoToHover(fileName: string, quickInfo: ts.QuickInfo | undefined): Hover | undefined {
    if (!quickInfo) return undefined;

    const textDocument = scanDocument(fileName);
    const range = textSpanToRange(textDocument, quickInfo.textSpan);

    return {
        contents: quickInfo.documentation?.map(doc => doc.text) ?? [],
        range
    }
}

export function tsDiagnosticToDiagnostic(diagnostic: ts.Diagnostic, textDoc: TextDocument): Diagnostic | undefined {
    const start = diagnostic.start ?? 0;
    const end = start + (diagnostic.length ?? 0);
    if (!textDoc) {
        return undefined;
    }
    if (!Object.values(CODE_ACTIONS).includes(diagnostic.code)) {
        return undefined;
    }

    return {
        message: diagnostic.messageText.toString(),
        range: Range.create(offsetToPosition(textDoc, start), offsetToPosition(textDoc, end)),
        code: diagnostic.code,
        severity: diagnosticCategoryToSeverity(diagnostic.category),
        source: "Custom Elements Language Server",
        data: diagnostic.relatedInformation
    }
}

function diagnosticCategoryToSeverity(category: ts.DiagnosticCategory) {
    switch (category) {
        case ts.DiagnosticCategory.Warning:
            return DiagnosticSeverity.Warning;
        case ts.DiagnosticCategory.Error:
            return DiagnosticSeverity.Error;
        case ts.DiagnosticCategory.Suggestion:// TODO: Check if suggestion should be information and vice versa
            return DiagnosticSeverity.Hint;
        case ts.DiagnosticCategory.Message:
            return DiagnosticSeverity.Information;
    }

}

const ZERO_RANGE = Range.create(Position.create(0, 0), Position.create(0, 0));
