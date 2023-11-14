from LSP.plugin import DottedDict
from lsp_utils import NpmClientHandler
import os
import sublime


def plugin_loaded() -> None:
    LspCustomElementsPlugin.setup()


def plugin_unloaded() -> None:
    LspCustomElementsPlugin.cleanup()


class LspCustomElementsPlugin(NpmClientHandler):
    package_name = __package__
    server_directory = 'server'
    # TODO: Check if this path works ?
    server_binary_path = os.path.join(server_directory, 'node_modules', 'custom-elements-languageserver', 'bin', 'custom-elements-languageserver.js')
    print("Path " + server_binary_path)

