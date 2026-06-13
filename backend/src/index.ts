import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectDB } from './database/config';
import { Message, Chat, Participant, User } from './models';
import { v4 as uuidv4 } from 'uuid';

const PORT = config.port;
const NODE_ENV = config.nodeEnv;

async function startServer() {
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        
        await connectDB();
        
        const httpServer = createServer(app);
        
        const io = new Server(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:3001'],
                credentials: true
            }
        });
        
        // Eventos de Socket.io - VERSIÓN SIMPLIFICADA
        io.on('connection', (socket) => {
            logger.info(`🔌 Usuario conectado: ${socket.id}`);
            
            // Guardar userId desde el frontend (no desde token)
            socket.on('set-user', (userId) => {
                socket.data.userId = userId;
                logger.info(`📌 Usuario ${userId} identificado en socket ${socket.id}`);
            });
            
            socket.on('join-chat', (chatId: string) => {
                socket.join(chatId);
                logger.info(`📢 Socket ${socket.id} se unió al chat ${chatId}`);
            });
            
            socket.on('leave-chat', (chatId: string) => {
                socket.leave(chatId);
                logger.info(`👋 Socket ${socket.id} salió del chat ${chatId}`);
            });
            
            socket.on('send-message', async (data) => {
                try {
                    const { chatId, content, userId, username } = data;
                    
                    logger.info(`📨 Recibido mensaje de ${username}: ${content}`);
                    
                    // Guardar en base de datos
                    const message = await Message.create({
                        id: uuidv4(),
                        chat_id: chatId,
                        user_id: userId,
                        content: content,
                        type: 'text',
                        reply_to: null,
                        is_edited: false,
                        is_deleted: false
                    });
                    
                    // Obtener mensaje con datos del usuario
                    const fullMessage = await Message.findByPk(message.id, {
                        include: [
                            { 
                                model: User, 
                                attributes: ['id', 'username', 'avatar_url'] 
                            }
                        ]
                    });
                    
                    // Actualizar fecha del chat
                    await Chat.update(
                        { updated_at: new Date() },
                        { where: { id: chatId } }
                    );
                    
                    // Emitir a todos en el chat
                    io.to(chatId).emit('new-message', fullMessage);
                    
                    logger.info(`✅ Mensaje emitido al chat ${chatId}`);
                    
                } catch (error) {
                    logger.error('Error al guardar mensaje:', error);
                }
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