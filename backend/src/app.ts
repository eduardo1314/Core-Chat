import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import friendRoutes from './routes/friend.routes';
import userRoutes from './routes/user.routes';
import storyRoutes from "./routes/story.routes";
import cloudinaryRoutes from "./routes/cloudinary.routes";
import musicRoutes from "./routes/music.routes";
import audioRoutes from './routes/audio.routes';
import cookieParser from 'cookie-parser';

const app: Express = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:3000",
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

//  Health check 
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        service: 'Core-Chat API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ruta principal
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'hello world, desde el universo de dragon ball JAJA',
        endpoints: {
            auth: `${config.apiPrefix}/auth`,
            chats: `${config.apiPrefix}/chats`,
            messages: `${config.apiPrefix}/messages`,
            friends: `${config.apiPrefix}/friends`,
            users: `${config.apiPrefix}/users`,
            stories: `${config.apiPrefix}/stories`,
            music: `${config.apiPrefix}/music`,
            audio: `${config.apiPrefix}/audio`,
        }
    });
});

// Rutas de la API
app.use(`${config.apiPrefix}/auth`, authRoutes);  
app.use(`${config.apiPrefix}/chats`, chatRoutes);
app.use(`${config.apiPrefix}/messages`, messageRoutes);
app.use(`${config.apiPrefix}/friends`, friendRoutes);
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/cloudinary`, cloudinaryRoutes);
app.use(`${config.apiPrefix}/stories`, storyRoutes);
app.use(`${config.apiPrefix}/music`, musicRoutes);
app.use(`${config.apiPrefix}/audio`, audioRoutes);


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