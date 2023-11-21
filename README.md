# Custom Elements Language Server

> **Note**
> This project is in Alpha phase right now. Major changes might occur.

## Usage

Just [install the plugin to your preferred system](https://github.com/Matsuuu/custom-elements-language-server#installing), and it should plug into your project.

## Features

The current featureset is as follows:

-   Provides Completions for custom elements defined in the local Custom Elements Manifest and ones in node_modules
-   Provides type hints for attributes and properties on html tages
-   Provides Go To Definition -functionality for Custom Elements defined in the Custom Elements Manifest
-   Provides diagnostics on missing imports and unclosed custom element tags


## Installing

### VS Code

For VS Code, you are able to install the Custom Elements Language Server through the extension Marketplace.

[You can find the plugin here](https://marketplace.visualstudio.com/items?itemName=Matsuuu.custom-elements-language-server-project)

---

### NeoVim

NeoVim supports LSP actions through the built in LSP. You will just need to install the Language Server locally on your machine through npm or yarn, and then enable your connector for the language service.

#### Install language server

Install the server plugin from [Npm](https://www.npmjs.com/package/custom-elements-languageserver)


```bash
npm install -g custom-elements-languageserver
```

#### Set up your lsp client

Custom Elements Language Server is comes pre-configured with [Mason](https://github.com/williamboman/mason.nvim) and [Nvim-lspconfig](https://github.com/neovim/nvim-lspconfig).

Configuration might change but at the moment it should look something like the following: 

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


### Disabling diagnostics

Sometimes CELS might catch some diagnostics that might not be useful for your usecase.

Adding a comment anywhere in your code with the given code, will disable diagnostics for said file.

These diagnostics can be disbled with the following flags:

| Command                     | Action                                                 |
| --------------------------- | ------------------------------------------------------ |
| cels-disable-diagnostics    | Disable all diagnostics                                |
| cels-disable-missing-closed | Disable diagnostics for non-closed custom element tags |
| cels-disable-import-check   | Disable checks for non-imported custom elements        |
