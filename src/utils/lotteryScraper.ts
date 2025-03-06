import axios from 'axios';
import * as cheerio from 'cheerio';
import { LotteryDraw } from '../utils/types';

const LOTTERY_URLS = {
  primitiva: 'https://www.loteriasyapuestas.es/es/resultados/la-primitiva/',
  bonoloto: 'https://www.loteriasyapuestas.es/es/resultados/bonoloto/',
  euromillones: 'https://www.loteriasyapuestas.es/es/resultados/euromillones/',
  gordo: 'https://www.loteriasyapuestas.es/es/resultados/gordo-primitiva/',
  eurodreams: 'https://www.loteriasyapuestas.es/es/resultados/eurodreams/'
};

async function scrapeWebPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error;
  }
}

function parsePrimitivaResults(html: string): LotteryDraw[] {
  const $ = cheerio.load(html);
  const draws: LotteryDraw[] = [];

  $('.resultado-sorteo').each((_, element) => {
    try {
      const date = $(element).find('.fecha-sorteo').text().trim();
      const numbers: number[] = [];
      $(element).find('.numeros-combinacion .numero').each((_, num) => {
        numbers.push(parseInt($(num).text().trim(), 10));
      });
      const extra = [parseInt($(element).find('.complementario .numero').text().trim(), 10)];

      if (numbers.length === 6 && !numbers.some(isNaN)) {
        draws.push({ numbers, extra, date });
      }
    } catch (error) {
      console.error('Error parsing Primitiva result:', error);
    }
  });

  return draws;
}

function parseEuromillonesResults(html: string): LotteryDraw[] {
  const $ = cheerio.load(html);
  const draws: LotteryDraw[] = [];

  $('.resultado-sorteo').each((_, element) => {
    try {
      const date = $(element).find('.fecha-sorteo').text().trim();
      const numbers: number[] = [];
      const stars: number[] = [];

      $(element).find('.numeros-combinacion .numero').each((_, num) => {
        numbers.push(parseInt($(num).text().trim(), 10));
      });

      $(element).find('.estrellas .numero').each((_, star) => {
        stars.push(parseInt($(star).text().trim(), 10));
      });

      if (numbers.length === 5 && stars.length === 2 && 
          !numbers.some(isNaN) && !stars.some(isNaN)) {
        draws.push({ numbers, stars, date });
      }
    } catch (error) {
      console.error('Error parsing Euromillones result:', error);
    }
  });

  return draws;
}

export async function scrapeLotteryResults(lotteryType: keyof typeof LOTTERY_URLS): Promise<LotteryDraw[]> {
  try {
    const url = LOTTERY_URLS[lotteryType];
    const html = await scrapeWebPage(url);

    switch (lotteryType) {
      case 'primitiva':
      case 'bonoloto':
        return parsePrimitivaResults(html);
      case 'euromillones':
        return parseEuromillonesResults(html);
      case 'gordo':
        // Implementar parser específico para El Gordo
        return [];
      case 'eurodreams':
        // Implementar parser específico para EuroDreams
        return [];
      default:
        throw new Error(`Parser no implementado para ${lotteryType}`);
    }
  } catch (error) {
    console.error(`Error scraping ${lotteryType}:`, error);
    return [];
  }
}

// Función de utilidad para validar los resultados scrapeados
export function validateScrapedResults(draws: LotteryDraw[]): boolean {
  return draws.every(draw => {
    const hasValidDate = draw.date && draw.date.length > 0;
    const hasValidNumbers = draw.numbers && 
                          draw.numbers.length > 0 && 
                          !draw.numbers.some(isNaN);
    
    if (!hasValidDate || !hasValidNumbers) return false;

    if (draw.stars) {
      if (draw.stars.some(isNaN)) return false;
    }

    if (draw.extra) {
      if (draw.extra.some(isNaN)) return false;
    }

    return true;
  });
} 