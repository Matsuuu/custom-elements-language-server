
// TODO: These are copy from the other place
export function offsetToPosition(documents: TextDocuments<TextDocument>, uri: string, offset: number): Position {
    return documents.get(uri)?.positionAt(offset) ?? Position.create(0, 0);
}

export function positionToOffset(documents: TextDocuments<TextDocument>, uri: string, position: Position): number {
    return documents.get(uri)?.offsetAt(position) ?? 0;
}

