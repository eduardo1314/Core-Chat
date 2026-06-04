import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import { ApiResponse } from './types';

const app: Express = express();

app.use(cors({
    origin: config.frontendUrl,
    credentials: true
}));

// funcion hello world para probar el servidor
//✅ Ruta Hello World (NUEVA)
app.get('/', (req: Request, res: Response) => {
    res.send('hello world');
});



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
});

app.get(`${config.apiPrefix}/health`, (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: config.nodeEnv
        }
    };
    res.json(response);
});

app.get(`${config.apiPrefix}/mensaje`, (req: Request, res: Response) => {
    const response: ApiResponse = {
        success: true,
        data: {
            mensaje: 'Hola desde el backend',
            entorno: config.nodeEnv,
            version: 'v1'
        }
    };
    res.json(response);
});

app.get(`${config.apiPrefix}/config`, (req: Request, res: Response) => {
    res.json({
        environment: config.nodeEnv,
        port: config.port,
        url: config.appUrl,
        frontendUrl: config.frontendUrl,
        apiPrefix: config.apiPrefix,
        timestamp: new Date().toISOString()
    });
});

app.use((req: Request, res: Response) => {
    const response: ApiResponse = {
        success: false,
        error: `Ruta no encontrada: ${req.method} ${req.path}`
    };
    res.status(404).json(response);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });
    
    const response: ApiResponse = {
        success: false,
        error: 'Error interno del servidor'
    };
    res.status(500).json(response);
});

export default app;
