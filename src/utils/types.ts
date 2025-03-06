export interface LotteryDraw {
  numbers: number[];
  extra?: number[];
  stars?: number[];
  date: string;
}

export interface LotteryHistoricalData {
  [key: string]: LotteryDraw[];
}

export interface NumberFrequency {
  number: number;
  frequency: number;
  lastDrawn?: string;
}

export interface NumberPattern {
  evenCount: number;
  oddCount: number;
  primeCount: number;
  sumRange: number;
  consecutiveCount: number;
  highLowRatio: number;
} 