import config from '../config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = levels[config.logLevel as LogLevel] || levels.info;

function log(level: LogLevel, message: string, meta?: any): void {
    if (levels[level] <= currentLevel) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta
        };
        
        if (level === 'error') {
            console.error(JSON.stringify(logEntry));
        } else {
            console.log(JSON.stringify(logEntry));
        }
    }
}

export const logger = {
    error: (message: string, meta?: any) => log('error', message, meta),
    warn: (message: string, meta?: any) => log('warn', message, meta),
    info: (message: string, meta?: any) => log('info', message, meta),
    debug: (message: string, meta?: any) => log('debug', message, meta),
};

export default logger;
