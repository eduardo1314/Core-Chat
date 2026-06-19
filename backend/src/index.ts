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
import { Op } from 'sequelize'; 

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
        const connectedUsers = new Map<string, string>(); // socketId -> userId
        const userSockets = new Map<string, Set<string>>(); // userId -> Set de socketIds
        
        //  Función para emitir actualización de no leídos a un usuario específico
        const emitUnreadUpdate = async (chatId: string, userId: string) => {
            try {
                // Contar mensajes no leídos para este usuario en este chat
                const participant = await Participant.findOne({
                    where: { chat_id: chatId, user_id: userId }
                });
                
                if (!participant) return;
                
                const lastReadAt = participant.last_read_at || new Date(0);
                
                const unreadCount = await Message.count({
                    where: {
                        chat_id: chatId,
                        user_id: { [Op.ne]: userId },
                        is_read: false,
                        created_at: { [Op.gt]: lastReadAt }
                    }
                });
                
                // Emitir al usuario específico usando sus sockets
                const userSocketIds = userSockets.get(userId);
                if (userSocketIds) {
                    for (const socketId of userSocketIds) {
                        io.to(socketId).emit('unread-update', {
                            chatId,
                            count: unreadCount
                        });
                    }
                }
            } catch (error) {
                logger.error('❌ Error al emitir actualización de no leídos:', error);
            }
        };

        // Manejo de conexiones Socket.IO
        io.on('connection', (socket) => {
            logger.info(`🔌 Usuario conectado: ${socket.id}`);
            
            // ==========================================
            // 1. IDENTIFICAR USUARIO
            // ==========================================
            socket.on('set-user', async (userId) => {
                if (!userId) {
                    logger.warn('⚠️ Intento de set-user sin userId');
                    return;
                }
                
                socket.data.userId = userId;
                connectedUsers.set(socket.id, userId);
                
                // Guardar socket en lista de sockets del usuario
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId)!.add(socket.id);
                
                // Actualizar estado en la base de datos
                try {
                    await User.update(
                        { 
                            status: 'online',
                            last_seen: new Date()
                        },
                        { where: { id: userId } }
                    );
                    
                    const user = await User.findByPk(userId, {
                        attributes: ['id', 'username', 'status', 'last_seen']
                    });
                    
                    logger.info(`📌 Usuario ${userId} conectado (status: online)`);
                    
                    // Notificar a otros usuarios que este usuario está en línea
                    socket.broadcast.emit('user-online', {
                        userId,
                        username: user?.username,
                        socketId: socket.id,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Confirmar al usuario
                    socket.emit('user-status-updated', {
                        status: 'online',
                        last_seen: new Date().toISOString()
                    });
                    
                } catch (error) {
                    logger.error('❌ Error al actualizar estado del usuario:', error);
                }
            });
            
            // ==========================================
            // 2. UNIRSE A UN CHAT
            // ==========================================
            socket.on('join-chat', (chatId: string) => {
                if (!chatId) {
                    logger.warn('⚠️ Intento de join-chat sin chatId');
                    return;
                }
                
                socket.join(chatId);
                logger.info(`📢 Socket ${socket.id} se unió al chat ${chatId}`);
                
                socket.emit('joined-chat', {
                    chatId,
                    success: true
                });
            });
            
            // ==========================================
            // 3. SALIR DE UN CHAT
            // ==========================================
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
            
            // ==========================================
            // 4. ENVIAR MENSAJE (CON NO LEÍDOS EN TIEMPO REAL)
            // ==========================================
            socket.on('send-message', async (data) => {
                try {
                    const { chatId, content, userId, username, tempId, messageId } = data;
                    
                    if (!chatId || !content || !userId) {
                        logger.error('❌ Datos incompletos:', { chatId, content, userId });
                        socket.emit('message-error', { 
                            error: 'Datos incompletos',
                            tempId: tempId || null
                        });
                        return;
                    }
                    
                    const uniqueId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    
                    if (processedMessages.has(uniqueId)) {
                        logger.warn(`⚠️ Mensaje duplicado ignorado: ${uniqueId}`);
                        return;
                    }
                    
                    processedMessages.set(uniqueId, Date.now());
                    setTimeout(() => {
                        processedMessages.delete(uniqueId);
                    }, 10000);
                    
                    logger.info(`📨 Recibido mensaje de ${username}: "${content}" en chat ${chatId}`);
                    
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
                    
                    await Chat.update(
                        { updated_at: new Date() },
                        { where: { id: chatId } }
                    );
                    
                    const messageData = {
                        ...fullMessage.toJSON(),
                        tempId: tempId || null,
                        uniqueId: uniqueId,
                        _serverTimestamp: new Date().toISOString()
                    };
                    
                    socket.to(chatId).emit('new-message', messageData);
                    
                    socket.emit('message-sent', {
                        ...messageData,
                        _confirmed: true
                    });
                    
                    io.to(chatId).emit('chat-updated', {
                        chatId,
                        lastMessage: content,
                        lastMessageId: message.id,
                        timestamp: new Date().toISOString(),
                        userId: userId,
                        username: username
                    });
                    
                    // ==========================================
                    // EMITIR ACTUALIZACIÓN DE NO LEÍDOS
                    // ==========================================
                    // Obtener todos los participantes del chat (excepto el emisor)
                    const participants = await Participant.findAll({
                        where: { chat_id: chatId, user_id: { [Op.ne]: userId } }
                    });
                    
                    // Para cada participante, emitir actualización de no leídos
                    for (const p of participants) {
                        await emitUnreadUpdate(chatId, p.user_id);
                    }
                    
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
            
            // ==========================================
            // 5. INDICADOR DE ESCRITURA
            // ==========================================
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
            
            // ==========================================
            // 6. ELIMINAR MENSAJE
            // ==========================================
            socket.on('delete-message', async (data) => {
                try {
                    const { chatId, messageId } = data;
                    if (!chatId || !messageId) return;
                    
                    const message = await Message.findByPk(messageId);
                    if (!message) {
                        socket.emit('error', { error: 'Mensaje no encontrado' });
                        return;
                    }
                    
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
                    
                    //  Actualizar no leídos después de eliminar mensaje
                    const participants = await Participant.findAll({
                        where: { chat_id: chatId, user_id: { [Op.ne]: socket.data.userId } }
                    });
                    
                    for (const p of participants) {
                        await emitUnreadUpdate(chatId, p.user_id);
                    }
                    
                    logger.info(`🗑️ Mensaje ${messageId} eliminado del chat ${chatId}`);
                } catch (error) {
                    logger.error('Error al eliminar mensaje:', error);
                    socket.emit('error', { error: 'Error al eliminar mensaje' });
                }
            });
            
            // ==========================================
            // 7. CIERRE DE SESIÓN MANUAL
            // ==========================================
            socket.on('user-offline', async (data) => {
                const userId = data?.userId || socket.data.userId;
                
                if (userId) {
                    try {
                        await User.update(
                            { 
                                status: 'offline',
                                last_seen: new Date()
                            },
                            { where: { id: userId } }
                        );
                        
                        socket.broadcast.emit('user-offline', {
                            userId,
                            timestamp: new Date().toISOString()
                        });
                        
                        // Eliminar todos los sockets del usuario
                        if (userSockets.has(userId)) {
                            userSockets.get(userId)!.forEach((socketId) => {
                                const s = io.sockets.sockets.get(socketId);
                                if (s) {
                                    s.disconnect(true);
                                }
                            });
                            userSockets.delete(userId);
                        }
                        
                        connectedUsers.delete(socket.id);
                        
                        logger.info(`📌 Usuario ${userId} se desconectó manualmente`);
                        
                    } catch (error) {
                        logger.error('❌ Error al actualizar estado:', error);
                    }
                }
            });
            
            // ==========================================
            // 8. DESCONEXIÓN
            // ==========================================
            socket.on('disconnect', async () => {
                const userId = socket.data.userId;
                logger.info(`🔌 Usuario desconectado: ${socket.id} (Usuario: ${userId || 'unknown'})`);
                
                if (userId) {
                    // Verificar si el usuario tiene otros sockets activos
                    if (userSockets.has(userId)) {
                        userSockets.get(userId)!.delete(socket.id);
                        
                        // Si solo queda este socket, marcar como offline
                        if (userSockets.get(userId)!.size === 0) {
                            userSockets.delete(userId);
                            
                            try {
                                await User.update(
                                    { 
                                        status: 'offline',
                                        last_seen: new Date()
                                    },
                                    { where: { id: userId } }
                                );
                                
                                socket.broadcast.emit('user-offline', {
                                    userId,
                                    timestamp: new Date().toISOString()
                                });
                                
                                logger.info(`📌 Usuario ${userId} desconectado (status: offline)`);
                                
                            } catch (error) {
                                logger.error('❌ Error al actualizar estado:', error);
                            }
                        }
                    }
                    
                    connectedUsers.delete(socket.id);
                }
            });
            
            // ==========================================
            // 9. PING PARA MANTENER CONEXIÓN
            // ==========================================
            socket.on('ping', () => {
                socket.emit('pong', {
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // ==========================================
        //  Endpoint para obtener no leídos de un usuario
        // ==========================================
        app.get('/api/unread/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { chatId } = req.query;
                
                if (chatId) {
                    const count = await Message.count({
                        where: {
                            chat_id: chatId as string,
                            user_id: { [Op.ne]: userId },
                            is_read: false
                        }
                    });
                    res.json({ success: true, count });
                } else {
                    // Obtener todos los no leídos del usuario
                    const participants = await Participant.findAll({
                        where: { user_id: userId },
                        attributes: ['chat_id', 'last_read_at']
                    });
                    
                    let totalUnread = 0;
                    for (const p of participants) {
                        const lastReadAt = p.last_read_at || new Date(0);
                        const count = await Message.count({
                            where: {
                                chat_id: p.chat_id,
                                user_id: { [Op.ne]: userId },
                                is_read: false,
                                created_at: { [Op.gt]: lastReadAt }
                            }
                        });
                        totalUnread += count;
                    }
                    
                    res.json({ success: true, totalUnread });
                }
            } catch (error) {
                res.status(500).json({ success: false, error: 'Error al obtener no leídos' });
            }
        });
        
        // ==========================================
        // ENDPOINTS
        // ==========================================
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