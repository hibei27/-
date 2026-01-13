import { GoogleGenAI, Modality } from "@google/genai";
import { User, Prize } from "../types";

// Note: In a real production app, never expose API keys in client-side code.
// This is for demonstration purposes using the provided process.env pattern.

const API_KEY = process.env.API_KEY || '';

export const generateCongratulatorySpeech = async (winner: User, prize: Prize): Promise<string> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing");
    return `恭喜 ${winner.name} 获得 ${prize.name}！实至名归！`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      你是一个高科技年会的主持人，语气激动、热情、充满未来感。
      刚刚抽出了一位中奖者。
      
      获奖者姓名：${winner.name}
      奖品：${prize.name}
      
      请生成一段简短、激情澎湃的颁奖词（2句话以内），用来在现场大屏展示或朗读。
      请直接输出内容，不要包含引号或其他说明。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || `恭喜 ${winner.name}！这一刻属于你！`;
  } catch (error) {
    console.error("Gemini generation failed", error);
    return `恭喜 ${winner.name} 获得 ${prize.name}！`;
  }
};

// --- TTS Helpers ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert raw PCM Int16 to AudioBuffer
function pcmToAudioBuffer(
  pcmData: Uint8Array, 
  ctx: AudioContext, 
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer {
  const int16Data = new Int16Array(pcmData.buffer);
  const frameCount = int16Data.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    // Loop through frames
    for (let i = 0; i < frameCount; i++) {
        // Int16 ranges from -32768 to 32767. Normalize to -1.0 to 1.0
        channelData[i] = int16Data[i * numChannels + channel] / 32768.0; 
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

export const speakText = async (text: string): Promise<void> => {
  if (!API_KEY) {
    console.warn("Gemini API Key missing for TTS");
    return;
  }
  if (!text) return;

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        console.warn("No audio data returned from Gemini TTS");
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const pcmBytes = decodeBase64(base64Audio);
    const buffer = pcmToAudioBuffer(pcmBytes, audioContext);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error", error);
  }
};