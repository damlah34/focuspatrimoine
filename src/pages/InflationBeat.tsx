import React, { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Info } from 'lucide-react';
import { InvestmentComparison } from '../types';
import { getLivretARate, calculateInvestmentComparison, formatCurrency, formatPercentage } from '../utils/calculations';
import ComparisonChart from '../components/ComparisonChart';

const InflationBeat: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [customRate, setCustomRate] = useState(5.0);
  const [livretARate, setLivretARate] = useState(getLivretARate());
  const [duration, setDuration] = useState(10);
  const [results, setResults] = useState<InvestmentComparison[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (initialCapital > 0 || monthlyContribution > 0) {
      const comparison = calculateInvestmentComparison(
        initialCapital,
        monthlyContribution,
        customRate,
        livretARate,
        duration
      );
      setResults(comparison);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [initialCapital, monthlyContribution, customRate, livretARate, duration]);

  const finalYear = results[results.length - 1];
  const totalContributions = initialCapital + (monthlyContribution * 12 * duration);
  
  const livretAGain = finalYear ? finalYear.livretA - totalContributions : 0;
  const customGain = finalYear ? finalYear.custom - totalContributions : 0;
  const gainDifference = customGain - livretAGain;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Battre l'inflation</h1>
        </div>
        <p className="text-gray-600">
          Comparez votre placement personnalisé au Livret A pour voir s'il bat réellement l'inflation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Paramètres
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital initial (€)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versement mensuel (€)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {monthlyContribution > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Résumé de l'investissement</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Capital initial : {formatCurrency(initialCapital)}</p>
                  <p>Versements ({duration} ans) : {formatCurrency(monthlyContribution * 12 * duration)}</p>
                  <p className="font-semibold border-t border-blue-200 pt-1">
                    Total investi : {formatCurrency(totalContributions)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux placement personnalisé (%)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux Livret A (%)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={livretARate}
                onChange={(e) => setLivretARate(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (années) : {duration}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 an</span>
                <span>30 ans</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Livret A</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(finalYear?.livretA || 0)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Gain : {formatCurrency(livretAGain)}
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">Placement personnalisé</h3>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(finalYear?.custom || 0)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Gain : {formatCurrency(customGain)}
                  </p>
                </div>
              </div>

              {/* Comparison Alert */}
              <div className={`p-4 rounded-lg ${
                gainDifference > 0 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-start">
                  <Info className={`w-5 h-5 mt-0.5 mr-3 ${
                    gainDifference > 0 ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <div>
                    <h4 className={`font-medium ${
                      gainDifference > 0 ? 'text-green-900' : 'text-orange-900'
                    }`}>
                      {gainDifference > 0 
                        ? '✓ Votre placement bat le Livret A !' 
                        : '⚠ Le Livret A reste plus avantageux'
                      }
                    </h4>
                    <p className={`text-sm mt-1 ${
                      gainDifference > 0 ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      Différence de gain : {formatCurrency(Math.abs(gainDifference))} 
                      {gainDifference > 0 ? ' en votre faveur' : ' en défaveur'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Summary for Monthly Contributions */}
              {monthlyContribution > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Résumé de votre investissement</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Capital initial</p>
                      <p className="font-semibold">{formatCurrency(initialCapital)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Versements totaux</p>
                      <p className="font-semibold">{formatCurrency(monthlyContribution * 12 * duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total investi</p>
                      <p className="font-semibold">{formatCurrency(totalContributions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Différence de gain</p>
                      <p className={`font-semibold ${gainDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(gainDifference))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <ComparisonChart 
                data={results} 
                customRate={customRate} 
                livretARate={livretARate} 
              />

              {/* References */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Références utilisées</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Taux Livret A : {formatPercentage(livretARate)}</li>
                  <li>• Inflation moyenne : 2,0%</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Renseignez vos paramètres
              </h3>
              <p className="text-gray-600">
                Saisissez un capital initial ou un versement mensuel pour voir la comparaison
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InflationBeat;