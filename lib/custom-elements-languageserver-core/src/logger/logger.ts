import fs from "fs";

const DEBUG = true;

export enum LogLevel {
    OFF = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

export interface LogMessage {
    message: string,
    level: LogLevel
}

export class Logger {
    private static _instance: Logger;
    private level: LogLevel = LogLevel.OFF;

    public static getInstance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    public static log(message: LogMessage) {
        this.getInstance().log(message);
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
