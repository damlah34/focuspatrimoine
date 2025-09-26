import React from 'react';
import { User, AlertCircle } from 'lucide-react';
import { isAuthenticated } from '../utils/auth';

interface BudgetProps {
  onNavigate: (page: string) => void;
}

const Budget: React.FC<BudgetProps> = ({ onNavigate }) => {
  if (!isAuthenticated()) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-900 mb-2">Connexion requise</h2>
          <p className="text-orange-700 mb-4">
            Vous devez être connecté pour accéder à cette fonctionnalité.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Budget</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Gérez votre budget personnel et vos finances
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Fonctionnalité à venir
        </h3>
        <p className="text-gray-600">
          La gestion du budget personnel sera disponible prochainement.
        </p>
      </div>
    </div>
  );
};

export default Budget;