"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PrenotaPage() {
  const [profilo, setProfilo] = useState<any>(null);
  const [servizi, setServizi] = useState<any[]>([]);
  const [caricamentoPagina, setCaricamentoPagina] = useState(true);

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

  const [orari, setOrari] = useState<string[]>([]);
  const [caricamentoOrari, setCaricamentoOrari] =
    useState(false);

  const [salvataggio, setSalvataggio] = useState(false);

  useEffect(() => {
    inizializzaPagina();
  }, []);

  async function inizializzaPagina() {
    setCaricamentoPagina(true);

    const [risultatoProfilo, risultatoServizi] =
      await Promise.all([
        supabase
          .from("professional_profile")
          .select("*")
          .order("id", { ascending: true })
          .limit(1),

        supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("id", { ascending: true }),
      ]);

    if (risultatoProfilo.error) {
      console.error(risultatoProfilo.error);

      alert(
        "Errore nel caricamento del profilo: " +
          risultatoProfilo.error.message
      );
    } else {
      const profiloCaricato =
        risultatoProfilo.data &&
        risultatoProfilo.data.length > 0
          ? risultatoProfilo.data[0]
          : null;

      setProfilo(profiloCaricato);
    }

    if (risultatoServizi.error) {
      console.error(risultatoServizi.error);

      alert(
        "Errore nel caricamento dei servizi: " +
          risultatoServizi.error.message
      );
    } else {
      setServizi(risultatoServizi.data || []);
    }

    setCaricamentoPagina(false);
  }

  // ==========================================
  // GIORNI
  // ==========================================

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

  // ==========================================
  // FUNZIONI ORARI
  // ==========================================

  function orarioInMinuti(orario: string) {
    const valore = orario.slice(0, 5);

    const [ore, minuti] = valore
      .split(":")
      .map(Number);

    return ore * 60 + minuti;
  }

  function minutiInOrario(minutiTotali: number) {
    const ore = Math.floor(minutiTotali / 60);
    const minuti = minutiTotali % 60;

    return (
      `${String(ore).padStart(2, "0")}:` +
      `${String(minuti).padStart(2, "0")}`
    );
  }

  function durataDaTesto(
    durataTesto: string | null | undefined
  ) {
    if (!durataTesto) return 30;

    const numero = Number(
      durataTesto.replace(/[^0-9]/g, "")
    );

    return numero > 0 ? numero : 30;
  }

  function massimoDivisoreComune(a: number, b: number) {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y !== 0) {
      const resto = x % y;
      x = y;
      y = resto;
    }

    return x;
  }

  function calcolaIntervalloSlot() {
    return 30;
  }

  function appuntamentiSiSovrappongono(
    nuovoInizio: number,
    nuovaFine: number,
    appuntamentoInizio: number,
    appuntamentoFine: number
  ) {
    return (
      nuovoInizio < appuntamentoFine &&
      nuovaFine > appuntamentoInizio
    );
  }

  function finePrenotazioneInMinuti(
    prenotazione: any
  ) {
    if (prenotazione.booking_end_time) {
      return orarioInMinuti(
        prenotazione.booking_end_time
      );
    }

    const inizio = orarioInMinuti(
      prenotazione.booking_time
    );

    const durata =
      Number(
        prenotazione.service_duration_minutes
      ) ||
      durataDaTesto(
        prenotazione.service_duration
      );

    return inizio + durata;
  }

  // ==========================================
  // CALCOLO DISPONIBILITÀ COMPLETO
  // ==========================================

  async function calcolaOrariDisponibili(
    giornoValore: string,
    durataServizio: number
  ) {
    // 1. Controlliamo prima le chiusure straordinarie.

    const {
      data: chiusura,
      error: erroreChiusura,
    } = await supabase
      .from("closures")
      .select("id")
      .eq("closure_date", giornoValore)
      .maybeSingle();

    if (erroreChiusura) {
      throw new Error(
        "Errore nel controllo delle chiusure: " +
          erroreChiusura.message
      );
    }

    if (chiusura) {
      return [];
    }

    // 2. Recuperiamo il giorno della settimana.

    const data = new Date(
      giornoValore + "T12:00:00"
    );

    const giornoSettimana = data.getDay();

    // 3. Recuperiamo fasce di lavoro e prenotazioni
    //    già confermate.

    const [
      risultatoDisponibilita,
      risultatoPrenotazioni,
    ] = await Promise.all([
      supabase
        .from("availability")
        .select(
          "start_time, end_time, is_active, day_enabled"
        )
        .eq("day_of_week", giornoSettimana)
        .eq("is_active", true)
        .eq("day_enabled", true),

      supabase
        .from("bookings")
        .select(
          "booking_time, booking_end_time, service_duration_minutes, service_duration"
        )
        .eq("booking_date", giornoValore)
        .eq("status", "confirmed"),
    ]);

    if (risultatoDisponibilita.error) {
      throw new Error(
        "Errore nel caricamento della disponibilità: " +
          risultatoDisponibilita.error.message
      );
    }

    if (risultatoPrenotazioni.error) {
      throw new Error(
        "Errore nel caricamento degli appuntamenti: " +
          risultatoPrenotazioni.error.message
      );
    }

    const disponibilita =
      risultatoDisponibilita.data || [];

    const prenotazioni =
      risultatoPrenotazioni.data || [];

    const intervalloSlot =
      calcolaIntervalloSlot();

    const nuoviOrari: string[] = [];

    // 4. Per ogni fascia di lavoro generiamo soltanto
    //    gli inizi in cui il servizio entra completamente.

    disponibilita.forEach((fascia: any) => {
      const inizioFascia =
        orarioInMinuti(fascia.start_time);

      const fineFascia =
        orarioInMinuti(fascia.end_time);

      let possibileInizio = inizioFascia;

      while (
        possibileInizio + durataServizio <=
        fineFascia
      ) {
        const possibileFine =
          possibileInizio + durataServizio;

        const sovrapposto =
          prenotazioni.some(
            (prenotazione: any) => {
              const appuntamentoInizio =
                orarioInMinuti(
                  prenotazione.booking_time
                );

              const appuntamentoFine =
                finePrenotazioneInMinuti(
                  prenotazione
                );

              return appuntamentiSiSovrappongono(
                possibileInizio,
                possibileFine,
                appuntamentoInizio,
                appuntamentoFine
              );
            }
          );

        if (!sovrapposto) {
          nuoviOrari.push(
            minutiInOrario(possibileInizio)
          );
        }

        possibileInizio += intervalloSlot;
      }
    });

    return Array.from(
      new Set(nuoviOrari)
    ).sort();
  }

  async function selezionaGiorno(
    giorno: any
  ) {
    if (!servizioSelezionato) {
      return;
    }

    setGiornoSelezionato(giorno);
    setOrarioSelezionato(null);
    setOrari([]);
    setCaricamentoOrari(true);

    try {
      const nuoviOrari =
        await calcolaOrariDisponibili(
          giorno.valore,
          Number(
            servizioSelezionato.duration_minutes
          )
        );

      setOrari(nuoviOrari);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Errore nel caricamento degli orari."
      );

      setOrari([]);
    }

    setCaricamentoOrari(false);
  }

  // ==========================================
  // PRENOTAZIONE
  // ==========================================

  async function confermaPrenotazione(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!nome || !telefono || !email) {
      alert("Compila tutti i campi.");
      return;
    }

    if (
      !servizioSelezionato ||
      !giornoSelezionato ||
      !orarioSelezionato
    ) {
      alert(
        "Seleziona servizio, giorno e orario."
      );

      return;
    }

    setSalvataggio(true);

    const durataMinuti = Number(
      servizioSelezionato.duration_minutes
    );

    // Prima di salvare ricontrolliamo da Supabase.
    // In questo modo se qualcuno ha prenotato nel
    // frattempo non confermiamo uno slot ormai occupato.

    try {
      const orariAggiornati =
        await calcolaOrariDisponibili(
          giornoSelezionato.valore,
          durataMinuti
        );

      if (
        !orariAggiornati.includes(
          orarioSelezionato
        )
      ) {
        alert(
          "Questo orario non è più disponibile. Scegli un altro orario."
        );

        setOrari(orariAggiornati);
        setOrarioSelezionato(null);
        setMostraForm(false);
        setSalvataggio(false);

        return;
      }
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Errore nel controllo della disponibilità."
      );

      setSalvataggio(false);
      return;
    }

    const inizioMinuti =
      orarioInMinuti(
        orarioSelezionato
      );

    const fineMinuti =
      inizioMinuti + durataMinuti;

    const fineOrario =
      minutiInOrario(fineMinuti);

    const durataTesto =
      `${durataMinuti} min`;

    const prezzoTesto =
      `${Number(
        servizioSelezionato.price
      ).toFixed(2)} €`;

    const { error } = await supabase
      .from("bookings")
      .insert([
        {
          customer_name: nome,
          customer_phone: telefono,
          customer_email: email,

          service_name:
            servizioSelezionato.name,

          service_duration:
            durataTesto,

          service_duration_minutes:
            durataMinuti,

          service_price:
            prezzoTesto,

          booking_date:
            giornoSelezionato.valore,

          booking_time:
            orarioSelezionato,

          booking_end_time:
            fineOrario,

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
        alert(
          "Errore salvataggio: " +
            error.message
        );
      }

      setSalvataggio(false);
      return;
    }

    setSalvataggio(false);
    setPrenotazioneConfermata(true);
  }

  function prezzoFormattato(prezzo: any) {
    return `${Number(prezzo).toFixed(2)} €`;
  }

  // ==========================================
  // CARICAMENTO
  // ==========================================

  if (caricamentoPagina) {
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
          Caricamento...
        </div>
      </main>
    );
  }

  // ==========================================
  // CONFERMA
  // ==========================================

  if (prenotazioneConfermata) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f7f7f8 0%, #eeeeef 100%)",
          fontFamily: "Arial, sans-serif",
          padding: "24px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "white",
            padding: "28px",
            borderRadius: "24px",
            textAlign: "center",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "50%",
              background: "#111111",
              color: "white",
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "38px",
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "28px",
            }}
          >
            Prenotazione confermata
          </h1>

          <p
            style={{
              color: "#666",
              lineHeight: 1.5,
              marginBottom: "24px",
            }}
          >
            Ciao <strong>{nome}</strong>, il tuo
            appuntamento è confermato.
          </p>

          <div
            style={{
              padding: "18px",
              background: "#f6f6f7",
              borderRadius: "16px",
              textAlign: "left",
            }}
          >
            <p>
              <strong>Professionista:</strong>{" "}
              {profilo?.name || "Professionista"}
            </p>

            <p>
              <strong>Servizio:</strong>{" "}
              {servizioSelezionato.name}
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
              {
                servizioSelezionato.duration_minutes
              }{" "}
              min
            </p>

            <p style={{ marginBottom: 0 }}>
              <strong>Prezzo:</strong>{" "}
              {prezzoFormattato(
                servizioSelezionato.price
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              (window.location.href = "/")
            }
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: "#111111",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Torna alla home
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGINA PRENOTAZIONE
  // ==========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7f7f8 0%, #eeeeef 100%)",
        fontFamily: "Arial, sans-serif",
        padding: "18px 14px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={() =>
            (window.location.href = "/")
          }
          style={{
            border: "none",
            background: "transparent",
            padding: "8px 0",
            marginBottom: "12px",
            cursor: "pointer",
            color: "#555",
            fontSize: "15px",
          }}
        >
          ← Home
        </button>

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "22px",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.07)",
          }}
        >
          {/* PROFILO */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingBottom: "20px",
              borderBottom: "1px solid #eeeeee",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                minWidth: "64px",
                borderRadius: "18px",
                background: "#111111",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              ✂️
            </div>

            <div>
              <h1
                style={{
                  margin: "0 0 4px",
                  fontSize: "24px",
                }}
              >
                {profilo?.name || "Professionista"}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "15px",
                }}
              >
                {profilo?.profession || ""}
              </p>
            </div>
          </div>

          {profilo?.description && (
            <div
              style={{
                background: "#f6f6f7",
                padding: "14px",
                borderRadius: "14px",
                marginBottom: "24px",
                color: "#666",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {profilo.description}
            </div>
          )}

          {!mostraForm && (
            <>
              {/* SERVIZIO */}

              <div style={{ marginBottom: "30px" }}>
                <p style={stepStyle}>
                  Passaggio 1
                </p>

                <h2 style={titleStyle}>
                  Scegli il servizio
                </h2>

                {servizi.length === 0 && (
                  <div style={emptyStyle}>
                    Nessun servizio disponibile.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {servizi.map((servizio) => {
                    const selezionato =
                      servizioSelezionato?.id ===
                      servizio.id;

                    return (
                      <button
                        key={servizio.id}
                        type="button"
                        onClick={() => {
                          setServizioSelezionato(servizio);

                          setGiornoSelezionato(null);
                          setOrarioSelezionato(null);
                          setOrari([]);
                          setMostraForm(false);
                        }}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "15px",
                          padding: "16px",
                          borderRadius: "16px",

                          border: selezionato
                            ? "2px solid #111111"
                            : "1px solid #e2e2e2",

                          background: selezionato
                            ? "#f5f5f5"
                            : "white",

                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "17px",
                              fontWeight: "bold",
                              marginBottom: "5px",
                            }}
                          >
                            {servizio.name}
                          </div>

                          <div
                            style={{
                              fontSize: "14px",
                              color: "#777",
                            }}
                          >
                            {
                              servizio.duration_minutes
                            }{" "}
                            min
                          </div>
                        </div>

                        <strong>
                          {prezzoFormattato(
                            servizio.price
                          )}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GIORNO */}

              {servizioSelezionato && (
                <div style={{ marginBottom: "30px" }}>
                  <p style={stepStyle}>
                    Passaggio 2
                  </p>

                  <h2 style={titleStyle}>
                    Scegli il giorno
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(92px, 1fr))",
                      gap: "9px",
                    }}
                  >
                    {giorni.map((giorno) => {
                      const selezionato =
                        giornoSelezionato?.valore ===
                        giorno.valore;

                      return (
                        <button
                          key={giorno.valore}
                          type="button"
                          onClick={() =>
                            selezionaGiorno(giorno)
                          }
                          style={{
                            padding: "14px 8px",
                            borderRadius: "14px",

                            border: selezionato
                              ? "2px solid #111111"
                              : "1px solid #e2e2e2",

                            background: selezionato
                              ? "#111111"
                              : "white",

                            color: selezionato
                              ? "white"
                              : "#111111",

                            cursor: "pointer",
                            minHeight: "70px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              textTransform:
                                "capitalize",

                              opacity: selezionato
                                ? 0.8
                                : 0.6,

                              marginBottom: "5px",
                            }}
                          >
                            {giorno.nome}
                          </div>

                          <strong>
                            {giorno.data}
                          </strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ORARI */}

              {giornoSelezionato && (
                <div>
                  <p style={stepStyle}>
                    Passaggio 3
                  </p>

                  <h2 style={titleStyle}>
                    Scegli un orario
                  </h2>

                  {caricamentoOrari ? (
                    <div style={emptyStyle}>
                      Controllo disponibilità...
                    </div>
                  ) : orari.length === 0 ? (
                    <div style={emptyStyle}>
                      Nessuna disponibilità compatibile
                      con la durata di questo servizio.
                      Scegli un&apos;altra data.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "9px",
                      }}
                    >
                      {orari.map((orario) => {
                        const selezionato =
                          orarioSelezionato === orario;

                        return (
                          <button
                            key={orario}
                            type="button"
                            onClick={() =>
                              setOrarioSelezionato(
                                orario
                              )
                            }
                            style={{
                              padding: "14px 8px",
                              borderRadius: "12px",

                              border: selezionato
                                ? "2px solid #111111"
                                : "1px solid #e1e1e1",

                              background: selezionato
                                ? "#111111"
                                : "white",

                              color: selezionato
                                ? "white"
                                : "#111111",

                              fontWeight: "bold",
                              fontSize: "15px",
                              cursor: "pointer",
                            }}
                          >
                            {orario}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RIEPILOGO */}

              {orarioSelezionato && (
                <div
                  style={{
                    marginTop: "26px",
                    padding: "18px",
                    background: "#f6f6f7",
                    borderRadius: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#777",
                      marginBottom: "6px",
                    }}
                  >
                    Il tuo appuntamento
                  </div>

                  <div
                    style={{
                      fontWeight: "bold",
                      lineHeight: 1.5,
                      marginBottom: "16px",
                    }}
                  >
                    {servizioSelezionato.name}
                    <br />
                    {giornoSelezionato.data} alle{" "}
                    {orarioSelezionato}
                    <br />
                    Durata:{" "}
                    {
                      servizioSelezionato.duration_minutes
                    }{" "}
                    min
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMostraForm(true)
                    }
                    style={primaryButton}
                  >
                    Continua
                  </button>
                </div>
              )}
            </>
          )}

          {/* FORM */}

          {mostraForm && (
            <>
              <button
                type="button"
                onClick={() =>
                  setMostraForm(false)
                }
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "4px 0",
                  marginBottom: "18px",
                  color: "#555",
                  fontSize: "15px",
                }}
              >
                ← Indietro
              </button>

              <p style={stepStyle}>
                Ultimo passaggio
              </p>

              <h2 style={titleStyle}>
                I tuoi dati
              </h2>

              <p
                style={{
                  color: "#666",
                  lineHeight: 1.5,
                  marginTop: 0,
                  marginBottom: "24px",
                }}
              >
                {servizioSelezionato.name} ·{" "}
                {giornoSelezionato.data} ·{" "}
                {orarioSelezionato} ·{" "}
                {
                  servizioSelezionato.duration_minutes
                }{" "}
                min
              </p>

              <form
                onSubmit={confermaPrenotazione}
              >
                <label style={labelStyle}>
                  Nome e cognome
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  required
                  placeholder="Mario Bianchi"
                  style={formInputStyle}
                />

                <label style={labelStyle}>
                  Telefono
                </label>

                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(e.target.value)
                  }
                  required
                  placeholder="333 1234567"
                  style={formInputStyle}
                />

                <label style={labelStyle}>
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  placeholder="mario@email.it"
                  style={{
                    ...formInputStyle,
                    marginBottom: "24px",
                  }}
                />

                <button
                  type="submit"
                  disabled={salvataggio}
                  style={{
                    ...primaryButton,
                    opacity: salvataggio ? 0.65 : 1,
                    cursor: salvataggio
                      ? "default"
                      : "pointer",
                  }}
                >
                  {salvataggio
                    ? "Controllo disponibilità..."
                    : "Conferma prenotazione"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const stepStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "#888",
  margin: "0 0 6px",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "22px",
};

const emptyStyle: React.CSSProperties = {
  background: "#f6f6f7",
  padding: "18px",
  borderRadius: "14px",
  color: "#666",
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "bold",
  fontSize: "14px",
};

const formInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px",
  marginTop: "7px",
  marginBottom: "18px",
  borderRadius: "12px",
  border: "1px solid #d8d8d8",
  fontSize: "16px",
  background: "white",
  color: "#111111",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "14px",
  border: "none",
  background: "#111111",
  color: "white",
  cursor: "pointer",
};