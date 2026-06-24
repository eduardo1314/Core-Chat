import cloudinary from './config/cloudinary';

async function testCloudinary() {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary conectado correctamente');
    } catch (error) {
        console.error('❌ Error al conectar con Cloudinary:', error);
    }
}

testCloudinary();