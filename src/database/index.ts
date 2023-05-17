import {Channel, DMChannel, TextChannel} from "discord.js";
import {DataSource} from "typeorm";

import {ChatData, DeletedChatData, EditedChatData} from "./entity/chatData";
import {ChatSession} from "../ai/chatSession";
import {ChannelData} from "./entity/channelData";

export class Database {
    private static _instance: Database;
    public static get instance(): Database {
        return Database._instance;
    }

    private dataSource: DataSource;

    constructor() {
        Database._instance = this;
    }

    async connect() {
        this.dataSource = new DataSource({
            type: "better-sqlite3",
            database: "database.sqlite",
            entities: [
                ChatData,
                EditedChatData,
                DeletedChatData,
                ChannelData
            ],
            // logging: true,
            synchronize: true,
        })

        await this.dataSource.initialize();
        console.log("Database connected.");
    }

    async saveChatData(chatData: ChatData) {
        await this.dataSource.getRepository(ChatData).save(chatData);
    }

    async saveEditedChatData(chatData: ChatData, editedAt: Date) {
        const editedChatData = new EditedChatData();
        editedChatData.messageId = chatData.messageId;
        editedChatData.time = editedAt;
        editedChatData.message = chatData.message;
        editedChatData.userName = chatData.userName;
        editedChatData.userNick = chatData.userNick;
        editedChatData.userId = chatData.userId;
        editedChatData.sessionId = chatData.sessionId;
        editedChatData.message = chatData.message;

        await this.dataSource.getRepository(EditedChatData).save(editedChatData);
    }

    async saveDeletedChatData(chatData: ChatData) {
        await this.dataSource.getRepository(DeletedChatData).save(chatData);
    }

    async getChatDataList(sessionId: string, count: number = 30): Promise<ChatData[]> {
        return await this.dataSource.getRepository(ChatData).find({
            where: {
                sessionId: sessionId
            },
            order: {
                time: "DESC"
            },
            take: count
        });
    }

    async getEditedChatDataList(sessionId: string, count: number = 30): Promise<EditedChatData[]> {
        return await this.dataSource.getRepository(EditedChatData).find({
            where: {
                sessionId: sessionId
            },
            order: {
                time: "DESC"
            },
            take: count
        });
    }

    async getDeletedChatDataList(sessionId: string, count: number = 30): Promise<DeletedChatData[]> {
        return await this.dataSource.getRepository(DeletedChatData).find({
            where: {
                sessionId: sessionId
            },
            order: {
                time: "DESC"
            },
            take: count
        });
    }

    async isRegisterChannel(sessionId: string) {
        return await this.dataSource.getRepository(ChannelData).findOne({
            where: {
                sessionId: sessionId
            }
        }) !== null;
    }

    async registerChannel(channel: Channel) {
        const channelData = new ChannelData();
        channelData.channelId = channel.id;

        if (channel instanceof TextChannel) {
            channelData.channelName = channel.name;
            channelData.channelName = channel.name;
            channelData.sessionId = channel.guild.id + "-" + channel.id;
            channelData.guildId = channel.guild.id;
            channelData.guildName = channel.guild.name;
        } else if (channel instanceof DMChannel) {
            channelData.channelName = channel.recipient?.username!;
            channelData.sessionId = channel.id;
        }

        if (await this.isRegisterChannel(channelData.sessionId)) return false;

        await this.dataSource.getRepository(ChannelData).save(channelData);
        return true;
    }

    async getChatData(messageId: string) {
        return await this.dataSource.getRepository(ChatData).findOne({
            where: {
                messageId: messageId
            }
        });
    }

    async deleteChatData(chatData: ChatData) {
        await this.dataSource.getRepository(ChatData).delete(chatData);
    }
}
