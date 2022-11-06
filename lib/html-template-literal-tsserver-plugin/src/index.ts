import { decorateWithTemplateLanguageService } from "typescript-template-language-service-decorator";
import ts from "typescript/lib/tsserverlibrary";
import { getLanguageService, LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { HTMLTemplateLiteralLanguageService } from "./html-template-literal-language-service";

class HTMLTemplateLiteralPlugin {
    private _htmlLanguageService?: HtmlLanguageService;
    private _config = {};

    public constructor(private readonly _typescript: typeof ts) {

    }

    public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
        info.project.projectService.logger.info(
            "Starting up HTML Template Literal TSServer Plugin"
        );

        const htmlTemplateLiteralLanguageService = new HTMLTemplateLiteralLanguageService(this._typescript, this.htmlLanguageService)

        const languageService = decorateWithTemplateLanguageService(
            this._typescript,
            info.languageService,
            info.project,
            htmlTemplateLiteralLanguageService,
            this.getTemplateSettings()
        );

        return languageService;
    }

    private get htmlLanguageService(): HtmlLanguageService {
        if (!this._htmlLanguageService) {
            this._htmlLanguageService = getLanguageService();
        }
        return this._htmlLanguageService;
    }

    private getTemplateSettings() {
        return {
            get tags() { return ["html", "htm"] },
            enableForStringWithSubstitutions: true,
            getSubstitutions: (templateString: any, spans: any): string => {
                return "";
            }
        }
    }
}

export = (mod: { typescript: typeof ts }) => new HTMLTemplateLiteralPlugin(mod.typescript);
