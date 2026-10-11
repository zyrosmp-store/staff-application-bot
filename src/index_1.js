
import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const APP_CHANNEL_ID = process.env.STAFF_APPLICATION_CHANNEL_ID || '1558871546179756122';

client.once('ready', () => {
  console.log(`Staff Application bot online as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    // /staff-setup command
    if (interaction.isChatInputCommand() && interaction.commandName === 'staff-setup') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Du måste vara admin för detta!', ephemeral: true });
      }

      const requirementsEmbed = new EmbedBuilder()
        .setTitle('📋 Netherite - Staff Application')
        .setColor(0x2B2D31)
        .setDescription(`
**Välkommen! Vill du bli en del av vårt Staff Team?**

Läs igenom kraven nedan innan du ansöker.

**__REQUIREMENTS__**
> ✅ Du måste vara **14+ år**
> ✅ Vara aktiv minst **1-2 timmar per dag**
> ✅ Ha mikrofon och kunna prata i VC
> ✅ Inga tidigare bans/mutes på servern
> ✅ God kunskap om Minecraft & vår server
> ✅ Kunna hantera stress och vara mogen
> ✅ Tala flytande **svenska & engelska**

**__Vad vi letar efter__**
> • Hjälpsam & trevlig mot spelare
> • Aktiv i chat och in-game
> • Erfarenhet av moderation (merit men ej krav)
> • Kan samarbeta i team

**__Ansökningsprocessen__**
> 1. Klicka på **Ansök nu**
> 2. Fyll i formuläret ärligt
> 3. Din ansökan skickas till ledningen
> 4. Svar inom 1-3 dagar

*Att ljuga i ansökan leder till direkt nekad och blacklist.*
        `)
        .setFooter({ text: 'Netherite Staff Team • Ansökningar granskas dagligen' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_staff_application')
          .setLabel('📝 Ansök nu')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({ embeds: [requirementsEmbed], components: [row] });
      return interaction.reply({ content: 'Staff application postad!', ephemeral: true });
    }

    // Open Modal
    if (interaction.isButton() && interaction.customId === 'open_staff_application') {
      const modal = new ModalBuilder()
        .setCustomId('staff_application_modal')
        .setTitle('Staff Ansökan - Netherite');

      const ageInput = new TextInputBuilder().setCustomId('age').setLabel('Hur gammal är du?').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 16').setMaxLength(2);
      const whyInput = new TextInputBuilder().setCustomId('why').setLabel('Varför vill du bli Staff?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Berätta varför just du ska bli staff...');
      const expInput = new TextInputBuilder().setCustomId('experience').setLabel('Tidigare erfarenhet som staff?').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Vilka servrar har du varit staff på tidigare?').setMaxLength(1000);
      const timeInput = new TextInputBuilder().setCustomId('time').setLabel('Hur aktiv kan du vara per vecka?').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 10-15 timmar').setMaxLength(100);
      const scenarioInput = new TextInputBuilder().setCustomId('scenario').setLabel('En spelare fuskar, vad gör du?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Förklara steg för steg vad du skulle göra...');

      modal.addComponents(
        new ActionRowBuilder().addComponents(ageInput),
        new ActionRowBuilder().addComponents(whyInput),
        new ActionRowBuilder().addComponents(expInput),
        new ActionRowBuilder().addComponents(timeInput),
        new ActionRowBuilder().addComponents(scenarioInput)
      );

      await interaction.showModal(modal);
    }

    // Modal Submit -> Send to application channel
    if (interaction.isModalSubmit() && interaction.customId === 'staff_application_modal') {
      const age = interaction.fields.getTextInputValue('age');
      const why = interaction.fields.getTextInputValue('why');
      const exp = interaction.fields.getTextInputValue('experience');
      const time = interaction.fields.getTextInputValue('time');
      const scenario = interaction.fields.getTextInputValue('scenario');

      const appChannel = await client.channels.fetch(APP_CHANNEL_ID).catch(() => null);
      if (!appChannel) {
        return interaction.reply({ content: `Kunde inte hitta applications kanalen! Kolla ID: ${APP_CHANNEL_ID}`, ephemeral: true });
      }

      const applicationEmbed = new EmbedBuilder()
        .setTitle('📩 Ny Staff Ansökan')
        .setColor(0xFFA500)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Sökande', value: `${interaction.user} (${interaction.user.tag})\nID: ${interaction.user.id}`, inline: false },
          { name: '🎂 Ålder', value: age, inline: true },
          { name: '⏰ Aktivitet', value: time, inline: true },
          { name: '💭 Varför Staff?', value: why.substring(0, 1024) },
          { name: '🛡️ Erfarenhet', value: exp.substring(0, 1024) },
          { name: '⚠️ Scenario - Fuskare', value: scenario.substring(0, 1024) }
        )
        .setTimestamp()
        .setFooter({ text: `Ansökan från ${interaction.user.id}` });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`staff_accept_${interaction.user.id}`).setLabel('✅ Acceptera').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`staff_deny_${interaction.user.id}`).setLabel('❌ Neka').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`staff_dm_${interaction.user.id}`).setLabel('💬 DM Sökande').setStyle(ButtonStyle.Secondary)
      );

      await appChannel.send({ 
        content: process.env.STAFF_ROLE_ID ? `<@&${process.env.STAFF_ROLE_ID}> Ny ansökan!` : '@here Ny staff ansökan!',
        embeds: [applicationEmbed], 
        components: [actionRow] 
      });

      await interaction.reply({ content: '✅ Din ansökan har skickats! Vi svarar inom 1-3 dagar.', ephemeral: true });
    }

    // Accept / Deny Buttons in staff channel
    if (interaction.isButton() && (interaction.customId.startsWith('staff_accept_') || interaction.customId.startsWith('staff_deny_') || interaction.customId.startsWith('staff_dm_'))) {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({ content: 'Du har inte permission att hantera ansökningar!', ephemeral: true });
      }

      const userId = interaction.customId.split('_').pop();
      const user = await client.users.fetch(userId).catch(() => null);

      if (interaction.customId.startsWith('staff_accept_')) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0x00FF00).setTitle('✅ ACCEPTED - Staff Ansökan');
        await interaction.update({ embeds: [embed], components: [] });
        if (user) {
          await user.send(`🎉 Grattis! Din Staff Ansökan på **Netherite** har blivit **ACCEPTERAD**! En högre staff kommer kontakta dig inom kort.`).catch(() => {});
        }
      }

      if (interaction.customId.startsWith('staff_deny_')) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0xFF0000).setTitle('❌ DENIED - Staff Ansökan');
        await interaction.update({ embeds: [embed], components: [] });
        if (user) {
          await user.send(`Tyvärr, din Staff Ansökan på **Netherite** blev nekad denna gång. Du kan ansöka igen om 14 dagar. Tack för att du ansökte!`).catch(() => {});
        }
      }

      if (interaction.customId.startsWith('staff_dm_')) {
        await interaction.reply({ content: `Skicka ett DM till <@${userId}> manuellt för att prata med personen.`, ephemeral: true });
      }
    }

  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Ett fel uppstod!', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: 'Ett fel uppstod!', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
