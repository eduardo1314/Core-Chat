import multer from 'multer';

// ============================================
// CONFIGURACIÓN EXISTENTE 
// ============================================

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Usa JPG, PNG, GIF o WEBP.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter: fileFilter
});

export const uploadAvatar = upload.single('avatar');

// ============================================
// MIDDLEWARE PARA STORIES
// ============================================

const storyFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm'
    ];
    const allowedExtensions = /jpeg|jpg|png|gif|webp|mp4|mov|webm/;
    const extname = allowedExtensions.test(file.originalname.toLowerCase().split('.').pop() || '');
    
    if (allowedTypes.includes(file.mimetype) && extname) {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Usa imágenes (JPG, PNG, GIF, WEBP) o videos (MP4, MOV, WEBM).'), false);
    }
};

const storyUpload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter: storyFileFilter
});

export const uploadStory = storyUpload.single('media');
export const uploadStoryImage = storyUpload.single('image');