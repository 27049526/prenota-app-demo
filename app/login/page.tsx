"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [controlloSessione, setControlloSessione] = useState(true);

  useEffect(() => {
    controllaSessione();
  }, []);

  async function controllaSessione() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      window.location.replace("/admin");
      return;
    }

    setControlloSessione(false);
  }

  async function accedi(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setCaricamento(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      alert("Accesso non riuscito: " + error.message);
      setCaricamento(false);
      return;
    }

    window.location.replace("/admin");
  }

  if (controlloSessione) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          background: "#f5f5f5",
        }}
      >
        <p>Controllo sessione...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginTop: 0,
          }}
        >
          Accesso professionista
        </h1>

        <p>
          Inserisci email e password per gestire le prenotazioni.
        </p>

        <form onSubmit={accedi}>
          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginTop: "6px",
              marginBottom: "18px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginTop: "6px",
              marginBottom: "24px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          <button
            type="submit"
            disabled={caricamento}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              cursor: caricamento ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {caricamento ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </main>
  );
}