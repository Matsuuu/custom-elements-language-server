# Custom Elements Language Server

> **Note**
> This project is in Alpha phase right now. Major changes might occur.

## Usage

The best way to utilize the Custom Elements Language Server is to enable the [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)(CEM) in your project by installing
a CEM generator like one provided by [The Open WC Team](https://github.com/open-wc/custom-elements-manifest/tree/master/packages/analyzer).

Generating a CEM in watch mode will provide you with the best user experience. If your dependencies ship with a Custom Elements Manifest, those will be utilized also.

## Features

The current featureset is as follows:

-   Support HTML files and html`` -template literals
-   Provides Completions for custom elements defined in the local Custom Elements Manifest and ones in node_modules
-   Provides type hints for attributes and properties on html tages
-   Provides Go To Definition -functionality for Custom Elements defined in the Custom Elements Manifest
-   Provides diagnostics on missing imports and unclosed custom element tags

### Disabling diagnostics

Sometimes CELS might catch some diagnostics that might not be useful for your usecase.

Adding a comment anywhere in your code with the given code, will disable diagnostics for said file.

These diagnostics can be disbled with the following flags:

| Command                     | Action                                                 |
| --------------------------- | ------------------------------------------------------ |
| cels-disable-diagnostics    | Disable all diagnostics                                |
| cels-disable-missing-closed | Disable diagnostics for non-closed custom element tags |
| cels-disable-import-check   | Disable checks for non-imported custom elements        |

## Installing

### VS Code

For VS Code, you are able to install the Custom Elements Language Server through the extension Marketplace.

[You can find the plugin here](https://marketplace.visualstudio.com/items?itemName=Matsuuu.custom-elements-language-server-project)

---

### NeoVim

NeoVim supports LSP actions through the built in LSP. You will just need to install the Language Server locally on your machine through npm or yarn, and then enable your connector for the language service.

#### Install language server

```bash
npm install -g custom-elements-languageserver
```

#### Set up your lsp client

With a library like [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) the client setup should be as easy as

```lua
require'lspconfig'.custom_elements_ls.setup{}
```

### Other editors

Is your favorite editor missing? If the editor supports LSP actions, plugging it in should be easy. If you need assistance, [submit an issue](https://github.com/Matsuuu/custom-elements-language-server/issues/new/choose).

## The Goal

The aim of the Custom Elements Language Server / Language services is to create a centralized server for supporting LSP operations on Custom Elements.

These operations include but are not limited to

-   Go To Definition
-   Attribute autocompletion
-   Slot name autocompletions
-   Event binding completions

Via installing a plugin to your favorite editor to support LSP actions, you are able to enable all of these Language Service functionalities.
