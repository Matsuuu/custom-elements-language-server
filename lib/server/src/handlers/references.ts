import { findIdentifiers, findTagNameForClass, findTemplateExpressions, getCEMData } from "custom-elements-languageserver-core";
import tss from "typescript/lib/tsserverlibrary.js";
import { ReferenceParams, Location, Range } from "vscode-languageserver";
import { getProjectForCurrentFile } from "../language-services/language-services.js";
import { documents, scanDocument } from "../text-documents.js";
import { offsetToPosition, positionToOffset, textDocumentDataToUsableData } from "../transformers.js";
import url from "url";

export function referenceHandler(referenceParams: ReferenceParams): Location[] {
    return getReferencesAtPosition(referenceParams);
}

// TODO: Make references work for HTML too
export function getReferencesAtPosition(referenceParams: ReferenceParams) {
    // TODO: This is an ugly method
    // TODO: ... And needs caching
    // TODO: ...but for now, it works
    //
    const usableData = textDocumentDataToUsableData(documents, referenceParams);
    const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
    const basePath = project?.getCurrentDirectory() ?? "";
    if (!project) {
        return [];
    }

    const cemCollection = getCEMData(project, basePath);
    if (!cemCollection.hasData()) {
        return [];
    }

    if (!project) {
        return [];
    }

    const openFilePath = referenceParams.textDocument.uri.replace("file://", "");
    const openDoc = scanDocument(openFilePath);
    const identifiers = findIdentifiers(openFilePath, "", project);
    const offset = positionToOffset(openDoc, referenceParams.position);
    const identifierUnderCursor = identifiers.find(id => id.pos <= offset && id.end >= offset);

    const referenceClass = identifierUnderCursor?.escapedText;
    if (!referenceClass) {
        return [];
    }

    const tagNameModule = findTagNameForClass(cemCollection, referenceClass);

    const definition = tagNameModule?.exports?.filter(exp => exp.kind === "custom-element-definition")?.[0];
    if (!definition) {
        return [];
    }

    const tagName = definition.name;

    const fileContentMap: any = {};

    // TODO: Find from HTML files too
    const filesUsingTag = project?.getRootScriptInfos().filter(file => {
        const templateExpressions = findTemplateExpressions(file.path, "", project);
        const contentAreas = templateExpressions.map(exp => exp.getText());
        const contains = contentAreas.some(area => area.includes("<" + tagName));
        if (contains) {
            fileContentMap[file.path] = {
                templateExpressions
            }
        }
        return contains;
    }) ?? [];


    const locations: Array<Location> = filesUsingTag?.flatMap(file => {
        const templateExpressions: Array<tss.Node> = fileContentMap[file.path].templateExpressions;
        return templateExpressions.flatMap((templateExp) => {
            const tagLength = `<${tagName}`.length;
            const content = templateExp.getFullText();
            const matches = [...content.matchAll(new RegExp(`<${tagName}`, "gi"))];
            const uri = url.pathToFileURL(file.path).href;
            const doc = scanDocument(file.path);
            if (!doc) {
                return [];
            }

            return matches.flatMap(match => {
                const start = templateExp.pos + (match.index ?? 0);
                const end = start + tagLength;

                const startPosition = offsetToPosition(doc, start);
                const endPosition = offsetToPosition(doc, end);
                return {
                    uri: uri,
                    range: Range.create(startPosition, endPosition)
                }
            })

        })
    });


    return locations;
}
