"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [disponibilita, setDisponibilita] = useState<any[]>([]);
  const [chiusure, setChiusure] = useState<any[]>([]);

  const [profilo, setProfilo] = useState<any>(null);
  const [servizi, setServizi] = useState<any[]>([]);

  const [nuovoServizioNome, setNuovoServizioNome] = useState("");
  const [nuovoServizioDurata, setNuovoServizioDurata] = useState("");
  const [nuovoServizioPrezzo, setNuovoServizioPrezzo] = useState("");

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
      caricaProfilo(),
      caricaServizi(),
    ]);
  }

  // ============================
  // PROFILO
  // ============================

  async function caricaProfilo() {
    const { data, error } = await supabase
      .from("professional_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      alert("Errore profilo: " + error.message);
      return;
    }

    setProfilo(data);
  }

  async function salvaProfilo() {
    if (!profilo) return;

    if (!profilo.name?.trim()) {
      alert("Inserisci il nome del professionista.");
      return;
    }

    const { error } = await supabase
      .from("professional_profile")
      .update({
        name: profilo.name.trim(),
        profession: profilo.profession?.trim() || null,
        description: profilo.description?.trim() || null,
        phone: profilo.phone?.trim() || null,
        email: profilo.email?.trim() || null,
      })
      .eq("id", profilo.id);

    if (error) {
      alert("Errore salvataggio profilo: " + error.message);
      return;
    }

    alert("Profilo salvato.");
    await caricaProfilo();
  }

  // ============================
  // SERVIZI
  // ============================

  async function caricaServizi() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert("Errore servizi: " + error.message);
      return;
    }

    setServizi(data || []);
  }

  async function modificaServizio(
    id: number,
    campo: string,
    valore: any
  ) {
    const { error } = await supabase
      .from("services")
      .update({
        [campo]: valore,
      })
      .eq("id", id);

    if (error) {
      alert("Errore modifica servizio: " + error.message);
      return;
    }

    await caricaServizi();
  }

  async function aggiungiServizio() {
    if (
      !nuovoServizioNome.trim() ||
      !nuovoServizioDurata ||
      !nuovoServizioPrezzo
    ) {
      alert("Compila nome, durata e prezzo.");
      return;
    }

    const durata = Number(nuovoServizioDurata);
    const prezzo = Number(nuovoServizioPrezzo);

    if (durata <= 0 || prezzo < 0) {
      alert("Controlla durata e prezzo.");
      return;
    }

    const { error } = await supabase
      .from("services")
      .insert([
        {
          name: nuovoServizioNome.trim(),
          duration_minutes: durata,
          price: prezzo,
          is_active: true,
        },
      ]);

    if (error) {
      alert("Errore aggiunta servizio: " + error.message);
      return;
    }

    setNuovoServizioNome("");
    setNuovoServizioDurata("");
    setNuovoServizioPrezzo("");

    await caricaServizi();
  }

  async function eliminaServizio(id: number) {
    const conferma = window.confirm(
      "Vuoi davvero eliminare questo servizio?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore eliminazione servizio: " + error.message);
      return;
    }

    await caricaServizi();
  }

  // ============================
  // PRENOTAZIONI
  // ============================

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

  // ============================
  // DISPONIBILITÀ
  // ============================

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

  // ============================
  // CHIUSURE
  // ============================

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

  // ============================
  // LOGOUT
  // ============================

  async function esci() {
    await supabase.auth.signOut();

    window.location.assign(
      window.location.origin + "/login"
    );
  }

  // ============================
  // APPUNTAMENTI OGGI / FUTURI
  // ============================

  const oggi = new Date().toISOString().split("T")[0];

  const appuntamentiOggi = prenotazioni.filter(
    (p) => p.booking_date === oggi
  );

  const prossimiAppuntamenti = prenotazioni.filter(
    (p) => p.booking_date > oggi
  );

  function SchedaPrenotazione({
    prenotazione,
  }: any) {
    return (
      <div
        style={{
          background: "white",
          padding: "18px",
          borderRadius: "18px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            margin: "0 0 14px",
          }}
        >
          {prenotazione.booking_date} —{" "}
          {prenotazione.booking_time}
        </h3>

        <p>
          <strong>Cliente:</strong>{" "}
          {prenotazione.customer_name}
        </p>

        <p>
          <strong>Servizio:</strong>{" "}
          {prenotazione.service_name}
        </p>

        <p>
          <strong>Telefono:</strong>{" "}
          {prenotazione.customer_phone}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {prenotazione.customer_email}
        </p>

        <button
          type="button"
          onClick={() =>
            annullaPrenotazione(prenotazione.id)
          }
          style={{
            marginTop: "6px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #dddddd",
            background: "white",
            cursor: "pointer",
            fontWeight: "bold",
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
        {/* HEADER */}

        <div
          style={{
            background: "#111111",
            color: "white",
            padding: "22px",
            borderRadius: "24px",
            marginBottom: "18px",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.12)",
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
                Gestisci la tua attività.
              </p>
            </div>

            <button
              type="button"
              onClick={esci}
              style={{
                padding: "11px 17px",
                borderRadius: "12px",
                border:
                  "1px solid rgba(255,255,255,0.25)",
                background:
                  "rgba(255,255,255,0.1)",
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

        {/* PROFILO */}

        <section
          style={{
            background: "white",
            padding: "22px",
            borderRadius: "24px",
            marginBottom: "20px",
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
            Profilo
          </div>

          <h2 style={{ margin: "0 0 6px" }}>
            Profilo professionista
          </h2>

          <p
            style={{
              color: "#666",
              marginTop: 0,
            }}
          >
            Informazioni mostrate ai clienti.
          </p>

          {profilo && (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              <input
                type="text"
                value={profilo.name || ""}
                onChange={(e) =>
                  setProfilo({
                    ...profilo,
                    name: e.target.value,
                  })
                }
                placeholder="Nome"
                style={inputStyle}
              />

              <input
                type="text"
                value={profilo.profession || ""}
                onChange={(e) =>
                  setProfilo({
                    ...profilo,
                    profession: e.target.value,
                  })
                }
                placeholder="Professione / attività"
                style={inputStyle}
              />

              <textarea
                value={profilo.description || ""}
                onChange={(e) =>
                  setProfilo({
                    ...profilo,
                    description: e.target.value,
                  })
                }
                placeholder="Descrizione"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />

              <input
                type="tel"
                value={profilo.phone || ""}
                onChange={(e) =>
                  setProfilo({
                    ...profilo,
                    phone: e.target.value,
                  })
                }
                placeholder="Telefono"
                style={inputStyle}
              />

              <input
                type="email"
                value={profilo.email || ""}
                onChange={(e) =>
                  setProfilo({
                    ...profilo,
                    email: e.target.value,
                  })
                }
                placeholder="Email"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={salvaProfilo}
                style={primaryButton}
              >
                Salva profilo
              </button>
            </div>
          )}
        </section>

        {/* SERVIZI */}

        <section
          style={{
            background: "white",
            padding: "22px",
            borderRadius: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.7px",
            }}
          >
            Servizi
          </div>

          <h2 style={{ marginBottom: "6px" }}>
            Servizi e prezzi
          </h2>

          <p style={{ color: "#666" }}>
            Gestisci ciò che i clienti possono prenotare.
          </p>

          {servizi.map((servizio) => (
            <div
              key={servizio.id}
              style={{
                background: "#f7f7f8",
                padding: "14px",
                borderRadius: "16px",
                marginBottom: "12px",
              }}
            >
              <input
                type="text"
                defaultValue={servizio.name}
                onBlur={(e) =>
                  modificaServizio(
                    servizio.id,
                    "name",
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  marginBottom: "9px",
                  fontWeight: "bold",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "9px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="number"
                  min="1"
                  defaultValue={
                    servizio.duration_minutes
                  }
                  onBlur={(e) =>
                    modificaServizio(
                      servizio.id,
                      "duration_minutes",
                      Number(e.target.value)
                    )
                  }
                  style={inputStyle}
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={servizio.price}
                  onBlur={(e) =>
                    modificaServizio(
                      servizio.id,
                      "price",
                      Number(e.target.value)
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={servizio.is_active}
                    onChange={(e) =>
                      modificaServizio(
                        servizio.id,
                        "is_active",
                        e.target.checked
                      )
                    }
                  />{" "}
                  Attivo
                </label>

                <button
                  type="button"
                  onClick={() =>
                    eliminaServizio(servizio.id)
                  }
                  style={secondaryButton}
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid #eee",
              paddingTop: "20px",
              marginTop: "20px",
            }}
          >
            <h3>Aggiungi servizio</h3>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <input
                type="text"
                value={nuovoServizioNome}
                onChange={(e) =>
                  setNuovoServizioNome(
                    e.target.value
                  )
                }
                placeholder="Nome servizio"
                style={inputStyle}
              />

              <input
                type="number"
                min="1"
                value={nuovoServizioDurata}
                onChange={(e) =>
                  setNuovoServizioDurata(
                    e.target.value
                  )
                }
                placeholder="Durata in minuti"
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={nuovoServizioPrezzo}
                onChange={(e) =>
                  setNuovoServizioPrezzo(
                    e.target.value
                  )
                }
                placeholder="Prezzo"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={aggiungiServizio}
                style={primaryButton}
              >
                + Aggiungi servizio
              </button>
            </div>
          </div>
        </section>

        {/* APPUNTAMENTI */}

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
              marginBottom: "14px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              Appuntamenti di oggi
            </h2>

            <button
              type="button"
              onClick={caricaPrenotazioni}
              style={secondaryButton}
            >
              Aggiorna
            </button>
          </div>

          {caricamento && <p>Caricamento...</p>}

          {!caricamento &&
            appuntamentiOggi.length === 0 && (
              <div style={emptyBox}>
                Nessun appuntamento per oggi.
              </div>
            )}

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {appuntamentiOggi.map(
              (prenotazione) => (
                <SchedaPrenotazione
                  key={prenotazione.id}
                  prenotazione={prenotazione}
                />
              )
            )}
          </div>
        </section>

        <section
          style={{
            marginBottom: "38px",
          }}
        >
          <h2>Prossimi appuntamenti</h2>

          {prossimiAppuntamenti.length === 0 && (
            <div style={emptyBox}>
              Nessun prossimo appuntamento.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {prossimiAppuntamenti.map(
              (prenotazione) => (
                <SchedaPrenotazione
                  key={prenotazione.id}
                  prenotazione={prenotazione}
                />
              )
            )}
          </div>
        </section>

        {/* ORARI */}

        <section style={cardStyle}>
          <h2>Orari di lavoro</h2>

          <p style={{ color: "#666" }}>
            Imposta giorni e fasce disponibili.
          </p>

          {giorni.map((giorno) => {
            const fasce = disponibilita.filter(
              (f) =>
                f.day_of_week === giorno.numero
            );

            const aperto =
              fasce.length > 0 &&
              fasce.some(
                (fascia) =>
                  fascia.day_enabled !== false
              );

            return (
              <div
                key={giorno.numero}
                style={{
                  padding: "18px 0",
                  borderBottom:
                    "1px solid #eeeeee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: aperto
                      ? "14px"
                      : 0,
                  }}
                >
                  <div>
                    <strong>
                      {giorno.nome}
                    </strong>

                    <div
                      style={{
                        color: "#777",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    >
                      {aperto
                        ? "Aperto"
                        : "Chiuso"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
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
                      style={
                        aperto
                          ? primarySmallButton
                          : secondaryButton
                      }
                    >
                      {aperto
                        ? "Aperto"
                        : "Chiuso"}
                    </button>

                    {aperto && (
                      <button
                        type="button"
                        onClick={() =>
                          aggiungiFascia(
                            giorno.numero
                          )
                        }
                        style={
                          secondaryButton
                        }
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
                        background:
                          "#f7f7f8",
                        padding: "13px",
                        borderRadius: "14px",
                        marginBottom: "9px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "9px",
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
                        style={timeInputStyle}
                      />

                      <span>→</span>

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
                        style={timeInputStyle}
                      />

                      <label>
                        <input
                          type="checkbox"
                          checked={
                            fascia.is_active
                          }
                          onChange={(e) =>
                            modificaFascia(
                              fascia.id,
                              "is_active",
                              e.target.checked
                            )
                          }
                        />{" "}
                        Attiva
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          eliminaFascia(
                            fascia.id
                          )
                        }
                        style={secondaryButton}
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </section>

        {/* CHIUSURE */}

        <section style={cardStyle}>
          <h2>Chiusure straordinarie</h2>

          <p style={{ color: "#666" }}>
            Ferie, festività o giornate non
            disponibili.
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
                setNuovaDataChiusura(
                  e.target.value
                )
              }
              style={inputStyle}
            />

            <input
              type="text"
              value={motivoChiusura}
              onChange={(e) =>
                setMotivoChiusura(
                  e.target.value
                )
              }
              placeholder="Motivo, es. Ferie"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={aggiungiChiusura}
              style={primaryButton}
            >
              Aggiungi chiusura
            </button>
          </div>

          {chiusure.length === 0 && (
            <div style={emptyBox}>
              Nessuna chiusura straordinaria.
            </div>
          )}

          {chiusure.map((chiusura) => (
            <div
              key={chiusura.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "14px 0",
                borderBottom:
                  "1px solid #eeeeee",
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
                  eliminaChiusura(
                    chiusura.id
                  )
                }
                style={secondaryButton}
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

// ============================
// STILI RIUTILIZZABILI
// ============================

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  borderRadius: "11px",
  border: "1px solid #d8d8d8",
  background: "white",
  fontSize: "15px",
  color: "#111111",
};

const timeInputStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #d8d8d8",
  background: "white",
  fontSize: "15px",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#111111",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
};

const primarySmallButton: React.CSSProperties = {
  padding: "10px 13px",
  borderRadius: "11px",
  border: "none",
  background: "#111111",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid #dddddd",
  background: "white",
  color: "#111111",
  cursor: "pointer",
  fontWeight: "bold",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "22px",
  borderRadius: "24px",
  marginBottom: "20px",
  boxShadow:
    "0 8px 25px rgba(0,0,0,0.05)",
};

const emptyBox: React.CSSProperties = {
  background: "white",
  padding: "18px",
  borderRadius: "16px",
  color: "#666",
};