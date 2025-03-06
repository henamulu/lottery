import { scrapeLotteryResults } from './lotteryScraper';
import { LotteryDraw, LotteryHistoricalData, NumberFrequency, NumberPattern } from './types';

let cachedHistoricalData: LotteryHistoricalData | null = null;

export async function getHistoricalData(): Promise<LotteryHistoricalData> {
  if (cachedHistoricalData) {
    return cachedHistoricalData;
  }

  cachedHistoricalData = {};
  
  // Lista de tipos de lotería a scrapear
  const lotteryTypes = ['primitiva', 'bonoloto', 'euromillones', 'gordo', 'eurodreams'] as const;
  
  // Realizar scraping para cada tipo de lotería
  await Promise.all(
    lotteryTypes.map(async (lotteryType) => {
      try {
        const results = await scrapeLotteryResults(lotteryType);
        if (results.length > 0) {
          cachedHistoricalData![lotteryType] = results;
        } else {
          // Usar datos de respaldo si el scraping falla
          cachedHistoricalData![lotteryType] = getFallbackData(lotteryType);
        }
      } catch (error) {
        console.error(`Error getting data for ${lotteryType}:`, error);
        cachedHistoricalData![lotteryType] = getFallbackData(lotteryType);
      }
    })
  );

  return cachedHistoricalData;
}

// Datos de respaldo en caso de que falle el scraping
function getFallbackData(lotteryType: string): LotteryDraw[] {
  const fallbackData: LotteryHistoricalData = {
    primitiva: [
      { numbers: [2, 3, 11, 13, 20, 48], extra: [4], date: '2024-02-24' },
      { numbers: [2, 11, 20, 27, 37, 44], extra: [3], date: '2024-02-22' },
    ],
    bonoloto: [
      { numbers: [6, 11, 15, 25, 35, 49], date: '2024-02-26' },
      { numbers: [1, 6, 11, 23, 41, 45], date: '2024-02-24' },
    ],
    euromillones: [
      { numbers: [4, 6, 20, 24, 25], stars: [5, 9], date: '2024-02-23' },
      { numbers: [8, 19, 32, 41, 42], stars: [9, 11], date: '2024-02-20' },
    ],
    gordo: [
      { numbers: [2, 11, 26, 27, 53], extra: [7], date: '2024-02-25' },
      { numbers: [5, 7, 14, 26, 27], extra: [1], date: '2024-02-18' },
    ],
    eurodreams: [
      { numbers: [3, 12, 16, 24, 31, 36], extra: [2], date: '2024-02-26' },
      { numbers: [2, 7, 11, 19, 29, 35], extra: [5], date: '2024-02-22' },
    ],
  };

  return fallbackData[lotteryType] || [];
}

export async function calculateNumberFrequencies(
  lotteryType: string,
  maxNumber: number
): Promise<NumberFrequency[]> {
  const frequencies: Map<number, { count: number; lastDrawn?: string }> = new Map();
  
  // Inicializar frecuencias
  for (let i = 1; i <= maxNumber; i++) {
    frequencies.set(i, { count: 0 });
  }

  // Obtener datos históricos
  const historicalData = await getHistoricalData();
  const lotteryData = historicalData[lotteryType] || [];

  // Contar frecuencias de los datos históricos
  lotteryData.forEach((draw: LotteryDraw) => {
    draw.numbers.forEach((num: number) => {
      const current = frequencies.get(num);
      if (current) {
        frequencies.set(num, {
          count: current.count + 1,
          lastDrawn: draw.date
        });
      }
    });
  });

  // Convertir a array y ordenar por frecuencia
  return Array.from(frequencies.entries())
    .map(([number, data]) => ({
      number,
      frequency: data.count,
      lastDrawn: data.lastDrawn
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

export function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

export function analyzePattern(numbers: number[]): NumberPattern {
  const evenCount = numbers.filter(n => n % 2 === 0).length;
  const primeCount = numbers.filter(isPrime).length;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  
  let consecutiveCount = 0;
  numbers.sort((a, b) => a - b).forEach((num, i) => {
    if (i > 0 && num === numbers[i - 1] + 1) consecutiveCount++;
  });

  const median = numbers.length > 0 ? numbers[Math.floor(numbers.length / 2)] : 0;
  const highCount = numbers.filter(n => n > median).length;

  return {
    evenCount,
    oddCount: numbers.length - evenCount,
    primeCount,
    sumRange: sum,
    consecutiveCount,
    highLowRatio: highCount / numbers.length
  };
}

export function validateNumbers(
  numbers: number[],
  config: {
    minNumber: number;
    maxNumber: number;
    requiredCount: number;
    maxConsecutive?: number;
    minSum?: number;
    maxSum?: number;
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar rango
  const outOfRange = numbers.some(
    n => n < config.minNumber || n > config.maxNumber
  );
  if (outOfRange) {
    errors.push(`Los números deben estar entre ${config.minNumber} y ${config.maxNumber}`);
  }

  // Validar duplicados
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    errors.push('No se permiten números duplicados');
  }

  // Validar cantidad
  if (numbers.length !== config.requiredCount) {
    errors.push(`Se requieren exactamente ${config.requiredCount} números`);
  }

  // Validar números consecutivos
  if (config.maxConsecutive) {
    let maxConsecutiveFound = 0;
    let currentConsecutive = 1;
    
    numbers.sort((a, b) => a - b).forEach((num, i) => {
      if (i > 0) {
        if (num === numbers[i - 1] + 1) {
          currentConsecutive++;
        } else {
          maxConsecutiveFound = Math.max(maxConsecutiveFound, currentConsecutive);
          currentConsecutive = 1;
        }
      }
    });
    
    if (maxConsecutiveFound > config.maxConsecutive) {
      errors.push(`Demasiados números consecutivos (máximo ${config.maxConsecutive})`);
    }
  }

  // Validar suma
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  if (config.minSum && sum < config.minSum) {
    errors.push(`La suma total debe ser al menos ${config.minSum}`);
  }
  if (config.maxSum && sum > config.maxSum) {
    errors.push(`La suma total no debe exceder ${config.maxSum}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generateOptimizedNumbers(
  config: {
    minNumber: number;
    maxNumber: number;
    requiredCount: number;
    maxConsecutive?: number;
    minSum?: number;
    maxSum?: number;
  },
  historicalPatterns: NumberPattern[]
): number[] {
  const numbers: number[] = [];
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Generar números
    const candidateNumbers: number[] = [];
    while (candidateNumbers.length < config.requiredCount) {
      const num = Math.floor(Math.random() * (config.maxNumber - config.minNumber + 1)) + config.minNumber;
      if (!candidateNumbers.includes(num)) {
        candidateNumbers.push(num);
      }
    }

    // Validar números
    const validation = validateNumbers(candidateNumbers, config);
    if (validation.isValid) {
      // Analizar patrón
      const pattern = analyzePattern(candidateNumbers);
      
      // Verificar si el patrón es similar a los patrones históricos exitosos
      const isPatternGood = historicalPatterns.some(historicalPattern => (
        Math.abs(pattern.evenCount - historicalPattern.evenCount) <= 1 &&
        Math.abs(pattern.primeCount - historicalPattern.primeCount) <= 1 &&
        Math.abs(pattern.highLowRatio - historicalPattern.highLowRatio) <= 0.2
      ));

      if (isPatternGood) {
        return candidateNumbers.sort((a, b) => a - b);
      }
    }
    
    attempts++;
  }

  // Si no se encuentra una combinación óptima, devolver la última generada
  return numbers.sort((a, b) => a - b);
} 