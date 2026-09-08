"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "5rem" }}>💥</div>

            <h1>Useless Achievements had a very useful error.</h1>

            <p>Please try again.</p>

            <button onClick={reset}>Try Again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
