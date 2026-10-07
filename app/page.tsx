"use client";

import { useEffect, useState } from "react";

type SensorData = {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  timestamp: string | null;
  device: string;
};

type HistoryPoint = {
  time: string;
  value: number;
};

const emptySensorData: SensorData = {
  temperature: null,
  humidity: null,
  pressure: null,
  timestamp: null,
  device: "ESP32-BME280",
};

const chartWidth = 520;
const chartHeight = 220;

function SensorCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </span>
        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${accent}`} />
      </div>

      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {value}
        </span>
        <span className="pb-1 text-sm font-semibold text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData>(emptySensorData);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function loadSensorData() {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error("Não foi possível carregar os dados");
        }

        const data = result.data as SensorData;
        setSensorData(data);
        setIsConnected(data.timestamp !== null);

        const temperature = data.temperature;
        if (temperature !== null) {
          setHistory((current) => [
            ...current,
            {
              time: new Date(data.timestamp ?? Date.now()).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              value: temperature,
            },
          ].slice(-12));
        }
      } catch {
        setIsConnected(false);
      }
    }

    loadSensorData();
    const interval = window.setInterval(loadSensorData, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const formatValue = (value: number | null) => value === null ? "—" : value.toFixed(1);
  const lastUpdate = sensorData.timestamp
    ? new Date(sensorData.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "aguardando leitura";
  const linePath = history.length > 1
    ? history.map((point, index) => {
        const x = (index / (history.length - 1)) * chartWidth;
        const min = Math.min(...history.map((item) => item.value)) - 1;
        const max = Math.max(...history.map((item) => item.value)) + 1;
        const y = chartHeight - ((point.value - min) / (max - min)) * chartHeight;
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      }).join(" ")
    : "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#edf5ff_100%)] px-4 py-6 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-[0_24px_60px_rgba(56,189,248,0.12)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">
              ExpoETE
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Estação Meteorológica Inteligente
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 md:self-center">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {isConnected ? "Sistema recebendo dados em tempo real" : "Aguardando primeira leitura do sensor"}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SensorCard label="Temperatura" value={formatValue(sensorData.temperature)} unit="°C" accent="from-cyan-500 to-sky-600" />
          <SensorCard label="Umidade" value={formatValue(sensorData.humidity)} unit="%" accent="from-emerald-500 to-teal-600" />
          <SensorCard label="Pressão" value={formatValue(sensorData.pressure)} unit="hPa" accent="from-violet-500 to-indigo-600" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Dados em tempo real
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Acompanhamento da temperatura
                </h2>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
                Última atualização: {lastUpdate}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <svg
                viewBox="0 0 500 260"
                className="h-64 w-full"
                role="img"
                aria-label="Gráfico de variação de temperatura"
              >
                {[0, 1, 2, 3, 4].map((line) => (
                  <line
                    key={line}
                    x1="0"
                    y1={30 + line * 50}
                    x2="500"
                    y2={30 + line * 50}
                    stroke="#dbeafe"
                    strokeWidth="1"
                  />
                ))}

                {[0, 1, 2, 3, 4, 5].map((line) => (
                  <line
                    key={line}
                    x1={line * 80}
                    y1="0"
                    x2={line * 80}
                    y2="260"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                ))}

                {linePath && <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />}
              </svg>

              {history.length === 0 && (
                <p className="-mt-36 pb-28 text-center text-sm text-slate-500">
                  O gráfico aparecerá após a primeira leitura real do ESP32.
                </p>
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200/80 bg-slate-900 p-5 text-slate-100 shadow-[0_26px_60px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              Status do sistema
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                <p className="text-sm text-slate-400">Conexão Wi‑Fi</p>
                <p className="mt-2 text-lg font-semibold text-white">Conectado</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                <p className="text-sm text-slate-400">ESP32</p>
                <p className="mt-2 text-lg font-semibold text-white">{isConnected ? "Enviando dados" : "Aguardando envio"}</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                <p className="text-sm text-slate-400">Servidor/API</p>
                <p className="mt-2 text-lg font-semibold text-white">Online</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
