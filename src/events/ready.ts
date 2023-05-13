import { Events } from '../interfaces';
import { EmbedBuilder, Message, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } from 'discord.js';

export const Event: Events = {
    name: 'ready',
    run: async (client) => {
        client.user.setPresence({
            activities: [
                {
                    name: 'Developed by Loiren.',
                    type: ActivityType.Playing
                }
            ]
        });
    }
};