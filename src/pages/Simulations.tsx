import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { Simulation } from '../types';
import { mockApi } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

interface SimulationsProps {
  onNavigate: (page: string, params?: any) => void;
}

const Simulations: React.FC<SimulationsProps> = ({ onNavigate }) => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      onNavigate('login', { page: 'simulations' });
      return;
    }
    
    loadSimulations();
  }, [onNavigate]);

  const loadSimulations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await mockApi.getSimulations();
      setSimulations(data);
    } catch (err) {
      setError('Erreur lors du chargement des simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return;
    }

    setDeletingId(id);
    
    try {
      await mockApi.deleteSimulation(id);
      setSimulations(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (simulation: Simulation) => {
    // Navigate to real estate page with simulation data
    onNavigate('real-estate', {
      simulationId: simulation.id,
      title: simulation.title
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated()) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-900 mb-2">Connexion requise</h2>
          <p className="text-orange-700 mb-4">
            Vous devez être connecté pour accéder à vos simulations.
          </p>
          <button
            onClick={() => onNavigate('login', { page: 'simulations' })}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mes simulations</h1>
          </div>
          
          <button
            onClick={() => onNavigate('real-estate')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle simulation
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Gérez et consultez vos projets immobiliers sauvegardés
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
          <span className="text-gray-600">Chargement des simulations...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && simulations.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune simulation
          </h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore créé de simulation immobilière.
          </p>
          <button
            onClick={() => onNavigate('real-estate')}
            className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer ma première simulation
          </button>
        </div>
      )}

      {!loading && !error && simulations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulations.map((simulation) => (
            <div
              key={simulation.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {simulation.title || 'Sans titre'}
                </h3>
                <p className="text-sm text-gray-500">
                  Créé le {formatDate(simulation.created_at)}
                </p>
                {simulation.updated_at && (
                  <p className="text-sm text-gray-500">
                    Modifié le {formatDate(simulation.updated_at)}
                  </p>
                )}
              </div>

              {/* Simulation Preview */}
              {simulation.payload?.meta && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    {simulation.payload.meta.city && (
                      <p><span className="font-medium">Ville :</span> {simulation.payload.meta.city}</p>
                    )}
                    {simulation.payload.computed?.grossYield && (
                      <p><span className="font-medium">Rendement brut :</span> {simulation.payload.computed.grossYield}%</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleOpen(simulation)}
                  className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ouvrir
                </button>
                
                <button
                  onClick={() => handleDelete(simulation.id, simulation.title)}
                  disabled={deletingId === simulation.id}
                  className="flex items-center px-3 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === simulation.id ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Simulations;