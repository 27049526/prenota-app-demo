export async function POST(request: Request) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
  
      if (!apiKey) {
        return Response.json(
          {
            error: "RESEND_API_KEY non configurata.",
          },
          { status: 500 }
        );
      }
  
      const body = await request.json();
  
      const {
        customerName,
        customerEmail,
        professionalName,
        serviceName,
        bookingDate,
        bookingTime,
        durationMinutes,
        price,
      } = body;
  
      if (
        !customerName ||
        !customerEmail ||
        !serviceName ||
        !bookingDate ||
        !bookingTime
      ) {
        return Response.json(
          {
            error: "Dati mancanti per inviare la conferma.",
          },
          { status: 400 }
        );
      }
  
      const risposta = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
  
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
  
          body: JSON.stringify({
            from: "Prenota <onboarding@resend.dev>",
  
            to: [customerEmail],
  
            subject: "Prenotazione confermata",
  
            html: `
              <div
                style="
                  font-family: Arial, sans-serif;
                  max-width: 560px;
                  margin: 0 auto;
                  color: #111111;
                  line-height: 1.5;
                "
              >
                <h1 style="font-size: 26px;">
                  Prenotazione confermata
                </h1>
  
                <p>
                  Ciao <strong>${customerName}</strong>,
                  il tuo appuntamento è stato confermato.
                </p>
  
                <div
                  style="
                    margin-top: 24px;
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 12px;
                  "
                >
                  <p>
                    <strong>Professionista:</strong>
                    ${professionalName || "Professionista"}
                  </p>
  
                  <p>
                    <strong>Servizio:</strong>
                    ${serviceName}
                  </p>
  
                  <p>
                    <strong>Data:</strong>
                    ${bookingDate}
                  </p>
  
                  <p>
                    <strong>Ora:</strong>
                    ${bookingTime}
                  </p>
  
                  <p>
                    <strong>Durata:</strong>
                    ${durationMinutes} min
                  </p>
  
                  <p style="margin-bottom: 0;">
                    <strong>Prezzo:</strong>
                    ${price}
                  </p>
                </div>
  
                <p
                  style="
                    margin-top: 24px;
                    color: #666666;
                  "
                >
                  Ti aspettiamo!
                </p>
              </div>
            `,
          }),
        }
      );
  
      const risultato = await risposta.json();
  
      if (!risposta.ok) {
        console.error(
          "Errore Resend:",
          risultato
        );
  
        return Response.json(
          {
            error:
              risultato?.message ||
              "Errore durante l'invio dell'email.",
          },
          {
            status: risposta.status,
          }
        );
      }
  
      return Response.json({
        success: true,
        data: risultato,
      });
    } catch (error) {
      console.error(
        "Errore route email:",
        error
      );
  
      return Response.json(
        {
          error:
            "Errore interno durante l'invio dell'email.",
        },
        { status: 500 }
      );
    }
  }