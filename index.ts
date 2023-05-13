import ModMail from './src/client';
import { AntiCrash } from 'discord-tool'; // bir türlü README yazamadığım modülüm 🤓

const client = new ModMail();
new AntiCrash(client);
client.init();