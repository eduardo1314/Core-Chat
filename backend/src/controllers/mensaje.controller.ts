import { Request, Response } from 'express';
import config from '../config';

export const getMensaje = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            mensaje: 'Hola desde el backend',
            entorno: config.nodeEnv,
            version: 'v1'
        }
    });
};

export const getConfig = (req: Request, res: Response) => {
    res.json({
        environment: config.nodeEnv,
        port: config.port,
        url: config.appUrl,
        frontendUrl: config.frontendUrl,
        apiPrefix: config.apiPrefix,
        timestamp: new Date().toISOString()
    });
};
