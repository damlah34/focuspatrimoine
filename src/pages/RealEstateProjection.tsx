import React, { useState, useEffect } from 'react';
import { Building2, Calculator, Save, Copy, Printer, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { RealEstateProjectionInput, RealEstateYearData, City } from '../types';
import { buildRealEstateProjection, formatCurrency, formatPercentage, calculateMonthlyPayment } from '../utils/calculations';
import { mockApi, searchCities } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import RealEstateChart from '../components/RealEstateChart';

interface RealEstateProjectionProps {
  simulationId?: string;
  simulationTitle?: string;
}

const RealEstateProjection: React.FC<RealEstateProjectionProps> = ({ 
  simulationId, 
  simulationTitle 
}) => {
  // Form state
  const [inputs, setInputs] = useState<RealEstateProjectionInput>({
    city: '',
    price: 100000,
    agencyFees: 0,
    renovationCosts: 0,
    notaryFees: 8000,
    personalContribution: 20000,
    loanDuration: 20,
    interestRate: 3.0,
    propertyType: 'apartment',
    monthlyRent: 500,
    units: [{ rent: 500 }],
    annualRentIncrease: 1.5,
    annualAppreciation: 2.0,
    monthlyCharges: 50,
    propertyTax: 1200,
    insurance: 300,
    cfe: 200,
    pnoInsurance: 400,
    accountant: 500,
    managementFees: 0,
    vacancy: 2,
    saleYear: 15
  });

  // UI state
  const [projection, setProjection] = useState<RealEstateYearData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [title, setTitle] = useState(simulationTitle || '');
  
  // Loading states
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadSimulationError, setLoadSimulationError] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [saveOk, setSaveOk] = useState('');

  const [currentSimulationId, setCurrentSimulationId] = useState(simulationId);

  // Load simulation if ID provided
  useEffect(() => {
    if (simulationId && isAuthenticated()) {
      loadSimulation(simulationId);
    }
  }, [simulationId]);

  // Auto-calculate notary fees
  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      notaryFees: Math.round(prev.price * 0.08)
    }));
  }, [inputs.price]);

  // Search cities
  useEffect(() => {
    if (cityQuery.length >= 2) {
      searchCities(cityQuery).then(setCities);
    } else {
      setCities([]);
    }
  }, [cityQuery]);

  // Update monthly rent based on property type and units
  useEffect(() => {
    if (inputs.propertyType !== 'apartment') {
      const totalRent = inputs.units.reduce((sum, unit) => sum + unit.rent, 0);
      setInputs(prev => ({ ...prev, monthlyRent: totalRent }));
    }
  }, [inputs.units, inputs.propertyType]);

  const loadSimulation = async (id: string) => {
    setLoadingSimulation(true);
    setLoadSimulationError('');
    
    try {
      const simulation = await mockApi.getSimulation(id);
      
      if (simulation && simulation.payload) {
        const data = simulation.payload;
        
        // Restore form inputs
        if (data.inputs) {
          setInputs(data.inputs);
          setCityQuery(data.inputs.city || '');
        }
        
        // Restore projection
        if (data.projection) {
          setProjection(data.projection);
          setShowResults(true);
        }
        
        setTitle(simulation.title);
      } else {
        setLoadSimulationError('Simulation non trouvée');
      }
    } catch (error) {
      setLoadSimulationError('Erreur lors du chargement');
    } finally {
      setLoadingSimulation(false);
    }
  };

  const handleCalculate = () => {
    if (inputs.monthlyRent <= 0) {
      alert('Veuillez renseigner le loyer mensuel');
      return;
    }
    
    const projectionData = buildRealEstateProjection(inputs);
    setProjection(projectionData);
    setShowResults(true);
  };

  const handleCitySelect = (city: City) => {
    setInputs(prev => ({ ...prev, city: city.nom }));
    setCityQuery(city.nom);
    setShowCityDropdown(false);
  };

  const handleUnitsChange = (index: number, rent: number) => {
    const newUnits = [...inputs.units];
    newUnits[index] = { rent };
    setInputs(prev => ({ ...prev, units: newUnits }));
  };

  const addUnit = () => {
    setInputs(prev => ({
      ...prev,
      units: [...prev.units, { rent: 500 }]
    }));
  };

  const removeUnit = (index: number) => {
    if (inputs.units.length > 1) {
      const newUnits = inputs.units.filter((_, i) => i !== index);
      setInputs(prev => ({ ...prev, units: newUnits }));
    }
  };

  const buildPayload = () => {
    const finalYear = projection[projection.length - 1];
    const financingNeeded = inputs.price + inputs.renovationCosts + inputs.notaryFees + inputs.agencyFees - inputs.personalContribution;
    const monthlyPayment = financingNeeded > 0 ? calculateMonthlyPayment(financingNeeded, inputs.interestRate, inputs.loanDuration) : 0;
    const annualCharges = inputs.propertyTax + inputs.insurance + inputs.cfe + inputs.pnoInsurance + inputs.accountant + inputs.managementFees;
    const vacancyFactor = 1 - (inputs.vacancy / 52);
    const netCashflow = (inputs.monthlyRent * 12 * vacancyFactor) - (inputs.monthlyCharges * 12) - (monthlyPayment * 12) - annualCharges;
    const grossYield = (inputs.monthlyRent * 12) / inputs.price * 100;
    const netYield = netCashflow / inputs.price * 100;

    return {
      meta: {
        city: inputs.city,
        propertyType: inputs.propertyType,
        timestamp: new Date().toISOString()
      },
      inputs,
      computed: {
        financingNeeded,
        monthlyPayment,
        netCashflow: Math.round(netCashflow),
        grossYield: Number(grossYield.toFixed(2)),
        netYield: Number(netYield.toFixed(2)),
        capitalGain: finalYear?.capitalGain || 0
      },
      projection
    };
  };

  const handleSave = async (saveAs = false) => {
    if (!isAuthenticated()) {
      alert('Vous devez être connecté pour sauvegarder');
      return;
    }

    if (!title.trim()) {
      alert('Veuillez saisir un titre pour la simulation');
      return;
    }

    setSaveErr('');
    setSaveOk('');

    try {
      const payload = buildPayload();
      
      if (currentSimulationId && !saveAs) {
        await mockApi.updateSimulation(currentSimulationId, title, payload);
        setSaveOk('Simulation mise à jour avec succès !');
      } else {
        const newSimulation = await mockApi.createSimulation(title, payload);
        setCurrentSimulationId(newSimulation.id);
        setSaveOk('Simulation sauvegardée avec succès !');
        
        // Navigate to simulations list
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'simulations' } }));
        }, 1500);
      }
    } catch (error: any) {
      setSaveErr(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Computed values
  const totalBudget = inputs.price + inputs.agencyFees + inputs.renovationCosts + inputs.notaryFees;
  const financingNeeded = totalBudget - inputs.personalContribution;
  const monthlyPayment = financingNeeded > 0 ? calculateMonthlyPayment(financingNeeded, inputs.interestRate, inputs.loanDuration) : 0;
  const annualCharges = inputs.propertyTax + inputs.insurance + inputs.cfe + inputs.pnoInsurance + inputs.accountant + inputs.managementFees;
  const vacancyFactor = 1 - (inputs.vacancy / 52);
  const netCashflow = (inputs.monthlyRent * 12 * vacancyFactor) - (inputs.monthlyCharges * 12) - (monthlyPayment * 12) - annualCharges;
  const grossYield = inputs.price > 0 ? (inputs.monthlyRent * 12) / inputs.price * 100 : 0;
  const netYield = inputs.price > 0 ? netCashflow / inputs.price * 100 : 0;

  let decision = 'NOGO';
  let decisionColor = 'text-red-600 bg-red-50 border-red-200';
  
  if (netYield >= 7) {
    decision = 'Favorable';
    decisionColor = 'text-green-600 bg-green-50 border-green-200';
  } else if (netYield >= 5.5) {
    decision = 'À approfondir';
    decisionColor = 'text-orange-600 bg-orange-50 border-orange-200';
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loadingSimulation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Loader2 className="animate-spin w-5 h-5 mr-2 text-blue-600" />
          <span className="text-blue-800">Chargement de la simulation...</span>
        </div>
      )}

      {loadSimulationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          <span className="text-red-800">{loadSimulationError}</span>
        </div>
      )}

      {saveErr && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
          <span className="text-red-800">{saveErr}</span>
        </div>
      )}

      {saveOk && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          <span className="text-green-800">{saveOk}</span>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Projet immobilier</h1>
          </div>
          
          {isAuthenticated() && showResults && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSave(false)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </button>
              <button
                onClick={() => handleSave(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Enregistrer sous
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </button>
            </div>
          )}
        </div>
        
        {isAuthenticated() && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Titre de la simulation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identification */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Identification</h2>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rechercher une ville..."
                />
                
                {showCityDropdown && cities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {cities.map((city, index) => (
                      <button
                        key={`${city.code}-${index}`}
                        onMouseDown={() => handleCitySelect(city)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                      >
                        <div className="font-medium">{city.nom}</div>
                        {city.codesPostaux?.length > 0 && (
                          <div className="text-sm text-gray-500">
                            {city.codesPostaux.slice(0, 3).join(', ')}
                            {city.codesPostaux.length > 3 && '...'}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Budget d'acquisition</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (hors frais) (€)
                </label>
                <input
                  type="number"
                  value={inputs.price}
                  onChange={(e) => setInputs(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais d'agence (€)
                </label>
                <input
                  type="number"
                  value={inputs.agencyFees}
                  onChange={(e) => setInputs(prev => ({ ...prev, agencyFees: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travaux (€)
                </label>
                <input
                  type="number"
                  value={inputs.renovationCosts}
                  onChange={(e) => setInputs(prev => ({ ...prev, renovationCosts: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frais de notaire (€)
                </label>
                <input
                  type="number"
                  value={inputs.notaryFees}
                  onChange={(e) => setInputs(prev => ({ ...prev, notaryFees: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Calculés automatiquement à 8% du prix</p>
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Financement</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apport personnel (€)
                </label>
                <input
                  type="number"
                  value={inputs.personalContribution}
                  onChange={(e) => setInputs(prev => ({ ...prev, personalContribution: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {financingNeeded > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée du prêt (années) : {inputs.loanDuration}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={inputs.loanDuration}
                      onChange={(e) => setInputs(prev => ({ ...prev, loanDuration: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5 ans</span>
                      <span>30 ans</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taux nominal (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.interestRate}
                      onChange={(e) => setInputs(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Property Type and Rent */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Typologie et loyers</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de bien
                </label>
                <select
                  value={inputs.propertyType}
                  onChange={(e) => setInputs(prev => ({ 
                    ...prev, 
                    propertyType: e.target.value as any,
                    units: e.target.value === 'apartment' ? [{ rent: 500 }] : prev.units
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="apartment">Appartement</option>
                  <option value="building">Immeuble</option>
                  <option value="colocation">Colocation</option>
                </select>
              </div>
              
              {inputs.propertyType === 'apartment' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loyer mensuel (€)
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyRent}
                    onChange={(e) => setInputs(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {inputs.propertyType === 'building' ? 'Lots' : 'Chambres'}
                  </label>
                  
                  {inputs.units.map((unit, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600 w-20">
                        {inputs.propertyType === 'building' ? `Lot ${index + 1}` : `Chambre ${index + 1}`}
                      </span>
                      <input
                        type="number"
                        value={unit.rent}
                        onChange={(e) => handleUnitsChange(index, Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Loyer (€)"
                      />
                      {inputs.units.length > 1 && (
                        <button
                          onClick={() => removeUnit(index)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addUnit}
                    className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Ajouter
                  </button>
                  
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">
                      Total mensuel : <strong>{formatCurrency(inputs.monthlyRent)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hypotheses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Hypothèses d'évolution</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Croissance des loyers (%/an) : {inputs.annualRentIncrease}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={inputs.annualRentIncrease}
                  onChange={(e) => setInputs(prev => ({ ...prev, annualRentIncrease: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>3%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valorisation du bien (%/an) : {inputs.annualAppreciation}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={inputs.annualAppreciation}
                  onChange={(e) => setInputs(prev => ({ ...prev, annualAppreciation: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Charges</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges mensuelles (€)
                </label>
                <input
                  type="number"
                  value={inputs.monthlyCharges}
                  onChange={(e) => setInputs(prev => ({ ...prev, monthlyCharges: Number(e.target.value) }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxe foncière (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.propertyTax}
                    onChange={(e) => setInputs(prev => ({ ...prev, propertyTax: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assurance (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.insurance}
                    onChange={(e) => setInputs(prev => ({ ...prev, insurance: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CFE (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.cfe}
                    onChange={(e) => setInputs(prev => ({ ...prev, cfe: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assurance PNO (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.pnoInsurance}
                    onChange={(e) => setInputs(prev => ({ ...prev, pnoInsurance: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expert-comptable (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.accountant}
                    onChange={(e) => setInputs(prev => ({ ...prev, accountant: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gestion locative (€/an)
                  </label>
                  <input
                    type="number"
                    value={inputs.managementFees}
                    onChange={(e) => setInputs(prev => ({ ...prev, managementFees: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vacance locative (semaines/an) : {inputs.vacancy}
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={inputs.vacancy}
                  onChange={(e) => setInputs(prev => ({ ...prev, vacancy: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 sem</span>
                  <span>8 sem</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de revente : {inputs.saleYear}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={inputs.saleYear}
                  onChange={(e) => setInputs(prev => ({ ...prev, saleYear: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 an</span>
                  <span>30 ans</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleCalculate}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculer la projection
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {showResults ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Budget global</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Besoin financement</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.max(0, financingNeeded))}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Mensualité</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Cashflow mensuel</p>
                  <p className={`text-xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netCashflow / 12)}
                  </p>
                </div>
              </div>

              {/* Yields and Decision */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Rendement brut</p>
                  <p className="text-xl font-bold text-blue-600">{formatPercentage(grossYield)}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                  <p className="text-sm text-gray-600">Rendement net</p>
                  <p className="text-xl font-bold text-indigo-600">{formatPercentage(netYield)}</p>
                </div>
                
                <div className={`p-4 rounded-lg shadow-md text-center border ${decisionColor}`}>
                  <p className="text-sm">Décision</p>
                  <p className="text-xl font-bold">{decision}</p>
                </div>
              </div>

              {/* Capital Gain */}
              {projection.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Plus-value potentielle</h3>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">À l'année {inputs.saleYear}</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(projection[projection.length - 1]?.capitalGain || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              {projection.length > 0 && (
                <RealEstateChart data={projection} />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Renseignez votre projet
              </h3>
              <p className="text-gray-600">
                Complétez le formulaire et lancez le calcul pour voir les projections
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealEstateProjection;