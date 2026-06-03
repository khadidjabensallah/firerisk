import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Cpu,
  Flame,
  Github,
  Linkedin,
  MapPin,
  Play,
  ShieldCheck,
  TreePine,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Algerian Forest Fire Risk Engine | ML Dashboard" },
      {
        name: "description",
        content:
          "Enterprise ML dashboard predicting Fire Weather Index for Bejaia & Sidi Bel-Abbes using a Random Forest Regressor.",
      },
      { property: "og:title", content: "Algerian Forest Fire Risk Engine" },
      {
        property: "og:description",
        content:
          "Real-time FWI predictions powered by a Random Forest model trained on Algerian forest fire data.",
      },
    ],
  }),
  component: Dashboard,
});

const featureImportance = [
  { feature: "Temperature", importance: 0.1596 },
  { feature: "Relative Humidity", importance: 0.4189 },
  { feature: "Rain", importance: 0.3343 },
  { feature: "Wind Speed", importance: 0.0872 },
];
function classifyRisk(fwi: number) {
  if (fwi < 5)
    return {
      label: "Low Risk",
      className: "bg-primary text-primary-foreground",
      description: "Conditions are stable. Routine monitoring advised.",
    };
  if (fwi < 12)
    return {
      label: "Moderate Risk",
      className: "bg-[oklch(0.78_0.16_95)] text-[oklch(0.25_0.05_60)]",
      description: "Elevated dryness. Maintain field readiness.",
    };
  if (fwi < 22)
    return {
      label: "High Risk",
      className: "bg-[oklch(0.7_0.18_55)] text-[oklch(0.2_0.05_40)]",
      description: "Significant ignition potential across the region.",
    };
  return {
    label: "Extreme Risk",
    className: "bg-destructive text-destructive-foreground",
    description: "Critical fire weather. Immediate response posture required.",
  };
}

function simulateFWI(temp: number, rh: number, wind: number, rain: number) {
  const dryness = Math.max(0, temp - 10) * 0.55;
  const humidityPenalty = (100 - rh) * 0.18;
  const windFactor = wind * 0.35;
  const rainSuppression = Math.min(rain * 1.6, 18);
  const raw = dryness + humidityPenalty + windFactor - rainSuppression;
  return Math.max(0, Math.min(40, Number(raw.toFixed(1))));
}

