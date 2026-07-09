import { Server, Socket } from 'socket.io';
import { User } from '../../models';
import { connectedUsers, userSockets } from '../index';
import logger from '../../utils/logger';

// ============================================
// CONFIGURACIÓN DE HANDLERS DE USUARIO
// ============================================
export const setupUserHandlers = (io: Server, socket: Socket) => {

    // ==========================================
    // 1. IDENTIFICAR USUARIO (SET-USER)
    // ==========================================
    socket.on('set-user', async (userId) => {
        if (!userId) {
            logger.warn('⚠️ set-user sin userId');
            return;
        }

        // Asignar userId al socket
        socket.data.userId = userId;

        // Unir al usuario a su sala personal 
        socket.join(`user_${userId}`);

        // Guardar en connectedUsers (socketId -> userId)
        connectedUsers.set(socket.id, userId);

        // Guardar en userSockets (userId -> Set de socketIds)
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        try {
            const now = new Date();

            // Verificar si el usuario ya estaba online
            const wasOffline = !userSockets.has(userId) || userSockets.get(userId)!.size === 1;

            // Actualizar estado del usuario en la base de datos
            await User.update(
                { status: 'online', last_seen: now },
                { where: { id: userId } }
            );

            // Obtener datos actualizados del usuario
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen']
            });

            // ==========================================
            //  Enviar lista de usuarios online al reconectar
            // ==========================================
            if (wasOffline) {
                logger.info(`🟢 Usuario ${userId} se reconectó, emitiendo user-online a todos`);
                
                // Notificar a TODOS los usuarios que este usuario está online
                io.emit('user-online', {
                    userId,
                    username: user?.username,
                    status: 'online',
                    lastSeen: now.toISOString()
                });

                // ==========================================
                // ENVIAR LISTA DE USUARIOS ONLINE AL RECONECTADO
                // ==========================================
                const onlineUsers = [];
                for (const [uid, sockets] of userSockets.entries()) {
                    if (uid !== userId && sockets.size > 0) {
                        try {
                            const onlineUser = await User.findByPk(uid, {
                                attributes: ['id', 'username', 'status', 'last_seen']
                            });
                            if (onlineUser) {
                                onlineUsers.push({
                                    userId: onlineUser.id,
                                    username: onlineUser.username,
                                    status: onlineUser.status,
                                    lastSeen: onlineUser.last_seen
                                });
                            }
                        } catch (error) {
                            logger.error(`Error al obtener usuario ${uid}:`, error);
                        }
                    }
                }

                socket.emit('online-users-list', {
                    users: onlineUsers,
                    timestamp: new Date().toISOString()
                });

                logger.info(`📋 Enviada lista de ${onlineUsers.length} usuarios online a ${userId}`);

            } else {
                logger.info(`🔄 Usuario ${userId} ya estaba online, reconectando socket`);
                
                const onlineUsers = [];
                for (const [uid, sockets] of userSockets.entries()) {
                    if (uid !== userId && sockets.size > 0) {
                        try {
                            const onlineUser = await User.findByPk(uid, {
                                attributes: ['id', 'username', 'status', 'last_seen']
                            });
                            if (onlineUser) {
                                onlineUsers.push({
                                    userId: onlineUser.id,
                                    username: onlineUser.username,
                                    status: onlineUser.status,
                                    lastSeen: onlineUser.last_seen
                                });
                            }
                        } catch (error) {
                            logger.error(`Error al obtener usuario ${uid}:`, error);
                        }
                    }
                }
                
                socket.emit('online-users-list', {
                    users: onlineUsers,
                    timestamp: new Date().toISOString()
                });
            }

            // Confirmar al usuario su estado actualizado
            socket.emit('user-status-updated', {
                status: 'online',
                lastSeen: now.toISOString()
            });

            // Emitir evento específico de reconexión
            socket.emit('reconnected', {
                userId,
                timestamp: now.toISOString()
            });

            logger.info(`🟢 Usuario ${userId} conectado (sockets: ${userSockets.get(userId)?.size || 0})`);

        } catch (error) {
            logger.error('❌ Error al actualizar estado:', error);
        }
    });

    // ==========================================
    // 2. CIERRE DE SESIÓN MANUAL (USER-OFFLINE)
    // ==========================================
    socket.on('user-offline', async (data) => {
        const userId = data?.userId || socket.data.userId;
        if (!userId) {
            logger.warn('⚠️ user-offline sin userId');
            return;
        }

        try {
            const now = new Date();

            // Actualizar estado a offline
            await User.update(
                { status: 'offline', last_seen: now },
                { where: { id: userId } }
            );

            //  Notificar a TODOS
            io.emit('user-offline', {
                userId,
                status: 'offline',
                lastSeen: now.toISOString()
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

            logger.info(`🔴 Usuario ${userId} se desconectó manualmente`);

        } catch (error) {
            logger.error('❌ Error al actualizar estado:', error);
        }
    });

    // ==========================================
    // 3. DESCONEXIÓN AUTOMÁTICA (DISCONNECT)
    // ==========================================
    socket.on('disconnect', async () => {
        const userId = socket.data.userId;
        logger.info(`🔌 Socket desconectado: ${socket.id} (Usuario: ${userId || 'unknown'})`);

        if (userId) {
            // Eliminar el socket de userSockets
            if (userSockets.has(userId)) {
                userSockets.get(userId)!.delete(socket.id);

                // Si no quedan sockets activos, marcar como offline
                if (userSockets.get(userId)!.size === 0) {
                    userSockets.delete(userId);

                    try {
                        const now = new Date();

                        await User.update(
                            { status: 'offline', last_seen: now },
                            { where: { id: userId } }
                        );

                        // Esperar 2 segundos antes de emitir offline
                        setTimeout(async () => {
                            // Verificar si el usuario se reconectó en el interim
                            if (!userSockets.has(userId)) {
                                io.emit('user-offline', {
                                    userId,
                                    status: 'offline',
                                    lastSeen: now.toISOString()
                                });
                                logger.info(`🔴 Usuario ${userId} desconectado (offline) después de 2s`);
                            } else {
                                logger.info(`🟢 Usuario ${userId} se reconectó antes de emitir offline`);
                            }
                        }, 2000);

                    } catch (error) {
                        logger.error('❌ Error al actualizar estado:', error);
                    }
                }
            }

            connectedUsers.delete(socket.id);
        }
    });

    // ==========================================
    // 4. OBTENER USUARIOS CONECTADOS
    // ==========================================
    socket.on('get-connected-users', async () => {
        const userId = socket.data.userId;
        const onlineUsers = [];
        
        for (const [uid, sockets] of userSockets.entries()) {
            if (uid !== userId && sockets.size > 0) {
                try {
                    const user = await User.findByPk(uid, {
                        attributes: ['id', 'username', 'status', 'last_seen']
                    });
                    if (user) {
                        onlineUsers.push({
                            userId: user.id,
                            username: user.username,
                            status: user.status,
                            lastSeen: user.last_seen
                        });
                    }
                } catch (error) {
                    logger.error(`Error al obtener usuario ${uid}:`, error);
                }
            }
        }
        
        socket.emit('connected-users', {
            users: onlineUsers,
            count: onlineUsers.length,
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 5. VERIFICAR SI UN USUARIO ESTÁ EN LÍNEA
    // ==========================================
    socket.on('check-user-online', (userId: string) => {
        const isOnline = userSockets.has(userId) && userSockets.get(userId)!.size > 0;
        socket.emit('user-online-status', {
            userId,
            isOnline,
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 6. ACTUALIZAR ESTADO MANUALMENTE
    // ==========================================
    socket.on('update-status', async (data) => {
        try {
            const userId = socket.data.userId;
            const { status } = data;

            if (!userId || !status) return;

            const now = new Date();

            await User.update(
                { status, last_seen: now },
                { where: { id: userId } }
            );

            socket.emit('user-status-updated', {
                status,
                lastSeen: now.toISOString()
            });

            logger.info(`📌 Usuario ${userId} actualizó estado a: ${status}`);

        } catch (error) {
            logger.error('❌ Error al actualizar estado:', error);
        }
    });

    // ==========================================
    // 7. PING PARA MANTENER CONEXIÓN
    // ==========================================
    socket.on('ping', () => {
        socket.emit('pong', {
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 8. RECONEXIÓN MANUAL
    // ==========================================
    socket.on('reconnect-request', async () => {
        const userId = socket.data.userId;
        if (!userId) return;

        try {
            const now = new Date();
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen']
            });

            await User.update(
                { status: 'online', last_seen: now },
                { where: { id: userId } }
            );

            // Emitir a TODOS que este usuario está online
            io.emit('user-online', {
                userId,
                username: user?.username,
                status: 'online',
                lastSeen: now.toISOString()
            });

            // Enviar lista de usuarios online al reconectado
            const onlineUsers = [];
            for (const [uid, sockets] of userSockets.entries()) {
                if (uid !== userId && sockets.size > 0) {
                    try {
                        const onlineUser = await User.findByPk(uid, {
                            attributes: ['id', 'username', 'status', 'last_seen']
                        });
                        if (onlineUser) {
                            onlineUsers.push({
                                userId: onlineUser.id,
                                username: onlineUser.username,
                                status: onlineUser.status,
                                lastSeen: onlineUser.last_seen
                            });
                        }
                    } catch (error) {
                        logger.error(`Error al obtener usuario ${uid}:`, error);
                    }
                }
            }
            
            socket.emit('online-users-list', {
                users: onlineUsers,
                timestamp: new Date().toISOString()
            });

            socket.emit('reconnect-confirmed', {
                userId,
                timestamp: now.toISOString()
            });

            logger.info(`🔄 Usuario ${userId} solicitó reconexión manual`);

        } catch (error) {
            logger.error('❌ Error en reconexión manual:', error);
        }
    });
};