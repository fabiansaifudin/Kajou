import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthSession } from './hooks/useAuthSession';
import { signIn, signOut } from './services/auth';
import { getProductsByStore } from './services/products';
import { createSale, getTransactionsByStore } from './services/sales';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function LoginPage({ onReady }) {
  const [email, setEmail] = useState('owner@kajou.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      onReady();
    } catch (error) {
      alert(error.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

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

        <h1>Masuk ke dashboard</h1>
        <p className="light-text">Gunakan akun Supabase yang sudah dibuat.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
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
  const storeUuid = session?.user?.user_metadata?.store_uuid;

  useEffect(() => {
    async function loadDashboard() {
      if (!storeUuid) return;

      try {
        const [productsData, transactionData] = await Promise.all([
          getProductsByStore(storeUuid),
          getTransactionsByStore(storeUuid),
        ]);

        setProducts(productsData);
        setTransactions(transactionData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [storeUuid]);

  const revenue = transactions.reduce((sum, tx) => sum + Number(tx.total || 0), 0);
  const stockTotal = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);

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
          <Link className="nav-item active" to="/">Dashboard</Link>
          <Link className="nav-item" to="/products">Produk</Link>
          <Link className="nav-item" to="/sales">Penjualan</Link>
          <Link className="nav-item" to="/reports">Laporan</Link>
        </nav>

        <button className="logout-button" onClick={onLogout}>Keluar</button>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Halo, {session?.user?.email}</h2>
          </div>
          <div className="store-pill">Toko: {storeUuid || 'Belum ditentukan'}</div>
        </header>

        <section className="stats-grid">
          <div className="stat-card accent-blue">
            <span>Produk</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card accent-green">
            <span>Stok</span>
            <strong>{stockTotal}</strong>
          </div>
          <div className="stat-card accent-gold">
            <span>Penjualan</span>
            <strong>{formatCurrency(revenue)}</strong>
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Produk</h3>
              <Link className="text-link" to="/products">Lihat semua</Link>
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
              <h3>Transaksi terbaru</h3>
              <Link className="text-link" to="/sales">Lihat semua</Link>
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
                  transactions.slice(0, 8).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_id}</td>
                      <td>{item.qty}</td>
                      <td>{formatCurrency(item.total)}</td>
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
  const storeUuid = session?.user?.user_metadata?.store_uuid;

  useEffect(() => {
    if (!storeUuid) return;

    async function load() {
      try {
        const data = await getProductsByStore(storeUuid);
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [storeUuid]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Produk</h2>
        <Link className="text-link" to="/">Kembali ke dashboard</Link>
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

function SalesPage({ session }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const storeUuid = session?.user?.user_metadata?.store_uuid;

  useEffect(() => {
    async function load() {
      if (!storeUuid) return;
      try {
        const [productData, txData] = await Promise.all([
          getProductsByStore(storeUuid),
          getTransactionsByStore(storeUuid),
        ]);

        setProducts(productData);
        setTransactions(txData);
        if (productData[0]) setSelectedProductId(productData[0].id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [storeUuid]);

  async function handleSale(event) {
    event.preventDefault();
    if (!selectedProductId || qty < 1) {
      alert('Harap pilih produk dan jumlah yang valid');
      return;
    }

    try {
      const result = await createSale({
        storeUuid,
        productId: selectedProductId,
        qty: Number(qty),
        paymentMethod,
      });

      alert(`Transaksi berhasil: ${JSON.stringify(result)}`);
      const refreshed = await Promise.all([
        getProductsByStore(storeUuid),
        getTransactionsByStore(storeUuid),
      ]);
      setProducts(refreshed[0]);
      setTransactions(refreshed[1]);
    } catch (error) {
      alert(error.message || 'Transaksi gagal');
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Penjualan</h2>
        <Link className="text-link" to="/">Kembali ke dashboard</Link>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Transaksi baru</h3>
          {loading ? (
            <p>Memuat data...</p>
          ) : (
            <form onSubmit={handleSale} className="stacked-form">
              <label>
                Produk
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Jumlah
                <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
              </label>

              <label>
                Metode Pembayaran
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>

              <button type="submit" className="primary-button">Proses Penjualan</button>
            </form>
          )}
        </div>

        <div className="panel">
          <h3>Riwayat transaksi</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Qty</th>
                <th>Total</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="muted-text">Belum ada transaksi</td>
                </tr>
              ) : (
                transactions.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>{item.qty}</td>
                    <td>{formatCurrency(item.total)}</td>
                    <td>{new Date(item.created_at).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="page-shell">
      <div className="page-header">
        <h2>Laporan</h2>
        <Link className="text-link" to="/">Kembali ke dashboard</Link>
      </div>

      <div className="panel">
        <p className="muted-text">
          Untuk laporan harian, mingguan, dan bulanan, data akan dibuat dari file JSON yang terenkripsi pada layer report generator.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return <div className="page-loading">Loading Kajou...</div>;
  }

  if (!session) {
    return <LoginPage onReady={() => window.location.reload()} />;
  }

  async function handleLogout() {
    await signOut();
    window.location.reload();
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage session={session} onLogout={handleLogout} />} />
      <Route path="/products" element={<ProductsPage session={session} />} />
      <Route path="/sales" element={<SalesPage session={session} />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

