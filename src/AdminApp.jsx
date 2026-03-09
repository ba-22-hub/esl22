// Importing dependencies
import {
  Routes,
  Route,
  Link,
  Outlet,
  useNavigate,
  Navigate,
  useLocation
} from "react-router-dom";
import { useAuthor } from "@context/AuthorContext.jsx";
import { Toaster } from "react-hot-toast";

// Importing pages
import AdminLogin from "@pages/dashboard/AdminLogin.jsx";
import UserTable from "@pages/dashboard/UserTable.jsx";
import ProductTable from "@pages/dashboard/ProductTable.jsx";
import MessagesDashboard from "@pages/dashboard/MessagesDashboard.jsx";
import RequestsDashboard from "@pages/dashboard/RequestsDashboard.jsx";
import OrderTable from "@pages/dashboard/OrderTable.jsx";
import MoreManagement from "@pages/dashboard/MoreManagement.jsx"

// Importing common components
import PageButton from "@common/PageButton.jsx";
import Loading from "@common/Loading.jsx";

function AdminNavbar() {
  const { logout } = useAuthor();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/admin");
  }

  const navLinks = [
    { to: "/admin/users", label: "👥 Utilisateurs", icon: "👥" },
    { to: "/admin/products", label: "📦 Produits", icon: "📦" },
    { to: "/admin/messages", label: "💬 Messages", icon: "💬" },
    { to: "/admin/requests", label: "📋 Demandes", icon: "📋" },
    { to: "/admin/orders", label: "🛒 Commandes", icon: "🛒" },
    { to: "/admin/more", label: "📰 Articles", icon: "📰" }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-rayonblue shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Première ligne : Logo + Boutons actions */}
        <div className="flex justify-between items-center mb-4">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rayonblue font-bold text-xl">
              R
            </div>
            <h1 className="text-2xl font-bold text-white hidden md:block">
              Administration Rayon22
            </h1>
          </div>

          {/* Boutons actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-rayonorange hover:opacity-90 text-white rounded-lg font-semibold transition hidden sm:block"
            >
              🏠 Rayon22
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-red bg-500 hover:bg-red-600 text-white rounded-lg font-bold transition flex items-center justify-center text-xl"
              title="Déconnexion"
            >
              ⏻
            </button>
          </div>
        </div>

        {/* Deuxième ligne : Navigation */}
        <div className="flex justify-center">
          {/* Liens de navigation - Desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg font-medium transition ${isActive(link.to)
                    ? 'bg-white text-rayonblue'
                    : 'text-white hover:bg-blue-700'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Menu mobile */}
          <div className="lg:hidden w-full">
            <select
              value={location.pathname}
              onChange={(e) => navigate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-white rounded-lg bg-white text-rayonblue font-medium focus:outline-none focus:ring-2 focus:ring-rayonorange"
            >
              {navLinks.map((link) => (
                <option key={link.to} value={link.to}>
                  {link.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}

// We need to use this layout to have a single Route in the component
function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <Outlet />
    </>
  );
}

function AdminApp() {
  const { isAdmin, loading } = useAuthor();

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        {isAdmin && (
          <Route path="/*" element={<AdminLayout />}>
            <Route path="users" element={<UserTable />} />
            <Route path="products" element={<ProductTable />} />
            <Route path="messages" element={<MessagesDashboard />} />
            <Route path="requests" element={<RequestsDashboard />} />
            <Route path="orders" element={<OrderTable />} />
            <Route path="more" element={<MoreManagement />} />
            <Route path="*" element={
              <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                    <p className="text-6xl mb-4">🔍</p>
                    <p className="text-2xl font-bold text-rayonblue mb-2">404 - Page introuvable</p>
                    <p className="text-lg">La page que vous recherchez n'existe pas.</p>
                  </div>
                </div>
              </div>
            } />
          </Route>
        )}
        {!isAdmin && (
          <Route path="*" element={<Navigate to="/admin" replace />} />
        )}
      </Routes>
    </div>
  );
}

export default AdminApp;