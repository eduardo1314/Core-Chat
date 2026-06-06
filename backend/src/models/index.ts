import sequelize from '../database/config';
import User from './User';
import Chat from './Chat';
import Message from './Message';
import Participant from './Participant';

// Relaciones
User.hasMany(Message, { foreignKey: 'user_id' });
Message.belongsTo(User, { foreignKey: 'user_id' });

Chat.hasMany(Message, { foreignKey: 'chat_id' });
Message.belongsTo(Chat, { foreignKey: 'chat_id' });

Chat.hasMany(Participant, { foreignKey: 'chat_id' });
Participant.belongsTo(Chat, { foreignKey: 'chat_id' });

User.hasMany(Participant, { foreignKey: 'user_id' });
Participant.belongsTo(User, { foreignKey: 'user_id' });

// Muchos a muchos
Chat.belongsToMany(User, { through: Participant, foreignKey: 'chat_id' });
User.belongsToMany(Chat, { through: Participant, foreignKey: 'user_id' });

export { sequelize, User, Chat, Message, Participant };
