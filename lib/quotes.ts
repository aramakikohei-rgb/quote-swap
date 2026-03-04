import fs from 'fs';
import path from 'path';

export interface Quote {
  id: string;
  quote: string;
  author: string;
  bio: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  quoteJa: string;
  tags: string[];
  createdAt: string;
}

const BUNDLED_PATH = path.join(process.cwd(), 'data', 'quotes.json');
const TMP_PATH = '/tmp/quotes.json';

function getDataPath(): string {
  // On Vercel, the project directory is read-only.
  // Copy to /tmp on first access so writes succeed.
  if (!fs.existsSync(TMP_PATH)) {
    fs.copyFileSync(BUNDLED_PATH, TMP_PATH);
  }
  return TMP_PATH;
}

export function getAllQuotes(): Quote[] {
  const raw = fs.readFileSync(getDataPath(), 'utf-8');
  return JSON.parse(raw);
}

export function getRandomQuote(): Quote {
  const quotes = getAllQuotes();
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

export function getQuoteById(id: string): Quote | undefined {
  return getAllQuotes().find((q) => q.id === id);
}

export function addQuote(quote: Omit<Quote, 'id' | 'createdAt'>): Quote {
  const quotes = getAllQuotes();
  const newQuote: Quote = {
    ...quote,
    id: `q${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  quotes.push(newQuote);
  fs.writeFileSync(getDataPath(), JSON.stringify(quotes, null, 2));
  return newQuote;
}

export function updateQuote(id: string, data: Partial<Omit<Quote, 'id' | 'createdAt'>>): Quote | null {
  const quotes = getAllQuotes();
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) return null;
  quotes[index] = { ...quotes[index], ...data };
  fs.writeFileSync(getDataPath(), JSON.stringify(quotes, null, 2));
  return quotes[index];
}

export function deleteQuote(id: string): boolean {
  const quotes = getAllQuotes();
  const filtered = quotes.filter((q) => q.id !== id);
  if (filtered.length === quotes.length) return false;
  fs.writeFileSync(getDataPath(), JSON.stringify(filtered, null, 2));
  return true;
}
