import * as tss from "typescript/lib/tsserverlibrary.js";

export class Logger implements tss.server.Logger {

    // TODO: Actually care about level
    private level: tss.server.LogLevel = tss.server.LogLevel.normal;

    constructor() {

    }

    hasLevel(level: tss.server.LogLevel): boolean {
        return level >= tss.server.LogLevel.terse && level <= tss.server.LogLevel.verbose;
    }

    loggingEnabled(): boolean {
        return true; // For now we won't disable logging
    }

    perftrc(s: string): void {
        this.msg(s, tss.server.Msg.Perf)
    }

    info(s: string): void {
        this.msg(s, tss.server.Msg.Info)
    }

    error(s: string): void {
        this.msg(s, tss.server.Msg.Err);
    }

    msg(s: string, type?: tss.server.Msg | undefined): void {
        switch (type) {
            case tss.server.Msg.Info:
                console.log(s);
                break;
            case tss.server.Msg.Perf:
                console.warn(s);
                break;
            case tss.server.Msg.Err:
                console.error(s);
                break;
        }
    }

    /**
     * For now, we're working only in-mem / cli output so we won't need the below
     * methods
     * */

    // TODO: Write logs to file

    getLogFileName(): string | undefined { return undefined; }
    startGroup(): void { }
    endGroup(): void { }
    close(): void { }
}
