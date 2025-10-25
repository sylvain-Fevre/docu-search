import { GoogleGenAI } from "@google/genai";

// =======================================================================
// RÈGLE FINALE ET DÉFINITIVE
// =======================================================================
// Pour les projets construits avec Vite, la variable d'environnement DOIT
// commencer par "VITE_" sur Vercel et être lue dans le code avec
// "import.meta.env.VITE_API_KEY". C'est la seule méthode qui fonctionne.
// =======================================================================
const API_KEY = import.meta.env.VITE_API_KEY;

let ai: GoogleGenAI | null = null;

// Initialise l'API uniquement si la clé a bien été trouvée.
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  // Cette erreur apparaîtra dans la console du navigateur si la clé est manquante.
  console.error("ERREUR CRITIQUE: La clé API Gemini est manquante. Assurez-vous qu'une variable d'environnement nommée VITE_API_KEY est bien définie sur Vercel.");
}

export async function findInDocument(document: string, query: string): Promise<string> {
  // Si l'initialisation a échoué, on retourne une erreur claire à l'utilisateur.
  if (!ai) {
      return "Erreur de configuration : Le service AI n'est pas initialisé. La clé API est probablement manquante ou mal configurée. Veuillez vérifier la variable d'environnement VITE_API_KEY sur Vercel.";
  }

  const model = 'gemini-2.5-flash';
  
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
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('permission'))) {
        return "Erreur de communication : La clé API fournie n'est pas valide ou n'a pas les permissions nécessaires. Vérifiez la configuration sur Vercel et Google Cloud.";
    }
    throw new Error("Failed to get a response from the Gemini API.");
  }
}
