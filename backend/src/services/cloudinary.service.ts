import cloudinary from '../config/cloudinary';

// ============================================
// SUBIR MEDIA DE STORY
// ============================================
export const uploadStoryMedia = async (
    fileBuffer: Buffer,
    mimeType: string
): Promise<{ url: string; publicId: string; duration?: number }> => {
    const isVideo = mimeType.startsWith('video/');
    
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'corechat/stories',
                resource_type: isVideo ? 'video' : 'image',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                    ...(isVideo ? [{ duration: '30' }] : []),
                ],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });

    const uploadResult = result as any;
    return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        duration: uploadResult.duration,
    };
};

// ============================================
// ELIMINAR DE CLOUDINARY
// ============================================
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        console.log(`🗑️ Intentando eliminar de Cloudinary: ${publicId}`);
        
        let resourceType: 'image' | 'video' = 'image';
        if (publicId.includes('/audio/') || 
            publicId.includes('audio') || 
            publicId.endsWith('.mp3') || 
            publicId.endsWith('.wav') || 
            publicId.endsWith('.aac') ||
            publicId.endsWith('.m4a')) {
            resourceType = 'video';
            console.log('🎵 Detectado como audio (video resource_type)');
        } else {
            console.log('🖼️ Detectado como imagen');
        }
        
        console.log(`📤 Tipo de recurso: ${resourceType}`);
        
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
        });
        
        console.log('📤 Respuesta de Cloudinary:', result);
        
        if (result.result === 'ok') {
            console.log(`✅ Eliminado exitosamente: ${publicId}`);
            return true;
        } else if (result.result === 'not found') {
            console.warn(`⚠️ Recurso no encontrado en Cloudinary: ${publicId}`);
            return false;
        } else {
            console.warn(`⚠️ No se pudo eliminar: ${publicId}`, result);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error eliminando ${publicId}:`, error);
        return false;
    }
};

// ============================================
// EXTRAER PUBLIC ID
// ============================================
export const getPublicIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    
    try {
        console.log('🔍 Extrayendo publicId de:', url);
        
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        
        if (uploadIndex === -1) {
            console.warn('⚠️ No se encontró "upload" en la URL');
            return null;
        }
        
        const pathParts = parts.slice(uploadIndex + 2);
        const fullPath = pathParts.join('/');
        
        // Detectar si es audio
        const isAudio = url.includes('/video/') || 
                        url.includes('/audio/') || 
                        fullPath.endsWith('.mp3') || 
                        fullPath.endsWith('.wav') || 
                        fullPath.endsWith('.aac') ||
                        fullPath.endsWith('.m4a');
        
        let publicId: string;
        
        if (isAudio) {
            // Audio: mantener la extensión
            publicId = fullPath.split('?')[0];
            console.log('🎵 Audio detectado, manteniendo extensión');
        } else {
            // Imagen: quitar la extensión
            publicId = fullPath.split('.')[0];
            console.log('🖼️ Imagen detectada, quitando extensión');
        }
        
        console.log('✅ publicId extraído:', publicId);
        return publicId;
        
    } catch (error) {
        console.error('❌ Error al extraer publicId:', error);
        return null;
    }
};

// ============================================
// SUBIR AUDIO A CLOUDINARY
// ============================================
export const uploadAudioToCloudinary = async (
    audioBuffer: Buffer,
    userId: string
): Promise<string> => {
    try {
        console.log(`🎵 Subiendo audio para usuario ${userId}...`);
        
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `corechat/stories/audio/${userId}`,
                    resource_type: 'video',
                    transformation: [
                        { quality: 'auto:good' },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(audioBuffer);
        });

        const uploadResult = result as any;
        console.log('✅ Audio subido a Cloudinary:', uploadResult.secure_url);
        console.log('✅ PublicId del audio:', uploadResult.public_id);
        return uploadResult.secure_url;
    } catch (error) {
        console.error('❌ Error al subir audio a Cloudinary:', error);
        throw new Error('Error al subir el audio a Cloudinary');
    }
};

export default cloudinary;