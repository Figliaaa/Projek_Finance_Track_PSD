import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({ monthlyTrends: [], topCategories: [] });
  const [status, setStatus] = useState('Memuat analitik...');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get('/api/analytics');
        setAnalytics(response.data);
      } catch (err) {
        setStatus('Gagal memuat analitik.');
      }
    };
    loadAnalytics();
  }, []);

  const chartData = {
    labels: analytics.monthlyTrends.map((item) => item.month),
    datasets: [
      {
        label: 'Pengeluaran Bulanan',
        data: analytics.monthlyTrends.map((item) => item.total_expense),
        backgroundColor: 'rgba(60, 119, 241, 0.72)',
        borderRadius: 8,
        maxBarThickness: 40,
      },
    ],
  };

  const categoryData = {
    labels: analytics.topCategories.map((item) => item.category_name),
    datasets: [
      {
        data: analytics.topCategories.map((item) => item.total),
        backgroundColor: ['#3c77f1', '#f19935', '#1b9e5e', '#8b5cf6', '#ef4444'],
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#eff4fb' } },
    },
  };

  return (
    <main className="page-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Analytics Dashboard</p>
            <h1>Tren Keuangan & Pengeluaran</h1>
          </div>
          <p className="panel-description">Lihat performa finansial Anda dalam 12 bulan terakhir.</p>
        </div>

        <div className="card analytics-grid">
          <article>
            <h3>Top Categories</h3>
            {analytics.topCategories.length ? (
              <Doughnut data={categoryData} />
            ) : (
              <div className="info-box">{status}</div>
            )}
          </article>

          <article>
            <h3>Monthly Expense Trend</h3>
            {analytics.monthlyTrends.length ? (
              <Bar data={chartData} options={options} />
            ) : (
              <div className="info-box">{status}</div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
