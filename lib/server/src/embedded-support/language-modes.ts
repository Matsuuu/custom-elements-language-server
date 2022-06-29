import {
    CompletionList,
    Diagnostic,
    getLanguageService as getHTMLLanguageService,
    Position,
    Range,
} from 'vscode-html-languageservice';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getDocumentRegions, HTMLDocumentRegions } from './embedded-tools.js';
import { getHTMLMode } from './modes/html-mode.js';
import { getLanguageModelCache, LanguageModelCache } from './language-mode-cache.js';

export interface LanguageMode {
    getId(): string;
    doValidation?: (document: TextDocument) => Diagnostic[];
    doComplete?: (document: TextDocument, position: Position) => CompletionList;
    onDocumentRemoved(document: TextDocument): void;
    dispose(): void;
}

export interface LanguageModes {
    getModeAtPosition(document: TextDocument, position: Position): LanguageMode | undefined;
    getModesInRange(document: TextDocument, range: Range): LanguageModeRange[];
    getAllModes(): LanguageMode[];
    getAllModesInDocument(document: TextDocument): LanguageMode[];
    getMode(languageId: string): LanguageMode | undefined;
    onDocumentRemoved(document: TextDocument): void;
    dispose(): void;
}

export interface LanguageModeRange extends Range {
    mode: LanguageMode | undefined;
    attributeValue?: boolean;
}

export let languageModes: LanguageModes;

export function initLanguageModes(langModes: LanguageModes) {
    languageModes = langModes;
}

export function getLanguageModes(): LanguageModes {
    const htmlLanguageService = getHTMLLanguageService();

    const documentRegions = getLanguageModelCache<HTMLDocumentRegions>(10, 60, document =>
        getDocumentRegions(htmlLanguageService, document)
    );

    let modelCaches: LanguageModelCache<any>[] = [];
    modelCaches.push(documentRegions);

    let modes = Object.create(null);
    modes['html'] = getHTMLMode(htmlLanguageService);

    return {
        getModeAtPosition(
            document: TextDocument,
            position: Position
        ): LanguageMode | undefined {
            const languageId = documentRegions.get(document).getLanguageAtPosition(position);
            if (languageId) {
                return modes[languageId];
            }
            return undefined;
        },
        getModesInRange(document: TextDocument, range: Range): LanguageModeRange[] {
            return documentRegions
                .get(document)
                .getLanguageRanges(range)
                .map(r => {
                    return <LanguageModeRange>{
                        start: r.start,
                        end: r.end,
                        mode: r.languageId && modes[r.languageId],
                        attributeValue: r.attributeValue
                    };
                });
        },
        getAllModesInDocument(document: TextDocument): LanguageMode[] {
            const result = [];
            for (const languageId of documentRegions.get(document).getLanguagesInDocument()) {
                const mode = modes[languageId];
                if (mode) {
                    result.push(mode);
                }
            }
            return result;
        },
        getAllModes(): LanguageMode[] {
            const result = [];
            for (const languageId in modes) {
                const mode = modes[languageId];
                if (mode) {
                    result.push(mode);
                }
            }
            return result;
        },
        getMode(languageId: string): LanguageMode {
            return modes[languageId];
        },
        onDocumentRemoved(document: TextDocument) {
            modelCaches.forEach(mc => mc.onDocumentRemoved(document));
            for (const mode in modes) {
                modes[mode].onDocumentRemoved(document);
            }
        },
        dispose(): void {
            modelCaches.forEach(mc => mc.dispose());
            modelCaches = [];
            for (const mode in modes) {
                modes[mode].dispose();
            }
            modes = {};
        }
    };
}
