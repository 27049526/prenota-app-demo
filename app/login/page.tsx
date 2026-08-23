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

  async function accedi(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setCaricamento(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error(error);
      alert(
        "Accesso non riuscito: " +
          error.message
      );
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
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.06)",
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
        padding: "18px 16px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
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
            marginBottom: "28px",
            cursor: "pointer",
            color: "#555",
            fontSize: "15px",
          }}
        >
          ← Home
        </button>

        <div
          style={{
            textAlign: "center",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              width: "74px",
              height: "74px",
              borderRadius: "22px",
              background: "#111111",
              color: "white",
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              boxShadow:
                "0 10px 25px rgba(0,0,0,0.12)",
            }}
          >
            👤
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "30px",
              color: "#111111",
            }}
          >
            Area professionista
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
              lineHeight: 1.5,
              fontSize: "15px",
            }}
          >
            Accedi per gestire appuntamenti,
            disponibilità e chiusure.
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "24px",
            boxShadow:
              "0 12px 35px rgba(0,0,0,0.08)",
          }}
        >
          <form onSubmit={accedi}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "7px",
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              autoComplete="email"
              placeholder="nome@email.it"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                marginBottom: "18px",
                borderRadius: "12px",
                border:
                  "1px solid #d8d8d8",
                fontSize: "16px",
                background: "white",
              }}
            />

            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "7px",
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                marginBottom: "24px",
                borderRadius: "12px",
                border:
                  "1px solid #d8d8d8",
                fontSize: "16px",
                background: "white",
              }}
            />

            <button
              type="submit"
              disabled={caricamento}
              style={{
                width: "100%",
                padding: "17px",
                border: "none",
                borderRadius: "14px",
                background: "#111111",
                color: "white",
                cursor: caricamento
                  ? "default"
                  : "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                opacity: caricamento
                  ? 0.7
                  : 1,
              }}
            >
              {caricamento
                ? "Accesso..."
                : "Accedi"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "18px",
            color: "#888",
            fontSize: "12px",
          }}
        >
          Accesso riservato al professionista
        </p>
      </div>
    </main>
  );
}