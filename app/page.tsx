"use client";

export default function Home() {
  function vaiCliente() {
    window.location.href = "/prenota";
  }

  function vaiProfessionista() {
    window.location.href = "/login";
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
          maxWidth: "420px",
          background: "white",
          padding: "32px",
          borderRadius: "18px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: "50px",
            marginBottom: "10px",
          }}
        >
          📅
        </div>

        <h1
          style={{
            marginBottom: "8px",
          }}
        >
          Prenota
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Prenota e gestisci appuntamenti in modo semplice.
        </p>

        <button
          type="button"
          onClick={vaiCliente}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "12px",
          }}
        >
          Sono un cliente
        </button>

        <button
          type="button"
          onClick={vaiProfessionista}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Area professionista
        </button>
      </div>
    </main>
  );
}