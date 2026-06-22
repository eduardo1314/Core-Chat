
export const formatLastSeen = (lastSeen: string | null | undefined): string => {
    if (!lastSeen) return 'Desconectado';
    
    const now = new Date();
    const date = new Date(lastSeen);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Si está en línea menos de 2 minutos
    if (diffMins < 2) {
        return 'En línea';
    }
    
    // Formatear hora: 
    const timeStr = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    //  Mostrar siempre la hora
    if (diffMins < 60) {
        return `Última vez, ${timeStr}`;
    }
    
    if (diffHours < 24) {
        return `Última vez hoy, ${timeStr}`;
    }
    
    if (diffDays === 1) {
        return `Última vez ayer, ${timeStr}`;
    }
    
    if (diffDays < 7) {
        const daysStr = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const dayName = daysStr[date.getDay()];
        return `Última vez el ${dayName}, ${timeStr}`;
    }
    
    return `Última vez el ${date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}, ${timeStr}`;
};