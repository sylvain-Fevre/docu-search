import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.API_KEY as required by the guidelines to fix the 'ImportMeta' error and align with best practices.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // Fix: Updated error message to refer to the correct environment variable.
    console.error("ERREUR CRITIQUE: La clé API Gemini n'est pas configurée dans la variable d'environnement API_KEY.");
}

// Initialise l'API uniquement si la clé existe
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export async function findInDocument(document: string, query: string): Promise<string> {
  if (!ai) {
      return "Erreur de configuration : Le service AI n'est pas initialisé. La clé API est probablement manquante sur le serveur. Veuillez contacter l'administrateur.";
  }

  const model = 'gemini-2.5-flash';

  // Fix: Refactored the prompt to use `systemInstruction` for setting the model's role, which is a better practice.
  const systemInstruction = `Vous êtes un assistant intelligent spécialisé dans l'analyse de documentation technique. 
Votre tâche est de répondre aux questions de l'utilisateur en vous basant *uniquement* sur le contexte de la documentation fournie. 
Trouvez toutes les sections, concepts et extraits de code pertinents qui répondent à la question de l'utilisateur. 
Synthétisez ces informations en une réponse claire et complète. 
Si la réponse ne se trouve pas dans le document, indiquez explicitement que l'information n'est pas présente. 
N'utilisez aucune connaissance externe. La réponse doit être en français.`;

  const contents = `
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
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the Gemini API.");
  }
}
