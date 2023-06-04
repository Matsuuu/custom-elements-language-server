import fs from "fs";

const DEBUG = true;

export enum LogLevel {
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogMessage {
    message: string,
    level: LogLevel
}

export class Logger {
    private static _instance: Logger;
    private level: LogLevel = LogLevel.INFO;

    public static getInstance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    public async log(message: LogMessage) {
        // This function is set as async so that it doesn't block execution
        if (message.level < this.level) {
            return;
        }
        this.msg(message);
    }

    private msg(message: LogMessage) {
        let prefix = "";
        switch (message.level) {
            case LogLevel.INFO:
                prefix = "[INFO]: ";
                break;
            case LogLevel.WARN:
                prefix = "[WARN]: ";
                break;
            case LogLevel.ERROR:
                prefix = "[ERROR]: ";
                break;
            default:
                prefix = "[INFO]: ";
        }

        const logMessage = prefix + message.message;

        fs.appendFile(__dirname + "/custom-elements-languageserver.log", "\n" + logMessage, (err: NodeJS.ErrnoException | null) => {
            if (err) {
                console.log("Writing to log failed. ", err);
            }
        });

        if (DEBUG) {
            console.log(logMessage);
        }
    }
}
