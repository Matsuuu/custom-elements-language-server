import { decorateWithTemplateLanguageService } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { getLanguageService, LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { HTMLTemplateLiteralLanguageService } from "./html-template-literal-language-service.js";
import * as fs from "fs";
import { CEMInstantiator } from "./cem/cem-instance.js";

class HTMLTemplateLiteralPlugin {
    private _htmlLanguageService?: HtmlLanguageService;
    private _config = {};
    private _logger: tss.server.Logger | undefined;
    private _consumerInfo: tss.server.PluginCreateInfo | undefined;
    private _projectDirectory: string = "";

    public constructor(private readonly _typescript: typeof tss) {

    }

    public create(info: tss.server.PluginCreateInfo): tss.LanguageService {
        this.initialize(info);
        CEMInstantiator.init(info);
        this._logger?.info("Starting up HTML Template Literal TSServer Plugin");

        const htmlTemplateLiteralLanguageService = new HTMLTemplateLiteralLanguageService(this._typescript, this.htmlLanguageService)

        const languageService = decorateWithTemplateLanguageService(
            this._typescript,
            info.languageService,
            info.project,
            htmlTemplateLiteralLanguageService,
            this.getTemplateSettings()
        );

        this._logger?.info("Finalized HTML Template Literal TSServer Plugin setup");
        return languageService;
    }

    private initialize(info: tss.server.PluginCreateInfo) {
        this._consumerInfo = info;
        this._logger = info.project.projectService.logger;
        this._projectDirectory = this._consumerInfo.project.getCurrentDirectory();
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

export default (mod: { typescript: typeof tss }) => new HTMLTemplateLiteralPlugin(mod.typescript);
