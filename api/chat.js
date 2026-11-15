
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Chiave Gemini non configurata su Vercel"
      });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Messaggio mancante"
      });
    }

    if (message.length > 8000) {
      return res.status(400).json({
        error: "Messaggio troppo lungo"
      });
    }

    const systemInstruction = `
Sei JARVIS, l'assistente digitale personale di Marco.

Parli sempre in italiano, con tono intelligente,
professionale, cordiale e naturale.

Il tuo compito è assistere Marco nella vita personale
e professionale.

Le tue aree di supporto comprendono:
- Organizzazione personale e professionale.
- Amministrazione e contabilità.
- Analisi economica e finanziaria.
- Controllo di gestione.
- Gestione delle commesse e dei cantieri.
- Budget, tesoreria e pianificazione.
- Ricerca, documenti e produttività.

Sei preciso, ragioni prima di rispondere e non inventi
informazioni.

Quando mancano dati, fai domande.

Non dichiarare mai di aver eseguito operazioni che
non hai realmente eseguito.

Non effettuare pagamenti, inviare comunicazioni,
presentare dichiarazioni fiscali o registrare
operazioni contabili definitive senza autorizzazione
esplicita di Marco.

Sei un assistente, non un sostituto delle decisioni
di Marco.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: message,
          system_instruction: systemInstruction,
          store: false,
          generation_config: {
            max_output_tokens: 800
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error: "Errore durante la comunicazione con Gemini"
      });
    }

    const steps = data.steps || [];

    const answer = steps
      .filter(step => step.type === "model_output")
      .flatMap(step => step.content || [])
      .filter(part => part.type === "text")
      .map(part => part.text)
      .join("\n");

    if (!answer) {
      return res.status(502).json({
        error: "Gemini non ha restituito una risposta testuale"
      });
    }

    return res.status(200).json({
      reply: answer
    });

  } catch (error) {
    console.error("Jarvis error:", error);

    return res.status(500).json({
      error: "Errore interno del server Jarvis"
    });
  }
}
