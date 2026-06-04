import { useState, useEffect } from 'react';
import api, { getMensaje, getConfig } from './services/api';
import { ConfigResponse } from './types';
import './App.css';

function App() {
    const [mensaje, setMensaje] = useState<string>('Cargando...');
    const [config, setConfig] = useState<ConfigResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Usar funciones tipadas
                const mensajeData = await getMensaje();
                setMensaje(mensajeData);
                
                const configData = await getConfig();
                setConfig(configData);
            } catch (err) {
                console.error('Error:', err);
                setMensaje('Error al conectar con el backend');
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="app">
            <h1>💬 Core-Chat</h1>
            
            <div className="card">
                <h2>Mensaje del backend:</h2>
                <p className="mensaje">{mensaje}</p>
            </div>

            {config && (
                <div className="card">
                    <h2>Configuración del backend:</h2>
                    <pre>{JSON.stringify(config, null, 2)}</pre>
                </div>
            )}

            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="status">
                <span className="dot"></span>
                Backend: {config ? 'Conectado ✅' : 'Desconectado ❌'}
                <span style={{ marginLeft: '1rem' }}>
                    Modo: {import.meta.env.MODE}
                </span>
            </div>
        </div>
    );
}

export default App;
