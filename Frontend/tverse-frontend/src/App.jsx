import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/GlobalTopBar';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OverviewDashboardPage } from './pages/OverviewDashboardPage';
import { KeywordIntelligencePage } from './pages/KeywordIntelligencePage';
import { ProductsPage } from './pages/ProductsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UploadPage } from './pages/UploadPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

const ROUTE_TITLES = {
  '/': 'Overview',
  '/keywords': 'Keyword Intelligence',
  '/products': 'Products',
  '/campaigns': 'Campaigns',
  '/upload': 'Upload Reports',
  '/login': 'Login'
};

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Dynamic title based on pathname
  let title = ROUTE_TITLES[location.pathname] || 'TverseIQ';
  if (location.pathname.startsWith('/products/')) title = 'Product Details';
  if (location.pathname.startsWith('/campaigns/')) title = 'Campaign Details';

  // Render Login page completely outside the app shell
  if (location.pathname === '/login') {
    return <LoginPage />;
  }

  // If not authenticated and trying to access a protected route, it will be caught by ProtectedRoute inside Routes
  // but we still wrap the shell here.
  return (
    <div className="app-shell">
      {isAuthenticated && <Sidebar />}
      <div className="app-main">
        {isAuthenticated && <TopBar title={title} />}
        <main className="app-content">
          <ErrorBoundary key={location.pathname}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<OverviewDashboardPage />} />
                <Route path="/keywords" element={<KeywordIntelligencePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              
              {/* Only OWNER and ADMIN can upload reports */}
              <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
                <Route path="/upload" element={<UploadPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<OverviewDashboardPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}