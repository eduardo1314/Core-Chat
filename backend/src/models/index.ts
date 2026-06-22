import sequelize from '../database/config';
import User from './User';
import Chat from './Chat';
import Message from './Message';
import Participant from './Participant';
import Friend from './Friend';
import UnreadCount from "./UnreadCount";

// ============================================
// RELACIONES EXISTENTES
// ============================================
User.hasMany(Message, { foreignKey: 'user_id' });
Message.belongsTo(User, { foreignKey: 'user_id' });

Chat.hasMany(Message, { foreignKey: 'chat_id' });
Message.belongsTo(Chat, { foreignKey: 'chat_id' });

Chat.hasMany(Participant, { foreignKey: 'chat_id' });
Participant.belongsTo(Chat, { foreignKey: 'chat_id' });

User.hasMany(Participant, { foreignKey: 'user_id' });
Participant.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Friend, { foreignKey: 'user_id' });
Friend.belongsTo(User, { foreignKey: 'user_id' });

// ============================================
// PARA UNREADCOUNT
// ============================================
UnreadCount.belongsTo(Chat, { foreignKey: 'chat_id' });
Chat.hasMany(UnreadCount, { foreignKey: 'chat_id' });

UnreadCount.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UnreadCount, { foreignKey: 'user_id' });

// ============================================
// MUCHOS A MUCHOS
// ============================================
Chat.belongsToMany(User, { through: Participant, foreignKey: 'chat_id' });
User.belongsToMany(Chat, { through: Participant, foreignKey: 'user_id' });

// ============================================
// EXPORTACIONES
// ============================================
export { 
    sequelize, 
    User, 
    Chat, 
    Message, 
    Participant, 
    Friend,
    UnreadCount 
};