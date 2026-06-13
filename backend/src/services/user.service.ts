import sequelize from '../database/config';
import { QueryTypes } from 'sequelize';

export interface UserSearch {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
}

export class UserService {
    
    async searchUsers(email: string, currentUserId: string): Promise<UserSearch | null> {
        if (!email) {
            return null;
        }
        
        const users = await sequelize.query<UserSearch>(
            `SELECT id, username, email, avatar_url, status
             FROM users
             WHERE email LIKE :email AND id != :currentUserId
             LIMIT 5`,
            {
                replacements: { email: `%${email}%`, currentUserId },
                type: QueryTypes.SELECT
            }
        );

        const user = (users as UserSearch[])[0];

        return user || null;
    }
}

export const userService = new UserService();
