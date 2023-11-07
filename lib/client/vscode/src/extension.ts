import * as path from "path";
import { commands, workspace, ExtensionContext } from "vscode";

import { Disposable, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

const disposables: Disposable[] = [];

function registerCommands(context: ExtensionContext) {
    const restartCommandDisposable = commands.registerCommand('extension.restart', async () => {
        client.stop();
        deactivate();
        activate(context);
    });
    disposables.push(restartCommandDisposable);
}


export function activate(context: ExtensionContext) {
    let serverPath = path.join("dist", "server", "src", "server.js");
    if (process.env.CUSTOM_ELEMENTS_LANGUAGE_SERVER_PATH) {
        serverPath = process.env.CUSTOM_ELEMENTS_LANGUAGE_SERVER_PATH;
    }
    console.log("Connecting to server @ " + serverPath);

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

    // TODO: Allow excluding filetypes
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // documentSelector: [
        //     ...SUPPORTED_LANGUAGES.map(lang => ({ scheme: "file", language: lang }))
        // ],
        //
        documentSelector: [
            { scheme: "file" }
        ],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: [
                workspace.createFileSystemWatcher("**/.clientrc")
            ]
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient("customElementsLanguageServer", "Custom Elements Language Services", serverOptions, clientOptions);

    // Start the client. This will also launch the server
    const clientStartedPromise = client.start();

    clientStartedPromise
        .then(() => {
            console.log("Connection to server established");
        })
        .catch(err => {
            console.error("Could not connect to Language Server ", err);
        });


    registerCommands(context);
}

export function deactivate(): Thenable<void> | undefined {
    disposables.forEach(dis => dis.dispose());
    if (!client) {
        return undefined;
    }
    return client.stop();
}
