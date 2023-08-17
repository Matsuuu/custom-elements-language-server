import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver-types";

export function normalizePath(path: string) {
    return tss.server.toNormalizedPath(path);
}

export function completionItemToCompletionEntry(completionItem: CompletionItem): ts.CompletionEntry {
    return {
        name: completionItem.label,
        sortText: completionItem.label,
        kindModifiers: "declare",
        kind: completionItem.kind ? completionKindToScriptElementKind(completionItem.kind) : tss.ScriptElementKind.unknown,
    };
}

function completionKindToScriptElementKind(kind: CompletionItemKind): tss.ScriptElementKind {
    return completionItemKindMappings[kind];
}

export function elementKindToCompletionKind(kind: tss.ScriptElementKind): CompletionItemKind {
    return scriptElementKindMappings[kind] ?? CompletionItemKind.Text;
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
};

const scriptElementKindMappings: { [key in tss.ScriptElementKind]?: CompletionItemKind } = {
    [tss.ScriptElementKind.memberFunctionElement]: CompletionItemKind.Method,
    [tss.ScriptElementKind.functionElement]: CompletionItemKind.Function,
    [tss.ScriptElementKind.constructorImplementationElement]: CompletionItemKind.Constructor,
    [tss.ScriptElementKind.variableElement]: CompletionItemKind.Field,
    [tss.ScriptElementKind.variableElement]: CompletionItemKind.Variable,
    [tss.ScriptElementKind.classElement]: CompletionItemKind.Class,
    [tss.ScriptElementKind.interfaceElement]: CompletionItemKind.Interface,
    [tss.ScriptElementKind.moduleElement]: CompletionItemKind.Module,
    [tss.ScriptElementKind.memberVariableElement]: CompletionItemKind.Property,
    [tss.ScriptElementKind.constElement]: CompletionItemKind.Unit,
    [tss.ScriptElementKind.constElement]: CompletionItemKind.Value,
    [tss.ScriptElementKind.enumElement]: CompletionItemKind.Enum,
    [tss.ScriptElementKind.keyword]: CompletionItemKind.Keyword,
    [tss.ScriptElementKind.constElement]: CompletionItemKind.Color,
    [tss.ScriptElementKind.alias]: CompletionItemKind.Reference,
    [tss.ScriptElementKind.moduleElement]: CompletionItemKind.File,
    [tss.ScriptElementKind.unknown]: CompletionItemKind.Snippet,
    [tss.ScriptElementKind.unknown]: CompletionItemKind.Text,
};
