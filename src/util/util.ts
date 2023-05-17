import {ChannelType, Message, PartialMessage} from "discord.js";
import {ChatData} from "../database/entity/chatData";
import {AIChatMessage, BaseChatMessage, HumanChatMessage} from "langchain/schema";
import {format} from "util";
import {BotClient} from "../client/discord";
import {Character} from "../types/character";

const messageFormat: string = "%s: %s";

class Util {
    getSessionIdFromMessage(message: Message | PartialMessage): string {
        if (message.channel.type === ChannelType.DM)
            return message.author?.id ?? "";
        else
            return `${message.guild?.id}-${message.channel.id}`
    }

    messageToChatData(message: Message): ChatData {
        const chatData = new ChatData();
        chatData.messageId = message.id;
        chatData.time = message.createdAt;
        chatData.userName = message.author.username;
        chatData.userNick = message.member?.nickname ?? ""
        chatData.userId = message.author.id;
        chatData.sessionId = instance.getSessionIdFromMessage(message);
        chatData.message = message.content;
        return chatData;
    }

    chatDataToBaseChatMessage(chatData: ChatData, character: Character): BaseChatMessage {
        return chatData.userId === BotClient.id ?
            new AIChatMessage(this.processMessage(instance.getFormattedMessage(chatData), character)) :
            new HumanChatMessage(instance.getFormattedMessage(chatData));
    }

    getFormattedMessage(chatData: ChatData): string {
        let userName = chatData.userNick === "" ? chatData.userName : chatData.userNick;
        let message = chatData.message;
        return format(messageFormat, userName, message);
    }

    processMessage(message: string, character: Character): string {
        const regex = new RegExp(`${character.name}.*:\\s*`);
        return message.replace(regex, "");
    }
}

const instance: Util = new Util();
export default instance;
