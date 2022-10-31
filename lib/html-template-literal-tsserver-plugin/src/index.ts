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

/*
    *        // Get a list of things to remove from the completion list from the config object.
        // If nothing was specified, we'll just remove 'caller'
        const whatToRemove: string[] = info.config.remove || ["caller", "async"];

        // Diagnostic logging
        info.project.projectService.logger.info(
            "Starting up HTML Template Literal TSServer Plugin"
        );

        // Set up decorator object
        const proxy: ts.LanguageService = Object.create(null);
        for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
            const x = info.languageService[k]!;
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
        }

        // Remove specified entries from completion list
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
            // This is just to let you hook into something to
            // see the debugger working
            debugger
            info.project.projectService.logger.info("Completions trigger.");

            const prior = info.languageService.getCompletionsAtPosition(fileName, position, options);
            if (!prior) return

            const oldLength = prior.entries.length;
            prior.entries = prior.entries.filter(e => whatToRemove.indexOf(e.name) < 0);

            // Sample logging for diagnostic purposes
            if (oldLength !== prior.entries.length) {
                const entriesRemoved = oldLength - prior.entries.length;
                info.project.projectService.logger.info(
                    `Removed ${entriesRemoved} entries from the completion list`
                );
            }

            return prior;
        };

        return proxy;

    * */

export = (mod: { typescript: typeof ts }) => new HTMLTemplateLiteralPlugin(mod.typescript);
