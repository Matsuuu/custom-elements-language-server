import { TextDocumentPositionParams } from "vscode-languageserver";
import { UsableTextDocumentData } from "../transformers";
import { getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { documents } from "../text-documents";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import ts from "typescript/lib/tsserverlibrary";

export interface QueryData {
    fileName: string;
    basePath: string;
    project: ts.server.Project | undefined;
    doc: TextDocument | undefined;
    position: Position;
    isValid: boolean;
}

export function generateLanguageServiceQueryData(usableData: UsableTextDocumentData, textDocumentParams: TextDocumentPositionParams): QueryData {
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
