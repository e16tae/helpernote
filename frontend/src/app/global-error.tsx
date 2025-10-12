"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
            심각한 오류가 발생했습니다
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            애플리케이션을 로드하는 중 문제가 발생했습니다.
          </p>
          {error.message && (
            <div style={{
              padding: "1rem",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              marginBottom: "1rem",
              maxWidth: "600px",
              width: "100%"
            }}>
              {error.message}
            </div>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
