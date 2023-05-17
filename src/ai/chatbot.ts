import {ChatOpenAI} from "langchain/chat_models/openai";
import {BaseChatMessage} from "langchain/schema";
import axios, {Canceler} from "axios";
import {Model, Models, ModelType} from "./modelType";
import {ChatSession} from "./chatSession";

export class ChatBot {

    private model: Model;
    private chat: ChatOpenAI;

    private sessions: Map<string, ChatSession> = new Map<string, ChatSession>();

    constructor(modelType: ModelType) {
        this.model = Models[modelType];
        this.chat = new ChatOpenAI({
            openAIApiKey: this.model.openAIApiKey ?? "None",
            modelName: this.model.modelName,
            maxTokens: this.model.maxTokens,
            temperature: this.model.temperature,
            presencePenalty: this.model.presencePenalty,
            frequencyPenalty: this.model.frequencyPenalty,
            timeout: this.model.timeout,
        }, {
            basePath: this.model.basePath ?? "https://api.openai.com/v1",
        });

        console.log(`ChatBot: ${modelType} model loaded.`);
    }

    public async callAsync(chatList: BaseChatMessage[]): Promise<{
        message: Promise<BaseChatMessage>,
        canceler: Canceler
    }> {
        let canceler: Canceler = () => {
        };
        const result = this.chat.call(chatList, {
            options: {
                cancelToken: new axios.CancelToken(function executor(c) {
                    canceler = c;
                })
            }
        });

        return {
            message: result,
            canceler: canceler
        }
    }

    getSession(sessionId: string): ChatSession {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new ChatSession(sessionId, this));
        }

        return this.sessions.get(sessionId)!;
    }
}