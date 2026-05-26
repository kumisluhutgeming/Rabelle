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
import { useTheme } from '@/components/ThemeProvider';
import { useState, useEffect } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const getSharedOptions = (isDark: boolean) => ({
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
        color: isDark ? '#f4f4f5' : '#1d1d1f' // zinc-100 or almost black
      }
    },
    tooltip: {
      backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)', // zinc-900 or white
      titleColor: isDark ? '#f4f4f5' : '#1d1d1f',
      bodyColor: isDark ? '#f4f4f5' : '#1d1d1f',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
});

export function ProvinceBarChart({ data, labels }: { data: number[], labels: string[] }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

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

  const shared = getSharedOptions(isDark);
  const options = {
    ...shared,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: isDark ? '#a1a1aa' : '#71717a', // zinc-400 or zinc-500
        },
        border: { display: false }
      },
      x: {
        grid: {
          display: false,
        },
        border: { display: false },
        ticks: {
          color: isDark ? '#a1a1aa' : '#71717a',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      ...shared.plugins,
      legend: { display: false }
    }
  };

  return (
    <div className="relative h-72 w-full flex items-center justify-center">
      <Bar key={isDark ? 'dark' : 'light'} data={chartData} options={options} />
    </div>
  );
}

export function OperatorDoughnutChart({ data, labels }: { data: number[], labels: string[] }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

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
        borderWidth: isDark ? 2 : 0,
        borderColor: isDark ? '#18181b' : undefined, // match dark card background so slices have gaps
        hoverOffset: 4,
      }
    ]
  };

  const options = {
    ...getSharedOptions(isDark),
    cutout: '70%',
  };

  return (
    <div className="relative h-72 w-full flex items-center justify-center">
      <Doughnut key={isDark ? 'dark' : 'light'} data={chartData} options={options} />
    </div>
  );
}
