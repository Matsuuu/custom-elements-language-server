import { ClientCapabilities } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

const CUSTOM_ELEMENT_STARTER_TAG_REGEX = /<[^\/]*\w*-\w*[^>]*>/g;
const CREATING_HTML_TAG_REGEX = /<(?<tagName>[A-Za-z]+(-[A-Za-z]+){0,})/g;

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

export function cursorIsCreatingHtmlTag(wordUnderCursor: string) {
    return wordUnderCursor.match(new RegExp(CREATING_HTML_TAG_REGEX));
}

export function cursorIsCreatingAttribute(textDocument: TextDocument, offset: number) {

    return false;
}

export function cursorIsInsideHtmlTag(textDocument: TextDocument, offset: number) {
    // TODO: We need to really plug in tree sitter. Parsing HTML with regex isn't going to work
    const fullText = textDocument.getText();
    let currentOffset = offset;
    let foundHtmlTag = undefined;
    while (currentOffset > 0) {
        currentOffset -= 1;
        const capturedText = fullText.substring(currentOffset, offset);
        const matches = Array.from(capturedText.matchAll(CREATING_HTML_TAG_REGEX));
        if (matches.length > 0) {
            foundHtmlTag = matches[0].groups?.tagName;
            break;
        }
    }
    return true;
}
