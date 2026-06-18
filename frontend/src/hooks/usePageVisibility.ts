import { useEffect, useRef,  } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const usePageVisibility = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const isOfflineSentRef = useRef(false);
    const isRegisteredRef = useRef(false); 

    useEffect(() => {
        // Prevenir registros duplicados
        if (isRegisteredRef.current) {
            console.log('⚠️ usePageVisibility ya está registrado, omitiendo...');
            return;
        }
        isRegisteredRef.current = true;

        if (!user?.id || !socket) {
            console.log('⏳ usePageVisibility esperando usuario o socket...');
            return;
        }

        console.log('✅ usePageVisibility registrado para usuario:', user.id);

        // ==========================================
        // 1. CUANDO EL USUARIO CAMBIA DE PESTAÑA
        // ==========================================
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log(`📤 Usuario ${user.id} cambió de pestaña - marcando offline`);
                isOfflineSentRef.current = true;
                socket.emit('user-offline', { userId: user.id });
            } else {
                console.log(`📤 Usuario ${user.id} volvió a la pestaña - marcando online`);
                isOfflineSentRef.current = false;
                socket.emit('set-user', user.id);
            }
        };

        // ==========================================
        // 2. CUANDO EL USUARIO CIERRA LA PESTAÑA
        // ==========================================
        const handleBeforeUnload = () => {
            if (!isOfflineSentRef.current && user?.id) {
                console.log(`📤 Usuario ${user.id} cerrando pestaña - offline`);
                socket.emit('user-offline', { userId: user.id });
                socket.disconnect();
            }
        };

        // ==========================================
        // 3. CUANDO EL USUARIO RECARGA LA PÁGINA
        // ==========================================
        const handlePageHide = () => {
            if (!isOfflineSentRef.current && user?.id) {
                console.log(`📤 Usuario ${user.id} recargando página - offline`);
                socket.emit('user-offline', { userId: user.id });
            }
        };

        // ==========================================
        // 4. CUANDO EL USUARIO CIERRA EL NAVEGADOR
        // ==========================================
        const handleUnload = () => {
            if (user?.id) {
                socket.emit('user-offline', { userId: user.id });
            }
        };

        //  Registrar todos los eventos
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('unload', handleUnload);

        //  Limpiar eventos
        return () => {
            console.log('🧹 Limpiando usePageVisibility');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('unload', handleUnload);
            isRegisteredRef.current = false;
        };
    }, [user?.id, socket]); //  Dependencias correctas
};