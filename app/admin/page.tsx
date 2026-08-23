"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [disponibilita, setDisponibilita] = useState<any[]>([]);
  const [chiusure, setChiusure] = useState<any[]>([]);

  const [nuovaDataChiusura, setNuovaDataChiusura] = useState("");
  const [motivoChiusura, setMotivoChiusura] = useState("");

  const [caricamento, setCaricamento] = useState(true);
  const [controlloAccesso, setControlloAccesso] = useState(true);

  const giorni = [
    { numero: 1, nome: "Lunedì" },
    { numero: 2, nome: "Martedì" },
    { numero: 3, nome: "Mercoledì" },
    { numero: 4, nome: "Giovedì" },
    { numero: 5, nome: "Venerdì" },
    { numero: 6, nome: "Sabato" },
    { numero: 0, nome: "Domenica" },
  ];

  useEffect(() => {
    controllaAccesso();
  }, []);

  async function controllaAccesso() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      window.location.replace("/login");
      return;
    }

    setControlloAccesso(false);

    await Promise.all([
      caricaPrenotazioni(),
      caricaDisponibilita(),
      caricaChiusure(),
    ]);
  }

  async function caricaPrenotazioni() {
    setCaricamento(true);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (error) {
      alert("Errore prenotazioni: " + error.message);
      setCaricamento(false);
      return;
    }

    setPrenotazioni(data || []);
    setCaricamento(false);
  }

  async function caricaDisponibilita() {
    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      alert("Errore orari: " + error.message);
      return;
    }

    setDisponibilita(data || []);
  }

  async function caricaChiusure() {
    const { data, error } = await supabase
      .from("closures")
      .select("*")
      .order("closure_date", { ascending: true });

    if (error) {
      alert("Errore chiusure: " + error.message);
      return;
    }

    setChiusure(data || []);
  }

  async function aggiungiChiusura() {
    if (!nuovaDataChiusura) {
      alert("Scegli una data.");
      return;
    }

    const { error } = await supabase
      .from("closures")
      .insert([
        {
          closure_date: nuovaDataChiusura,
          reason: motivoChiusura || null,
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        alert("Questa data è già presente tra le chiusure.");
      } else {
        alert("Errore: " + error.message);
      }
      return;
    }

    setNuovaDataChiusura("");
    setMotivoChiusura("");

    await caricaChiusure();
  }

  async function eliminaChiusura(id: number) {
    const conferma = window.confirm(
      "Vuoi eliminare questa chiusura straordinaria?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("closures")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore eliminazione: " + error.message);
      return;
    }

    await caricaChiusure();
  }

  async function cambiaStatoGiorno(
    giorno: number,
    aperto: boolean,
    fasce: any[]
  ) {
    if (fasce.length === 0 && aperto) {
      const { error } = await supabase
        .from("availability")
        .insert([
          {
            day_of_week: giorno,
            start_time: "09:00",
            end_time: "13:00",
            is_active: true,
            day_enabled: true,
          },
        ]);

      if (error) {
        alert("Errore apertura giornata: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("availability")
        .update({
          day_enabled: aperto,
        })
        .eq("day_of_week", giorno);

      if (error) {
        alert("Errore modifica giornata: " + error.message);
        return;
      }
    }

    await caricaDisponibilita();
  }

  async function aggiungiFascia(giorno: number) {
    const fasceGiorno = disponibilita.filter(
      (f) => f.day_of_week === giorno
    );

    const giornoAperto =
      fasceGiorno.length === 0
        ? true
        : fasceGiorno.some((f) => f.day_enabled !== false);

    if (!giornoAperto) {
      alert("Prima imposta il giorno come Aperto.");
      return;
    }

    const { error } = await supabase
      .from("availability")
      .insert([
        {
          day_of_week: giorno,
          start_time: "09:00",
          end_time: "13:00",
          is_active: true,
          day_enabled: true,
        },
      ]);

    if (error) {
      alert("Errore: " + error.message);
      return;
    }

    await caricaDisponibilita();
  }

  async function modificaFascia(
    id: number,
    campo: string,
    valore: any
  ) {
    const { error } = await supabase
      .from("availability")
      .update({
        [campo]: valore,
      })
      .eq("id", id);

    if (error) {
      alert("Errore modifica: " + error.message);
      return;
    }

    await caricaDisponibilita();
  }

  async function eliminaFascia(id: number) {
    const conferma = window.confirm(
      "Vuoi eliminare questa fascia oraria?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore eliminazione: " + error.message);
      return;
    }

    await caricaDisponibilita();
  }

  async function annullaPrenotazione(id: number) {
    const conferma = window.confirm(
      "Vuoi davvero annullare questo appuntamento?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      alert("Errore annullamento: " + error.message);
      return;
    }

    await caricaPrenotazioni();
  }

  async function esci() {
    await supabase.auth.signOut();
    window.location.assign(window.location.origin + "/login");
  }

  const oggi = new Date().toISOString().split("T")[0];

  const appuntamentiOggi = prenotazioni.filter(
    (p) => p.booking_date === oggi
  );

  const prossimiAppuntamenti = prenotazioni.filter(
    (p) => p.booking_date > oggi
  );

  function SchedaPrenotazione({ prenotazione }: any) {
    return (
      <div
        style={{
          background: "white",
          padding: "18px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {prenotazione.booking_date} — {prenotazione.booking_time}
        </h3>

        <p>
          <strong>Cliente:</strong> {prenotazione.customer_name}
        </p>

        <p>
          <strong>Servizio:</strong> {prenotazione.service_name}
        </p>

        <p>
          <strong>Telefono:</strong> {prenotazione.customer_phone}
        </p>

        <p>
          <strong>Email:</strong> {prenotazione.customer_email}
        </p>

        <button
          type="button"
          onClick={() => annullaPrenotazione(prenotazione.id)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          Annulla appuntamento
        </button>
      </div>
    );
  }

  if (controlloAccesso) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Controllo accesso...
      </main>
    );
  }

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
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "35px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "5px" }}>
              Area professionista
            </h1>

            <p style={{ margin: 0 }}>
              Gestisci prenotazioni e disponibilità.
            </p>
          </div>

          <button
            type="button"
            onClick={esci}
            style={{
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Esci
          </button>
        </div>

        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "40px",
          }}
        >
          <h2>Orari di lavoro</h2>

          {giorni.map((giorno) => {
            const fasce = disponibilita.filter(
              (f) => f.day_of_week === giorno.numero
            );

            const aperto =
              fasce.length > 0 &&
              fasce.some(
                (fascia) => fascia.day_enabled !== false
              );

            return (
              <div
                key={giorno.numero}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >
                  <strong>{giorno.nome}</strong>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        cambiaStatoGiorno(
                          giorno.numero,
                          !aperto,
                          fasce
                        )
                      }
                    >
                      {aperto ? "Aperto" : "Chiuso"}
                    </button>

                    {aperto && (
                      <button
                        type="button"
                        onClick={() =>
                          aggiungiFascia(giorno.numero)
                        }
                      >
                        + Aggiungi fascia
                      </button>
                    )}
                  </div>
                </div>

                {!aperto && (
                  <p style={{ color: "#666" }}>
                    Nessuna prenotazione disponibile.
                  </p>
                )}

                {aperto &&
                  fasce.map((fascia) => (
                    <div
                      key={fascia.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        marginBottom: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        type="time"
                        defaultValue={fascia.start_time.slice(0, 5)}
                        onBlur={(e) =>
                          modificaFascia(
                            fascia.id,
                            "start_time",
                            e.target.value
                          )
                        }
                      />

                      <span>→</span>

                      <input
                        type="time"
                        defaultValue={fascia.end_time.slice(0, 5)}
                        onBlur={(e) =>
                          modificaFascia(
                            fascia.id,
                            "end_time",
                            e.target.value
                          )
                        }
                      />

                      <label>
                        <input
                          type="checkbox"
                          checked={fascia.is_active}
                          onChange={(e) =>
                            modificaFascia(
                              fascia.id,
                              "is_active",
                              e.target.checked
                            )
                          }
                        />{" "}
                        Fascia attiva
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          eliminaFascia(fascia.id)
                        }
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </section>

        <section
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "40px",
          }}
        >
          <h2>Chiusure straordinarie</h2>

          <p>
            Usa questa sezione per ferie, festività o giorni in cui non vuoi
            accettare prenotazioni.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <input
              type="date"
              value={nuovaDataChiusura}
              onChange={(e) =>
                setNuovaDataChiusura(e.target.value)
              }
            />

            <input
              type="text"
              value={motivoChiusura}
              onChange={(e) =>
                setMotivoChiusura(e.target.value)
              }
              placeholder="Motivo, es. Ferie"
            />

            <button
              type="button"
              onClick={aggiungiChiusura}
            >
              Aggiungi chiusura
            </button>
          </div>

          {chiusure.length === 0 && (
            <p>Nessuna chiusura straordinaria.</p>
          )}

          {chiusure.map((chiusura) => (
            <div
              key={chiusura.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <strong>{chiusura.closure_date}</strong>

                {chiusura.reason && (
                  <span> — {chiusura.reason}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  eliminaChiusura(chiusura.id)
                }
              >
                Elimina
              </button>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2>Appuntamenti di oggi</h2>

          {appuntamentiOggi.length === 0 && (
            <p>Nessun appuntamento per oggi.</p>
          )}

          {appuntamentiOggi.map((prenotazione) => (
            <SchedaPrenotazione
              key={prenotazione.id}
              prenotazione={prenotazione}
            />
          ))}
        </section>

        <section>
          <h2>Prossimi appuntamenti</h2>

          {prossimiAppuntamenti.length === 0 && (
            <p>Nessun prossimo appuntamento.</p>
          )}

          {prossimiAppuntamenti.map((prenotazione) => (
            <SchedaPrenotazione
              key={prenotazione.id}
              prenotazione={prenotazione}
            />
          ))}
        </section>
      </div>
    </main>
  );
}