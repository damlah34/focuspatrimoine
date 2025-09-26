import { InvestmentComparison, RealEstateProjectionInput, RealEstateYearData } from '../types';

export const getLivretARate = (): number => 3.0;

export const calculateMonthlyPayment = (amount: number, rate: number, years: number): number => {
  if (amount <= 0) return 0;
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = years * 12;
  
  if (monthlyRate === 0) return amount / numberOfPayments;
  
  return (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

export const calculateInvestmentComparison = (
  initialCapital: number,
  monthlyContribution: number,
  customRate: number,
  livretARate: number,
  years: number
): InvestmentComparison[] => {
  const results: InvestmentComparison[] = [];
  const inflationRate = 2.0;
  
  let livretAValue = initialCapital;
  let customValue = initialCapital;
  let inflationValue = initialCapital;
  
  for (let year = 1; year <= years; year++) {
    // Monthly calculations
    for (let month = 1; month <= 12; month++) {
      livretAValue += monthlyContribution;
      customValue += monthlyContribution;
      inflationValue += monthlyContribution;
      
      livretAValue *= (1 + livretARate / 100 / 12);
      customValue *= (1 + customRate / 100 / 12);
      inflationValue *= (1 + inflationRate / 100 / 12);
    }
    
    results.push({
      year,
      livretA: Math.round(livretAValue),
      custom: Math.round(customValue),
      inflation: Math.round(inflationValue)
    });
  }
  
  return results;
};

export const buildRealEstateProjection = (input: RealEstateProjectionInput): RealEstateYearData[] => {
  const financingNeeded = input.price + input.renovationCosts + input.notaryFees + input.agencyFees - input.personalContribution;
  const monthlyPayment = financingNeeded > 0 ? calculateMonthlyPayment(financingNeeded, input.interestRate, input.loanDuration) : 0;
  
  const results: RealEstateYearData[] = [];
  
  let remainingDebt = financingNeeded;
  let cumulativeCashflow = 0;
  let paidCapital = 0;
  let propertyValue = input.price;
  
  const vacancyFactor = 1 - (input.vacancy / 52);
  const annualCharges = input.propertyTax + input.insurance + input.cfe + input.pnoInsurance + input.accountant + input.managementFees;
  
  for (let year = 1; year <= input.saleYear; year++) {
    let yearlyRent = input.monthlyRent * 12 * Math.pow(1 + input.annualRentIncrease / 100, year - 1) * vacancyFactor;
    let yearlyCashflow = yearlyRent - (input.monthlyCharges * 12) - (monthlyPayment * 12) - annualCharges;
    
    // Capital repayment calculation (simplified)
    const interestPayment = remainingDebt * (input.interestRate / 100);
    const capitalPayment = Math.min((monthlyPayment * 12) - interestPayment, remainingDebt);
    
    remainingDebt = Math.max(0, remainingDebt - capitalPayment);
    paidCapital += capitalPayment;
    cumulativeCashflow += yearlyCashflow;
    propertyValue *= (1 + input.annualAppreciation / 100);
    
    let capitalGain = 0;
    let enrichment = paidCapital + cumulativeCashflow;
    
    if (year === input.saleYear) {
      capitalGain = propertyValue - input.price;
      enrichment += capitalGain - remainingDebt;
    }
    
    results.push({
      year,
      remainingDebt: Math.round(remainingDebt),
      paidCapital: Math.round(paidCapital),
      cumulativeCashflow: Math.round(cumulativeCashflow),
      enrichment: Math.round(enrichment),
      propertyValue: Math.round(propertyValue),
      capitalGain: Math.round(capitalGain)
    });
  }
  
  return results;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};