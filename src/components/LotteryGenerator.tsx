'use client';

import { useState, useEffect } from 'react';
import {
  calculateNumberFrequencies,
  analyzePattern,
  validateNumbers,
  generateOptimizedNumbers,
  getHistoricalData,
} from '../utils/lotteryAnalysis';
import type { NumberFrequency, NumberPattern } from '../utils/types';

type LotteryType = 'primitiva' | 'bonoloto' | 'euromillones' | 'gordo' | 'eurodreams';

interface LotteryConfig {
  name: string;
  numbers: number;
  maxNumber: number;
  extra?: {
    name: string;
    count: number;
    maxNumber: number;
  };
  stars?: {
    count: number;
    maxNumber: number;
  };
}

const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  primitiva: {
    name: 'La Primitiva',
    numbers: 6,
    maxNumber: 49,
    extra: {
      name: 'Reintegro',
      count: 1,
      maxNumber: 9,
    },
  },
  bonoloto: {
    name: 'Bonoloto',
    numbers: 6,
    maxNumber: 49,
  },
  euromillones: {
    name: 'Euromillones',
    numbers: 5,
    maxNumber: 50,
    stars: {
      count: 2,
      maxNumber: 12,
    },
  },
  gordo: {
    name: 'El Gordo',
    numbers: 5,
    maxNumber: 54,
    extra: {
      name: 'Número Clave',
      count: 1,
      maxNumber: 9,
    },
  },
  eurodreams: {
    name: 'Euro Dreams',
    numbers: 6,
    maxNumber: 40,
    extra: {
      name: 'Sueño',
      count: 1,
      maxNumber: 5,
    },
  },
};

