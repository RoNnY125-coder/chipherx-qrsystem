
"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Scanner() {
  const [result, setResult] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setResult(decodedText);
        scanner.clear().catch(console.error);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#080b18] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-bold text-cyan-400">
          CIPHERX
        </h1>

        <h2 className="mt-8 text-2xl font-bold">
          Scan Checkpoint QR
        </h2>

        <p className="mt-3 text-gray-400">
          Point your camera towards the checkpoint QR code.
        </p>

        <div className="mt-8 rounded-xl bg-white p-4">
          <div id="qr-reader"></div>
        </div>

        {result && (
          <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-5">
            <h3 className="font-bold text-cyan-400">
              QR Code Scanned!
            </h3>
            <p className="mt-3 break-all text-sm text-gray-300">
              {result}
            </p>
          </div>
        )}

        <a
          href="/dashboard"
          className="mt-8 inline-block text-cyan-400 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
    </main>
  );
}
