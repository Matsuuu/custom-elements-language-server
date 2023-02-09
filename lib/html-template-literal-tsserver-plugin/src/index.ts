import { decorateWithTemplateLanguageService } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { HTMLTemplateLiteralLanguageService } from "./html-template-literal-language-service.js";

export class HTMLTemplateLiteralPlugin {
    public static projectDirectory: string;

    private _htmlLanguageService?: HTMLLanguageService.LanguageService;
    private _config = {};
    private _logger: tss.server.Logger | undefined;
    private _consumerInfo: tss.server.PluginCreateInfo | undefined;
    private _projectDirectory: string = "";

    public constructor(private readonly _typescript: typeof tss, private readonly _project: tss.server.Project) { }

    public create(info: tss.server.PluginCreateInfo): tss.LanguageService {
        this.initialize(info);
        HTMLTemplateLiteralPlugin.projectDirectory = info.project.getCurrentDirectory();
        this._logger?.info("Starting up HTML Template Literal TSServer Plugin");

        const htmlTemplateLiteralLanguageService = new HTMLTemplateLiteralLanguageService(this._typescript, this.htmlLanguageService, this._project);

        const languageService = decorateWithTemplateLanguageService(
            this._typescript,
            info.languageService,
            info.project,
            htmlTemplateLiteralLanguageService,
            this.getTemplateSettings(),
        );

        this._logger?.info("Finalized HTML Template Literal TSServer Plugin setup");
        return languageService;
    }

    private initialize(info: tss.server.PluginCreateInfo) {
        this._consumerInfo = info;
        this._logger = info.project.projectService.logger;
        this._projectDirectory = this._consumerInfo.project.getCurrentDirectory();
    }

    private get htmlLanguageService(): HTMLLanguageService.LanguageService {
        if (!this._htmlLanguageService) {
            this._htmlLanguageService = HTMLLanguageService.getLanguageService();
        }
        return this._htmlLanguageService;
    }

    private getTemplateSettings() {
        return {
            get tags() {
                return ["html", "htm", "template"];
            },
            enableForStringWithSubstitutions: true,
            getSubstitutions: (templateString: any, spans: any): string => {
                return "";
            },
        };
    }
}

export default (mod: { typescript: typeof tss, project: tss.server.Project }) => new HTMLTemplateLiteralPlugin(mod.typescript, mod.project);
