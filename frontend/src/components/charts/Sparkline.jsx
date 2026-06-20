import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale);

function Sparkline({ values, color = "#3b82f6" }) {
  const data = {
    labels: values.map((_, i) => i),
    datasets: [
      {
        data: values,
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    maintainAspectRatio: false,
    elements: { line: { borderCapStyle: "round" } },
  };

  return (
    <div style={{ height: 32, width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default Sparkline;