import { ClientCapabilities, Position, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

const CUSTOM_ELEMENT_STARTER_TAG_REGEX = /<[^\/]*\w*-\w*[^>]*>/g;

export interface OffsetRange {
    start: number;
    end: number;
}

export function checkIfHasConfigurationCapability(capabilities: ClientCapabilities) {
    return !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );

}

export function checkIfHasWorkspaceFolderCapability(capabilities: ClientCapabilities) {
    return !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
}

export function checkIfHasDiagnosticRelatedInformationCapability(capabilities: ClientCapabilities) {
    return !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );
}

export function getLineLength(textDocument: TextDocument, line: number) {
    const start = Position.create(line, 0);
    const nextLineStart = Position.create(line + 1, 0);

    const startOffset = textDocument.offsetAt(start);
    const nextLineStartOffset = textDocument.offsetAt(nextLineStart);

    return nextLineStartOffset - startOffset - 1;
}

export function getLineText(textDocument: TextDocument, offset: number) {
    const pos = textDocument.positionAt(offset);
    const line = pos.line;
    const start = Position.create(line, 0);
    const lineLength = getLineLength(textDocument, pos.line);

    const end = Position.create(line, lineLength);

    return textDocument.getText(Range.create(start, end));
}

export function getLineTextByLine(textDocument: TextDocument, lineNum: number) {
    const start = Position.create(lineNum, 0);
    const lineLength = getLineLength(textDocument, lineNum);
    const end = Position.create(lineNum, lineLength);
    return textDocument.getText(Range.create(start, end));
}

export function getAllLinesAsText(textDocument: TextDocument) {
    const lines = textDocument.lineCount;
    const lineArray = [];
    let lineCount = 0;
    while (lineCount < lines) {
        lineArray.push(getLineTextByLine(textDocument, lineCount));
        lineCount++;
    }
    return lineArray;
}

export function findCustomElementsInFile(textDocument: TextDocument) {
    const text = textDocument.getText();
    const matcher = new RegExp(CUSTOM_ELEMENT_STARTER_TAG_REGEX);
    const matches = Array.from(text.matchAll(matcher));

    return matches.map(matchToFoundElement)
}

function matchToFoundElement(match: RegExpMatchArray) {
    const tag = match[0];
    const index = match.index ?? 0;
    return {
        matchedTag: tag,
        matchIndex: index,
        matchRange: getMatchRange(tag, index)
    }
}

function getMatchRange(matchedTag: string, matchIndex: number): OffsetRange {
    return {
        start: matchIndex,
        end: matchIndex + matchedTag.length
    }
}

export function cursorIsInsideCustomElementTag(textDocument: TextDocument, offset: number) {

    const elems = findCustomElementsInFile(textDocument);
    //console.log("FOUND ELEMS ", elems);
    // TODO: Figure out if we are inside an element, and in the area in which attributes etc. can be filled into

    return true;
}
