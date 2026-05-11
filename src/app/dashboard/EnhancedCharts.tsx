"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const sharedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
          size: 12,
          weight: 500,
        },
        color: '#1d1d1f'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
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

export function ProvinceBarChart({ data, labels }: { data: number[], labels: string[] }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Jumlah Infrastruktur',
        data,
        backgroundColor: '#007AFF', // Apple Blue
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    ...sharedOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)',
        },
        border: { display: false }
      },
      x: {
        grid: {
          display: false,
        },
        border: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      ...sharedOptions.plugins,
      legend: { display: false }
    }
  };

  return (
    <div className="relative h-72 w-full flex items-center justify-center">
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function OperatorDoughnutChart({ data, labels }: { data: number[], labels: string[] }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#FF2D55', // Apple Pink
          '#5856D6', // Apple Purple
          '#FF9500', // Apple Orange
          '#34C759', // Apple Green
          '#5AC8FA', // Apple Light Blue
        ],
        borderWidth: 0,
        hoverOffset: 4,
      }
    ]
  };

  const options = {
    ...sharedOptions,
    cutout: '70%',
  };

  return (
    <div className="relative h-72 w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
