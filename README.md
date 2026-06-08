<div align="center">
  
# 💬 Core-Chat

### Aplicación de Chat en Tiempo Real Full Stack

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

## 📋 Tabla de Contenidos

- [📖 Descripción](#-descripción)
- [✨ Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [💻 Uso](#-uso)
- [📡 API Endpoints](#-api-endpoints)
- [🌐 Variables de Entorno](#-variables-de-entorno)

---

## 📖 Descripción

**Core-Chat** es una aplicación de chat en tiempo real construida con tecnologías modernas. Este proyecto demuestra la implementación de una arquitectura full stack escalable, con tipado fuerte gracias a TypeScript tanto en el frontend como en el backend.

### 🎯 Propósito

- Aprender y practicar desarrollo full stack moderno
- Implementar TypeScript en ambos lados de la aplicación
- Crear una base sólida para aplicaciones de chat en tiempo real

---

## ✨ Características

### Actuales
- ✅ **API RESTful** con Express y TypeScript
- ✅ **Frontend React** con Vite y TypeScript
- ✅ **CORS configurado** para comunicación segura
- ✅ **Variables de entorno** para configuración
- ✅ **Logger profesional** con niveles de log
- ✅ **Conexión frontend-backend** exitosa
- ✅ **Sistema de tipos compartidos** entre frontend y backend

### Próximamente
- ⏳ WebSockets (Socket.io) para mensajería real-time
- ⏳ Autenticación de usuarios con JWT
- ⏳ Base de datos (PostgreSQL/MongoDB)
- ⏳ Salas de chat privadas y públicas
- ⏳ Envío de imágenes y archivos

---## 🛠️ Tecnologías

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20.x | Entorno de ejecución |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Tipado estático |
| Cors | 2.x | Seguridad CORS |
| Dotenv | 16.x | Variables de entorno |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Biblioteca UI |
| TypeScript | 5.x | Tipado estático |
| Vite | 5.x | Build tool |
| Axios | 1.x | Cliente HTTP |

---

## 📁 Estructura del Proyecto

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)
- Git

### Clonar el Repositorio

```bash
git clone https://github.com/eduardo1314/Core-Chat.git
cd Core-Chat


## 🗄️ Ver la Base de Datos (Adminer)

Adminer es una herramienta ligera para visualizar la base de datos desde el navegador.

### Iniciar Adminer 

```bash
cd /var/www/adminer
php -S localhost:8080 ## Este es un ejemplo puede ser en otro puerto que este libre

## 🗄️ Base de Datos

### Requisitos previos
- PostgreSQL 16 o superior

### Configuración de la base de datos

1. **Crear usuario y base de datos:**
\`\`\`bash
sudo -u postgres psql
\`\`\`


2. **Crear las tablas:**
\`\`\`sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    type VARCHAR(20) DEFAULT 'private',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reply_to UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

3. **Verificar tablas creadas:**
\`\`\`bash
sudo -u postgres psql -d corechat_db -c "\dt"
\`\`\`

Deberías ver:
- users
- chats
- participants
- messages
