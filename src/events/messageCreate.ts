import { Events } from '../interfaces';
import { EmbedBuilder, Message, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { Chat } from '../models';

export const Event: Events = {
    name: 'messageCreate',
    run: async (client, message) => {
        if (message.author.bot) return;

        const isDm = message.channel.type === ChannelType.DM;
        const generateId = (prefix: string, userId: string) => prefix + '-' + userId + '-' + Math.floor(Math.random() * 1000000);

        if (isDm) {
            const checkDb = await Chat.findOne({ ownerId: message.author.id });
            if (checkDb?.isWaiting) return message.channel.send('Sabırlı ol, şu anda aktif bir kanalın var.');

            if (checkDb && message.content.toLowerCase() === '!kapat') {
                await client.channels.fetch(checkDb.adminChannelId).then((channel) => (channel as TextChannel).send('Bu iletişim kullanıcı tarafından sona erdi.'));
                await Chat.deleteOne({ ownerId: message.author.id });
                return message.channel.send('Kanalı başarıyla kapattınız.');
            };

            if (checkDb && checkDb?.adminChannelId) {
                const channel = await client.channels.fetch(checkDb.adminChannelId);
                if (!channel) return message.channel.send('Discord API şu anda ulaşılabilir değil, lütfen daha sonra tekrar deneyin.');

                return await (channel as TextChannel).send({
                    content: `🕵️‍♀️ **${message.author.username}:** ${message.content}`,
                    files: message.attachments.map((attachment) => attachment.url)
                });
            } else {
                await message.channel.send({
                    content: [
                        ':wave: Selam, bugün nasılsın?',
                        'Yardıma mı ihtiyacın var bilmiyorum, fakat yardıma ihtiyacın var ise her zaman burdayız.',
                        '',
                        'Şimdi, senden bir yanıt bekliyorum ve sihirli soruyu soruyorum. Yardıma mı ihtiyacın var?',
                        'Lütfen aşağıdaki butonlara tıklayarak **bana** yanıt ver.'
                    ].join('\n'),
                    components: [
                        new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Primary)
                                    .setLabel('Evet')
                                    .setCustomId(generateId('yes', message.author.id)),
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Danger)
                                    .setLabel('Hayır')
                                    .setCustomId(generateId('no', message.author.id))
                            )
                    ]
                });

                new Chat({
                    channelId: message.channel.id,
                    ownerId: message.author.id,
                    onlineAdmins: [],
                    isWaiting: true,
                    createdAt: new Date(),
                }).save();

                const collector = message.channel.createMessageComponentCollector({
                    filter: (interaction) => interaction.user.id === message.author.id,
                    time: 1000 * 60 * 5
                });

                collector.on('collect', async (i) => {
                    if (i.customId.startsWith('yes')) {
                        await Chat.deleteOne({ channelId: message.channel.id });

                        await i.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(message.author.tag + ' ' + 'Yardım Kanalı')
                                    .setDescription('Bizimle iletişime geçtiğin için teşekkür ederiz, yetkililere gerekli bilgiler iletildi ve müsait olunca seninle iletişime **DM üzerinden** geçecekler. *Bu süreçte lütfen sabırlı olun.*\n\n> Bu kanalı kapatmak istiyorsan lütfen **!kapat** yazın.')
                                    .setColor('Blurple')
                            ],
                            components: [],
                            content: ''
                        });

                        const channel = await client.guilds.cache.get(client.config.modmails.guild)?.channels.create({
                            name: 'modmail-' + message.author.id.slice(0, 4),
                            parent: client.config.modmails.parent,
                            topic: 'Bu kanal ' + message.author.tag + ' tarafından oluşturuldu.',
                            type: ChannelType.GuildText,
                        });

                        new Chat({
                            channelId: message.channel.id,
                            adminChannelId: channel.id,
                            ownerId: message.author.id,
                            onlineAdmins: [],
                            isWaiting: false,
                            createdAt: new Date(),
                        }).save();

                        await channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(message.author.tag + ' ' + 'Yardım İstiyor')
                                    .setDescription('Bir kullanıcı yardım istiyor, lütfen bu kanaldan onunla iletişime geçin. Attığınız tüm mesajlar ona **DM** üzerinden iletilecek.\n\n> *Fotoğraflar, videolar geçerlidir.*\n> *Eğer bu kanalda kullanıcıya DM iletmeden konuşmak istiyorsanız mesajınızın başına // ekleyin.*')
                                    .addFields({
                                        name: 'Kullanıdı Adı',
                                        value: message.author.tag,
                                        inline: true
                                    }, {
                                        name: 'Kullanıcı Kimliği',
                                        value: message.author.id,
                                        inline: true
                                    }, {
                                        name: 'Sunucuya Katılma Tarihi',
                                        value: message.author.createdAt.toDateString(),
                                        inline: true
                                    }, {
                                        name: 'Olası Yardım Konusu',
                                        value: [
                                            '```',
                                            message.content,
                                            '```'
                                        ].join('\n'),
                                    })
                                    .setColor('Blurple')
                            ]
                        });

                    } else if (i.customId.startsWith('no')) {
                        await i.update({
                            content: 'Peki, yardıma ihtiyacın olduğu zaman burada olduğumuzu unutma.',
                            components: []
                        });

                        await Chat.deleteOne({ channelId: message.channel.id });
                    };
                });
            };
        } else {
            const db = await Chat.findOne({ adminChannelId: message.channel.id });
            if (!db) return;

            const owner = await client.users.fetch(db.ownerId);
            if (!owner) return message.channel.send('Discord API şu anda ulaşılabilir değil, lütfen daha sonra tekrar deneyin.');

            if (message.content.startsWith('//')) return;
            if (message.content === '!kapat') {
                await message.channel.send({
                    content: 'Başarıyla kapatıldı.',
                });

                await Chat.deleteOne({ adminChannelId: message.channel.id });
                await message.channel.delete();
                await client.users.fetch(db.ownerId).then((u) => u.send('Kanalınız, yetkililer tarafından kapatıldı.'));
            };
            await Chat.updateOne({ adminChannelId: message.channel.id }, { $push: { onlineAdmins: message.author.id } });

            await owner.send({
                content: `🕵️‍♀️ **${message.author.username}:** ${message.content}`,
                files: message.attachments.map((a) => a.proxyURL)
            });
        };
    }
};