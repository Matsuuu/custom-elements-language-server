import tss from "typescript/lib/tsserverlibrary.js";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver-types";

export function completionItemToCompletionEntry(completionItem: CompletionItem): ts.CompletionEntry {
    return {
        name: completionItem.label,
        sortText: completionItem.label,
        kindModifiers: "declare",
        kind: completionItem.kind ? completionKindToScriptElementKind(completionItem.kind) : tss.ScriptElementKind.unknown,
    }
}

function completionKindToScriptElementKind(
    kind: CompletionItemKind
): tss.ScriptElementKind {
    return completionItemKindMappings[kind];
}

const completionItemKindMappings: { [index: number]: tss.ScriptElementKind } = {
    [CompletionItemKind.Method]: tss.ScriptElementKind.memberFunctionElement,
    [CompletionItemKind.Function]: tss.ScriptElementKind.functionElement,
    [CompletionItemKind.Constructor]: tss.ScriptElementKind.constructorImplementationElement,
    [CompletionItemKind.Field]: tss.ScriptElementKind.variableElement,
    [CompletionItemKind.Variable]: tss.ScriptElementKind.variableElement,
    [CompletionItemKind.Class]: tss.ScriptElementKind.classElement,
    [CompletionItemKind.Interface]: tss.ScriptElementKind.interfaceElement,
    [CompletionItemKind.Module]: tss.ScriptElementKind.moduleElement,
    [CompletionItemKind.Property]: tss.ScriptElementKind.memberVariableElement,
    [CompletionItemKind.Unit]: tss.ScriptElementKind.constElement,
    [CompletionItemKind.Value]: tss.ScriptElementKind.constElement,
    [CompletionItemKind.Enum]: tss.ScriptElementKind.enumElement,
    [CompletionItemKind.Keyword]: tss.ScriptElementKind.keyword,
    [CompletionItemKind.Color]: tss.ScriptElementKind.constElement,
    [CompletionItemKind.Reference]: tss.ScriptElementKind.alias,
    [CompletionItemKind.File]: tss.ScriptElementKind.moduleElement,
    [CompletionItemKind.Snippet]: tss.ScriptElementKind.unknown,
    [CompletionItemKind.Text]: tss.ScriptElementKind.unknown,
}
