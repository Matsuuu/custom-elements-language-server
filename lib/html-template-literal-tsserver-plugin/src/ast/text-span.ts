import { JavaScriptModule } from "custom-elements-manifest";
import ts from "typescript";
import { getAttributeIdentifier, getClassIdentifier, getEventIdentifier, getPropertyIdentifier } from "./identifier.js";


export const ZERO_TEXT_SPAN = ts.createTextSpan(0, 0);

export function getClassDefinitionTextSpan(mod: JavaScriptModule, className: string, basePath: string): ts.TextSpan {
    const classIdentifier = getClassIdentifier(mod.path, className, basePath);
    if (!classIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: classIdentifier.getStart(),
        length: classIdentifier.getWidth(),
    };
}

export function getAttributeDefinitionTextSpan(mod: JavaScriptModule, attributeName: string, basePath: string): ts.TextSpan {
    const attributeIdentifier = getAttributeIdentifier(mod.path, attributeName, basePath);
    if (!attributeIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: attributeIdentifier.getStart(),
        length: attributeIdentifier.getWidth(),
    };
}

export function getPropertyDefinitionTextSpan(mod: JavaScriptModule, propertyName: string, basePath: string): ts.TextSpan {
    const propertyIdentifier = getPropertyIdentifier(mod.path, propertyName, basePath);
    if (!propertyIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: propertyIdentifier.getStart(),
        length: propertyIdentifier.getWidth(),
    };
}

export function getEventDefinitionTextSpan(mod: JavaScriptModule, eventName: string, basePath: string): ts.TextSpan {
    const eventIdentifier = getEventIdentifier(mod.path, eventName, basePath);
    if (!eventIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: eventIdentifier.getStart(),
        length: eventIdentifier.getWidth(),
    };
}


