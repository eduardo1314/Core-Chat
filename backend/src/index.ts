import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectDB } from './database/config';
import { initSocket } from './socket';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function startServer() {
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        logger.info(`🔌 Puerto: ${PORT}`);

        await connectDB();

        const httpServer = createServer(app);

        // Inicializar Socket.IO 
        const io = initSocket(httpServer);

        //  Guardar io en app para controladores para poder usar enpoints normales http
        app.set('io', io);

        httpServer.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en ${config.appUrl}`);
            logger.info(`📚 API disponible en: ${config.appUrl}${config.apiPrefix}`);
            logger.info(`🔌 Socket.io disponible en: ${config.appUrl}`);
            logger.info('========================================');
        });

        // Graceful Shutdown
        const gracefulShutdown = () => {
            logger.info('⚠️ Cerrando servidor...');
            io.sockets.sockets.forEach((socket) => {
                socket.disconnect(true);
            });
            io.close(() => {
                httpServer.close(async () => {
                    try {
                        const { sequelize } = await import('./models');
                        await sequelize.close();
                        logger.info('✅ Servidor cerrado correctamente');
                        process.exit(0);
                    } catch (error) {
                        logger.error('❌ Error al cerrar servidor:', error);
                        process.exit(1);
                    }
                });
            });
            setTimeout(() => {
                logger.error('❌ Forzando cierre del servidor');
                process.exit(1);
            }, 5000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        process.on('uncaughtException', (error) => {
            logger.error('❌ Excepción no capturada:', error);
        });
        process.on('unhandledRejection', (reason) => {
            logger.error('❌ Promesa rechazada no manejada:', reason);
        });

    } catch (error) {
        logger.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();