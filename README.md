# custom-elements-language-server

> **Warning**
> This repository / project is still extremely Work In Progress. Rapid changes and refactors are going to happen

## TODO

-   Scan CEM manifest and feed it into the html-template-literal-tssserver-plugin
-   Find a way to get declaration / references working with html literaly stuff
-   ?

When we need to add a new "feature", make sure the providers in server.ts match

## The Goal

The aim of the Custom Elements Language Server / Language services is to create a centralized server for supporting LSP operations on Custom Elements.

These operations include but are not limited to

-   Go To Definition
-   Attribute autocompletion
-   Slot name autocompletions
-   Event binding completions

Helpful Development Sources:

-   https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

-   https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-sample/server/src/server.ts
