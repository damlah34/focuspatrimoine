import React from 'react';
import { Building2, TrendingUp, FileText, LogOut, User } from 'lucide-react';
import { isAuthenticated, logout } from '../utils/auth';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const authenticated = isAuthenticated();

  const menuItems = [
    { id: 'inflation', label: 'Battre l\'inflation', icon: TrendingUp },
    { id: 'real-estate', label: 'Projet immo', icon: Building2 },
    { id: 'simulations', label: 'Mes simulations', icon: FileText, protected: true },
    { id: 'budget', label: 'Budget', icon: User, protected: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Focus Patrimoine</h1>
          <p className="text-sm text-gray-500 mt-1">Simulateur financier</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isDisabled = item.protected && !authenticated;
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onNavigate(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
                {item.protected && !authenticated && (
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                    Connexion requise
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        
        {authenticated && (
          <div className="absolute bottom-6 left-6">
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;