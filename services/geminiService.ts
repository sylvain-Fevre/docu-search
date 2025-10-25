import { GoogleGenAI } from "@google/genai";

// Cette ligne est LA SEULE manière sécurisée de gérer votre clé API.
// Vercel va "injecter" la vraie clé ici au moment de la construction du site.
// La clé ne sera JAMAIS visible dans le code source de votre page web.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("ERREUR CRITIQUE: La clé API Gemini n'est pas configurée dans les variables d'environnement de Vercel.");
}

// Initialise l'API uniquement si la clé existe
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export async function findInDocument(document: string, query: string): Promise<string> {
  if (!ai) {
      return "Erreur de configuration : Le service AI n'est pas initialisé. La clé API est probablement manquante sur le serveur. Veuillez contacter l'administrateur.";
  }

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
