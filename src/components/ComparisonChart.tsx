import React, { useMemo } from 'react';
import { InvestmentComparison } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ComparisonChartProps {
  data: InvestmentComparison[];
  customRate: number;
  livretARate: number;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, customRate, livretARate }) => {
  const chartData = useMemo(() => {
    if (!data.length) return null;

    const maxValue = Math.max(...data.flatMap(d => [d.livretA, d.custom, d.inflation]));
    const minValue = Math.min(...data.flatMap(d => [d.livretA, d.custom, d.inflation]));
    const range = maxValue - minValue;
    const padding = range * 0.1;

    const chartHeight = 300;
    const chartWidth = 600;

    const getY = (value: number) => {
      return chartHeight - ((value - minValue + padding) / (range + 2 * padding)) * chartHeight;
    };

    const denominator = Math.max(1, data.length - 1);

    const getX = (index: number) => {
      if (data.length === 1) {
        return chartWidth / 2;
      }

      return (index / denominator) * chartWidth;
    };

    const createPath = (values: number[]) => {
      if (values.length === 1) {
        const x = chartWidth / 2;
        const y = getY(values[0]);
        return `M ${x} ${y} L ${x} ${y}`;
      }

      return values
        .map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(value)}`)
        .join(' ');
    };

    return {
      livretAPath: createPath(data.map(d => d.livretA)),
      customPath: createPath(data.map(d => d.custom)),
      inflationPath: createPath(data.map(d => d.inflation)),
      points: data.map((d, index) => ({
        x: getX(index),
        livretAY: getY(d.livretA),
        customY: getY(d.custom),
        inflationY: getY(d.inflation),
        data: d
      })),
      maxValue,
      minValue
    };
  }, [data]);

  if (!chartData || !data.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Évolution des capitaux</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Aucune donnée à afficher
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Évolution des capitaux</h3>
      
      <div className="relative">
        <svg width="100%" height="320" viewBox={`0 0 600 320`} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="60" height="30" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="600" height="300" fill="url(#grid)" />
          
          {/* Lines */}
          <path
            d={chartData.inflationPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <path
            d={chartData.livretAPath}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
          />
          <path
            d={chartData.customPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
          />
          
          {/* Points with hover */}
          {chartData.points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.customY}
                r="4"
                fill="#2563eb"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  {`Année ${point.data.year}: ${formatCurrency(point.data.custom)}`}
                </title>
              </circle>
              <circle
                cx={point.x}
                cy={point.livretAY}
                r="4"
                fill="#059669"
                className="hover:r-6 transition-all cursor-pointer"
              >
                <title>
                  {`Année ${point.data.year}: ${formatCurrency(point.data.livretA)}`}
                </title>
              </circle>
              <circle
                cx={point.x}
                cy={point.inflationY}
                r="3"
                fill="#ef4444"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>
                  {`Année ${point.data.year}: ${formatCurrency(point.data.inflation)}`}
                </title>
              </circle>
            </g>
          ))}
          
          {/* X-axis labels */}
          {chartData.points.map((point, index) => {
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
          <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
          <span>Placement personnalisé ({customRate}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-600 mr-2"></div>
          <span>Livret A ({livretARate}%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 border-dashed border-t mr-2"></div>
          <span>Seuil inflation (2%)</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;