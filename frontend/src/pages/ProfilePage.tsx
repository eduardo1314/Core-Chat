import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Profile from '../components/profile';
import { getMyProfileService } from '../services/user.service';
import { UserProfile } from '../types';

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================
    // CARGAR PERFIL
    // ============================================
    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getMyProfileService();
            console.log('📥 Perfil recibido:', response);
            console.log('📥 Avatar URL:', response.data?.avatar_url);
            
            if (response.success && response.data) {
                setProfile(response.data);
            } else {
                setError(response.error || 'Error al cargar perfil');
            }
        } catch (err: any) {
            console.error('❌ Error:', err);
            setError(err?.error || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // ============================================
    // HANDLERS AVATAR
    // ============================================
    const handleAvatarUpdated = async (avatarUrl: string) => {
        console.log('🔄 Avatar actualizado:', avatarUrl);
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
        await loadProfile();
    };

    const handleAvatarRemoved = async () => {
        setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
        await loadProfile();
    };

    const handleAvatarError = (error: string) => {
        console.error('❌ Error de avatar:', error);
    };

    // ============================================
    // RENDER
    // ============================================
    const displayName = user?.username || profile?.username || 'Usuario';
    const displayEmail = user?.email || profile?.email || '';
    const avatarUrl = profile?.avatar_url || null;

    console.log('🖼️ URL a mostrar:', avatarUrl);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
                    <p className="text-red-500 text-lg mb-4">❌ {error}</p>
                    <button
                        onClick={loadProfile}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-center relative">
                        <div className="relative inline-block">
                            <Profile
                                currentAvatar={avatarUrl}
                                onAvatarUpdated={handleAvatarUpdated}
                                onAvatarRemoved={handleAvatarRemoved}
                                onError={handleAvatarError}
                                size={120}
                            />
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mt-4">
                            {displayName}
                        </h1>
                        <p className="text-blue-100">{displayEmail}</p>
                    </div>

                    {/* CONTENIDO */}
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">Usuario</span>
                                <span className="font-medium dark:text-white">{displayName}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">Email</span>
                                <span className="font-medium dark:text-white">{displayEmail}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">Estado</span>
                                <span className="text-green-500 font-medium">● En línea</span>
                            </div>

                            {avatarUrl && (
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Avatar</span>
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                     foto de perfil  actulizada
                                    </span>
                                </div>
                            )}

                            {profile?.created_at && (
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Miembro desde</span>
                                    <span className="font-medium dark:text-white">
                                        {new Date(profile.created_at).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* BOTONES */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/chat"
                                className="flex-1 bg-blue-500 text-white text-center py-2.5 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                            >
                                💬 Volver al chat
                            </Link>
                            <button
                                onClick={logout}
                                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition duration-200 font-medium"
                            >
                                🚪 Cerrar Sesión
                            </button>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;