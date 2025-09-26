import { Simulation } from '../types';

// Mock API - in real app this would be actual server endpoints
const SIMULATIONS_KEY = 'focus_patrimoine_simulations';

const getStoredSimulations = (): Simulation[] => {
  const stored = localStorage.getItem(SIMULATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setStoredSimulations = (simulations: Simulation[]): void => {
  localStorage.setItem(SIMULATIONS_KEY, JSON.stringify(simulations));
};

export const mockApi = {
  async getSimulations(): Promise<Simulation[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getStoredSimulations();
  },

  async getSimulation(id: string): Promise<Simulation | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const simulations = getStoredSimulations();
    return simulations.find(s => s.id === id) || null;
  },

  async createSimulation(title: string, payload: any): Promise<Simulation> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const simulations = getStoredSimulations();
    
    // Check for duplicate title
    if (simulations.some(s => s.title === title)) {
      throw new Error('A simulation with this title already exists');
    }
    
    const newSimulation: Simulation = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      created_at: new Date().toISOString(),
      payload
    };
    
    simulations.push(newSimulation);
    setStoredSimulations(simulations);
    
    return newSimulation;
  },

  async updateSimulation(id: string, title: string, payload: any): Promise<Simulation> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const simulations = getStoredSimulations();
    const index = simulations.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Simulation not found');
    }
    
    // Check for duplicate title (excluding current simulation)
    if (simulations.some((s, i) => s.title === title && i !== index)) {
      throw new Error('A simulation with this title already exists');
    }
    
    const updatedSimulation: Simulation = {
      ...simulations[index],
      title,
      payload,
      updated_at: new Date().toISOString()
    };
    
    simulations[index] = updatedSimulation;
    setStoredSimulations(simulations);
    
    return updatedSimulation;
  },

  async deleteSimulation(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const simulations = getStoredSimulations();
    const filteredSimulations = simulations.filter(s => s.id !== id);
    setStoredSimulations(filteredSimulations);
  }
};

export const searchCities = async (query: string): Promise<any[]> => {
  if (query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux&boost=population&limit=5`
    );
    
    if (!response.ok) return [];
    
    const cities = await response.json();
    return cities.map((city: any) => ({
      nom: city.nom,
      code: city.code,
      codesPostaux: city.codesPostaux || []
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};