import { useEffect, useState } from 'react';
import api from '../api';

const defaultForm = {
  goal_name: '',
  target_amount: '',
  deadline: '',
  category: '',
  priority: '1',
  status: 'active',
  description: '',
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Memuat goals...');

  const loadGoals = async () => {
    try {
      const response = await api.get('/api/goals');
      setGoals(response.data);
    } catch (err) {
      setMessage('Gagal memuat goals. Coba kembali.');
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleEditClick = (goal) => {
    setEditingGoalId(goal.id);
    setForm({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      deadline: goal.deadline,
      category: goal.category || '',
      priority: String(goal.priority || 1),
      status: goal.status || 'active',
      description: goal.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setForm(defaultForm);
    setMessage('Mode edit dibatalkan.');
  };

  const GOAL_COLORS = [
    'linear-gradient(90deg, var(--accent), var(--accent-bright))',
    'linear-gradient(90deg, #fbbf24, #f59e0b)',
    'linear-gradient(90deg, #34d399, #10b981)',
    'linear-gradient(90deg, #f87171, #ef4444)',
    'linear-gradient(90deg, #a78bfa, #7c3aed)',
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (editingGoalId) {
        await api.put(`/api/goals/${editingGoalId}`, {
          ...form,
          target_amount: Number(form.target_amount),
        });
        setMessage('Goal berhasil diperbarui.');
      } else {
        await api.post('/api/goals', {
          ...form,
          target_amount: Number(form.target_amount),
        });
        setMessage('Goal berhasil ditambahkan.');
      }
      setForm(defaultForm);
      setEditingGoalId(null);
      loadGoals();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Gagal menyimpan goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-layout">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Goal Manager</p>
            <h1>Atur tujuan finansial Anda</h1>
          </div>
          <p className="panel-description">Tambahkan goal baru dan pantau progress target Anda setiap bulan.</p>
        </div>

        <form className="card goal-form" onSubmit={handleSubmit}>
          <label>
            Nama Goal
            <input name="goal_name" value={form.goal_name} onChange={handleChange} required />
          </label>
          <label>
            Target Jumlah (Rp)
            <input type="number" name="target_amount" value={form.target_amount} onChange={handleChange} required />
          </label>
          <label>
            Deadline
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} required />
          </label>
          <label>
            Kategori
            <input name="category" value={form.category} onChange={handleChange} placeholder="Tabungan, Liburan, Pendidikan" />
          </label>
          <label>
            Prioritas
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="1">Tinggi</option>
              <option value="2">Sedang</option>
              <option value="3">Rendah</option>
            </select>
          </label>
          <label>
            Status Goal
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <label>
            Deskripsi
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
          </label>
          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : editingGoalId ? 'Perbarui Goal' : 'Tambahkan Goal'}
            </button>
            {editingGoalId && (
              <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                Batalkan
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Goal List</p>
            <h2>{goals.length ? 'Goals Anda' : 'Belum ada goal tersimpan'}</h2>
          </div>
          <span className="panel-description">Lihat progress, deadline, dan status setiap goal.</span>
        </div>

        {goals.length ? (
          <div className="grid-grid">
            {goals.map((goal, idx) => {
              const progress = goal.progress || 0;
              return (
                <article key={goal.id} className="card goal-summary">
                  <div className="goal-summary-header">
                    <div>
                      <h3>{goal.goal_name}</h3>
                      <p>{goal.category || 'General'} • {goal.status}</p>
                    </div>
                    <div className="goal-summary-actions">
                      <button type="button" className="button-secondary small" onClick={() => handleEditClick(goal)}>
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="progress-meter">
                    <div className="goal-bar" style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      background: GOAL_COLORS[idx % GOAL_COLORS.length],
                      animationDelay: `${0.4 + idx * 0.1}s`,
                    }} />
                  </div>
                  <div className="goal-summary-meta">
                    <span>{Math.max(progress, 0)}% tercapai</span>
                    <span>Rp {Number(goal.current_amount || 0).toLocaleString('id-ID')} / Rp {Number(goal.target_amount).toLocaleString('id-ID')}</span>
                  </div>
                  <p className="goal-note">Deadline: {goal.deadline}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="info-box">Tambahkan goal baru menggunakan form di atas untuk langsung memulai.</div>
        )}
      </section>

      <div className="info-box">
        {message}
      </div>
    </main>
  );
}
