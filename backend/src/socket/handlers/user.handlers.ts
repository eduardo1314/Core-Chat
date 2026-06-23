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

        // Unir al usuario a su sala personal (necesario para palomitas)
        socket.join(`user_${userId}`);

        // Guardar en connectedUsers (socketId -> userId)
        connectedUsers.set(socket.id, userId);

        // Guardar en userSockets (userId -> Set de socketIds)
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        try {
            // Actualizar estado del usuario en la base de datos
            await User.update(
                { status: 'online', last_seen: new Date() },
                { where: { id: userId } }
            );

            // Obtener datos actualizados del usuario
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen']
            });

            // Notificar a otros usuarios que este usuario está en línea
            socket.broadcast.emit('user-online', {
                userId,
                username: user?.username,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            // Confirmar al usuario su estado actualizado
            socket.emit('user-status-updated', {
                status: 'online',
                last_seen: new Date().toISOString()
            });

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
            // Actualizar estado a offline
            await User.update(
                { status: 'offline', last_seen: new Date() },
                { where: { id: userId } }
            );

            // Notificar a otros usuarios
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
    });

    // ==========================================
    // 3. DESCONEXIÓN AUTOMÁTICA (DISCONNECT)
    // ==========================================
    socket.on('disconnect', async () => {
        const userId = socket.data.userId;
        logger.info(`🔌 Usuario desconectado: ${socket.id} (Usuario: ${userId || 'unknown'})`);

        if (userId) {
            // Eliminar el socket de userSockets
            if (userSockets.has(userId)) {
                userSockets.get(userId)!.delete(socket.id);

                // Si no quedan sockets activos, marcar como offline
                if (userSockets.get(userId)!.size === 0) {
                    userSockets.delete(userId);

                    try {
                        await User.update(
                            { status: 'offline', last_seen: new Date() },
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
    // 4. PING PARA MANTENER CONEXIÓN
    // ==========================================
    socket.on('ping', () => {
        socket.emit('pong', {
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 5. OBTENER USUARIOS CONECTADOS
    // ==========================================
    socket.on('get-connected-users', () => {
        const users = Array.from(connectedUsers.values());
        socket.emit('connected-users', {
            users,
            count: users.length,
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 6. VERIFICAR SI UN USUARIO ESTÁ EN LÍNEA
    // ==========================================
    socket.on('check-user-online', (userId: string) => {
        const isOnline = connectedUsers.has(userId);
        socket.emit('user-online-status', {
            userId,
            isOnline,
            timestamp: new Date().toISOString()
        });
    });

    // ==========================================
    // 7. ACTUALIZAR ESTADO MANUALMENTE
    // ==========================================
    socket.on('update-status', async (data) => {
        try {
            const userId = socket.data.userId;
            const { status } = data;

            if (!userId || !status) return;

            await User.update(
                { status: status, last_seen: new Date() },
                { where: { id: userId } }
            );

            socket.emit('user-status-updated', {
                status,
                last_seen: new Date().toISOString()
            });

            logger.info(`📌 Usuario ${userId} actualizó estado a: ${status}`);

        } catch (error) {
            logger.error('❌ Error al actualizar estado:', error);
        }
    });
};