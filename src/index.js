
import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const APP_CHANNEL_ID = process.env.STAFF_APPLICATION_CHANNEL_ID || '1558871546179756122';

client.once('ready', () => {
  console.log(`Staff Application bot online as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'staff-setup') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Administrator only!', ephemeral: true });
      }

      const requirementsEmbed = new EmbedBuilder()
        .setTitle('🎬 Stream Team - Staff Application')
        .setColor(0x9146FF)
        .setDescription(`
Welcome! We're looking for dedicated **Moderators & Support Staff** for the stream team.

Please read the requirements carefully before applying.

**__REQUIREMENTS__**
> 🔹 Must be **16+ years old**
> 🔹 Fluent in **English** (Swedish is a plus)
> 🔹 Active and available during streams (Evenings CEST)
> 🔹 Previous experience moderating Twitch / Discord / YouTube
> 🔹 Mature, professional and calm under pressure
> 🔹 Good communication & teamwork skills
> 🔹 No history of toxicity / bans in this community
> 🔹 Working microphone for staff meetings

**__YOUR RESPONSIBILITIES__**
> • Moderate Twitch chat & Discord (Timeouts, Bans, Slowmode)
> • Handle Support Tickets & User Questions
> • Keep chat positive, hype and welcoming
> • Enforce rules fairly & consistently
> • Assist during events, subathons & community nights
> • Report issues to Senior Staff

**__WHAT WE OFFER__**
> • Staff role & private staff community
> • Growth opportunities (Support -> Mod -> Senior Mod)
> • Direct contact with the streamer team
> • Early access to events & announcements

**__PROCESS__**
> 1. Click **Apply Now**
> 2. Fill out the application honestly (5-10 min)
> 3. Application is reviewed by Senior Staff
> 4. Response within 48h via DM

*Lying or copying applications = Instant denial & blacklist.*
        `)
        .setFooter({ text: 'Stream Staff Recruitment • Professional & Respectful Team' })
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_staff_application')
          .setLabel('📝 Apply Now')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [requirementsEmbed], components: [row] });
      return interaction.reply({ content: 'Staff application panel posted!', ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'open_staff_application') {
      const modal = new ModalBuilder()
        .setCustomId('staff_application_modal')
        .setTitle('Stream Staff Application');

      const ageTz = new TextInputBuilder().setCustomId('age_tz').setLabel('Age, Timezone & Availability?').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: 19, CEST, Available 18:00-23:00').setMaxLength(150);
      const exp = new TextInputBuilder().setCustomId('experience').setLabel('Moderation Experience? (Twitch/Discord)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Where have you modded before? What tools did you use? (BTTV, Mod View, Sery_bot?)');
      const why = new TextInputBuilder().setCustomId('why').setLabel('Why should we choose you?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('What makes you a good fit for our team?');
      const scenario1 = new TextInputBuilder().setCustomId('scenario_spam').setLabel('Chat is spammed with self-promo & toxicity').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('Step by step, how do you handle it during a live stream?');
      const scenario2 = new TextInputBuilder().setCustomId('scenario_ticket').setLabel('User opens ticket: "Mod abused me"').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000).setPlaceholder('How do you handle the ticket professionally?');

      modal.addComponents(
        new ActionRowBuilder().addComponents(ageTz),
        new ActionRowBuilder().addComponents(exp),
        new ActionRowBuilder().addComponents(why),
        new ActionRowBuilder().addComponents(scenario1),
        new ActionRowBuilder().addComponents(scenario2)
      );

      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'staff_application_modal') {
      const ageTz = interaction.fields.getTextInputValue('age_tz');
      const exp = interaction.fields.getTextInputValue('experience');
      const why = interaction.fields.getTextInputValue('why');
      const scenarioSpam = interaction.fields.getTextInputValue('scenario_spam');
      const scenarioTicket = interaction.fields.getTextInputValue('scenario_ticket');

      const appChannel = await client.channels.fetch(APP_CHANNEL_ID).catch(() => null);
      if (!appChannel) {
        return interaction.reply({ content: `Could not find application channel: ${APP_CHANNEL_ID}`, ephemeral: true });
      }

      const applicationEmbed = new EmbedBuilder()
        .setTitle('📩 New Stream Staff Application')
        .setColor(0x9146FF)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .addFields(
          { name: '👤 Applicant', value: `${interaction.user} \nID: \`${interaction.user.id}\``, inline: false },
          { name: '🕒 Age / Timezone / Availability', value: ageTz.substring(0, 1024), inline: false },
          { name: '🛡️ Moderation Experience', value: exp.substring(0, 1024), inline: false },
          { name: '⭐ Why choose you?', value: why.substring(0, 1024), inline: false },
          { name: '🚨 Scenario 1: Spam / Toxicity in Live Chat', value: scenarioSpam.substring(0, 1024), inline: false },
          { name: '🎫 Scenario 2: Ticket - Mod Abuse Report', value: scenarioTicket.substring(0, 1024), inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `User ID: ${interaction.user.id} • Account created` })
        .setTimestamp();

      // Account age check
      const accountAge = Math.floor((Date.now() - interaction.user.createdTimestamp) / (1000*60*60*24));
      applicationEmbed.addFields({ name: '📅 Discord Account Age', value: `${accountAge} days old`, inline: true });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`staff_accept_${interaction.user.id}`).setLabel('✅ Accept').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`staff_deny_${interaction.user.id}`).setLabel('❌ Deny').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`staff_trial_${interaction.user.id}`).setLabel('👀 Trial Mod').setStyle(ButtonStyle.Primary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`staff_dm_${interaction.user.id}`).setLabel('💬 Contact').setStyle(ButtonStyle.Secondary)
      );

      await appChannel.send({ 
        content: process.env.STAFF_ROLE_ID ? `<@&${process.env.STAFF_ROLE_ID}> New staff application!` : `New staff application!`,
        embeds: [applicationEmbed], 
        components: [actionRow, row2] 
      });

      await interaction.reply({ content: '✅ Your application has been submitted! Our Senior Team will review it within 48 hours. Check your DMs.', ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('staff_')) {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({ content: 'You need Manage Server to handle applications!', ephemeral: true });
      }

      const userId = interaction.customId.split('_').pop();
      const user = await client.users.fetch(userId).catch(() => null);

      if (interaction.customId.startsWith('staff_accept_')) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0x00FF00).setTitle('✅ ACCEPTED - Stream Staff Application');
        await interaction.update({ embeds: [embed], components: [] });
        if (user) await user.send(`🎉 Congratulations! Your Staff Application for **${interaction.guild.name}** has been **ACCEPTED**!\n\nA Senior Staff member will contact you shortly with onboarding info. Welcome to the team!`).catch(() => {});
      }

      if (interaction.customId.startsWith('staff_deny_')) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0xFF0000).setTitle('❌ DENIED - Stream Staff Application');
        await interaction.update({ embeds: [embed], components: [] });
        if (user) await user.send(`Thank you for applying for Staff at **${interaction.guild.name}**.\n\nAfter careful review, we have decided not to move forward with your application at this time. You are welcome to re-apply in 30 days.\n\nWe appreciate your interest!`).catch(() => {});
      }

      if (interaction.customId.startsWith('staff_trial_')) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(0xFFFF00).setTitle('👀 TRIAL MOD - Stream Staff Application');
        await interaction.update({ embeds: [embed], components: [] });
        if (user) await user.send(`Great news! Your application for **${interaction.guild.name}** has been moved to **TRIAL MOD** phase!\n\nYou will be given Trial permissions for 7-14 days to see how you work with the team. A Senior will DM you soon.`).catch(() => {});
      }

      if (interaction.customId.startsWith('staff_dm_')) {
        await interaction.reply({ content: `Please DM <@${userId}> directly to discuss their application.`, ephemeral: true });
      }
    }

  } catch (e) {
    console.error(e);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred!', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
