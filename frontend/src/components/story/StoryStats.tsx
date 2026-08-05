import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStoryStats } from '../../hooks/useStoryStats';
import { Heart, Eye, ArrowLeft, TrendingUp, X } from 'lucide-react';

interface StoryStatsProps {
    storyId?: string;
    onClose?: () => void;
}

const StoryStats: React.FC<StoryStatsProps> = ({ storyId: propStoryId, onClose }) => {
    const { storyId: paramStoryId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();
    const { viewers, likers, viewsCount, likesCount, loading, error, loadStats } = useStoryStats();

    const [activeTab, setActiveTab] = useState<'viewers' | 'likers'>('viewers');

    const storyId = propStoryId || paramStoryId;

    useEffect(() => {
        if (storyId) {
            loadStats(storyId);
        }
    }, [storyId]);

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/10">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando estadísticas...</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Un momento por favor</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-500/20">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😅</div>
                        <p className="text-red-500 font-medium mb-2">{error}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Intenta de nuevo más tarde</p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition shadow-lg shadow-blue-500/25"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentList = activeTab === 'viewers' ? viewers : likers;
    const engagementRate = viewsCount > 0 ? Math.round((likesCount / viewsCount) * 100) : 0;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 animate-scaleIn">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClose}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                            </button>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Estadísticas
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition lg:hidden"
                        >
                            <X className="w-5 h-5 text-gray-900 dark:text-white" />
                        </button>
                    </div>
                </div>

                {/* Resumen de métricas - Estilo Instagram */}
                <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex justify-around">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {viewsCount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Vistas</p>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-pink-500">
                                {likesCount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-500">
                                {engagementRate}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                        </div>
                    </div>
                </div>

                {/* Tabs - Estilo Instagram */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('viewers')}
                        className={`flex-1 py-3 text-sm font-medium transition relative ${
                            activeTab === 'viewers'
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>Vistas</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {viewsCount}
                            </span>
                        </div>
                        {activeTab === 'viewers' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('likers')}
                        className={`flex-1 py-3 text-sm font-medium transition relative ${
                            activeTab === 'likers'
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Heart className="w-4 h-4" />
                            <span>Likes</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {likesCount}
                            </span>
                        </div>
                        {activeTab === 'likers' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-pink-500 rounded-full" />
                        )}
                    </button>
                </div>

                {/* Lista de usuarios - Estilo Instagram vertical */}
                <div className="overflow-y-auto max-h-[50vh]">
                    {currentList.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="text-6xl mb-4">
                                {activeTab === 'viewers' ? '👀' : '💔'}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                {activeTab === 'viewers'
                                    ? 'Nadie ha visto esta historia aún'
                                    : 'Nadie ha dado like a esta historia aún'}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                {activeTab === 'viewers'
                                    ? 'Comparte tu historia para llegar a más personas'
                                    : 'Anima a tus amigos a dar like'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {currentList.map((viewer) => (
                                <div
                                    key={viewer.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                                    onClick={() => {
                                        handleClose();
                                        navigate(`/profile/${viewer.id}`);
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {viewer.avatar_url ? (
                                            <img
                                                src={viewer.avatar_url}
                                                alt={viewer.username}
                                                className="w-11 h-11 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                                {viewer.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                                            viewer.status === 'online' 
                                                ? 'bg-green-500' 
                                                : 'bg-gray-400'
                                        }`} />
                                    </div>

                                    {/* Info del usuario */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {viewer.username}
                                            </p>
                                            {viewer.status === 'online' && (
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {viewer.status === 'online' ? 'Activo ahora' : 'Desconectado'}
                                        </p>
                                    </div>

                                    {/* Ícono de acción */}
                                    <div className="flex-shrink-0">
                                        {activeTab === 'likers' ? (
                                            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-blue-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con resumen */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>{viewsCount} vistas</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                            <span>{likesCount} likes</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{engagementRate}% engagement</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilos de animación */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.25s ease-out;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default StoryStats;