import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Gradelys — Espace d'apprentissage et de révision interactif";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0F17",
          backgroundImage:
            "radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.25) 0%, transparent 65%)",
          color: "#F8FAFC",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px 80px",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar with Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#0EA5E9",
              color: "#FFFFFF",
              fontSize: "26px",
              fontWeight: "bold",
            }}
          >
            G
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Gradelys
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            fontSize: "62px",
            fontWeight: 800,
            lineHeight: 1.15,
            textAlign: "center",
            letterSpacing: "-0.03em",
            maxWidth: "960px",
            marginBottom: "24px",
            color: "#FFFFFF",
          }}
        >
          L'espace d'apprentissage & de révision pour réussir.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "26px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            marginBottom: "48px",
          }}
        >
          Mémorisation espacée (SM-2), diagnostics de devoirs, fiches interactives et synthèses visuelles.
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          {[
            "Fiches & Répétition espacée",
            "Scanner de devoirs",
            "Cartes mentales",
            "Quiz interactifs",
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "9999px",
                padding: "10px 22px",
                fontSize: "18px",
                color: "#E2E8F0",
                fontWeight: 500,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
