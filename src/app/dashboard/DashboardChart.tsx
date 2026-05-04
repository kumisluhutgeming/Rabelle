"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardChart({ data }: { data: number[] }) {
  const chartData = {
    labels: ['BTS', 'TV', 'Radio', 'Lainnya'],
    datasets: [
      {
        data: data,
        backgroundColor: [
          '#007AFF', // Apple Blue
          '#34C759', // Apple Green
          '#FF9500', // Apple Orange
          '#8E8E93', // Apple Gray
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
            size: 13,
            weight: 500,
          },
          color: '#1d1d1f'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1d1d1f',
        bodyColor: '#1d1d1f',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: {
          size: 13,
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
        },
        bodyFont: {
          size: 14,
          weight: 'bold' as const,
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
        }
      }
    }
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart: any) {
      const width = chart.width;
      const height = chart.height;
      const ctx = chart.ctx;

      ctx.restore();
      const fontSize = (height / 114).toFixed(2);
      ctx.font = "bold " + fontSize + "em -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1d1d1f";

      const total = data.reduce((a, b) => a + b, 0);
      const text = total.toString();
      const textX = Math.round((width - ctx.measureText(text).width) / 2);
      const textY = height / 2.2; // slightly above center to account for legend

      ctx.fillText(text, textX, textY);
      
      ctx.font = "500 " + (parseFloat(fontSize) * 0.35).toFixed(2) + "em -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#8E8E93";
      const label = "Total Data";
      const labelX = Math.round((width - ctx.measureText(label).width) / 2);
      ctx.fillText(label, labelX, textY + 25);
      
      ctx.save();
    }
  };

  return (
    <div className="relative h-64 w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
    </div>
  );
}
