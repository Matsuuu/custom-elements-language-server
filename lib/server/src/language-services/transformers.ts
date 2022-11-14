import * as tss from "typescript/lib/tsserverlibrary.js";

export function tssIteratorToArray<T>(iterator: tss.Iterator<T>): Array<T> {
    const outputArray: Array<T> = [];
    let round = undefined;

    while (!(round = iterator.next()).done) {
        outputArray.push(round.value);
    }

    return outputArray
}
