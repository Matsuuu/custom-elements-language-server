import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getProjectBasePath } from "../../template-context.js";
import { getSourceFile, getSourceFileWithImports } from "../../ts/sourcefile.js";

export function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const sourceFile = getSourceFileWithImports(filePath);
    //const sourceFile = getSourceFile(basePath);
}
