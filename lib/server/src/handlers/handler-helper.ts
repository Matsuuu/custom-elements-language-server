import { TextDocumentPositionParams } from "vscode-languageserver";
import { UsableTextDocumentData } from "../transformers";
import { getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { documents } from "../text-documents";

export function generateLanguageServiceQueryData(usableData: UsableTextDocumentData, textDocumentParams: TextDocumentPositionParams) {
    const fileName = usableData.fileName;
    const basePath = getProjectBasePath(usableData.fileName);
    const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
    const doc = documents.get(textDocumentParams.textDocument.uri);
    const position = textDocumentParams.position;

    return {
        fileName,
        basePath,
        project,
        doc,
        position,
        isValid: doc !== undefined && project !== undefined
    };
}
