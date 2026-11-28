
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner() {
  const [result, setResult] = useState(false);
  const [status, setStatus] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
    try {
      setStatus("Starting camera...");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "user" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        () => {
          setResult(true);
          setStatus("QR captured successfully!");
          scanner.stop().catch(console.error);
        },
        () => {}
      );

      setStatus("Camera started successfully!");
    } catch (error) {
      console.error("Camera error:", error);
      setStatus(
        error instanceof Error ? error.message : "Unable to start camera."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#080b18] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-bold text-cyan-400">CIPHERX</h1>

        <h2 className="mt-8 text-2xl font-bold">
          Scan Attendance QR
        </h2>

        <p className="mt-3 text-gray-400">
          Point your camera towards the unique QR code received through email.
        </p>

        <div className="mt-8 rounded-xl bg-white p-4">
          <div id="qr-reader"></div>
        </div>

        <button
          onClick={startCamera}
          className="mt-5 rounded-lg bg-cyan-400 px-6 py-3 font-bold text-black"
        >
          Start Camera
        </button>

        {status && (
          <p className="mt-4 text-sm text-cyan-400">{status}</p>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-5">
            <h3 className="font-bold text-cyan-400">
              QR Code Scanned!
            </h3>
            <p className="mt-3 text-sm text-gray-300">
              QR captured successfully. Attendance verification will be connected to the backend.
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-cyan-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}



