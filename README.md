# Custom Elements Language Server

> **Note**
> This repository / project is still Work In Progress. Rapid changes and refactors are going to happen.

## Installing

### VS Code

For VS Code, you are able to install the Custom Elements Language Server through the extension Marketplace.

[You can find the plugin here](https://google.com) // TODO: Add the actual plugin link when released

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
require'lspconfig'.tsserver.setup{}
```

## The Goal

The aim of the Custom Elements Language Server / Language services is to create a centralized server for supporting LSP operations on Custom Elements.

These operations include but are not limited to

-   Go To Definition
-   Attribute autocompletion
-   Slot name autocompletions
-   Event binding completions


Via installing a plugin to your favorite editor to support LSP actions, you are able to enable all of these Language Service functionalities.
