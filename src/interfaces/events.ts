import { ClientEvents } from 'discord.js';
import Client from '../Client';

export interface Events {
    name: keyof ClientEvents;
    run: (client: Client, ...args: any) => Promise<any> | any;
};