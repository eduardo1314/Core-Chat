import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
    try {
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

        const { user, token } = await authService.register(dto);
        
        // Enviar token como cookie HttpOnly
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        res.status(201).json({ success: true, data: { user } });
    } catch (error: any) {
        console.error('Register error:', error);
        const status = error.message === 'Email already exists' ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
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

        const { user, token } = await authService.login(dto);
        
        // Enviar token como cookie HttpOnly
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        res.json({ success: true, data: { user } });
    } catch (error: any) {
        console.error('Login error:', error);
        const status = error.message === 'Invalid credentials' ? 401 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        // Obtener token de la cookie
        const token = req.cookies?.token;
        
        if (!token) {
            res.status(401).json({ success: false, error: 'No autorizado' });
            return;
        }

        const jwt = require('jsonwebtoken');
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        
        const user = await authService.getProfile(decoded.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token inválido' });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logout exitoso' });
};
