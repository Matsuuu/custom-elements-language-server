import * as ts from "typescript";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver-types";

export function completionItemToCompletionEntry(completionItem: CompletionItem): ts.CompletionEntry {
    return {
        name: completionItem.label,
        sortText: completionItem.label,
        kindModifiers: "declare",
        kind: completionItem.kind ? completionKindToScriptElementKind(completionItem.kind) : ts.ScriptElementKind.unknown,
    }
}

function completionKindToScriptElementKind(
    kind: CompletionItemKind
): ts.ScriptElementKind {
    return completionItemKindMappings[kind];
}

const completionItemKindMappings: { [index: number]: ts.ScriptElementKind } = {
    [CompletionItemKind.Method]: ts.ScriptElementKind.memberFunctionElement,
    [CompletionItemKind.Function]: ts.ScriptElementKind.functionElement,
    [CompletionItemKind.Constructor]: ts.ScriptElementKind.constructorImplementationElement,
    [CompletionItemKind.Field]: ts.ScriptElementKind.variableElement,
    [CompletionItemKind.Variable]: ts.ScriptElementKind.variableElement,
    [CompletionItemKind.Class]: ts.ScriptElementKind.classElement,
    [CompletionItemKind.Interface]: ts.ScriptElementKind.interfaceElement,
    [CompletionItemKind.Module]: ts.ScriptElementKind.moduleElement,
    [CompletionItemKind.Property]: ts.ScriptElementKind.memberVariableElement,
    [CompletionItemKind.Unit]: ts.ScriptElementKind.constElement,
    [CompletionItemKind.Value]: ts.ScriptElementKind.constElement,
    [CompletionItemKind.Enum]: ts.ScriptElementKind.enumElement,
    [CompletionItemKind.Keyword]: ts.ScriptElementKind.keyword,
    [CompletionItemKind.Color]: ts.ScriptElementKind.constElement,
    [CompletionItemKind.Reference]: ts.ScriptElementKind.alias,
    [CompletionItemKind.File]: ts.ScriptElementKind.moduleElement,
    [CompletionItemKind.Snippet]: ts.ScriptElementKind.unknown,
    [CompletionItemKind.Text]: ts.ScriptElementKind.unknown,
}
