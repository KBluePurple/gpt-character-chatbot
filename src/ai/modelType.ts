export interface Model {
    modelName: string;
    maxTokens: number;
    temperature: number;
    presencePenalty: number;
    frequencyPenalty: number;
    timeout: number;
    basePath?: string;
    openAIApiKey?: string;
}

export enum ModelType {
    GPT_3_5_TURBO = "gpt-3.5-turbo"
}

export const Models: { [key in ModelType]: Model } = {
    "gpt-3.5-turbo": {
        modelName: "gpt-3.5-turbo",
        openAIApiKey: process.env.OPENAI_API_KEY ?? "None",
        maxTokens: 200,
        temperature: 0.8,
        presencePenalty: 0.7,
        frequencyPenalty: 0.7,
        timeout: 1000000,
    }
}