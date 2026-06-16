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
const FRONTEND_URL = config.frontendUrl || 'http://localhost:5173';

async function startServer() {
    try {
        logger.info('🚀 Iniciando Core-Chat API...');
        logger.info(`📡 Modo: ${NODE_ENV}`);
        logger.info(`🔌 Puerto: ${PORT}`);
        logger.info(`🌐 Frontend: ${FRONTEND_URL}`);
        
        await connectDB();
        
        const httpServer = createServer(app);
        
        const io = new Server(httpServer, {
            cors: {
                origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
                credentials: true,
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        
        // Cache para prevenir duplicados en el servidor
        const processedMessages = new Map<string, number>();
        
        // Estadísticas en memoria
        const connectedUsers = new Map<string, string>(); // socketId 
        
     // Manejo de conexiones Socket.IO
        io.on('connection', (socket) => {
            logger.info(`🔌 Usuario conectado: ${socket.id}`);
            
            // ==========================================
            // 1. IDENTIFICAR USUARIO
            // ==========================================
            socket.on('set-user', (userId) => {
                if (!userId) {
                    logger.warn('⚠️ Intento de set-user sin userId');
                    return;
                }
                
                socket.data.userId = userId;
                connectedUsers.set(socket.id, userId);
                
                logger.info(`📌 Usuario ${userId} identificado en socket ${socket.id}`);
                
                // Notificar a otros usuarios que este usuario está en línea
                socket.broadcast.emit('user-online', {
                    userId,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                });
            });
            
            //unir a un chat
            socket.on('join-chat', (chatId: string) => {
                if (!chatId) {
                    logger.warn('⚠️ Intento de join-chat sin chatId');
                    return;
                }
                
                socket.join(chatId);
                logger.info(`📢 Socket ${socket.id} se unió al chat ${chatId}`);
                
                // Enviar confirmación
                socket.emit('joined-chat', {
                    chatId,
                    success: true
                });
            });
            
        // salir de un chat
            socket.on('leave-chat', (chatId: string) => {
                if (!chatId) {
                    logger.warn('⚠️ Intento de leave-chat sin chatId');
                    return;
                }
                
                socket.leave(chatId);
                logger.info(`👋 Socket ${socket.id} salió del chat ${chatId}`);
                
                socket.emit('left-chat', {
                    chatId,
                    success: true
                });
            });
            
            //enviar mensaje
            socket.on('send-message', async (data) => {
                try {
                    const { chatId, content, userId, username, tempId, messageId } = data;
                    
                    // ✅ Validaciones
                    if (!chatId || !content || !userId) {
                        logger.error('❌ Datos incompletos:', { chatId, content, userId });
                        socket.emit('message-error', { 
                            error: 'Datos incompletos',
                            tempId: tempId || null
                        });
                        return;
                    }
                    
                    //  Generar ID único para prevenir duplicados
                    const uniqueId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    //  Prevenir duplicados en el servidor
                    if (processedMessages.has(uniqueId)) {
                        logger.warn(`⚠️ Mensaje duplicado ignorado: ${uniqueId}`);
                        return;
                    }
                    
                    // Guardar en cache por 10 segundos
                    processedMessages.set(uniqueId, Date.now());
                    setTimeout(() => {
                        processedMessages.delete(uniqueId);
                    }, 10000);
                    
                    logger.info(`📨 Recibido mensaje de ${username}: "${content}" en chat ${chatId}`);
                    
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
                    
                    //  Obtener mensaje con datos del usuario
                    const fullMessage = await Message.findByPk(message.id, {
                        include: [
                            { 
                                model: User, 
                                attributes: ['id', 'username', 'avatar_url'] 
                            }
                        ]
                    });
                    
                    if (!fullMessage) {
                        throw new Error('Mensaje no encontrado después de crear');
                    }
                    
                    //  Actualizar fecha del chat
                    await Chat.update(
                        { updated_at: new Date() },
                        { where: { id: chatId } }
                    );
                    
                    //  Preparar datos del mensaje
                    const messageData = {
                        ...fullMessage.toJSON(),
                        tempId: tempId || null,
                        uniqueId: uniqueId,
                        _serverTimestamp: new Date().toISOString()
                    };
                    
                    // ==========================================
                    // CLAVE: Emitir a TODOS EXCEPTO al emisor
                    // ==========================================
                    socket.to(chatId).emit('new-message', messageData);
                    
                    //  Confirmar al emisor que su mensaje fue guardado
                    socket.emit('message-sent', {
                        ...messageData,
                        _confirmed: true
                    });
                    
                    // Notificar que el chat se actualizó
                    io.to(chatId).emit('chat-updated', {
                        chatId,
                        lastMessage: content,
                        lastMessageId: message.id,
                        timestamp: new Date().toISOString(),
                        userId: userId,
                        username: username
                    });
                    
                    logger.info(`✅ Mensaje emitido al chat ${chatId} (ID: ${message.id})`);
                    
                } catch (error) {
                    logger.error('❌ Error al guardar mensaje:', error);
                    socket.emit('message-error', { 
                        error: 'Error al enviar mensaje',
                        tempId: data?.tempId || null,
                        details: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });
            
           // Indicador de escritura
            socket.on('typing', (data) => {
                try {
                    const { chatId, isTyping } = data;
                    if (!chatId) return;
                    
                    const userId = socket.data.userId;
                    if (!userId) return;
                    
                    socket.to(chatId).emit('user-typing', {
                        userId,
                        isTyping,
                        chatId,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    logger.error('Error en typing:', error);
                }
            });
            
            // Eliminar mensaje
            socket.on('delete-message', async (data) => {
                try {
                    const { chatId, messageId } = data;
                    if (!chatId || !messageId) return;
                    
                    const message = await Message.findByPk(messageId);
                    if (!message) {
                        socket.emit('error', { error: 'Mensaje no encontrado' });
                        return;
                    }
                    
                    // Verificar que el usuario sea el dueño
                    if (message.user_id !== socket.data.userId) {
                        socket.emit('error', { error: 'No autorizado' });
                        return;
                    }
                    
                    await message.update({ 
                        is_deleted: true,
                        content: 'Mensaje eliminado'
                    });
                    
                    io.to(chatId).emit('message-deleted', {
                        chatId,
                        messageId,
                        userId: socket.data.userId,
                        timestamp: new Date().toISOString()
                    });
                    
                    logger.info(`🗑️ Mensaje ${messageId} eliminado del chat ${chatId}`);
                } catch (error) {
                    logger.error('Error al eliminar mensaje:', error);
                    socket.emit('error', { error: 'Error al eliminar mensaje' });
                }
            });
            
            // Manejar desconexión
            socket.on('disconnect', () => {
                const userId = socket.data.userId;
                logger.info(`🔌 Usuario desconectado: ${socket.id} (Usuario: ${userId || 'unknown'})`);
                
                if (userId) {
                    socket.broadcast.emit('user-offline', {
                        userId,
                        timestamp: new Date().toISOString()
                    });
                    
                    connectedUsers.delete(socket.id);
                }
            });
            
            // Manejar errores de conexión
            socket.on('ping', () => {
                socket.emit('pong', {
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // Endpoint para estadísticas de Socket.IO
        app.get('/api/socket-stats', (req, res) => {
            res.json({
                connectedUsers: connectedUsers.size,
                totalSockets: io.engine.clientsCount,
                rooms: Object.keys(io.sockets.adapter.rooms).length,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });
        
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                service: 'Core-Chat API',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
        
        // ==========================================
        // INICIAR SERVIDOR
        // ==========================================
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en ${config.appUrl}`);
            logger.info(`📚 API disponible en: ${config.appUrl}${config.apiPrefix}`);
            logger.info(`🔌 Socket.io disponible en: ${config.appUrl}`);
            logger.info(`📊 Stats: ${config.appUrl}/api/socket-stats`);
            logger.info(`🏥 Health: ${config.appUrl}/api/health`);
            logger.info(`🌐 Frontend permitido: ${FRONTEND_URL}`);
            logger.info('========================================');
        });
        
        // ==========================================
        // GRACEFUL SHUTDOWN
        // ==========================================
        const gracefulShutdown = () => {
            logger.info('⚠️ Cerrando servidor...');
            
            // Desconectar todos los sockets
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
            
            // Forzar cierre después de 5 segundos
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