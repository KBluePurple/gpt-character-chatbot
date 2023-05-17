import {Client, GatewayIntentBits, Partials} from "discord.js";
import {Command} from "../core/command";

const {Guilds, MessageContent, GuildMessages, GuildMembers, DirectMessages,} = GatewayIntentBits;


export class BotClient {
    private static _instance: BotClient;

    public static get id(): string {
        return BotClient._instance.client.user?.id ?? "";
    }

    public client: Client;
    private commands: Map<string, Command> = new Map<string, Command>();

    public constructor() {
        BotClient._instance = this;
        this.client = new Client({
            intents: [
                Guilds,
                GuildMessages,
                GuildMembers,
                MessageContent,
                DirectMessages
            ],
            partials: [
                Partials.Channel
            ]
        });
        this.client.on("interactionCreate", async interaction => {
            if (!interaction.isCommand()) return;
            const command = this.commands.get(interaction.commandName);

            if (command === undefined) return;
            await command.execute(interaction);
        });
    }

    public async login(token: string): Promise<void> {
        await this.client.login(token);
        console.log("Logged in as " + this.client.user?.tag);
    }

    addCommand(command: Command) {
        this.client.application?.commands.create(command.data);
        this.commands.set(command.data.name, command);
    }
}