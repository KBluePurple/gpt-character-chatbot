import {Canceler} from "axios";
import {Message} from "discord.js";
import {BaseChatMessage} from "langchain/schema";

import {ChatBot} from "./chatbot";

export class ChatSession {
    private readonly _id: string;
    private _chat: ChatBot;
    private _isTyping: boolean = false;
    private _cancelToken: Canceler | undefined;
    private _typingInterval: NodeJS.Timeout | undefined;

    public get id(): string {
        return this._id;
    }

    constructor(sessionId: string, chat: ChatBot) {
        this._id = sessionId;
        this._chat = chat;
    }

    public async call(chatList: BaseChatMessage[], userMessage: Message): Promise<BaseChatMessage> {
        if (this._isTyping) {
            this._cancelToken?.();
            clearInterval(this._typingInterval);
            this._isTyping = false;
        }

        this._isTyping = true;

        userMessage.channel.sendTyping();
        this._typingInterval = setInterval(() => {
            userMessage.channel.sendTyping();
        }, 1000);
        const task = await this._chat.callAsync(chatList);
        this._cancelToken = task.canceler;

        const result = await task.message;
        clearInterval(this._typingInterval);
        this._isTyping = false;
        this._cancelToken = undefined;

        return result;
    }

    public get isTyping(): boolean {
        return this._isTyping;
    }
}