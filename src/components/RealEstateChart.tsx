import React from 'react';
import { RealEstateYearData } from '../types';
import { formatCurrency } from '../utils/calculations';

interface RealEstateChartProps {
  data: RealEstateYearData[];
}

const RealEstateChart: React.FC<RealEstateChartProps> = ({ data }) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.paidCapital, d.cumulativeCashflow, d.enrichment)));
  const minValue = Math.min(...data.map(d => Math.min(d.cumulativeCashflow, 0)));
  
  const chartHeight = 300;
  const chartWidth = 600;
  const range = maxValue - minValue;
  const padding = range * 0.1;

  const getY = (value: number) => {
    return chartHeight - ((value - minValue + padding) / (range + 2 * padding)) * chartHeight;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * chartWidth;
  };

  const createPath = (values: number[]) => {
    return values
      .map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(value)}`)
      .join(' ');
  };

  const points = data.map((d, index) => ({
    x: getX(index),
    paidCapitalY: getY(d.paidCapital),
    cashflowY: getY(d.cumulativeCashflow),
    enrichmentY: getY(d.enrichment),
    data: d
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Évolution patrimoniale</h3>
      
      <div className="relative">
        <svg width="100%" height="320" viewBox="0 0 600 320" className="overflow-visible">
          {/* Grid */}
          <defs>
            <pattern id="realEstateGrid" width="60" height="30" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="600" height="300" fill="url(#realEstateGrid)" />
          
          {/* Zero line */}
          <line x1="0" y1={getY(0)} x2="600" y2={getY(0)} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* Lines */}
          <path
            d={createPath(data.map(d => d.paidCapital))}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
          />
          <path
            d={createPath(data.map(d => d.cumulativeCashflow))}
            fill="none"
            stroke="#dc2626"
            strokeWidth="3"
          />
          <path
            d={createPath(data.map(d => d.enrichment))}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.paidCapitalY}
                r="3"
                fill="#059669"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>Capital remboursé année {point.data.year}: {formatCurrency(point.data.paidCapital)}</title>
              </circle>
              <circle
                cx={point.x}
                cy={point.cashflowY}
                r="3"
                fill="#dc2626"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>Cashflow cumulé année {point.data.year}: {formatCurrency(point.data.cumulativeCashflow)}</title>
              </circle>
              <circle
                cx={point.x}
                cy={point.enrichmentY}
                r="4"
                fill="#2563eb"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>Enrichissement année {point.data.year}: {formatCurrency(point.data.enrichment)}</title>
              </circle>
            </g>
          ))}
          
          {/* X-axis labels */}
          {points.map((point, index) => {
            if (index % Math.max(1, Math.floor(data.length / 10)) === 0) {
              return (
                <text
                  key={index}
                  x={point.x}
                  y="315"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {point.data.year}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-600 mr-2"></div>
          <span>Capital remboursé</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-600 mr-2"></div>
          <span>Cashflow cumulé</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
          <span>Enrichissement total</span>
        </div>
      </div>
    </div>
  );
};

export default RealEstateChart;