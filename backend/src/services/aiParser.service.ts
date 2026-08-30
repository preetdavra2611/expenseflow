import { config } from '../config';
import { ParsedTransaction, ParseResult, PaymentMethod, TransactionType } from '../types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Categories mapping dictionary with synonyms & Hinglish keywords
const CATEGORY_KEYWORDS: Record<string, { category: string; type: TransactionType; defaultMerchant?: string }> = {
  // Food & Dining
  food: { category: 'Food', type: 'EXPENSE' },
  dinner: { category: 'Food', type: 'EXPENSE' },
  lunch: { category: 'Food', type: 'EXPENSE' },
  breakfast: { category: 'Food', type: 'EXPENSE' },
  chai: { category: 'Food', type: 'EXPENSE' },
  tea: { category: 'Food', type: 'EXPENSE' },
  coffee: { category: 'Food', type: 'EXPENSE' },
  pizza: { category: 'Food', type: 'EXPENSE' },
  burger: { category: 'Food', type: 'EXPENSE' },
  snack: { category: 'Food', type: 'EXPENSE' },
  snacks: { category: 'Food', type: 'EXPENSE' },
  swiggy: { category: 'Food', type: 'EXPENSE', defaultMerchant: 'Swiggy' },
  zomato: { category: 'Food', type: 'EXPENSE', defaultMerchant: 'Zomato' },
  dominos: { category: 'Food', type: 'EXPENSE', defaultMerchant: "Domino's" },
  mcdonalds: { category: 'Food', type: 'EXPENSE', defaultMerchant: "McDonald's" },
  restaurant: { category: 'Food', type: 'EXPENSE' },
  cafe: { category: 'Food', type: 'EXPENSE' },
  dhaba: { category: 'Food', type: 'EXPENSE' },
  biryani: { category: 'Food', type: 'EXPENSE' },
  nashta: { category: 'Food', type: 'EXPENSE' },
  khana: { category: 'Food', type: 'EXPENSE' },

  // Groceries
  grocery: { category: 'Groceries', type: 'EXPENSE' },
  groceries: { category: 'Groceries', type: 'EXPENSE' },
  dmart: { category: 'Groceries', type: 'EXPENSE', defaultMerchant: 'DMart' },
  blinkit: { category: 'Groceries', type: 'EXPENSE', defaultMerchant: 'Blinkit' },
  zepto: { category: 'Groceries', type: 'EXPENSE', defaultMerchant: 'Zepto' },
  instamart: { category: 'Groceries', type: 'EXPENSE', defaultMerchant: 'Instamart' },
  bigbasket: { category: 'Groceries', type: 'EXPENSE', defaultMerchant: 'BigBasket' },
  kirana: { category: 'Groceries', type: 'EXPENSE' },
  sabzi: { category: 'Groceries', type: 'EXPENSE' },
  vegetables: { category: 'Groceries', type: 'EXPENSE' },
  fruits: { category: 'Groceries', type: 'EXPENSE' },
  doodh: { category: 'Groceries', type: 'EXPENSE' },
  milk: { category: 'Groceries', type: 'EXPENSE' },
  ration: { category: 'Groceries', type: 'EXPENSE' },

  // Transport
  transport: { category: 'Transport', type: 'EXPENSE' },
  uber: { category: 'Transport', type: 'EXPENSE', defaultMerchant: 'Uber' },
  ola: { category: 'Transport', type: 'EXPENSE', defaultMerchant: 'Ola' },
  rapido: { category: 'Transport', type: 'EXPENSE', defaultMerchant: 'Rapido' },
  auto: { category: 'Transport', type: 'EXPENSE' },
  cab: { category: 'Transport', type: 'EXPENSE' },
  taxi: { category: 'Transport', type: 'EXPENSE' },
  bus: { category: 'Transport', type: 'EXPENSE' },
  metro: { category: 'Transport', type: 'EXPENSE' },
  train: { category: 'Transport', type: 'EXPENSE' },
  rickshaw: { category: 'Transport', type: 'EXPENSE' },
  toll: { category: 'Transport', type: 'EXPENSE' },
  parking: { category: 'Transport', type: 'EXPENSE' },

  // Fuel
  petrol: { category: 'Fuel', type: 'EXPENSE' },
  diesel: { category: 'Fuel', type: 'EXPENSE' },
  cng: { category: 'Fuel', type: 'EXPENSE' },
  gas: { category: 'Fuel', type: 'EXPENSE' },
  fuel: { category: 'Fuel', type: 'EXPENSE' },

  // Shopping
  shopping: { category: 'Shopping', type: 'EXPENSE' },
  clothes: { category: 'Shopping', type: 'EXPENSE' },
  clothing: { category: 'Shopping', type: 'EXPENSE' },
  shoes: { category: 'Shopping', type: 'EXPENSE' },
  shirt: { category: 'Shopping', type: 'EXPENSE' },
  jeans: { category: 'Shopping', type: 'EXPENSE' },
  dress: { category: 'Shopping', type: 'EXPENSE' },
  amazon: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'Amazon' },
  flipkart: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'Flipkart' },
  myntra: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'Myntra' },
  ajio: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'Ajio' },
  zara: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'Zara' },
  h_m: { category: 'Shopping', type: 'EXPENSE', defaultMerchant: 'H&M' },
  electronics: { category: 'Shopping', type: 'EXPENSE' },

  // Entertainment
  movie: { category: 'Entertainment', type: 'EXPENSE' },
  cinema: { category: 'Entertainment', type: 'EXPENSE' },
  theatre: { category: 'Entertainment', type: 'EXPENSE' },
  bookmyshow: { category: 'Entertainment', type: 'EXPENSE', defaultMerchant: 'BookMyShow' },
  pvr: { category: 'Entertainment', type: 'EXPENSE', defaultMerchant: 'PVR' },
  inox: { category: 'Entertainment', type: 'EXPENSE', defaultMerchant: 'INOX' },
  game: { category: 'Entertainment', type: 'EXPENSE' },
  gaming: { category: 'Entertainment', type: 'EXPENSE' },
  party: { category: 'Entertainment', type: 'EXPENSE' },
  club: { category: 'Entertainment', type: 'EXPENSE' },
  outing: { category: 'Entertainment', type: 'EXPENSE' },

  // Bills & Utilities
  electricity: { category: 'Bills & Utilities', type: 'EXPENSE' },
  bijli: { category: 'Bills & Utilities', type: 'EXPENSE' },
  water: { category: 'Bills & Utilities', type: 'EXPENSE' },
  pani: { category: 'Bills & Utilities', type: 'EXPENSE' },
  wifi: { category: 'Bills & Utilities', type: 'EXPENSE' },
  broadband: { category: 'Bills & Utilities', type: 'EXPENSE' },
  internet: { category: 'Bills & Utilities', type: 'EXPENSE' },
  recharge: { category: 'Bills & Utilities', type: 'EXPENSE' },
  mobile: { category: 'Bills & Utilities', type: 'EXPENSE' },
  cylinder: { category: 'Bills & Utilities', type: 'EXPENSE' },
  lpg: { category: 'Bills & Utilities', type: 'EXPENSE' },
  bill: { category: 'Bills & Utilities', type: 'EXPENSE' },
  bills: { category: 'Bills & Utilities', type: 'EXPENSE' },

  // Rent
  rent: { category: 'Rent', type: 'EXPENSE' },
  kiraya: { category: 'Rent', type: 'EXPENSE' },
  maintenance: { category: 'Rent', type: 'EXPENSE' },
  pg: { category: 'Rent', type: 'EXPENSE' },
  hostel: { category: 'Rent', type: 'EXPENSE' },

  // Education
  fee: { category: 'Education', type: 'EXPENSE' },
  fees: { category: 'Education', type: 'EXPENSE' },
  tuition: { category: 'Education', type: 'EXPENSE' },
  college: { category: 'Education', type: 'EXPENSE' },
  school: { category: 'Education', type: 'EXPENSE' },
  book: { category: 'Education', type: 'EXPENSE' },
  books: { category: 'Education', type: 'EXPENSE' },
  course: { category: 'Education', type: 'EXPENSE' },
  udemy: { category: 'Education', type: 'EXPENSE', defaultMerchant: 'Udemy' },
  coursera: { category: 'Education', type: 'EXPENSE', defaultMerchant: 'Coursera' },

  // Healthcare
  medicine: { category: 'Healthcare', type: 'EXPENSE' },
  medicines: { category: 'Healthcare', type: 'EXPENSE' },
  doctor: { category: 'Healthcare', type: 'EXPENSE' },
  hospital: { category: 'Healthcare', type: 'EXPENSE' },
  clinic: { category: 'Healthcare', type: 'EXPENSE' },
  pharmacy: { category: 'Healthcare', type: 'EXPENSE' },
  apollo: { category: 'Healthcare', type: 'EXPENSE', defaultMerchant: 'Apollo' },
  pharmeasy: { category: 'Healthcare', type: 'EXPENSE', defaultMerchant: 'PharmEasy' },
  dental: { category: 'Healthcare', type: 'EXPENSE' },
  gym: { category: 'Healthcare', type: 'EXPENSE' },
  fitness: { category: 'Healthcare', type: 'EXPENSE' },

  // Travel
  flight: { category: 'Travel', type: 'EXPENSE' },
  hotel: { category: 'Travel', type: 'EXPENSE' },
  trip: { category: 'Travel', type: 'EXPENSE' },
  makemytrip: { category: 'Travel', type: 'EXPENSE', defaultMerchant: 'MakeMyTrip' },
  goibibo: { category: 'Travel', type: 'EXPENSE', defaultMerchant: 'Goibibo' },
  irctc: { category: 'Travel', type: 'EXPENSE', defaultMerchant: 'IRCTC' },
  vacation: { category: 'Travel', type: 'EXPENSE' },

  // Subscriptions
  netflix: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'Netflix' },
  spotify: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'Spotify' },
  prime: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'Amazon Prime' },
  youtube: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'YouTube' },
  hotstar: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'Disney+ Hotstar' },
  apple: { category: 'Subscriptions', type: 'EXPENSE', defaultMerchant: 'Apple' },
  subscription: { category: 'Subscriptions', type: 'EXPENSE' },

  // Personal Care
  salon: { category: 'Personal Care', type: 'EXPENSE' },
  haircut: { category: 'Personal Care', type: 'EXPENSE' },
  spa: { category: 'Personal Care', type: 'EXPENSE' },
  makeup: { category: 'Personal Care', type: 'EXPENSE' },
  skincare: { category: 'Personal Care', type: 'EXPENSE' },

  // Gifts
  gift: { category: 'Gifts', type: 'EXPENSE' },
  gifts: { category: 'Gifts', type: 'EXPENSE' },
  present: { category: 'Gifts', type: 'EXPENSE' },
  donation: { category: 'Gifts', type: 'EXPENSE' },

  // Income categories
  salary: { category: 'Salary', type: 'INCOME' },
  stipend: { category: 'Salary', type: 'INCOME' },
  freelance: { category: 'Freelance', type: 'INCOME' },
  client: { category: 'Freelance', type: 'INCOME' },
  upwork: { category: 'Freelance', type: 'INCOME' },
  fiverr: { category: 'Freelance', type: 'INCOME' },
  project: { category: 'Freelance', type: 'INCOME' },
  business: { category: 'Business', type: 'INCOME' },
  sales: { category: 'Business', type: 'INCOME' },
  profit: { category: 'Business', type: 'INCOME' },
  refund: { category: 'Refund', type: 'INCOME' },
  cashback: { category: 'Refund', type: 'INCOME' },
  reimbursement: { category: 'Refund', type: 'INCOME' },
};

