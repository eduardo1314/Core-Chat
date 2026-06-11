import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import friendRoutes from './routes/friend.routes';
import cookieParser from 'cookie-parser';


const app: Express = express();


// 2. CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:3001",
    "http://localhost:5173",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
});

// Ruta principal
app.get('/', (req: Request, res: Response) => {
    res.send('hello world, desde el universo de dragon ball');
});

// Rutas de la API
app.use(`${config.apiPrefix}/auth`, authRoutes);  
app.use(`${config.apiPrefix}/chats`, chatRoutes);
app.use(`${config.apiPrefix}/messages`, messageRoutes);
app.use(`${config.apiPrefix}/friends`, friendRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: `Ruta no encontrada: ${req.method} ${req.path}`
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

export default app;
