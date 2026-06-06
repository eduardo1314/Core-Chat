import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'corechat_db',
    process.env.DB_USER || 'corechat_user',
    process.env.DB_PASSWORD || 'corechat123',
    
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL conectado exitosamente');
        
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Tablas creadas/sincronizadas');
        }
    } catch (error) {
        console.error('❌ Error al conectar PostgreSQL:', error);
        process.exit(1);
    }
};

export default sequelize;
