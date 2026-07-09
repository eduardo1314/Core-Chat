export const formatLastSeen = (lastSeen: string | null | undefined): string => {
    if (!lastSeen) return '';
    
    const date = new Date(lastSeen);
    
    const timeStr = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    
    // Si es hoy
    if (diffDays === 0) {
        return ` ${timeStr}`;
    }
    
    // Si fue ayer
    if (diffDays === 1) {
        return `ultima vez ayer a las ${timeStr}`;
    }
    
    // Si es esta semana
    if (diffDays < 7) {
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        return `ultima vez el ${days[date.getDay()]} a las ${timeStr}`;
    }
    
    // Si es más de una semana
    const dateStr = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    return `ultima vez el ${dateStr} a las ${timeStr}`;
};