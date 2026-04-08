import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function BudgetPage() {
  const [summary, setSummary] = useState(null);
  const [budgetCalc, setBudgetCalc] = useState(null);
  const [message, setMessage] = useState('Memuat data budget...');

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const [summaryRes, calcRes] = await Promise.all([
          api.get('/api/budget/summary'),
          api.post('/api/budget/calculate', { use_goals: true }),
        ]);
        setSummary(summaryRes.data);
        setBudgetCalc(calcRes.data);
      } catch (err) {
        setMessage('Tidak dapat memuat data budget.');
      }
    };
    loadBudget();
  }, []);

  const chartData = {
    labels: ['Kebutuhan', 'Keinginan', 'Tabungan'],
    datasets: [
      {
        data: [
          summary?.allocation?.needs || 0,
          summary?.allocation?.wants || 0,
          summary?.allocation?.savings || 0,
        ],
        backgroundColor: ['#3c77f1', '#f19935', '#1b9e5e'],
        hoverOffset: 10,
      },
    ],
  };

  return (
    <main className="page-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Budget Visualizer</p>
            <h1>Alokasi vs Realita</h1>
          </div>
          <p className="panel-description">Visualisasi alokasi budget dan pengeluaran bulan ini.</p>
        </div>

        {!summary || !budgetCalc ? (
          <div className="info-box">{message}</div>
        ) : (
          <div className="card budget-visualizer">
            <div className="budget-chart-grid">
              <div className="chart-card">
                <h3>Alokasi Bulanan</h3>
                <Doughnut data={chartData} />
              </div>
              <div className="budget-details">
                <div className="detail-card">
                  <span>Pengeluaran Hari Ini</span>
                  <strong>Rp {Number(summary.summary?.spentToday || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div className="detail-card">
                  <span>Total Pendapatan</span>
                  <strong>Rp {Number(summary.income || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div className="detail-card">
                  <span>Sisa Budget</span>
                  <strong style={{ color: (summary.summary?.totalRemaining || 0) < 0 ? '#e53e3e' : 'inherit' }}>
                    Rp {Number(summary.summary?.totalRemaining || 0).toLocaleString('id-ID')}
                  </strong>
                </div>
                <div className="detail-card">
                  <span>Savings for Goals</span>
                  <strong>Rp {Number(budgetCalc.allocation?.savings_for_goals || 0).toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
