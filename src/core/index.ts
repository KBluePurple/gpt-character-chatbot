import {AIChatMessage, BaseChatMessage, HumanChatMessage, SystemChatMessage} from "langchain/schema";
import {CanceledError} from "axios";
import {Message, PartialMessage} from "discord.js";

import {ChatBot} from "../ai/chatbot";
import {BotClient} from "../client/discord";
import {Character} from "../types/character";
import {Database} from "../database";
import {ChatData} from "../database/entity/chatData";
import {Prompt} from "../ai/prompt";
import Util from "../util/util";
import {registerCommand} from "./commands/register";

const maxMessageCount: number = 15;

export class CharacterBot {
    private _discord: BotClient;
    private _ai: ChatBot;

    private readonly _character: Character;

    public constructor(discord: BotClient, ai: ChatBot, character: Character) {
        this._discord = discord;
        this._ai = ai;
        this._discord.client.on("messageCreate", this.handleMessage.bind(this));
        this._discord.client.on("messageUpdate", this.handleMessageUpdate.bind(this));
        this._discord.client.on("messageDelete", this.handleMessageDelete.bind(this));
        this._discord.addCommand(registerCommand);
        this._character = character;

        console.log(`Character ${this._character.name} is ready.`);
    }

    private async getSession(message: Message | PartialMessage) {
        const sessionId = Util.getSessionIdFromMessage(message);
        return this._ai.getSession(sessionId);
    }

    private async handleMessage(message: Message) {
        if (message.author.bot) return;
        await this.getSession(message);
        // 대화 기록을 저장
        Database.instance.saveChatData(Util.messageToChatData(message))
            .then((_) => console.log("Human Chat data saved."));

        await this.handleCharacterMessage(message);
    }

    private async handleMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
        if (newMessage.author?.bot) return;
        const session = await this.getSession(oldMessage);

        const chatData = await Database.instance.getChatData(oldMessage.id);
        if (chatData === null) return;

        if (newMessage.editedAt !== null)
            await Database.instance.saveEditedChatData(chatData, newMessage.editedAt);

        chatData.message = newMessage.content ?? "";

        await Database.instance.saveChatData(chatData);

        if (session.isTyping)
            await this.handleCharacterMessage(newMessage as Message);
    }

    private async handleMessageDelete(message: Message | PartialMessage) {
        if (message.author?.bot) return;
        const session = await this.getSession(message);

        const chatData = await Database.instance.getChatData(message.id);
        if (chatData === null) return;

        await Database.instance.saveDeletedChatData(chatData);
        await Database.instance.deleteChatData(chatData);

        if (session.isTyping)
            await this.handleCharacterMessage(message as Message);
    }

    /**
     * 캐릭터 채팅을 처리합니다.
     * @param message 디스코드 메시지
     */
    public async handleCharacterMessage(message: Message) {
        const sessionId = Util.getSessionIdFromMessage(message);

        const canChat = await this.isRegisteredChannel(sessionId) || !message.inGuild();
        if (!canChat) return;

        const session = await this._ai.getSession(sessionId);
        // 해당 세션의 대화 기록을 가져옴
        const chatHistory = await this.getChatHistory(sessionId, message);

        const chatList: BaseChatMessage[] = [];
        // AI를 대화 모드로 만드는 베이스 프롬프트
        // AI를 캐릭터 역할을 하게 만드는 캐릭터 설명 프롬프트
        chatList.push(new SystemChatMessage(`${Prompt.getBaseMessage(this._character)}\n${this._character.description})`));
        // 대화 시작 프롬프트
        chatList.push(new SystemChatMessage("[Start a new chat]"));

        // 채팅 기록을 마지막 메시지를 제외하고 모두 추가
        chatList.push(...chatHistory.slice(0, chatHistory.length - 1));
        // 캐릭터 노트를 추가
        chatList.push(new SystemChatMessage(this._character.notes));
        // 마지막 메시지를 추가
        chatList.push(chatHistory[chatHistory.length - 1]);

        for (const chat of chatList) {
            if (chat instanceof SystemChatMessage)
                console.log(`System: ${chat.text}`);
            else if (chat instanceof HumanChatMessage)
                console.log(`Human: ${chat.text}`);
            else if (chat instanceof AIChatMessage)
                console.log(`AI: ${chat.text}`);
        }

        try {
            // 채팅 기록과 함께 봇 대화 API 콜
            const response = await session.call(chatList, message);

            // 대화를 답장으로 보냄
            const replyMessage = await message.reply(Util.processMessage(response.text, this._character));

            const chatData = Util.messageToChatData(replyMessage);
            chatData.message = response.text;
            console.log(`AI: ${response.text}`);

            // 대화 기록을 저장
            Database.instance.saveChatData(chatData)
                .then((_) => console.log("AI Chat data saved."));
        } catch (e) {
            if (e instanceof CanceledError) {
                // ignore
            } else {
                console.error(e);
            }
        }
    }

    private async isRegisteredChannel(sessionId: string): Promise<boolean> {
        return await Database.instance.isRegisterChannel(sessionId);
    }

    private async getChatHistory(sessionId: string, message: Message): Promise<BaseChatMessage[]> {
        let result: ChatData[] = [...await Database.instance.getChatDataList(sessionId, maxMessageCount)];

        let discordChatList = await this.getChatHistoryFromDiscord(message, maxMessageCount);
        discordChatList = discordChatList.filter((discordMessage) => {
            for (const chatData of result) {
                if (chatData.messageId === discordMessage.messageId) {
                    return false;
                }
            }
            return true;
        });
        result.push(...discordChatList);

        if (result.length > maxMessageCount)
            result = result.slice(result.length - maxMessageCount);

        result.sort((a, b) => a.time.getTime() - b.time.getTime());
        return result.map((chatData) => Util.chatDataToBaseChatMessage(chatData, this._character));
    }

    private async getChatHistoryFromDiscord(message: Message, maxCount: number): Promise<ChatData[]> {
        const result: ChatData[] = [];

        let discordChatList = await message.channel.messages.fetch({
            limit: maxCount,
        });

        discordChatList = discordChatList.reverse();

        for (const [, discordMessage] of discordChatList) {
            result.push(Util.messageToChatData(discordMessage));
        }

        // Merge messages from the same user
        for (let i = 1; i < result.length; i++) {
            if (result[i].userId === result[i - 1].userId) {
                result[i - 1].message += "\n" + result[i].message;
                result.splice(i, 1);
                i--;
            }
        }

        return result;
    }
}