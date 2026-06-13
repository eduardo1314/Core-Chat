import { useAuth as useAuthContext } from '../context/AuthContext';

// Este hook solo re-exporta el contexto para mantener consistencia
export const useAuth = () => {
    return useAuthContext();
};
