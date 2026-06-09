import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectDB } from './database/config';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function startServer() {
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        
        await connectDB();
        
        const httpServer = createServer(app);
        
        // Configurar Socket.io
        const io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
                credentials: true
            }
        });
        
        // Eventos de Socket.io
        io.on('connection', (socket) => {
            logger.info(`🔌 Usuario conectado: ${socket.id}`);
            
            socket.on('join-chat', (chatId: string) => {
                socket.join(chatId);
                logger.info(`📢 Usuario ${socket.id} se unió al chat ${chatId}`);
            });
            
            socket.on('leave-chat', (chatId: string) => {
                socket.leave(chatId);
                logger.info(`👋 Usuario ${socket.id} salió del chat ${chatId}`);
            });
            
            socket.on('send-message', async (data) => {
                // Aquí guardarás el mensaje en la DB
                io.to(data.chatId).emit('new-message', data);
            });
            
            socket.on('disconnect', () => {
                logger.info(`🔌 Usuario desconectado: ${socket.id}`);
            });
        });
        
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en ${config.appUrl}`);
            logger.info(`📚 API disponible en: ${config.appUrl}${config.apiPrefix}`);
            logger.info(`🔌 Socket.io disponible en: ${config.appUrl}`);
            logger.info('========================================');
        });
        
        // Graceful shutdown
        const gracefulShutdown = () => {
            logger.info('⚠️ Cerrando servidor...');
            io.close();
            httpServer.close(async () => {
                const { sequelize } = await import('./models');
                await sequelize.close();
                process.exit(0);
            });
        };
        
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        
    } catch (error) {
        logger.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();