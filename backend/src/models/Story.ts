import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

// ============================================
// INTERFACES
// ============================================
interface StoryAttributes {
    id: string;
    user_id: string;
    image_url: string;
    video_url?: string | null;
    content?: string | null;
    location?: string | null;
    music?: string | null;
    music_artist?: string | null;
    music_duration?: number | null;
    music_preview_url?: string | null; 
    background_color?: string | null;
    font_color?: string | null;
    font_size?: string | null;
    text_position?: string | null;  
    text_scale?: number | null;     
    is_highlight?: boolean;
    highlight_cover?: string | null;
    viewed_by: string[];
    views_count: number;
    likes: string[];
    likes_count: number;
    comments: string[];
    comments_count: number;
    expires_at: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

interface StoryCreationAttributes extends Optional<StoryAttributes, 
    'id' | 'video_url' | 'content' | 'location' | 'music' | 'music_artist' | 
    'music_duration' | 'music_preview_url' | 'background_color' | 'font_color' | 'font_size' |
    'text_position' | 'text_scale' | 
    'is_highlight' | 'highlight_cover' | 'viewed_by' | 'views_count' | 
    'likes' | 'likes_count' | 'comments' | 'comments_count' | 
    'expires_at' | 'is_active' | 'created_at' | 'updated_at' | 'deleted_at'
> {}

// ============================================
// MODELO STORY
// ============================================
class Story extends Model<StoryAttributes, StoryCreationAttributes> implements StoryAttributes {
    public id!: string;
    public user_id!: string;
    public image_url!: string;
    public video_url!: string | null;
    public content!: string | null;
    public location!: string | null;
    public music!: string | null;
    public music_artist!: string | null;
    public music_duration!: number | null;
    public music_preview_url!: string | null; 
    public background_color!: string | null;
    public font_color!: string | null;
    public font_size!: string | null;
    public text_position!: string | null;  
    public text_scale!: number | null;     
    public is_highlight!: boolean;
    public highlight_cover!: string | null;
    public viewed_by!: string[];
    public views_count!: number;
    public likes!: string[];
    public likes_count!: number;
    public comments!: string[];
    public comments_count!: number;
    public expires_at!: Date;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

Story.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        image_url: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        video_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        music: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        music_artist: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        music_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        music_preview_url: { 
            type: DataTypes.TEXT,
            allowNull: true,
        },
        background_color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#000000',
        },
        font_color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#FFFFFF',
        },
        font_size: {
            type: DataTypes.STRING(10),
            allowNull: true,
            defaultValue: 'medium',
        },
        
        text_position: {
            type: DataTypes.TEXT,  
            allowNull: true,
            get() {
                const value = this.getDataValue('text_position');
                if (!value) return { x: 0, y: 0 };
                try {
                    return JSON.parse(value);
                } catch {
                    return { x: 0, y: 0 };
                }
            },
            set(value: any) {
                if (value && typeof value === 'object') {
                    this.setDataValue('text_position', JSON.stringify(value));
                } else {
                    this.setDataValue('text_position', null);
                }
            }
        },
        text_scale: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 1,
        },
        is_highlight: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        highlight_cover: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        viewed_by: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            allowNull: false,
            defaultValue: [],
        },
        views_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        likes: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            allowNull: false,
            defaultValue: [],
        },
        likes_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        comments: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            allowNull: false,
            defaultValue: [],
        },
        comments_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'stories',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: true,
        deletedAt: 'deleted_at',
    }
);

export default Story;