import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';
import { authService } from '../services/auth.service';


export const register = async (req: Request, res: Response) => {
    try {
        // Validar datos de entrada
        const dto = plainToClass(RegisterDTO, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const formattedErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));
            res.status(400).json({
                success: false,
                error: 'Error de validación',
                details: formattedErrors
            });
            return;
        }

        // Usar el servicio
        const result = await authService.register(dto);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error('Register error:', error);
        const status = error.message === 'Email already exists' ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        // Validar datos de entrada
        const dto = plainToClass(LoginDTO, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const formattedErrors = errors.map(error => ({
                property: error.property,
                constraints: error.constraints
            }));
            res.status(400).json({
                success: false,
                error: 'Error de validación',
                details: formattedErrors
            });
            return;
        }

        // Usar el servicio
        const result = await authService.login(dto);
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Login error:', error);
        const status = error.message === 'Invalid credentials' ? 401 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, error: 'No token' });
            return;
        }

        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        
        // Usar el servicio
        const user = await authService.getProfile(decoded.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
