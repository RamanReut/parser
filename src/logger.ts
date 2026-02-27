import pino from 'pino'
import { join } from 'path'

// Configure logger with file and console output
const logger = pino({
    level: 'info', // Minimum log level to capture
    transport: {
        targets: [
            {
                target: 'pino/file',
                options: {
                    destination: join(__dirname, '../logs/app.log'),
                    mkdir: true,
                },
            },
            {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        ]
    }
})

export default logger
