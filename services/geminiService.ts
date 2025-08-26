/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { type FormData } from "../components/StartScreen";

export interface StudyBookResult {
  content: string;
  sources: { title: string; uri: string }[];
}

/**
 * Generates a study book with text and images based on user input.
 * @param formData The user's input for the study book.
 * @param updateProgress A callback function to report progress.
 * @returns A promise that resolves to the generated study book content and sources.
 */
export const generateStudyBook = async (
    formData: FormData,
    updateProgress: (message: string) => void
): Promise<StudyBookResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // 1. Generate text content with image placeholders
    updateProgress('Researching and drafting content...');
    console.log('Generating text content...');
    
    const textPrompt = `You are an expert educator and content creator. Your task is to generate a comprehensive, professional, and easy-to-understand study guide based on the user's request.

    **Main Topic:** ${formData.topic}
    **Subtopic:** ${formData.subtopic}
    
    **Guiding Instructions:**
    ${formData.guide}
    
    **Reference Books/Sources to consult:**
    ${formData.references}
    
    **Content Requirements:**
    1.  **Structure and Formatting:**
        *   Organize the content logically with clear headings (H1, H2, H3), subheadings, and paragraphs. Use Markdown for all formatting.
        *   Keep paragraphs short (2-4 sentences maximum) for excellent readability.
        *   Utilize bullet points and numbered lists frequently to break down complex information into digestible pieces.
        *   Ensure generous spacing between paragraphs, lists, and headings to create a clean, uncluttered layout.
    2.  **Tone:** Maintain a professional yet accessible tone. The content should be easy for a college student to study and understand, while still being comprehensive.
    3.  **Illustrations:** To enhance understanding, insert placeholders for images, diagrams, or tables where they would be most effective. Use the format \`[IMAGE: A clear, descriptive prompt for an image]\`. For example: \`[IMAGE: A diagram showing the process of photosynthesis, labeling the inputs and outputs.]\`. Be specific in your image prompts. Insert a variety of placeholders for both diagrams and photos where appropriate.
    4.  **Tables:** Use markdown tables for comparisons or data summaries where appropriate. Ensure any tables are well-structured in Markdown, with clear headers, aligned columns, and concise data presentation. The table should be easy to read and integrate seamlessly with the surrounding text.
    
    Generate the study guide now.`;

    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
        config: { tools: [{ googleSearch: {} }] },
    });

    let markdownContent = textResponse.text;
    console.log('Text content received.');

    const groundingMetadata = textResponse.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web)
        .filter((web, index, self) => web && self.findIndex(w => w.uri === web.uri) === index) // Filter out duplicates
        .map(web => ({ title: web.title || web.uri, uri: web.uri })) as { title: string; uri: string }[] || [];

    // 2. Extract image prompts from the markdown
    updateProgress('Planning illustrations...');
    const imagePrompts: string[] = [];
    const imagePlaceholderRegex = /\[IMAGE:\s*(.*?)\]/g;
    let match;
    while ((match = imagePlaceholderRegex.exec(markdownContent)) !== null) {
        imagePrompts.push(match[1]);
    }
    console.log(`Found ${imagePrompts.length} image prompts.`);
    
    const generatedImageUrls: string[] = [];
    if (imagePrompts.length > 0) {
        // 3a. Classify image prompts
        updateProgress('Categorizing illustration types...');
        let imageTypes: ('diagram' | 'photograph')[] = Array(imagePrompts.length).fill('diagram');
        try {
            const typeResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `For a study book on "${formData.topic} - ${formData.subtopic}", analyze the following image prompts. For each prompt, decide if it's better suited as a "diagram" (for concepts, processes, abstract ideas) or a "photograph" (for real-world examples, people, places, objects).
                
                Prompts:
                ${imagePrompts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}
                
                Return your response as a JSON array of strings, where each string is either "diagram" or "photograph", corresponding to each prompt in order. Example: ["diagram", "photograph", "diagram"]`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
            const parsedResponse = JSON.parse(typeResponse.text);
            if (Array.isArray(parsedResponse) && parsedResponse.length === imagePrompts.length) {
                imageTypes = parsedResponse.map(t => (t === 'photograph' ? 'photograph' : 'diagram'));
                console.log('Image types categorized:', imageTypes);
            } else {
                console.warn('Could not parse image types, defaulting all to diagram.');
            }
        } catch (e) {
            console.error('Failed to categorize image types, defaulting all to diagram.', e);
        }

        updateProgress('Refining illustration concepts...');
        // 3b. Rewrite prompts and generate images for each.
        for (let i = 0; i < imagePrompts.length; i++) {
            const originalPrompt = imagePrompts[i];
            const imageType = imageTypes[i];
            updateProgress(`Processing illustration ${i + 1} of ${imagePrompts.length}...`);

            // Rewrite the abstract prompt into a detailed visual prompt.
            let visualPrompt = originalPrompt;
            try {
                const rewriteInstruction = imageType === 'diagram'
                    ? `You are an expert prompt engineer for a text-to-image AI model. Rewrite the following abstract concept for a study book diagram into a detailed, visual prompt. The new prompt must describe a visual scene with clear objects, layout, style, and colors. It should be an instruction to DRAW, not to write text or code.
                    - Style: A minimalist, clean, modern, technical infographic diagram. Use a professional and limited color palette (e.g., blues, greens, grays). Ensure clear labels with a sans-serif font. The background MUST be solid white.
                    - Content: Describe the shapes (rectangles, circles, arrows), the connections, and the text labels visually.
                    - AVOID: Do not output code, markdown, or any non-visual instructions. The entire output must be a single, descriptive paragraph for the image model.

                    **Original concept:** "${originalPrompt}"`
                    : `You are an expert prompt engineer for a text-to-image AI model. Rewrite the following brief concept for a study book photograph into a detailed, visual prompt. The new prompt should describe a scene, subject, setting, lighting, composition, and mood to generate a photorealistic image.
                    - Style: A high-quality, professional, photorealistic photograph suitable for an educational textbook. The image should be sharp, well-composed, and directly illustrative of the subject. Use natural or studio lighting as appropriate.
                    - Content: Describe the scene, the main subject, any other objects, the environment, and the overall feeling.

                    **Original concept:** "${originalPrompt}"`;
                
                const rewrittenPromptResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: rewriteInstruction,
                    config: { temperature: 0.4 }
                });

                visualPrompt = rewrittenPromptResponse.text;
                console.log(`Rewritten prompt for "${originalPrompt}": ${visualPrompt}`);
            } catch(e) {
                console.error(`Failed to rewrite prompt for "${originalPrompt}", using original.`, e);
                visualPrompt = originalPrompt; // Fallback to original
            }

            // Generate the image using the new, more descriptive prompt.
            updateProgress(`Generating ${imageType} ${i + 1} of ${imagePrompts.length}: "${originalPrompt.substring(0, 30)}..."`);
            try {
                const imageResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: visualPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/png',
                        aspectRatio: '16:9',
                    },
                });
                const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                generatedImageUrls.push(imageUrl);
            } catch (error) {
                console.error(`Failed to generate image for prompt: "${visualPrompt}"`, error);
                generatedImageUrls.push(''); 
            }
        }
    }
    
    // 4. Replace placeholders with actual image tags
    updateProgress('Assembling the final study book...');
    console.log('Replacing placeholders with generated images.');
    let finalContent = markdownContent;
    imagePrompts.forEach((prompt, index) => {
        const imageUrl = generatedImageUrls[index];
        if (imageUrl) {
            finalContent = finalContent.replace(
                `[IMAGE: ${prompt}]`,
                `<img src="${imageUrl}" alt="${prompt}" class="my-6 rounded-lg shadow-lg mx-auto" />`
            );
        } else {
             finalContent = finalContent.replace(`[IMAGE: ${prompt}]`, ''); // Remove placeholder if image failed
        }
    });

    console.log('Study book generation complete.');
    return { content: finalContent, sources };
};