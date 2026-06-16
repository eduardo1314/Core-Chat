import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-center">
                        <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center text-4xl font-bold text-blue-500 shadow-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-2xl font-bold text-white mt-4">{user?.username}</h1>
                        <p className="text-blue-100">{user?.email}</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Usuario</span>
                                <span className="font-medium">{user?.username}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium">{user?.email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500">Estado</span>
                                <span className="text-green-500">● En línea</span>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-4">
                            <Link
                                to="/chat"
                                className="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition"
                            >
                                Volver al chat
                            </Link>
                            <button
                                onClick={logout}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
