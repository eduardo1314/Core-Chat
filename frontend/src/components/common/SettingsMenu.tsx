import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { getFriendsService } from '../../services/friends.service';
import { useSocket } from '../../hooks/useSocket'; 
import ThemeToggle from './ThemeToggle';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const { friends, unblockUser, loadFriends } = useFriends();
    const [showBlockedList, setShowBlockedList] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState(friends.filter(f => f.status === 'blocked'));

    // Obtener eventos de socket
    const { onUserStatusUpdated, offUserStatusUpdated } = useSocket();

    // Actualizar la lista de bloqueados cuando friends cambie
    useEffect(() => {
        setBlockedUsers(friends.filter(f => f.status === 'blocked'));
    }, [friends]);

    //  ESCUCHAR CAMBIOS EN TIEMPO REAL (cuando alguien bloquea/desbloquea)
    useEffect(() => {
        const handleUserStatusUpdated = (data: { userId: string; status: string }) => {
            console.log('📢 [SettingsMenu] Estado de usuario actualizado:', data);
            
            //  Recargar la lista de amigos para actualizar bloqueados
            loadFriends();
        };

        //  Registrar listener
        onUserStatusUpdated(handleUserStatusUpdated);

        return () => {
            offUserStatusUpdated(handleUserStatusUpdated);
        };
    }, [onUserStatusUpdated, offUserStatusUpdated, loadFriends]);

  

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowBlockedList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUnblock = async (friendId: string | undefined) => {
        if (!friendId) {
            console.error('No friendId provided');
            return;
        }
        try {
            // Desbloquear usuario
            await unblockUser(friendId);
            
            // Recargar amigos
            await loadFriends();
            
            //  Obtener lista actualizada
            const response = await getFriendsService();
            if (response.success && response.data) {
                const updatedBlocked = response.data.filter(f => f.status === 'blocked');
                setBlockedUsers(updatedBlocked);
            }
            
            alert('✅ Usuario desbloqueado');
        } catch (error) {
            console.error('Error al desbloquear:', error);
            alert('❌ Error al desbloquear usuario');
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Botón de tres rayas */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Menú"
            >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Menú desplegable */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header del menú */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{user?.username}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-2">
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="text-xl">👤</span>
                            <span className="text-gray-700 dark:text-gray-300">Mi Perfil</span>
                        </Link>

                        {/* Sección de usuarios bloqueados */}
                        <button
                            onClick={() => setShowBlockedList(!showBlockedList)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🚫</span>
                                <span className="text-gray-700 dark:text-gray-300">Usuarios Bloqueados</span>
                            </div>
                            {blockedUsers.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {blockedUsers.length}
                                </span>
                            )}
                        </button>

                        {/* Lista de bloqueados (expandible) */}
                        {showBlockedList && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                                {blockedUsers.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No hay usuarios bloqueados
                                    </div>
                                ) : (
                                    blockedUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                                                    {user.friend?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-through">
                                                        {user.friend?.username}
                                                    </p>
                                                    <p className="text-xs text-red-500">Bloqueado</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnblock(user.friend?.id)}
                                                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                                            >
                                                Desbloquear
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* Tema oscuro/claro */}
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🌙</span>
                                <span className="text-gray-700 dark:text-gray-300">Modo Oscuro</span>
                            </div>
                            <ThemeToggle />
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-2"
                        >
                            <span className="text-xl">🚪</span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsMenu;