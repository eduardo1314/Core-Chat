import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegStatic as string);

// ============================================
// OBTENER DURACIÓN DEL AUDIO
// ============================================
export const getAudioDuration = async (previewUrl: string): Promise<number> => {
    let tempFile: string | null = null;
    
    try {
        const audioResponse = await axios.get(previewUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        tempFile = path.join(tempDir, `${uuidv4()}.mp3`);
        fs.writeFileSync(tempFile, audioResponse.data);

        return new Promise((resolve) => {
            if (!tempFile) {
                resolve(30);
                return;
            }

            ffmpeg.ffprobe(tempFile, (err, metadata) => {
                // Limpiar archivo temporal
                try {
                    if (tempFile && fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                        console.log('🧹 Archivo temporal eliminado:', tempFile);
                    }
                } catch (error) {}

                if (err) {
                    console.error('❌ Error al obtener duración:', err);
                    resolve(30);
                } else {
                    resolve(metadata?.format?.duration || 30);
                }
            });
        });
    } catch (error) {
        // Limpiar en caso de error
        try {
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (error) {}
        
        return 30;
    }
};