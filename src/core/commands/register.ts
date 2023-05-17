import {CommandInteraction, SlashCommandBuilder} from "discord.js";
import {Command} from "../command";
import {Database} from "../../database";

export const registerCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register this channel to the bot."),
    execute: async (interaction: CommandInteraction) => {
        if (interaction.channel === null) return;

        if (await Database.instance.registerChannel(interaction.channel)) {
            await interaction.reply({
                content: "This channel is registered to the bot.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "This channel is already registered to the bot.",
                ephemeral: true
            });
        }
    }
}