function Dashboard() {
  const [temperature, setTemperature] = useState(32);
  const [humidity, setHumidity] = useState(45);
  const [wind, setWind] = useState(18);
  const [rain, setRain] = useState(0.2);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const livePreview = useMemo(
    () => simulateFWI(temperature, humidity, wind, rain),
    [temperature, humidity, wind, rain],
  );

  const displayedFwi = prediction ?? livePreview;
  const risk = useMemo(() => classifyRisk(displayedFwi), [displayedFwi]);
  const gaugePercent = Math.min(100, (displayedFwi / 40) * 100);

const runPrediction = async () => {
    // Reset states before calling
    setIsRunning(true);
    setPrediction(null);
    setError(null);

    try {
      // Call our FastAPI backend
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: temperature,
          rh: humidity,
          ws: wind,
          rain: rain,
        }),
      });

      // If server returned an error status
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Parse the JSON response from FastAPI
      const data = await response.json();

      // data.fwi is the real ML prediction
      setPrediction(data.fwi);

    } catch (err) {
      // Show error message if API is unreachable
      setError("Cannot reach the backend. Is FastAPI running on port 8000?");
      console.error(err);
    } finally {
      // Always stop the loading state
      setIsRunning(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between bg-sidebar p-6 text-sidebar-foreground lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <TreePine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">FireRisk AI</p>
              <p className="text-xs text-sidebar-foreground/60">v1.0 · Production</p>
            </div>
          </div>

          <nav className="mt-10 space-y-1 text-sm">
            {[
              { icon: Activity, label: "Overview", active: true },
              { icon: TrendingUp, label: "Feature Importance" },
              { icon: Flame, label: "Simulation" },
              { icon: ShieldCheck, label: "Model Health" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">
            Developer
          </p>
          <p className="mt-2 text-sm font-semibold text-sidebar-foreground">
            Khadidja BENSALLAH
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            Computer Science Student · ESTIN
          </p>
          <Separator className="my-4 bg-sidebar-border" />
          <div className="flex gap-2">
            <a
              href="#"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sidebar-accent px-2 py-1.5 text-xs text-sidebar-foreground transition-colors hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a
              href="#"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sidebar-accent px-2 py-1.5 text-xs text-sidebar-foreground transition-colors hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
            >
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-border bg-card/50 px-6 py-5 backdrop-blur lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Environmental Intelligence
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                Algerian Forest Fire Risk Engine
              </h1>
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Model Online
            </Badge>
          </div>
        </header>

        <div className="space-y-8 px-6 py-8 lg:px-10">
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={ShieldCheck}
                label="Model Stability"
                value="94%"
                hint="R² on held-out validation"
              />
              <MetricCard
                icon={Cpu}
                label="Algorithm"
                value="Random Forest"
                hint="Regressor · 300 estimators"
              />
              <MetricCard
                icon={MapPin}
                label="Target Region"
                value="Bejaia & Sidi Bel-Abbes"
                hint="Northern Algeria · 2012 dataset"
              />
            </div>

            <Card className="border-border shadow-[var(--shadow-card)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Feature Importance
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permutation-based contribution to predicted FWI.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Normalized 0–1
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureImportance}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.7 0.18 155)" />
                          <stop offset="100%" stopColor="oklch(0.5 0.14 155)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.92 0.01 220)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="feature"
                        tick={{ fontSize: 12, fill: "oklch(0.4 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "oklch(0.4 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 0.4]}
                      />
                      <Tooltip
                        cursor={{ fill: "oklch(0.95 0.01 150)" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid oklch(0.92 0.01 220)",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [v.toFixed(2), "Importance"]}
                      />
                      <Bar
                        dataKey="importance"
                        fill="url(#barFill)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <Card className="border-border shadow-[var(--shadow-card)] lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Real-Time Simulation Calculator
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust environmental parameters and run the model.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField
                  label="Temperature"
                  unit="°C"
                  value={temperature}
                  min={10}
                  max={50}
                  step={1}
                  onChange={setTemperature}
                />
                <SliderField
                  label="Relative Humidity"
                  unit="%"
                  value={humidity}
                  min={10}
                  max={100}
                  step={1}
                  onChange={setHumidity}
                />
                <SliderField
                  label="Wind Speed"
                  unit="km/h"
                  value={wind}
                  min={0}
                  max={50}
                  step={1}
                  onChange={setWind}
                />
                <SliderField
                  label="Rain"
                  unit="mm"
                  value={rain}
                  min={0}
                  max={20}
                  step={0.1}
                  onChange={setRain}
                />
                {error && (
                 <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    ⚠️ {error}
                  </div>
)}
                <Button
                  onClick={runPrediction}
                  disabled={isRunning}
                  className="h-12 w-full bg-[image:var(--gradient-primary)] text-base font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.01]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isRunning ? "Running inference…" : "Run ML Model Prediction"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Predicted Fire Weather Index
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {prediction === null
                    ? "Live preview — click predict for the model output."
                    : "Model inference complete."}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <Gauge percent={gaugePercent} value={displayedFwi} />
                  <Badge
                    className={`mt-6 rounded-full px-4 py-1.5 text-sm font-semibold ${risk.className}`}
                  >
                    <Flame className="mr-1.5 h-3.5 w-3.5" />
                    {risk.label}
                  </Badge>
                  <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">
                    {risk.description}
                  </p>

                  <div className="mt-6 grid w-full grid-cols-2 gap-3 text-xs">
                    <ReadOut label="Temp" value={`${temperature}°C`} />
                    <ReadOut label="Humidity" value={`${humidity}%`} />
                    <ReadOut label="Wind" value={`${wind} km/h`} />
                    <ReadOut label="Rain" value={`${rain.toFixed(1)} mm`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Built by Khadidja BENSALLAH · ESTIN · Forest Fire ML Pipeline · 2026
          </footer>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SliderField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-sm text-secondary-foreground">
          {step < 1 ? value.toFixed(1) : value} {unit}
        </span>
      </div>
      <Slider
        className="mt-3"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function Gauge({ percent, value }: { percent: number; value: number }) {
  const radius = 100;
  const stroke = 16;
  const normalized = radius - stroke / 2;
  const circumference = Math.PI * normalized;
  const offset = circumference - (percent / 100) * circumference;

  const colorStops =
    percent < 25
      ? ["oklch(0.7 0.16 155)", "oklch(0.55 0.15 155)"]
      : percent < 55
        ? ["oklch(0.8 0.17 95)", "oklch(0.7 0.17 70)"]
        : percent < 80
          ? ["oklch(0.75 0.18 55)", "oklch(0.65 0.2 40)"]
          : ["oklch(0.7 0.22 28)", "oklch(0.55 0.24 25)"];

  return (
    <div className="relative" style={{ width: radius * 2, height: radius + 20 }}>
      <svg width={radius * 2} height={radius + 10} viewBox={`0 0 ${radius * 2} ${radius + 10}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colorStops[0]} />
            <stop offset="100%" stopColor={colorStops[1]} />
          </linearGradient>
        </defs>
        <path
          d={`M ${stroke / 2} ${radius} A ${normalized} ${normalized} 0 0 1 ${
            radius * 2 - stroke / 2
          } ${radius}`}
          fill="none"
          stroke="oklch(0.94 0.01 220)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${radius} A ${normalized} ${normalized} 0 0 1 ${
            radius * 2 - stroke / 2
          } ${radius}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {value.toFixed(1)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          FWI Score
        </span>
      </div>
    </div>
  );
}

function ReadOut({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
