import React, { useState } from 'react';
import { User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { login, setToken, LoginCredentials } from '../utils/auth';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { token } = await login(credentials);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Focus Patrimoine</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre mot de passe"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Utilisez n'importe quel email et mot de passe pour tester l'application</p>
        </div>
      </div>
    </div>
  );
};

export default Login;