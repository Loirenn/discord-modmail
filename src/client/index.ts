import { Client, Collection, REST, Routes, GatewayIntentBits, Partials } from 'discord.js';
import { connect, set } from 'mongoose';
import glob from 'glob';
import { join } from 'path';
import { Events } from '../interfaces';
import config from '../../config';
import 'advanced-logs';

export default class ModMail extends Client {
    public readonly events: Collection<string, Events> = new Collection();
    public readonly config = config;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping
            ],
            partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User]
        })
    };

    public init(): void {
        this._login()
            .connectDb()
            .loadEvents();
    };

    public _login(): ModMail {
        this.login(this.config.token)
            .then(() => console.success(`Logged in as ${this.user?.tag}`))
            .catch((err) => console.error(err));

        return this;
    };

    public connectDb(): ModMail {
        set('strictQuery', true);
        connect(this.config.mongoURI)
            .then(() => console.info('Connected to MongoDB'))
            .catch((err) => console.error(err));
        return this;
    };

    
    public loadEvents(): ModMail {
        glob('**/*.ts', { cwd: join(__dirname, '../events') }, async (err, files) => {
            if (err) return console.error(err);
            if (files.length === 0) return console.warn('No events were found in the events file, this part is skipped..');
            
            files.forEach(async (file, i) => {
                const { Event }: { Event: Events } = await import(`../events/${file}`);
                this.events.set(Event.name, Event);
                this.on(Event.name, Event.run.bind(null, this));
            });
        });

        return this;
    };
};