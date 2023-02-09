import * as path from "path";
import { commands, window, workspace, ExtensionContext } from "vscode";

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node.js";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    console.log(context);
    console.log(process.env);
    let serverPath = path.join("dist", "server", "src", "server.js");
    if (process.env.CUSTOM_ELEMENTS_LANGUAGE_SERVER_PATH) {
        serverPath = process.env.CUSTOM_ELEMENTS_LANGUAGE_SERVER_PATH;
    }
    console.log("Initializing LS");
    // let serverModule = context.asAbsolutePath(path.join("lib", "server", "out", "server.js"));
    let serverModule = context.asAbsolutePath(serverPath);
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        },
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: "file", language: "plaintext" },
            { scheme: "file", language: "html" },
            { scheme: "file", language: "typescript" },
            { scheme: "file", language: "javascript" }, // TODO: Need to add jsx etc.?
        ],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: [
                workspace.createFileSystemWatcher("**/.clientrc")
            ]
        },
    };

    const disposable = commands.registerCommand('extension.helloWorld', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        window.showInformationMessage('Hello World!');
    });

    // Create the language client and start the client.
    client = new LanguageClient("customElementsLanguageServer", "Custom Elements Language Services", serverOptions, clientOptions);

    // Start the client. This will also launch the server
    client.start();
    console.log("Client started");
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
