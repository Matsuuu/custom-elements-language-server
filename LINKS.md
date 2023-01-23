HTML Lang server TokenTypes https://github.com/microsoft/vscode-html-languageservice/blob/main/src/htmlLanguageTypes.ts#L74-L97

Completion contexts: https://github.com/microsoft/vscode-html-languageservice/blob/main/src/services/htmlCompletion.ts

```javascript
export declare enum TokenType {
    StartCommentTag = 0,
    Comment = 1,
    EndCommentTag = 2,
    StartTagOpen = 3,
    StartTagClose = 4,
    StartTagSelfClose = 5,
    StartTag = 6,
    EndTagOpen = 7,
    EndTagClose = 8,
    EndTag = 9,
    DelimiterAssign = 10,
    AttributeName = 11,
    AttributeValue = 12,
    StartDoctypeTag = 13,
    Doctype = 14,
    EndDoctypeTag = 15,
    Content = 16,
    Whitespace = 17,
    Unknown = 18,
    Script = 19,
    Styles = 20,
    EOS = 21
}
```

Helpful Development Sources:

-   https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

-   https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-sample/server/src/server.ts
