import { TextDocument } from "vscode-languageserver-textdocument";
import { Position, Range } from "vscode-languageserver/node.js";

export function getWordUnderCursor(doc: TextDocument, position: Position) {
    const lineText = getLineText(doc, doc.offsetAt(position));
    const cursorPosition = position.character;

    let start = cursorPosition;
    let end = cursorPosition;

    while (start > 0 && lineText[start - 1] !== " ") {
        start -= 1;
    }
    while (end < lineText.length && lineText[end + 1] !== " ") {
        end += 1;
    }

    return lineText.substring(start, end);
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
