import { JavaScriptModule } from "custom-elements-manifest";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { getAttributeIdentifier, getClassIdentifier, getEventIdentifier, getPropertyIdentifier } from "./identifier.js";


export const ZERO_TEXT_SPAN = ts.createTextSpan(0, 0);

// TODO: We might need to implement the package aware things here too

export function getClassDefinitionTextSpan(mod: JavaScriptModule, className: string, basePath: string, project: tss.server.Project): ts.TextSpan {
    const classIdentifier = getClassIdentifier(mod.path, className, basePath, project);
    if (!classIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: classIdentifier.getStart(),
        length: classIdentifier.getWidth(),
    };
}

export function getAttributeDefinitionTextSpan(mod: JavaScriptModule, attributeName: string, basePath: string, project: tss.server.Project): ts.TextSpan {
    const attributeIdentifier = getAttributeIdentifier(mod.path, attributeName, basePath, project);
    if (!attributeIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: attributeIdentifier.getStart(),
        length: attributeIdentifier.getWidth(),
    };
}

export function getPropertyDefinitionTextSpan(mod: JavaScriptModule, propertyName: string, basePath: string, project: tss.server.Project): ts.TextSpan {
    const propertyIdentifier = getPropertyIdentifier(mod.path, propertyName, basePath, project);
    if (!propertyIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: propertyIdentifier.getStart(),
        length: propertyIdentifier.getWidth(),
    };
}

export function getEventDefinitionTextSpan(mod: JavaScriptModule, eventName: string, basePath: string, project: tss.server.Project): ts.TextSpan {
    const eventIdentifier = getEventIdentifier(mod.path, eventName, basePath, project);
    if (!eventIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: eventIdentifier.getStart(),
        length: eventIdentifier.getWidth(),
    };
}


