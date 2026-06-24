import multer from 'multer';

// Almacenamiento en memoria (no guarda en disco)
const storage = multer.memoryStorage();

// Validación de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Usa JPG, PNG, GIF o WEBP.'), false);
    }
};

// Configuración de Multer
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: fileFilter
});

// Middleware para un solo archivo con nombre 'avatar'
export const uploadAvatar = upload.single('avatar');