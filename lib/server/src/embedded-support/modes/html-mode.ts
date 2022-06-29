
import {
    LanguageService as HTMLLanguageService,
    Position,
} from 'vscode-html-languageservice';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageMode } from '../language-modes';

export function getHTMLMode(htmlLanguageService: HTMLLanguageService): LanguageMode {
    return {
        getId() {
            return 'html';
        },
        doComplete(document: TextDocument, position: Position) {
            // TODO: Add custom elements to completions
            return htmlLanguageService.doComplete(
                document,
                position,
                htmlLanguageService.parseHTMLDocument(document)
            );
        },
        onDocumentRemoved(_document: TextDocument) { /* nothing to do */ },
        dispose() { /* nothing to do */ }
    };
}
