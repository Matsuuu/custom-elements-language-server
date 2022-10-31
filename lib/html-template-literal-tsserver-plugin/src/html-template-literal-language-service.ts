import { ScriptElementKind } from "typescript";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {

    constructor() {

    }

    public getCompletionsAtPosition(
        context: TemplateContext,
        position: ts.LineAndCharacter
    ): ts.CompletionInfo {

        return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            entries: [{ name: "foo", kind: ScriptElementKind.string, sortText: "foo" }]
        };

    }
}
