import { model, Schema } from 'mongoose';

export const Chat = model('chats', new Schema({
    channelId: { type: String, required: true },
    adminChannelId: { type: String },
    ownerId: { type: String, required: true },
    onlineAdmins: { type: Array, default: [] },
    createdAt: { type: Date },
    isWaiting: { type: Boolean, default: false }
}));