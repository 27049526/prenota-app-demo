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
        background:
          "linear-gradient(180deg, #f7f7f8 0%, #eeeeef 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "22px",
              background: "#111111",
              color: "white",
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            }}
          >
            📅
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: 1.1,
              color: "#111111",
            }}
          >
            Prenota
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666666",
              fontSize: "16px",
              lineHeight: 1.5,
            }}
          >
            Prenota un appuntamento in pochi secondi
            oppure accedi alla tua area professionista.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
          }}
        >
          <button
            type="button"
            onClick={vaiCliente}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "14px",
              border: "none",
              background: "#111111",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            Prenota un appuntamento
          </button>

          <button
            type="button"
            onClick={vaiProfessionista}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #dddddd",
              background: "white",
              color: "#111111",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Area professionista
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "22px",
            marginBottom: 0,
            color: "#888888",
            fontSize: "13px",
          }}
        >
          Nessuna registrazione richiesta per prenotare
        </p>
      </div>
    </main>
  );
}