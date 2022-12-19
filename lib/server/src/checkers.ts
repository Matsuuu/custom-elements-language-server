import { ClientCapabilities } from "vscode-languageserver";

export interface OffsetRange {
    start: number;
    end: number;
}

export function checkIfHasConfigurationCapability(capabilities: ClientCapabilities) {
    return !!(capabilities.workspace && !!capabilities.workspace.configuration);
}

export function checkIfHasWorkspaceFolderCapability(capabilities: ClientCapabilities) {
    return !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
}

export function checkIfHasDiagnosticRelatedInformationCapability(capabilities: ClientCapabilities) {
    return !!(capabilities.textDocument && capabilities.textDocument.publishDiagnostics && capabilities.textDocument.publishDiagnostics.relatedInformation);
}
