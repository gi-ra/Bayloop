import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F7A73",
        }}
      >
        <svg width="320" height="206" viewBox="0 0 56 36" fill="none">
          <path
            d="M4 28c0-8.837 7.163-16 16-16s16 7.163 16 16"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M52 8c0 8.837-7.163 16-16 16S20 16.837 20 8"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
