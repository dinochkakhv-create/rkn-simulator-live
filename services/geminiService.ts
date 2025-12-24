
import { GoogleGenAI, Type } from "@google/genai";

// Always create a new GoogleGenAI instance right before making an API call 
// to ensure it uses the most up-to-date API key.
export const generateBlockAndReplacement = async (serviceName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Ты — высокопоставленный чиновник Роскомнадзора. 
    Твоя задача — придумать абсурдное, бюрократическое и крайне запутанное оправдание для блокировки сервиса или игры "${serviceName}".
    Используй канцеляризмы, ссылайся на несуществующие статьи и законы, упоминай "защиту детей от кубического влияния", "информационный суверенитет", "пропаганду западных механик".
    
    Также ты должен предложить "Отечественный аналог" (импортозамещение). 
    Название аналога должно быть смешным, патриотичным и нелепым.
    Примеры:
    - YouTube -> "НашТруба"
    - Roblox -> "Скрепные Кубики" или "СтройПлощадка №7"
    - Minecraft -> "Шахтерская Правда"
    - Brawl Stars -> "Битва Дружин"
    
    Придумай краткое описание аналога, подчеркивающее его "безопасность", "воспитательную ценность" и "традиционность".

    Ответ должен быть на русском языке в формате JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reason: {
              type: Type.STRING,
              description: 'Абсурдная причина блокировки.',
            },
            replacementName: {
              type: Type.STRING,
              description: 'Название отечественного аналога.',
            },
            replacementDescription: {
              type: Type.STRING,
              description: 'Описание аналога.',
            },
          },
          required: ["reason", "replacementName", "replacementDescription"],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    return {
      reason: data.reason || "Причина засекречена в интересах национальной безопасности.",
      replacement: {
        name: data.replacementName || "ГосПриложение",
        description: data.replacementDescription || "Безопасный аналог для всех граждан."
      }
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      reason: "Не удалось получить обоснование. Блокируем профилактически по факту нахождения в реестре.",
      replacement: {
        name: "СкрепнаяЗаглушка",
        description: "Временно заменяет отсутствующий здравый смысл."
      }
    };
  }
};
