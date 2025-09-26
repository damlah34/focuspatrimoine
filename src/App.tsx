import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import InflationBeat from './pages/InflationBeat';
import RealEstateProjection from './pages/RealEstateProjection';
import Simulations from './pages/Simulations';
import Budget from './pages/Budget';
import { isAuthenticated } from './utils/auth';

// Global page parameters for navigation state
declare global {
  interface Window {
    __pageParams?: any;
  }
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('inflation');
  const [pageParams, setPageParams] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Listen for navigation events
    const handleNavigate = (event: any) => {
      const { page, params } = event.detail;
      handleNavigation(page, params);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const handleNavigation = (page: string, params?: any) => {
    if (page === 'login') {
      if (params?.page) {
        window.__pageParams = {
          page: params.page,
          params: params.params
        };
      } else {
        window.__pageParams = undefined;
      }

      setShowLogin(true);
      return;
    }

    // Check if page requires authentication
    const protectedPages = ['simulations', 'budget'];

    if (protectedPages.includes(page) && !isAuthenticated()) {
      // Store the desired destination
      window.__pageParams = { page, params };
      setShowLogin(true);
      return;
    }

    setCurrentPage(page);
    setPageParams(params);
    setShowLogin(false);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    
    // Navigate to the originally requested page if stored
    if (window.__pageParams) {
      const { page, params } = window.__pageParams;
      setCurrentPage(page);
      setPageParams(params);
      window.__pageParams = undefined;
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'inflation':
        return <InflationBeat />;
      case 'real-estate':
        return (
          <RealEstateProjection 
            simulationId={pageParams?.simulationId}
            simulationTitle={pageParams?.title}
          />
        );
      case 'simulations':
        return <Simulations onNavigate={handleNavigation} />;
      case 'budget':
        return <Budget onNavigate={handleNavigation} />;
      default:
        return <InflationBeat />;
    }
  };

  if (showLogin) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigation}>
      {renderPage()}
    </Layout>
  );
};

export default App;