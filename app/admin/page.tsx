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
          background:
            "linear-gradient(180deg, #f7f7f8 0%, #eeeeef 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "20px 24px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            color: "#666",
          }}
        >
          Controllo accesso...
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7f7f8 0%, #eeeeef 100%)",
        fontFamily: "Arial, sans-serif",
        padding: "18px 14px 50px",
        color: "#111111",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* INTESTAZIONE */}
        <div
          style={{
            background: "#111111",
            color: "white",
            padding: "22px",
            borderRadius: "24px",
            marginBottom: "18px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.7,
                  marginBottom: "5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                }}
              >
                Dashboard
              </div>

              <h1
                style={{
                  margin: "0 0 6px",
                  fontSize: "28px",
                  color: "white",
                }}
              >
                Area professionista
              </h1>

              <p
                style={{
                  margin: 0,
                  opacity: 0.75,
                  fontSize: "14px",
                }}
              >
                Gestisci appuntamenti e disponibilità.
              </p>
            </div>

            <button
              type="button"
              onClick={esci}
              style={{
                padding: "11px 17px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Esci
            </button>
          </div>
        </div>

        {/* RIEPILOGO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "18px",
              borderRadius: "18px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: "13px",
                marginBottom: "5px",
              }}
            >
              Oggi
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "bold",
              }}
            >
              {appuntamentiOggi.length}
            </div>

            <div
              style={{
                color: "#777",
                fontSize: "13px",
              }}
            >
              appuntamenti
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: "18px",
              borderRadius: "18px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                color: "#777",
                fontSize: "13px",
                marginBottom: "5px",
              }}
            >
              In programma
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: "bold",
              }}
            >
              {prossimiAppuntamenti.length}
            </div>

            <div
              style={{
                color: "#777",
                fontSize: "13px",
              }}
            >
              prossimi
            </div>
          </div>
        </div>

        {/* APPUNTAMENTI DI OGGI */}
        <section
          style={{
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  marginBottom: "4px",
                }}
              >
                Agenda
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                }}
              >
                Appuntamenti di oggi
              </h2>
            </div>

            <button
              type="button"
              onClick={caricaPrenotazioni}
              style={{
                padding: "10px 13px",
                borderRadius: "11px",
                border: "1px solid #ddd",
                background: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Aggiorna
            </button>
          </div>

          {caricamento && (
            <div
              style={{
                background: "white",
                padding: "18px",
                borderRadius: "16px",
              }}
            >
              Caricamento...
            </div>
          )}

          {!caricamento && appuntamentiOggi.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "18px",
                color: "#666",
                boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              }}
            >
              Nessun appuntamento per oggi.
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {appuntamentiOggi.map((prenotazione) => (
              <SchedaPrenotazione
                key={prenotazione.id}
                prenotazione={prenotazione}
              />
            ))}
          </div>
        </section>

        {/* PROSSIMI APPUNTAMENTI */}
        <section
          style={{
            marginBottom: "38px",
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.7px",
              marginBottom: "4px",
            }}
          >
            Agenda
          </div>

          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "22px",
            }}
          >
            Prossimi appuntamenti
          </h2>

          {prossimiAppuntamenti.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "18px",
                color: "#666",
                boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              }}
            >
              Nessun prossimo appuntamento.
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {prossimiAppuntamenti.map((prenotazione) => (
              <SchedaPrenotazione
                key={prenotazione.id}
                prenotazione={prenotazione}
              />
            ))}
          </div>
        </section>

        {/* ORARI DI LAVORO */}
        <section
          style={{
            background: "white",
            padding: "22px",
            borderRadius: "24px",
            marginBottom: "20px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.7px",
              marginBottom: "4px",
            }}
          >
            Disponibilità
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
            }}
          >
            Orari di lavoro
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#666",
              lineHeight: 1.5,
              fontSize: "14px",
            }}
          >
            Imposta i giorni e le fasce orarie in cui i clienti
            possono prenotare.
          </p>

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
                  padding: "18px 0",
                  borderBottom: "1px solid #eeeeee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: aperto ? "15px" : "0",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "17px",
                      }}
                    >
                      {giorno.nome}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: aperto ? "#555" : "#999",
                      }}
                    >
                      {aperto
                        ? "Disponibile per le prenotazioni"
                        : "Giorno chiuso"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
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
                      style={{
                        padding: "10px 13px",
                        borderRadius: "11px",
                        border: aperto
                          ? "1px solid #111111"
                          : "1px solid #dddddd",
                        background: aperto
                          ? "#111111"
                          : "#f4f4f4",
                        color: aperto
                          ? "white"
                          : "#555",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {aperto ? "Aperto" : "Chiuso"}
                    </button>

                    {aperto && (
                      <button
                        type="button"
                        onClick={() =>
                          aggiungiFascia(giorno.numero)
                        }
                        style={{
                          padding: "10px 13px",
                          borderRadius: "11px",
                          border: "1px solid #dddddd",
                          background: "white",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        + Fascia
                      </button>
                    )}
                  </div>
                </div>

                {aperto &&
                  fasce.map((fascia) => (
                    <div
                      key={fascia.id}
                      style={{
                        background: "#f7f7f8",
                        borderRadius: "14px",
                        padding: "13px",
                        marginBottom: "9px",
                        display: "flex",
                        gap: "9px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        type="time"
                        defaultValue={fascia.start_time.slice(
                          0,
                          5
                        )}
                        onBlur={(e) =>
                          modificaFascia(
                            fascia.id,
                            "start_time",
                            e.target.value
                          )
                        }
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid #d8d8d8",
                          background: "white",
                          fontSize: "15px",
                        }}
                      />

                      <span
                        style={{
                          color: "#777",
                        }}
                      >
                        →
                      </span>

                      <input
                        type="time"
                        defaultValue={fascia.end_time.slice(
                          0,
                          5
                        )}
                        onBlur={(e) =>
                          modificaFascia(
                            fascia.id,
                            "end_time",
                            e.target.value
                          )
                        }
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid #d8d8d8",
                          background: "white",
                          fontSize: "15px",
                        }}
                      />

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
                      >
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
                        />
                        Attiva
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          eliminaFascia(fascia.id)
                        }
                        style={{
                          padding: "9px 12px",
                          borderRadius: "10px",
                          border: "1px solid #e1e1e1",
                          background: "white",
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </section>

        {/* CHIUSURE STRAORDINARIE */}
        <section
          style={{
            background: "white",
            padding: "22px",
            borderRadius: "24px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.7px",
              marginBottom: "4px",
            }}
          >
            Disponibilità
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
            }}
          >
            Chiusure straordinarie
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#666",
              lineHeight: 1.5,
              fontSize: "14px",
            }}
          >
            Ferie, festività o altri giorni in cui non vuoi
            ricevere prenotazioni.
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginBottom: "22px",
            }}
          >
            <input
              type="date"
              value={nuovaDataChiusura}
              onChange={(e) =>
                setNuovaDataChiusura(e.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #d8d8d8",
                background: "white",
                fontSize: "16px",
              }}
            />

            <input
              type="text"
              value={motivoChiusura}
              onChange={(e) =>
                setMotivoChiusura(e.target.value)
              }
              placeholder="Motivo, es. Ferie"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #d8d8d8",
                background: "white",
                fontSize: "16px",
              }}
            />

            <button
              type="button"
              onClick={aggiungiChiusura}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "#111111",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Aggiungi chiusura
            </button>
          </div>

          {chiusure.length === 0 && (
            <div
              style={{
                background: "#f7f7f8",
                padding: "16px",
                borderRadius: "14px",
                color: "#666",
              }}
            >
              Nessuna chiusura straordinaria.
            </div>
          )}

          {chiusure.map((chiusura) => (
            <div
              key={chiusura.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "14px 0",
                borderBottom: "1px solid #eeeeee",
              }}
            >
              <div>
                <strong>
                  {chiusura.closure_date}
                </strong>

                {chiusura.reason && (
                  <div
                    style={{
                      color: "#777",
                      fontSize: "14px",
                      marginTop: "3px",
                    }}
                  >
                    {chiusura.reason}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  eliminaChiusura(chiusura.id)
                }
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #dddddd",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Elimina
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}