export class AIParserService {
  private openai: OpenAI | null = null;
  private geminiAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.ai.geminiApiKey) {
      this.geminiAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }
    if (config.ai.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
  }

  /**
   * Main entry point: Parses text using Gemini / OpenAI if available, falling back to local NLP engine
   */
  async parseMessage(message: string, userTimezone: string = 'Asia/Kolkata'): Promise<ParseResult> {
    const trimmed = message.trim();
    if (!trimmed) {
      return { status: 'FAILED', error: 'Empty message' };
    }

    // Try Google Gemini AI parser if API key is provided
    if (this.geminiAI) {
      try {
        const geminiResult = await this.parseWithGemini(trimmed, userTimezone);
        if (geminiResult.status === 'SUCCESS' && geminiResult.transactions.length > 0) {
          return geminiResult;
        }
        if (geminiResult.status === 'CLARIFICATION') {
          return geminiResult;
        }
      } catch (err) {
        console.warn('Gemini AI parser notice, falling back to local NLP parser:', err);
      }
    }

    // Try OpenAI parser if API key is provided
    if (this.openai) {
      try {
        const aiResult = await this.parseWithOpenAI(trimmed, userTimezone);
        if (aiResult.status === 'SUCCESS' && aiResult.transactions.length > 0) {
          return aiResult;
        }
      } catch (err) {
        console.warn('OpenAI parser failed or threw, falling back to Rule NLP parser:', err);
      }
    }

    // Fallback to our robust local rule & regex NLP engine
    return this.parseWithLocalNLP(trimmed, userTimezone);
  }

  /**
   * Tier 1A: Google Gemini AI Structured JSON Parser (Free Tier Supported)
   */
  private async parseWithGemini(text: string, userTimezone: string): Promise<ParseResult> {
    if (!this.geminiAI) return { status: 'FAILED', error: 'Gemini client not initialized' };

    const todayStr = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert financial transaction parser for a Telegram Expense Tracker bot.
Current Date: ${todayStr}, User Timezone: ${userTimezone}.
User input: "${text}"

Your task is to analyze user natural language messages (in English, Indian-English, Hinglish) and extract structured transaction data.

Categories for EXPENSE: Food, Groceries, Transport, Fuel, Shopping, Entertainment, Bills & Utilities, Rent, Education, Healthcare, Travel, Subscriptions, Personal Care, Gifts, Other.
Categories for INCOME: Salary, Freelance, Business, Gift, Refund, Other.

Payment Methods: CASH, UPI, CARD, NET_BANKING, WALLET, OTHER.

Rules:
1. Support multi-transaction sentences (e.g. "spent 200 on breakfast and 150 on bus").
2. For dates, resolve relative terms like "today", "yesterday", "kal", "2 days ago" into exact YYYY-MM-DD strings.
3. If an expense amount is clear but the category/purpose is ambiguous (e.g. "spent 500" or "paid 200" with no context), return clarification needed.
4. Output must strictly be valid JSON matching this schema:
{
  "status": "SUCCESS" | "CLARIFICATION",
  "transactions": [
    {
      "type": "EXPENSE" | "INCOME",
      "amount": number,
      "currency": "INR",
      "category": string,
      "description": string,
      "merchant": string | null,
      "paymentMethod": "CASH" | "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "OTHER",
      "date": "YYYY-MM-DD",
      "notes": string | null
    }
  ],
  "clarification": {
    "question": string,
    "options": string[]
  }
}`;

    const model = this.geminiAI.getGenerativeModel({
      model: config.ai.geminiModel || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    if (!content) {
      return { status: 'FAILED', error: 'No response from Gemini AI' };
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed.status === 'CLARIFICATION' && parsed.clarification) {
        return {
          status: 'CLARIFICATION',
          clarification: {
            type: 'CLARIFICATION_REQUIRED',
            rawMessage: text,
            question: parsed.clarification.question || 'Could you specify what this transaction was for?',
            options: parsed.clarification.options || ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Other'],
          },
        };
      }

      if (parsed.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        return {
          status: 'SUCCESS',
          transactions: parsed.transactions.map((t: any) => ({
            type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            amount: Number(t.amount),
            currency: t.currency || 'INR',
            category: t.category || (t.type === 'INCOME' ? 'Other' : 'Other'),
            description: t.description || (t.type === 'INCOME' ? 'Income' : 'Expense'),
            merchant: t.merchant || null,
            paymentMethod: this.normalizePaymentMethod(t.paymentMethod || 'CASH'),
            date: t.date || todayStr,
            notes: t.notes || null,
          })),
        };
      }
    } catch (e) {
      console.error('Failed to parse Gemini AI JSON:', e);
    }

    return { status: 'FAILED', error: 'Invalid Gemini AI response structure' };
  }

  /**
   * Tier 1B: OpenAI Structured JSON Parser
   */
  private async parseWithOpenAI(text: string, userTimezone: string): Promise<ParseResult> {
    if (!this.openai) return { status: 'FAILED', error: 'OpenAI client not initialized' };

    const todayStr = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are an expert financial transaction parser for a Telegram Expense Tracker bot.
Current Date: ${todayStr}, User Timezone: ${userTimezone}.
Your task is to analyze user natural language messages (in English, Indian-English, Hinglish) and extract structured transaction data.

Categories for EXPENSE: Food, Groceries, Transport, Fuel, Shopping, Entertainment, Bills & Utilities, Rent, Education, Healthcare, Travel, Subscriptions, Personal Care, Gifts, Other.
Categories for INCOME: Salary, Freelance, Business, Gift, Refund, Other.

Payment Methods: CASH, UPI, CARD, NET_BANKING, WALLET, OTHER.

Rules:
1. Support multi-transaction sentences (e.g. "spent 200 on breakfast and 150 on bus").
2. For dates, resolve relative terms like "today", "yesterday", "kal", "2 days ago" into exact YYYY-MM-DD strings.
3. If an expense amount is clear but the category/purpose is ambiguous (e.g. "spent 500" or "paid 200" with no context), return clarification needed.
4. Output must strictly be valid JSON matching the following schema:
{
  "status": "SUCCESS" | "CLARIFICATION",
  "transactions": [
    {
      "type": "EXPENSE" | "INCOME",
      "amount": number,
      "currency": "INR",
      "category": string,
      "description": string,
      "merchant": string | null,
      "paymentMethod": "CASH" | "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "OTHER",
      "date": "YYYY-MM-DD",
      "notes": string | null
    }
  ],
  "clarification": {
    "question": string,
    "options": string[]
  }
}`;

    const response = await this.openai.chat.completions.create({
      model: config.ai.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { status: 'FAILED', error: 'No response from AI model' };
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed.status === 'CLARIFICATION' && parsed.clarification) {
        return {
          status: 'CLARIFICATION',
          clarification: {
            type: 'CLARIFICATION_REQUIRED',
            rawMessage: text,
            question: parsed.clarification.question || "Could you specify what this transaction was for?",
            options: parsed.clarification.options || ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Other'],
          },
        };
      }

      if (parsed.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
        return {
          status: 'SUCCESS',
          transactions: parsed.transactions.map((t: any) => ({
            type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            amount: Number(t.amount),
            currency: t.currency || 'INR',
            category: t.category || (t.type === 'INCOME' ? 'Other' : 'Other'),
            description: t.description || (t.type === 'INCOME' ? 'Income' : 'Expense'),
            merchant: t.merchant || null,
            paymentMethod: this.normalizePaymentMethod(t.paymentMethod || 'CASH'),
            date: t.date || todayStr,
            notes: t.notes || null,
          })),
        };
      }
    } catch (e) {
      console.error('Failed to parse AI JSON:', e);
    }

    return { status: 'FAILED', error: 'Invalid AI response structure' };
  }

  /**
   * Tier 2: Ultra-Robust Local Rule, Regex & Hinglish NLP Engine
   */
  public parseWithLocalNLP(text: string, _userTimezone: string = 'Asia/Kolkata'): ParseResult {
    // Step 1: Check if message contains multiple sub-transactions
    const subClauses = this.splitMultiTransactions(text);

    const parsedTransactions: ParsedTransaction[] = [];
    const globalDate = this.extractDate(text);
    const globalPaymentMethod = this.extractPaymentMethod(text);

    for (const clause of subClauses) {
      const singleRes = this.parseSingleClause(clause, globalDate, globalPaymentMethod);
      if (singleRes.status === 'CLARIFICATION') {
        // If single transaction is ambiguous and no other transactions
        if (subClauses.length === 1) {
          return singleRes;
        }
      } else if (singleRes.status === 'SUCCESS') {
        parsedTransactions.push(...singleRes.transactions);
      }
    }

    if (parsedTransactions.length > 0) {
      return {
        status: 'SUCCESS',
        transactions: parsedTransactions,
      };
    }

    // Check if amount is present at least
    const fallbackAmount = this.extractAmount(text);
    if (fallbackAmount !== null) {
      return {
        status: 'CLARIFICATION',
        clarification: {
          type: 'CLARIFICATION_REQUIRED',
          rawMessage: text,
          extractedAmount: fallbackAmount,
          extractedCurrency: 'INR',
          extractedType: 'EXPENSE',
          question: `I understood ₹${fallbackAmount} as an expense, but I'm not sure about the category. Is this Food, Transport, Shopping, or something else?`,
          options: ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Other'],
        },
      };
    }

    return {
      status: 'FAILED',
      error: "Couldn't extract amount or details from message. Try: 'Spent 250 on dinner' or '₹500 petrol'",
    };
  }

  /**
   * Splits multi-transaction sentences (e.g., "spent 200 on breakfast and 150 on bus")
   */
  private splitMultiTransactions(text: string): string[] {
    // Check if text has multiple amounts
    const amountMatches = text.match(/(?:₹|rs\.?|inr|\$)?\s*\b\d+(?:,\d{3})*(?:\.\d{1,2})?\b/gi);
    if (!amountMatches || amountMatches.length <= 1) {
      return [text];
    }

    // Split by common delimiters like "and", "&", "also", "aur", "+", commas when followed by an amount
    const splitRegex = /(?:\band\b|\b&\b|\balso\b|\baur\b|\+|\bthen\b|,)(?=\s*(?:(?:i\s+spent|spent|paid|₹|rs\.?|\d+)))/i;
    const parts = text.split(splitRegex).map((p) => p.trim()).filter((p) => p.length > 0);

    if (parts.length > 1) {
      return parts;
    }

    // Secondary split check: "200 on food, 150 on bus"
    const commaParts = text.split(/,\s*(?=\d|₹|rs)/i).map((p) => p.trim()).filter((p) => p.length > 0);
    if (commaParts.length > 1) {
      return commaParts;
    }

    return [text];
  }

  /**
   * Parses a single transaction clause
   */
  private parseSingleClause(clause: string, defaultDate: string, defaultPaymentMethod: PaymentMethod): ParseResult {
    const amount = this.extractAmount(clause);
    if (amount === null) {
      return { status: 'FAILED', error: 'No amount found in clause' };
    }

    const currency = this.extractCurrency(clause);
    const date = this.extractDate(clause) || defaultDate;
    const paymentMethod = this.extractPaymentMethod(clause) || defaultPaymentMethod;
    const type = this.detectTransactionType(clause);
    const { category, merchant, description } = this.detectCategoryAndDetails(clause, type);

    // If category is generic "Other" and description is vague, ask for clarification
    const isAmbiguous =
      category === 'Other' &&
      !clause.toLowerCase().includes('other') &&
      !clause.toLowerCase().includes('miscellaneous') &&
      clause.replace(/[0-9.,₹$rs]/gi, '').trim().length < 3;

    if (isAmbiguous) {
      return {
        status: 'CLARIFICATION',
        clarification: {
          type: 'CLARIFICATION_REQUIRED',
          rawMessage: clause,
          extractedAmount: amount,
          extractedCurrency: currency,
          extractedType: type,
          question: `I understood ${currency === 'INR' ? '₹' : currency} ${amount} as an ${type.toLowerCase()}, but I'm not sure about the category. Is this Food, Transport, Shopping, or something else?`,
          options: ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Groceries', 'Other'],
        },
      };
    }

    return {
      status: 'SUCCESS',
      transactions: [
        {
          type,
          amount,
          currency,
          category,
          description: description || (type === 'INCOME' ? 'Income' : 'Expense'),
          merchant: merchant || null,
          paymentMethod,
          date,
          notes: null,
        },
      ],
    };
  }

  /**
   * Amount extraction with support for ₹, Rs, INR, USD, commas, decimals
   */
  private extractAmount(text: string): number | null {
    // Check patterns like ₹500, Rs. 500, 500/-, 500 rs, 500
    const patterns = [
      /(?:₹|rs\.?|inr|\$)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|\$|\/-|rupees|bucks)/i,
      /\b(?:spent|paid|gave|got|received|received|cost|costing|amount)\s+(\d+(?:,\d{3})*(?:\.\d{1,2})?)\b/i,
      /\b(\d+(?:,\d{3})*(?:\.\d{1,2})?)\b/,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const numStr = match[1].replace(/,/g, '');
        const val = parseFloat(numStr);
        if (!isNaN(val) && val > 0) {
          return val;
        }
      }
    }

    return null;
  }

  /**
   * Currency extraction (defaults to INR)
   */
  private extractCurrency(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('$') || lower.includes('usd') || lower.includes('dollar')) return 'USD';
    if (lower.includes('€') || lower.includes('eur') || lower.includes('euro')) return 'EUR';
    if (lower.includes('£') || lower.includes('gbp') || lower.includes('pound')) return 'GBP';
    return 'INR';
  }

  /**
   * Payment method extraction
   */
  private extractPaymentMethod(text: string): PaymentMethod {
    const lower = text.toLowerCase();
    if (lower.includes('upi') || lower.includes('gpay') || lower.includes('google pay') || lower.includes('phonepe') || lower.includes('paytm')) {
      return 'UPI';
    }
    if (lower.includes('credit card') || lower.includes('debit card') || lower.includes('card')) {
      return 'CARD';
    }
    if (lower.includes('net banking') || lower.includes('netbanking') || lower.includes('bank transfer') || lower.includes('neft') || lower.includes('imps')) {
      return 'NET_BANKING';
    }
    if (lower.includes('wallet') || lower.includes('amazon pay') || lower.includes('cred')) {
      return 'WALLET';
    }
    if (lower.includes('cash') || lower.includes('roked')) {
      return 'CASH';
    }
    return 'CASH';
  }

  /**
   * Date extraction: relative ("yesterday", "today", "kal", "2 days ago") or absolute
   */
  private extractDate(text: string): string {
    const lower = text.toLowerCase();
    const now = new Date();

    if (lower.includes('yesterday') || lower.includes('kal') && (lower.includes('spent') || lower.includes('paid') || lower.includes('yesterday'))) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    const daysAgoMatch = lower.match(/(\d+)\s+days?\s+ago/);
    if (daysAgoMatch && daysAgoMatch[1]) {
      const days = parseInt(daysAgoMatch[1], 10);
      const target = new Date(now);
      target.setDate(now.getDate() - days);
      return target.toISOString().split('T')[0];
    }

    // Check for explicit YYYY-MM-DD or DD/MM/YYYY
    const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (isoMatch) return isoMatch[0];

    const ddmmyyyy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }

    return now.toISOString().split('T')[0];
  }

  /**
   * Detects transaction type (EXPENSE vs INCOME)
   */
  private detectTransactionType(text: string): TransactionType {
    const lower = text.toLowerCase();
    const incomeKeywords = [
      'salary',
      'got salary',
      'received',
      'received from',
      'gave me',
      'given by',
      'mom gave',
      'dad gave',
      'refund',
      'cashback',
      'freelance',
      'stipend',
      'credited',
      'earned',
      'income',
      'bonus',
      'dividend',
      'interest',
    ];

    for (const kw of incomeKeywords) {
      if (lower.includes(kw)) {
        return 'INCOME';
      }
    }

    return 'EXPENSE';
  }

  /**
   * Category, Merchant, and Description detection
   */
  private detectCategoryAndDetails(
    text: string,
    type: TransactionType
  ): { category: string; merchant: string | null; description: string } {
    const lower = text.toLowerCase();

    // Check specific merchants first
    const merchantMap: Record<string, { merchant: string; category: string }> = {
      dominos: { merchant: "Domino's", category: 'Food' },
      "domino's": { merchant: "Domino's", category: 'Food' },
      mcdonalds: { merchant: "McDonald's", category: 'Food' },
      "mcdonald's": { merchant: "McDonald's", category: 'Food' },
      starbucks: { merchant: 'Starbucks', category: 'Food' },
      kfc: { merchant: 'KFC', category: 'Food' },
      burgerking: { merchant: 'Burger King', category: 'Food' },
      dmart: { merchant: 'DMart', category: 'Groceries' },
      blinkit: { merchant: 'Blinkit', category: 'Groceries' },
      zepto: { merchant: 'Zepto', category: 'Groceries' },
      instamart: { merchant: 'Instamart', category: 'Groceries' },
      bigbasket: { merchant: 'BigBasket', category: 'Groceries' },
      uber: { merchant: 'Uber', category: 'Transport' },
      ola: { merchant: 'Ola', category: 'Transport' },
      rapido: { merchant: 'Rapido', category: 'Transport' },
      amazon: { merchant: 'Amazon', category: 'Shopping' },
      flipkart: { merchant: 'Flipkart', category: 'Shopping' },
      myntra: { merchant: 'Myntra', category: 'Shopping' },
      ajio: { merchant: 'Ajio', category: 'Shopping' },
      zara: { merchant: 'Zara', category: 'Shopping' },
      netflix: { merchant: 'Netflix', category: 'Subscriptions' },
      spotify: { merchant: 'Spotify', category: 'Subscriptions' },
      hotstar: { merchant: 'Disney+ Hotstar', category: 'Subscriptions' },
      prime: { merchant: 'Amazon Prime', category: 'Subscriptions' },
      apollo: { merchant: 'Apollo Pharmacy', category: 'Healthcare' },
      pharmeasy: { merchant: 'PharmEasy', category: 'Healthcare' },
      bookmyshow: { merchant: 'BookMyShow', category: 'Entertainment' },
      pvr: { merchant: 'PVR', category: 'Entertainment' },
      inox: { merchant: 'INOX', category: 'Entertainment' },
      shell: { merchant: 'Shell', category: 'Fuel' },
      hp: { merchant: 'HP Petrol', category: 'Fuel' },
      ioc: { merchant: 'Indian Oil', category: 'Fuel' },
      airtel: { merchant: 'Airtel', category: 'Bills & Utilities' },
      jio: { merchant: 'Jio', category: 'Bills & Utilities' },
      vi: { merchant: 'Vi', category: 'Bills & Utilities' },
    };

    for (const [key, val] of Object.entries(merchantMap)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lower)) {
        return {
          category: val.category,
          merchant: val.merchant,
          description: this.cleanDescription(text, key),
        };
      }
    }

    // Check keywords dictionary
    for (const [kw, info] of Object.entries(CATEGORY_KEYWORDS)) {
      // Word boundary match
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lower)) {
        return {
          category: info.category,
          merchant: info.defaultMerchant || null,
          description: this.cleanDescription(text, kw),
        };
      }
    }

    // Specific phrasing checks
    if (lower.includes('gave me') || lower.includes('dad') || lower.includes('mom') || lower.includes('friend')) {
      return {
        category: 'Gift',
        merchant: null,
        description: this.cleanDescription(text, 'gift'),
      };
    }

    const defaultCat = type === 'INCOME' ? 'Other' : 'Other';
    return {
      category: defaultCat,
      merchant: null,
      description: this.cleanDescription(text, ''),
    };
  }

  /**
   * Cleans description by removing amount, currency, and filler words
   */
  private cleanDescription(raw: string, matchedKeyword: string): string {
    let desc = raw
      .replace(/(?:₹|rs\.?|inr|\$)\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/gi, '')
      .replace(/\b\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:₹|rs\.?|inr|\$|\/-|rupees)?/gi, '')
      .replace(/\b(?:spent|paid|bought|got|received|from|using|via|at|on|for|today|yesterday|aaj|kal|pe|kharch|kiye|to)\b/gi, '')
      .replace(/\b(?:upi|gpay|phonepe|paytm|cash|card|credit|debit)\b/gi, '')
      .replace(/[^\w\s&'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!desc || desc.length < 2) {
      if (matchedKeyword) {
        return matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
      }
      return 'Expense';
    }

    // Capitalize first letter
    return desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  private normalizePaymentMethod(pm: string): PaymentMethod {
    const upper = (pm || '').toUpperCase();
    if (upper === 'UPI') return 'UPI';
    if (upper === 'CARD') return 'CARD';
    if (upper === 'NET_BANKING' || upper === 'NETBANKING') return 'NET_BANKING';
    if (upper === 'WALLET') return 'WALLET';
    if (upper === 'CASH') return 'CASH';
    return 'CASH';
  }
}

export const aiParserService = new AIParserService();
