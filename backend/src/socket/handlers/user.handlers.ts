import { Server, Socket } from 'socket.io';
import { User } from '../../models';
import { connectedUsers, userSockets } from '../index';
import logger from '../../utils/logger';

export const setupUserHandlers = (io: Server, socket: Socket) => {
    
    // ==========================================
    // 1. IDENTIFICAR USUARIO 
    // ==========================================
    socket.on('set-user', async (userId) => {
        if (!userId) {
            logger.warn('⚠️ set-user sin userId');
            return;
        }

        socket.data.userId = userId;
        
        // Guardar en connectedUsers
        connectedUsers.set(socket.id, userId);
        
        // Guardar en userSockets
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        console.log(`🔵 [userSockets] Usuario ${userId} guardado. Sockets:`, Array.from(userSockets.get(userId) || []));
        console.log(`🔵 [userSockets] Total usuarios: ${userSockets.size}`);

        try {
            await User.update(
                { status: 'online', last_seen: new Date() },
                { where: { id: userId } }
            );

            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'status', 'last_seen']
            });

            socket.broadcast.emit('user-online', {
                userId,
                username: user?.username,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });

            socket.emit('user-status-updated', {
                status: 'online',
                last_seen: new Date().toISOString()
            });

        } catch (error) {
            logger.error('❌ Error al actualizar estado:', error);
        }
    });

    // ==========================================
    // 2. CIERRE DE SESIÓN MANUAL
    // ==========================================
    socket.on('user-offline', async (data) => {
        const userId = data?.userId || socket.data.userId;
        if (!userId) {
            logger.warn('⚠️ user-offline sin userId');
            return;
        }

        try {
            await User.update(
                { status: 'offline', last_seen: new Date() },
                { where: { id: userId } }
            );

            socket.broadcast.emit('user-offline', {
                userId,
                timestamp: new Date().toISOString()
            });

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
    // 3. DESCONEXIÓN AUTOMÁTICA 
    // ==========================================
    socket.on('disconnect', async () => {
        const userId = socket.data.userId;
        logger.info(`🔌 Usuario desconectado: ${socket.id} (Usuario: ${userId || 'unknown'})`);

        if (userId) {
            if (userSockets.has(userId)) {
                userSockets.get(userId)!.delete(socket.id);
                
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
    // 6. VERIFICAR SI UN USUARIO ESTÁ EN LÍNEA (NUEVO)
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