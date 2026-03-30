"use client";

/**
 * Replaces the root layout when an error bubbles up from it.
 * Must define its own <html> and <body> (no shared CSS from root layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: "0.875rem", color: "#a1a1aa", maxWidth: "24rem" }}>
            {error.message || "Kitchen OS hit an unexpected error."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "0.75rem",
              background: "#fafafa",
              color: "#09090b",
              padding: "0.625rem 1.25rem",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
