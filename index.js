require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TICKET_CATEGORY_ID = (process.env.TICKET_CATEGORY_ID || '').trim();
const STAFF_ROLE_ID = (process.env.STAFF_ROLE_ID || '').trim();

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('ticket-setup')
      .setDescription('티켓 생성 패널 메시지를 전송합니다.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('슬래시 커맨드가 등록되었습니다.');
}

client.once('ready', async () => {
  console.log(`${client.user.tag} 으로 로그인했습니다.`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-setup') {
      const embed = new EmbedBuilder()
        .setTitle('📩 고객 지원 티켓')
        .setDescription('문의가 필요하신 경우 아래 **티켓 열기** 버튼을 눌러 전용 채널을 생성하세요.')
        .setColor(0x5865f2);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('티켓 열기')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const user = interaction.user;

        const existingChannel = guild.channels.cache.find(
          (ch) => ch.parentId === TICKET_CATEGORY_ID && ch.topic === user.id
        );

        if (existingChannel) {
          return interaction.editReply({
            content: `이미 열려 있는 티켓이 있습니다: ${existingChannel}`,
          });
        }

        const safeUsername = user.username.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'user';
        const channelName = `ticket-${safeUsername}`;

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: TICKET_CATEGORY_ID || null,
          topic: user.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            },
            ...(STAFF_ROLE_ID
              ? [
                  {
                    id: STAFF_ROLE_ID,
                    allow: [
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                      PermissionFlagsBits.ReadMessageHistory,
                      PermissionFlagsBits.ManageChannels,
                    ],
                  },
                ]
              : []),
          ],
        });

        const ticketEmbed = new EmbedBuilder()
          .setTitle('🎫 티켓이 생성되었습니다')
          .setDescription(`${user} 님, 문의 내용을 남겨주시면 담당자가 곧 확인합니다.\n문제가 해결되면 **티켓 닫기** 버튼을 눌러주세요.`)
          .setColor(0x57f287);

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('티켓 닫기')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}> ${user}` : `${user}`,
          embeds: [ticketEmbed],
          components: [closeRow],
        });

        await interaction.editReply({
          content: `티켓 채널이 생성되었습니다: ${ticketChannel}`,
        });
      }

      if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '5초 후 티켓 채널이 삭제됩니다...' });
        setTimeout(async () => {
          try {
            await interaction.channel.delete('티켓 종료');
          } catch (err) {
            console.error('채널 삭제 실패:', err);
          }
        }, 5000);
      }
    }
  } catch (error) {
    console.error('상호작용 처리 오류:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `오류가 발생했습니다: ${error.message}`,
      }).catch(() => {});
    } else if (interaction.isRepliable()) {
      await interaction.reply({
        content: `오류가 발생했습니다: ${error.message}`,
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('ticket-setup')
      .setDescription('티켓 생성 패널 메시지를 전송합니다.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('슬래시 커맨드가 등록되었습니다.');
}

client.once('ready', async () => {
  console.log(`${client.user.tag} 으로 로그인했습니다.`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-setup') {
    const embed = new EmbedBuilder()
      .setTitle('📩 고객 지원 티켓')
      .setDescription('문의가 필요하신 경우 아래 **티켓 열기** 버튼을 눌러 전용 채널을 생성하세요.')
      .setColor(0x5865f2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('티켓 열기')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const guild = interaction.guild;
      const user = interaction.user;

      const existingChannel = guild.channels.cache.find(
        (ch) => ch.parentId === TICKET_CATEGORY_ID && ch.topic === user.id
      );

      if (existingChannel) {
        return interaction.reply({
          content: `이미 열려 있는 티켓이 있습니다: ${existingChannel}`,
          ephemeral: true,
        });
      }

      const safeUsername = user.username.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'user';
      const channelName = `ticket-${safeUsername}`;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID || null,
        topic: user.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          ...(STAFF_ROLE_ID
            ? [
                {
                  id: STAFF_ROLE_ID,
                  allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels,
                  ],
                },
              ]
            : []),
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 티켓이 생성되었습니다')
        .setDescription(`${user} 님, 문의 내용을 남겨주시면 담당자가 곧 확인합니다.\n문제가 해결되면 **티켓 닫기** 버튼을 눌러주세요.`)
        .setColor(0x57f287);

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('티켓 닫기')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}> ${user}` : `${user}`,
        embeds: [ticketEmbed],
        components: [closeRow],
      });

      await interaction.reply({
        content: `티켓 채널이 생성되었습니다: ${ticketChannel}`,
        ephemeral: true,
      });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '5초 후 티켓 채널이 삭제됩니다...' });
      setTimeout(async () => {
        try {
          await interaction.channel.delete('티켓 종료');
        } catch (err) {
          console.error('채널 삭제 실패:', err);
        }
      }, 5000);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
