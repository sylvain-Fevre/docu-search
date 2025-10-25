
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function findInDocument(document: string, query: string): Promise<string> {
  const model = 'gemini-2.5-flash';

  const prompt = `
    Vous êtes un assistant intelligent spécialisé dans l'analyse de documentation technique. 
    Votre tâche est de répondre aux questions de l'utilisateur en vous basant *uniquement* sur le contexte de la documentation fournie. 
    Trouvez toutes les sections, concepts et extraits de code pertinents qui répondent à la question de l'utilisateur. 
    Synthétisez ces informations en une réponse claire et complète. 
    Si la réponse ne se trouve pas dans le document, indiquez explicitement que l'information n'est pas présente. 
    N'utilisez aucune connaissance externe. La réponse doit être en français.

    Voici la documentation :
    ---
    ${document}
    ---

    Voici la question de l'utilisateur :
    ---
    ${query}
    ---

    Fournissez la réponse basée sur la documentation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the Gemini API.");
  }
}
