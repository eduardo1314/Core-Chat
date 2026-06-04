//aqui ira la logica de negocio para el mensaje


export const getMensajeService = () => {
    return {
        mensaje: 'Hola desde el backend',
        entorno: process.env.NODE_ENV || 'development',
        version: 'v1'
    };
};

export const getConfigService = () => {
    return {
        environment: process.env.NODE_ENV,
        port: process.env.APP_PORT,
        url: process.env.APP_URL,
        frontendUrl: process.env.APP_FRONTEND_URL,
        apiPrefix: process.env.API_PREFIX,
        timestamp: new Date().toISOString()
    };
};
