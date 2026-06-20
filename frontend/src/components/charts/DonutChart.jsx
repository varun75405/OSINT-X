import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip);

/**
 * segments: [{ label, count, pct }]
 * colors: array of hex strings, same order as segments
 * centerValue / centerLabel: text shown in the donut hole
 */
function DonutChart({ segments, colors, centerValue, centerLabel, size = 150 }) {
  const data = {
    labels: segments.map(s => s.label),
    datasets: [
      {
        data: segments.map(s => s.count),
        backgroundColor: colors,
        borderWidth: 0,
        cutout: "72%",
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.raw}`,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{centerValue}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{centerLabel}</div>
      </div>
    </div>
  );
}

export default DonutChart;