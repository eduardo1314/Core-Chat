import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectDB } from './database/config';
import { initSocket } from './socket';
import { startScheduler } from './jobs/index';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function startServer() {
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        logger.info(`🔌 Puerto: ${PORT}`);

        // ============================================
        // CONECTAR A BASE DE DATOS
        // ============================================
        await connectDB();

        // ============================================
        // INICIAR SCHEDULER (LIMPIEZA DE HISTORIAS)
        // ============================================
        startScheduler();
        logger.info('✅ Scheduler iniciado');

        // ============================================
        // CREAR SERVIDOR HTTP
        // ============================================
        const httpServer = createServer(app);

        // ============================================
        // INICIALIZAR SOCKET.IO
        // ============================================
        const io = initSocket(httpServer);
        app.set('io', io);

        // ============================================
        // INICIAR SERVIDOR
        // ============================================
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en ${config.appUrl}`);
            logger.info(`📚 API disponible en: ${config.appUrl}${config.apiPrefix}`);
            logger.info(`🔌 Socket.io disponible en: ${config.appUrl}`);
            logger.info('========================================');
        });

        // ============================================
        // GRACEFUL SHUTDOWN
        // ============================================
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

        // ============================================
        // MANEJAR SEÑALES DEL SISTEMA
        // ============================================
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