import { GoogleGenAI, Type } from "@google/genai";
import { DocumentType, GeneratedContent, Template, ChartType, Slide } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const chartSchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            enum: ['bar', 'line', 'pie'] as ChartType[],
            description: 'The type of chart to display.',
        },
        labels: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The labels for the x-axis (for bar/line) or segments (for pie).',
        },
        datasets: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: 'The label for this dataset.' },
                    data: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: 'The numerical data for this dataset.'
                    }
                },
                required: ['label', 'data']
            },
            description: 'The data series to be plotted on the chart.'
        }
    },
    required: ['type', 'labels', 'datasets']
};

const baseItemSchemaProperties = {
    title: { type: Type.STRING },
    content: { type: Type.ARRAY, items: { type: Type.STRING } },
    imagePrompt: {
        type: Type.STRING,
        description: 'A brief, descriptive prompt for a relevant, professional image. E.g., "A photo of a solar panel farm at sunset." Only add if an image would strongly enhance the content.',
        nullable: true,
    },
    chart: {
        ...chartSchema,
        description: 'Data for a chart. Only include if data visualization is essential to explain the content.',
        nullable: true,
    },
};

const singleSlideSchema = {
    type: Type.OBJECT,
    properties: {
        ...baseItemSchemaProperties,
        title: { ...baseItemSchemaProperties.title, description: 'The title of the slide. Should be concise.' },
        content: { ...baseItemSchemaProperties.content, description: 'An array of strings, each being a detailed and informative bullet point.' },
        notes: {
            type: Type.STRING,
            description: 'Speaker notes for the slide.',
            nullable: true
        }
    },
    required: ['title', 'content']
};

const presentationSchema = {
    type: Type.ARRAY,
    items: singleSlideSchema,
};

const documentSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            ...baseItemSchemaProperties,
            title: { ...baseItemSchemaProperties.title, description: 'The title or heading of this document section.' },
            content: { ...baseItemSchemaProperties.content, description: 'An array of strings, each being a full paragraph.' },
        },
        required: ['title', 'content']
    },
};

export async function generateDocumentContent(prompt: string, documentType: DocumentType, template: Template, slideCount: number, fileContext?: string | null): Promise<GeneratedContent> {
    const isPresentation = documentType === DocumentType.PRESENTATION;
    const documentTypeName = isPresentation ? 'PowerPoint presentation' : 'Microsoft Word document';
    const schema = isPresentation ? presentationSchema : documentSchema;
    const countInstruction = isPresentation ? ` with exactly ${slideCount} slides` : '';
    
    let systemInstruction: string;
    let userPrompt: string;

    if (fileContext) {
        systemInstruction = `You are a highly specialized AI assistant named Hayagriva. Your only function is to act as a **Content Extractor and Formatter**. You will be given a text context and an instruction. Your entire response MUST be based *exclusively* on the provided text context.

**ABSOLUTE DIRECTIVES:**
1.  **SOURCE OF TRUTH:** The provided <CONTEXT> is your one and only source of information. You are forbidden from using any external knowledge, making assumptions, or inventing details. Every piece of content you generate must be directly traceable to the <CONTEXT>.
2.  **USER INSTRUCTION:** The <INSTRUCTION> from the user tells you *how* to process the <CONTEXT>. You must follow this instruction precisely. For example, if the instruction is "Summarize this in 3 slides," you will create a 3-slide summary using ONLY information from the <CONTEXT>.
3.  **OUTPUT FORMAT:** You MUST format your response as a valid JSON object that strictly adheres to the provided JSON schema. Do not include any text, explanations, or markdown formatting outside of the JSON object.
4.  **DOCUMENT TYPE:** The final output should be structured as a ${documentTypeName}${countInstruction}.
5.  **STYLE:** The content should reflect the style of the "${template.name}" template which uses the "${template.font}" font.
6.  **VISUALS:** If you include an 'imagePrompt' or a 'chart', the subject matter or data MUST be explicitly present in the <CONTEXT>.`;
        
        userPrompt = `<CONTEXT>\n${fileContext}\n</CONTEXT>\n\n<INSTRUCTION>\n${prompt}\n</INSTRUCTION>`;

    } else {
        systemInstruction = `You are an expert content creator named Hayagriva. Your task is to generate content for a professional ${documentTypeName} based on the user's prompt, styled according to the chosen template. The template is named "${template.name}" and uses a ${template.font} font with primary color ${template.colors.primary}.
For presentations, each slide's content should contain comprehensive and detailed information with multiple, informative bullet points.
Where appropriate, enhance slides or document sections with a relevant 'imagePrompt' or 'chart' data to visualize key information and improve engagement. Use professional and relevant visuals where they add value.
You must return valid JSON adhering to the provided schema, with no markdown formatting.`;
        userPrompt = `Create a ${documentTypeName}${countInstruction} about: "${prompt}"`;
    }


    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (!Array.isArray(parsedJson)) {
            throw new Error("API did not return a valid array.");
        }
        
        return parsedJson as GeneratedContent;

    } catch (error) {
        console.error("Error generating content:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating content.");
    }
}

export async function regenerateSlideContent(originalPrompt: string, newSlidePrompt: string, mediaRequest: 'image' | 'chart' | 'none'): Promise<Slide> {
    
    let mediaInstruction = "do not include any image or chart.";
    if (mediaRequest === 'image') {
        mediaInstruction = "you MUST include a relevant image by providing an 'imagePrompt'. Do not include a chart.";
    } else if (mediaRequest === 'chart') {
        mediaInstruction = "you MUST include a relevant data chart by providing 'chart' data. Do not include an image.";
    }

    const systemInstruction = `You are an expert content editor named Hayagriva. You are editing a single slide within a larger presentation about "${originalPrompt}". Your task is to regenerate the content for this specific slide based on the user's new instructions. Ensure the new content is detailed and comprehensive.`;
    const userPrompt = `The user's new instruction for this slide is: "${newSlidePrompt}". Please regenerate the slide's title and content. The user has specifically requested that ${mediaInstruction}. Provide a single valid JSON object for the slide, adhering to the provided schema, with no markdown formatting.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: singleSlideSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Slide;

    } catch (error) {
        console.error("Error regenerating slide:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to regenerate slide: ${error.message}`);
        }
        throw new Error("An unknown error occurred while regenerating the slide.");
    }
}


export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, high-quality image for a business presentation: ${prompt}`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No image was generated from the prompt.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
}