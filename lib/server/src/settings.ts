import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments } from "vscode-languageserver/node.js";

const DEFAULT_CAPABILITIES: LanguageServerCapabilities = {
    hasConfigurationCapability: false,
    hasWorkspaceFolderCapability: false,
    hasDiagnosticRelatedInformationCapability: false
}

export const documentSettings = new Map<string, LanguageServerSettings>();
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let capabilities: LanguageServerCapabilities = DEFAULT_CAPABILITIES;

export function setCapabilities(capabilitiesBuilder: CapabilitiesBuilder): LanguageServerCapabilities {
    capabilities = {
        ...capabilities,
        ...capabilitiesBuilder
    };

    return capabilities;
}


export function getCapabilities() {
    return capabilities;
}

export const DEFAULT_SETTINGS: LanguageServerSettings = {};
let globalSettings: LanguageServerSettings = DEFAULT_SETTINGS;

export function setGlobalSettings(settings: LanguageServerSettings) {
    globalSettings = settings;
}

export function getGlobalSettings() {
    return globalSettings;
}


export interface LanguageServerSettings { }

export interface CapabilitiesBuilder {
    hasConfigurationCapability?: boolean;
    hasWorkspaceFolderCapability?: boolean;
    hasDiagnosticRelatedInformationCapability?: boolean;
}

export interface LanguageServerCapabilities {
    hasConfigurationCapability: boolean;
    hasWorkspaceFolderCapability: boolean;
    hasDiagnosticRelatedInformationCapability: boolean;
}

