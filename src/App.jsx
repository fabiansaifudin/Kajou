import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('owner@kajou.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLogin(data.session);
    } catch (error) {
      alert(error.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-block">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-name">Kajou</div>
            <div className="brand-subtitle">Kasir Jualan Offline Unggul</div>
          </div>
        </div>

        <h1>Masuk ke admin</h1>
        <p className="light-text">Gunakan akun Supabase Anda untuk mengakses dashboard.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@kajou.app"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardPage({ session, onLogout }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const storeUuid = session?.user?.user_metadata?.store_uuid;

        const [productsResult, transactionsResult] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('store_uuid', storeUuid)
            .order('name', { ascending: true }),
          supabase
            .from('transactions')
            .select('*')
            .eq('store_uuid', storeUuid)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        if (productsResult.error) throw productsResult.error;
        if (transactionsResult.error) throw transactionsResult.error;

        setProducts(productsResult.data || []);
        setTransactions(transactionsResult.data || []);
      } catch (error) {
        console.error(error);
        alert(error.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  const totalRevenue = useMemo(
    () => transactions.reduce((sum, tx) => sum + Number(tx.total || 0), 0),
    [transactions],
  );

  const totalStock = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    [products],
  );

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block sidebar-brand">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-name">Kajou</div>
            <div className="brand-subtitle">POS</div>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/" className="nav-item active">Dashboard</Link>
          <Link to="/products" className="nav-item">Produk</Link>
          <Link to="/transactions" className="nav-item">Transaksi</Link>
          <Link to="/report" className="nav-item">Laporan</Link>
        </nav>

        <button className="logout-button" onClick={onLogout}>Keluar</button>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Halo, {session?.user?.email}</h2>
          </div>
          <div className="store-pill">Toko: {session?.user?.user_metadata?.store_uuid || 'Default'}</div>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent-blue">
            <span>Produk</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card accent-green">
            <span>Stok</span>
            <strong>{totalStock}</strong>
          </div>
          <div className="stat-card accent-gold">
            <span>Penjualan</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Produk</h3>
              <Link to="/products" className="text-link">Lihat semua</Link>
            </div>

            {loading ? (
              <p>Memuat produk...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>SKU</th>
                    <th>Harga</th>
                    <th>Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 6).map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Transaksi Terbaru</h3>
              <Link to="/transactions" className="text-link">Lihat semua</Link>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="muted-text">Belum ada transaksi</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.product_id || 'Produk'}</td>
                      <td>{tx.qty}</td>
                      <td>{formatCurrency(tx.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProductsPage({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_uuid', session?.user?.user_metadata?.store_uuid)
          .order('name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (session) loadProducts();
  }, [session]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Produk</h2>
        <Link to="/" className="text-link">Kembali ke dashboard</Link>
      </div>

      <div className="panel">
        {loading ? (
          <p>Memuat produk...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>SKU</th>
                <th>Harga</th>
                <th>Stok</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TransactionsPage({ session }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('store_uuid', session?.user?.user_metadata?.store_uuid)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (session) loadTransactions();
  }, [session]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Transaksi</h2>
        <Link to="/" className="text-link">Kembali ke dashboard</Link>
      </div>

      <div className="panel">
        {loading ? (
          <p>Memuat transaksi...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.product_id}</td>
                  <td>{tx.qty}</td>
                  <td>{formatCurrency(tx.total)}</td>
                  <td>{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReportPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Laporan</h2>
        <Link to="/" className="text-link">Kembali ke dashboard</Link>
      </div>

      <div className="panel">
        <p className="muted-text">Halaman laporan akan dikembangkan untuk harian, mingguan, dan bulanan.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading Kajou...</div>;
  }

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardPage session={session} onLogout={handleLogout} />} />
      <Route path="/products" element={<ProductsPage session={session} />} />
      <Route path="/transactions" element={<TransactionsPage session={session} />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
