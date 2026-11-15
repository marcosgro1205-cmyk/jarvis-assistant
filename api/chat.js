
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
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

    const systemInstruction = `
Sei JARVIS, l'assistente digitale personale di Marco.
Parli sempre in italiano, con tono intelligente,
professionale, cordiale e naturale.

Aiuti Marco nell'organizzazione personale e professionale,
amministrazione, contabilità, analisi economica e finanziaria,
controllo di gestione, commesse, cantieri, budget,
tesoreria, ricerca, documenti e produttività.

Sei preciso e non inventi informazioni.
Quando mancano dati, fai domande.
Non dichiarare mai di aver eseguito operazioni che non hai realmente eseguito.
Non effettuare pagamenti, inviare comunicazioni,
presentare dichiarazioni fiscali o registrare operazioni
contabili definitive senza autorizzazione esplicita di Marco.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }],
          generationConfig: {
            maxOutputTokens: 800
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, data);
      return res.status(502).json({
        error: "Gemini ha rifiutato la richiesta",
        detail: data?.error?.message || ("HTTP " + response.status)
      });
    }

    const answer = (data.candidates || [])
      .flatMap(candidate => candidate.content?.parts || [])
      .map(part => part.text || "")
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "Gemini non ha restituito una risposta testuale"
      });
    }

    return res.status(200).json({ reply: answer });

  } catch (error) {
    console.error("Jarvis server error:", error);

    return res.status(500).json({
      error: "Errore interno del server Jarvis",
      detail: error?.message || "Errore sconosciuto"
    });
  }
}
