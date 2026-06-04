import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import config from './config';
import logger from './utils/logger';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function startServer(): Promise<void> {

    
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en ${config.appUrl}`);
            logger.info(`📚 API disponible en: ${config.appUrl}${config.apiPrefix}`);
            logger.info(`🏥 Health Check: ${config.appUrl}${config.apiPrefix}/health`);
            logger.info('========================================');
        });
        
        const gracefulShutdown = (signal: string): void => {
            logger.info(`⚠️ Recibido ${signal}. Cerrando servidor...`);
            
            server.close(() => {
                logger.info('👋 Servidor HTTP cerrado');
                logger.info('✅ Shutdown completado');
                process.exit(0);
            });
            
            setTimeout(() => {
                logger.error('⏰ Timeout forzando cierre...');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
            logger.error('🚨 Unhandled Rejection:', { reason, promise });
        });
        
        process.on('uncaughtException', (error: Error) => {
            logger.error('🚨 Uncaught Exception:', error);
            process.exit(1);
        });
        
    } catch (error) {
        logger.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