export default function LotteryGenerator() {
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>('primitiva');
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [generatedStars, setGeneratedStars] = useState<number[]>([]);
  const [generatedExtra, setGeneratedExtra] = useState<number[]>([]);
  const [frequencies, setFrequencies] = useState<NumberFrequency[]>([]);
  const [pattern, setPattern] = useState<NumberPattern | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFrequencies = async () => {
      setIsLoading(true);
      try {
        const newFrequencies = await calculateNumberFrequencies(
          selectedLottery,
          LOTTERY_CONFIGS[selectedLottery].maxNumber
        );
        setFrequencies(newFrequencies);
      } catch (error) {
        console.error('Error loading frequencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFrequencies();
  }, [selectedLottery]);

  const generateNumbers = async () => {
    setIsLoading(true);
    try {
      const config = LOTTERY_CONFIGS[selectedLottery];
      const historicalData = await getHistoricalData();
      const lotteryData = historicalData[selectedLottery] || [];
      
      // Obtener patrones históricos
      const historicalPatterns = lotteryData.map(draw => analyzePattern(draw.numbers));
      
      // Generar números optimizados
      const numbers = generateOptimizedNumbers(
        {
          minNumber: 1,
          maxNumber: config.maxNumber,
          requiredCount: config.numbers,
          maxConsecutive: 2,
          minSum: Math.floor(config.maxNumber * config.numbers * 0.3),
          maxSum: Math.floor(config.maxNumber * config.numbers * 0.7),
        },
        historicalPatterns
      );

      // Validar números generados
      const validation = validateNumbers(numbers, {
        minNumber: 1,
        maxNumber: config.maxNumber,
        requiredCount: config.numbers,
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Analizar patrón de los números generados
      const newPattern = analyzePattern(numbers);
      setPattern(newPattern);
      setGeneratedNumbers(numbers);
      setValidationErrors([]);

      // Generar estrellas si es necesario
      if (config.stars) {
        const stars: number[] = [];
        while (stars.length < config.stars.count) {
          const star = Math.floor(Math.random() * config.stars.maxNumber) + 1;
          if (!stars.includes(star)) {
            stars.push(star);
          }
        }
        setGeneratedStars(stars.sort((a, b) => a - b));
      } else {
        setGeneratedStars([]);
      }

      // Generar número extra si es necesario
      if (config.extra) {
        const extra: number[] = [];
        while (extra.length < config.extra.count) {
          const extraNum = Math.floor(Math.random() * config.extra.maxNumber) + 1;
          if (!extra.includes(extraNum)) {
            extra.push(extraNum);
          }
        }
        setGeneratedExtra(extra);
      } else {
        setGeneratedExtra([]);
      }
    } catch (error) {
      console.error('Error generating numbers:', error);
      setValidationErrors(['Error al generar números. Por favor, intenta de nuevo.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-8 tracking-tight">
          Generador de Lotería
          <span className="block text-2xl mt-2 text-pink-300 font-normal">
            Encuentra tu suerte con análisis estadístico
          </span>
        </h1>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-8">
            <label className="block text-white text-sm font-medium mb-2">
              Selecciona tu lotería:
            </label>
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value as LotteryType)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white backdrop-blur-sm 
                       transition-all hover:bg-white/10 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              disabled={isLoading}
            >
              {Object.entries(LOTTERY_CONFIGS).map(([key, config]) => (
                <option key={key} value={key} className="bg-gray-900 text-white">
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={generateNumbers}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-xl
                       font-medium text-lg transition-all transform hover:scale-[1.02] hover:shadow-lg
                       active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                       focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generando...' : 'Generar Números'}
            </button>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              disabled={isLoading}
              className="bg-white/10 text-white py-4 px-6 rounded-xl font-medium transition-all
                       hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showAnalysis ? 'Ocultar Análisis' : 'Mostrar Análisis'}
            </button>
          </div>

          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <h3 className="text-red-200 font-medium mb-2">Errores de validación:</h3>
              <ul className="list-disc list-inside text-red-100">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {generatedNumbers.length > 0 && (
            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-medium text-white mb-4">
                  Números Principales:
                </h2>
                <div className="flex flex-wrap gap-4 justify-center">
                  {generatedNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                               flex items-center justify-center font-bold text-2xl text-white
                               shadow-lg transform transition-all hover:scale-110 hover:rotate-12"
                    >
                      {number}
                    </div>
                  ))}
                </div>
              </div>

              {generatedStars.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Estrellas:
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {generatedStars.map((star, index) => (
                      <div
                        key={index}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500
                                 flex items-center justify-center font-bold text-xl text-white
                                 shadow-lg transform transition-all hover:scale-110 hover:rotate-45"
                      >
                        {star}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedExtra.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-4">
                    {LOTTERY_CONFIGS[selectedLottery].extra?.name}:
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {generatedExtra.map((extra, index) => (
                      <div
                        key={index}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-red-500
                                 flex items-center justify-center font-bold text-xl text-white
                                 shadow-lg transform transition-all hover:scale-110 hover:-rotate-12"
                      >
                        {extra}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAnalysis && pattern && (
                <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xl font-medium text-white mb-4">
                    Análisis Estadístico:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-white/90">
                        Números pares: {pattern.evenCount} ({Math.round(pattern.evenCount/generatedNumbers.length*100)}%)
                      </p>
                      <p className="text-white/90">
                        Números impares: {pattern.oddCount} ({Math.round(pattern.oddCount/generatedNumbers.length*100)}%)
                      </p>
                      <p className="text-white/90">
                        Números primos: {pattern.primeCount} ({Math.round(pattern.primeCount/generatedNumbers.length*100)}%)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white/90">
                        Suma total: {pattern.sumRange}
                      </p>
                      <p className="text-white/90">
                        Números consecutivos: {pattern.consecutiveCount}
                      </p>
                      <p className="text-white/90">
                        Ratio alto/bajo: {Math.round(pattern.highLowRatio * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-white mb-3">
                      Números más frecuentes:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {frequencies.slice(0, 5).map((freq) => (
                        <div
                          key={freq.number}
                          className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white"
                        >
                          {freq.number} ({freq.frequency})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 