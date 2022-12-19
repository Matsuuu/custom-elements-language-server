import { TemplateContext } from "typescript-template-language-service-decorator";

export function getProjectBasePath(context: TemplateContext) {
    // Where is StandardTemplateContext?
    // @ts-ignore until we can find a typing for this
    return context?.helper?.project?.currentDirectory ?? "";
    // TODO: Is the currentdirectory the best way to get the base path?
}
