"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Home() {
  const servizi = [
    { nome: "Taglio", durata: "30 min", prezzo: "25 €" },
    { nome: "Barba", durata: "20 min", prezzo: "15 €" },
    { nome: "Taglio + Barba", durata: "50 min", prezzo: "35 €" },
  ];

  const giorni = Array.from({ length: 7 }, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() + i);

    return {
      nome: data.toLocaleDateString("it-IT", {
        weekday: "short",
      }),
      data: data.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      }),
      valore: data.toISOString().split("T")[0],
    };
  });

  function generaOrari(
    inizio: string,
    fine: string,
    intervalloMinuti = 30
  ) {
    const orari: string[] = [];

    const [oraInizio, minutiInizio] = inizio
      .split(":")
      .map(Number);

    const [oraFine, minutiFine] = fine
      .split(":")
      .map(Number);

    let minutiTotali = oraInizio * 60 + minutiInizio;
    const minutiFinali = oraFine * 60 + minutiFine;

    while (minutiTotali < minutiFinali) {
      const ore = Math.floor(minutiTotali / 60);
      const minuti = minutiTotali % 60;

      const orario =
        `${String(ore).padStart(2, "0")}:` +
        `${String(minuti).padStart(2, "0")}`;

      orari.push(orario);

      minutiTotali += intervalloMinuti;
    }

    return orari;
  }

  const [servizioSelezionato, setServizioSelezionato] =
    useState<any>(null);

  const [giornoSelezionato, setGiornoSelezionato] =
    useState<any>(null);

  const [orarioSelezionato, setOrarioSelezionato] =
    useState<string | null>(null);

  const [mostraForm, setMostraForm] = useState(false);

  const [prenotazioneConfermata, setPrenotazioneConfermata] =
    useState(false);

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [orariOccupati, setOrariOccupati] = useState<string[]>([]);
  const [orari, setOrari] = useState<string[]>([]);

  async function caricaDisponibilita(giornoValore: string) {
    // 1. Controlliamo prima se la data è una chiusura straordinaria
    const {
      data: chiusura,
      error: erroreChiusura,
    } = await supabase
      .from("closures")
      .select("id")
      .eq("closure_date", giornoValore)
      .maybeSingle();

    if (erroreChiusura) {
      console.error(erroreChiusura);

      alert(
        "Errore nel controllo delle chiusure: " +
          erroreChiusura.message
      );

      setOrari([]);
      return;
    }

    // Se la data è chiusa, non mostriamo nessun orario
    if (chiusura) {
      setOrari([]);
      return;
    }

    // 2. Se non è una chiusura straordinaria,
    // controlliamo gli orari settimanali
    const data = new Date(giornoValore + "T12:00:00");
    const giornoSettimana = data.getDay();

    const {
      data: disponibilita,
      error,
    } = await supabase
      .from("availability")
      .select(
        "start_time, end_time, is_active, day_enabled"
      )
      .eq("day_of_week", giornoSettimana)
      .eq("is_active", true)
      .eq("day_enabled", true);

    if (error) {
      console.error(error);

      alert(
        "Errore nel caricamento della disponibilità: " +
          error.message
      );

      setOrari([]);
      return;
    }

    const nuoviOrari: string[] = [];

    (disponibilita || []).forEach((fascia: any) => {
      const orariFascia = generaOrari(
        fascia.start_time.slice(0, 5),
        fascia.end_time.slice(0, 5)
      );

      nuoviOrari.push(...orariFascia);
    });

    const orariUnici = [...new Set(nuoviOrari)].sort();

    setOrari(orariUnici);
  }

  async function caricaOrariOccupati(data: string) {
    const {
      data: prenotazioni,
      error,
    } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", data)
      .eq("status", "confirmed");

    if (error) {
      console.error(error);

      alert(
        "Errore nel caricamento degli orari: " +
          error.message
      );

      return;
    }

    const occupati = (prenotazioni || []).map(
      (prenotazione: any) => prenotazione.booking_time
    );

    setOrariOccupati(occupati);
  }

  async function confermaPrenotazione(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!nome || !telefono || !email) {
      alert("Compila tutti i campi");
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .insert([
        {
          customer_name: nome,
          customer_phone: telefono,
          customer_email: email,
          service_name: servizioSelezionato.nome,
          service_duration: servizioSelezionato.durata,
          service_price: servizioSelezionato.prezzo,
          booking_date: giornoSelezionato.valore,
          booking_time: orarioSelezionato,
          status: "confirmed",
        },
      ]);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        alert(
          "Questo orario è appena stato prenotato da un altro cliente. Scegli un altro orario."
        );
      } else {
        alert("Errore salvataggio: " + error.message);
      }

      return;
    }

    setPrenotazioneConfermata(true);
  }

  if (prenotazioneConfermata) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
          padding: "30px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            background: "white",
            padding: "28px",
            borderRadius: "18px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "60px" }}>✅</div>

          <h1>Prenotazione confermata</h1>

          <p>
            Ciao <strong>{nome}</strong>, il tuo appuntamento è stato
            confermato.
          </p>

          <div
            style={{
              marginTop: "24px",
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <p>
              <strong>Professionista:</strong> Mario Rossi
            </p>

            <p>
              <strong>Servizio:</strong>{" "}
              {servizioSelezionato.nome}
            </p>

            <p>
              <strong>Giorno:</strong>{" "}
              {giornoSelezionato.data}
            </p>

            <p>
              <strong>Ora:</strong>{" "}
              {orarioSelezionato}
            </p>

            <p>
              <strong>Durata:</strong>{" "}
              {servizioSelezionato.durata}
            </p>

            <p>
              <strong>Prezzo:</strong>{" "}
              {servizioSelezionato.prezzo}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const orariDisponibili = orari.filter(
    (orario) => !orariOccupati.includes(orario)
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
        padding: "30px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          background: "white",
          padding: "28px",
          borderRadius: "18px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "#dddddd",
              margin: "0 auto 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
            }}
          >
            👤
          </div>

          <h1 style={{ marginBottom: "6px" }}>
            Mario Rossi
          </h1>

          <p style={{ margin: 0 }}>Barbiere</p>
        </div>

        {!mostraForm && (
          <>
            <h2>Scegli un servizio</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {servizi.map((servizio) => (
                <button
                  key={servizio.nome}
                  onClick={() => {
                    setServizioSelezionato(servizio);
                    setGiornoSelezionato(null);
                    setOrarioSelezionato(null);
                    setOrari([]);
                    setOrariOccupati([]);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px",
                    borderRadius: "12px",
                    border:
                      servizioSelezionato?.nome ===
                      servizio.nome
                        ? "2px solid black"
                        : "1px solid #dddddd",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        marginBottom: "5px",
                      }}
                    >
                      {servizio.nome}
                    </div>

                    <div style={{ fontSize: "14px" }}>
                      {servizio.durata}
                    </div>
                  </div>

                  <strong>{servizio.prezzo}</strong>
                </button>
              ))}
            </div>

            {servizioSelezionato && (
              <>
                <h2 style={{ marginTop: "32px" }}>
                  Scegli un giorno
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(4, 1fr)",
                    gap: "10px",
                  }}
                >
                  {giorni.map((giorno) => (
                    <button
                      key={giorno.valore}
                      onClick={async () => {
                        setGiornoSelezionato(giorno);
                        setOrarioSelezionato(null);
                        setOrari([]);
                        setOrariOccupati([]);

                        await Promise.all([
                          caricaDisponibilita(
                            giorno.valore
                          ),
                          caricaOrariOccupati(
                            giorno.valore
                          ),
                        ]);
                      }}
                      style={{
                        padding: "14px 8px",
                        borderRadius: "10px",
                        border:
                          giornoSelezionato?.valore ===
                          giorno.valore
                            ? "2px solid black"
                            : "1px solid #dddddd",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{giorno.nome}</strong>
                      <br />
                      {giorno.data}
                    </button>
                  ))}
                </div>
              </>
            )}

            {giornoSelezionato && (
              <>
                <h2 style={{ marginTop: "32px" }}>
                  Scegli un orario
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, 1fr)",
                    gap: "10px",
                  }}
                >
                  {orariDisponibili.length === 0 && (
                    <p
                      style={{
                        gridColumn: "1 / -1",
                        color: "#666",
                      }}
                    >
                      Nessuna disponibilità per questo
                      giorno. Scegli un'altra data.
                    </p>
                  )}

                  {orariDisponibili.map((orario) => (
                    <button
                      key={orario}
                      onClick={() =>
                        setOrarioSelezionato(orario)
                      }
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border:
                          orarioSelezionato === orario
                            ? "2px solid black"
                            : "1px solid #dddddd",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      {orario}
                    </button>
                  ))}
                </div>
              </>
            )}

            {orarioSelezionato && (
              <div
                style={{
                  marginTop: "32px",
                  padding: "18px",
                  background: "#f5f5f5",
                  borderRadius: "12px",
                }}
              >
                <strong>Hai scelto:</strong>

                <p>
                  {servizioSelezionato.nome} —{" "}
                  {giornoSelezionato.data} alle{" "}
                  {orarioSelezionato}
                </p>

                <button
                  onClick={() => setMostraForm(true)}
                  style={{
                    width: "100%",
                    padding: "15px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Continua
                </button>
              </div>
            )}
          </>
        )}

        {mostraForm && (
          <>
            <button
              onClick={() => setMostraForm(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                marginBottom: "20px",
              }}
            >
              ← Indietro
            </button>

            <h2>I tuoi dati</h2>

            <p>
              {servizioSelezionato.nome} —{" "}
              {giornoSelezionato.data} alle{" "}
              {orarioSelezionato}
            </p>

            <form onSubmit={confermaPrenotazione}>
              <label>Nome e cognome</label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Mario Bianchi"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  marginTop: "7px",
                  marginBottom: "18px",
                  borderRadius: "10px",
                  border: "1px solid #cccccc",
                  fontSize: "16px",
                }}
              />

              <label>Telefono</label>

              <input
                type="tel"
                value={telefono}
                onChange={(e) =>
                  setTelefono(e.target.value)
                }
                placeholder="333 1234567"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  marginTop: "7px",
                  marginBottom: "18px",
                  borderRadius: "10px",
                  border: "1px solid #cccccc",
                  fontSize: "16px",
                }}
              />

              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="mario@email.it"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  marginTop: "7px",
                  marginBottom: "24px",
                  borderRadius: "10px",
                  border: "1px solid #cccccc",
                  fontSize: "16px",
                }}
              />

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: "bold",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Conferma prenotazione
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}