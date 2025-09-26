export interface InvestmentComparison {
  year: number;
  livretA: number;
  custom: number;
  inflation: number;
}

export interface RealEstateProjectionInput {
  city: string;
  price: number;
  agencyFees: number;
  renovationCosts: number;
  notaryFees: number;
  personalContribution: number;
  loanDuration: number;
  interestRate: number;
  propertyType: 'apartment' | 'building' | 'colocation';
  monthlyRent: number;
  units: Array<{ rent: number }>;
  annualRentIncrease: number;
  annualAppreciation: number;
  monthlyCharges: number;
  propertyTax: number;
  insurance: number;
  cfe: number;
  pnoInsurance: number;
  accountant: number;
  managementFees: number;
  vacancy: number;
  saleYear: number;
}

export interface RealEstateYearData {
  year: number;
  remainingDebt: number;
  paidCapital: number;
  cumulativeCashflow: number;
  enrichment: number;
  propertyValue: number;
  capitalGain: number;
}

export interface Simulation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  payload: any;
}

export interface User {
  id: string;
  email: string;
  token: string;
}

export interface City {
  nom: string;
  code: string;
  codesPostaux: string[];
}