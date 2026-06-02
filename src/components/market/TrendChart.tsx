"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

type TrendPoint = {
  date: string;
  avg_price: number;
};

type Props = {
  data: TrendPoint[];
  category: string;
  variety: string;
  loading?: boolean;
};

export default function TrendChart({ data, category, variety, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-[280px] bg-gray-50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">价格趋势</h3>
        <p className="text-sm text-gray-400">暂无趋势数据</p>
      </div>
    );
  }

  const labels = data.map((d) => {
    const parts = d.date.split("-");
    return `${parts[1]}/${parts[2]}`;
  });

  const prices = data.map((d) => d.avg_price);
  const min = Math.floor(Math.min(...prices) * 0.95);
  const max = Math.ceil(Math.max(...prices) * 1.05);

  // 计算涨跌幅
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = last - first;
  const changePct = first > 0 ? ((change / first) * 100).toFixed(1) : "0.0";
  const isUp = change >= 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: `均价 (元/公斤)`,
        data: prices,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#10b981",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f9fafb",
        bodyColor: "#d1d5db",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: any) => {
            const idx = items[0]?.dataIndex;
            return idx !== undefined ? data[idx]?.date : "";
          },
          label: (item: any) => `¥${item.raw} 元/公斤`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: "#9ca3af",
          maxTicksLimit: 10,
        },
      },
      y: {
        min,
        max,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          font: { size: 11 },
          color: "#9ca3af",
          callback: (v: any) => `¥${v}`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            {category} · {variety} 价格趋势
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">近 {data.length} 天均价走势</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
          isUp ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
        }`}>
          <span>{isUp ? "↑" : "↓"}</span>
          <span>{isUp ? "+" : ""}{change.toFixed(1)}</span>
          <span className="text-xs opacity-70">({isUp ? "+" : ""}{changePct}%)</span>
        </div>
      </div>
      <div className="h-[280px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
