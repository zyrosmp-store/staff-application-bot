
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'staff-setup',
    description: 'Posta staff application med requirements (Admin only)'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Registering staff commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('Staff slash commands registered.');
} catch (err) {
  console.error(err);
}
