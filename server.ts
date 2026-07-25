import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { trades, users, milestones, reviews } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API ROUTES
  
  app.post('/api/auth/sync-user', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email || '');
      res.json(user);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Trades
  app.get('/api/trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userTrades = await db.select().from(trades)
        .where(eq(trades.userId, req.user.uid))
        .orderBy(desc(trades.entryTime));
      res.json(userTrades);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  app.post('/api/trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
         res.status(401).json({ error: 'Unauthorized' });
         return;
      }
      const newTrade = await db.insert(trades).values({
        ...req.body,
        userId: req.user.uid,
        entryTime: req.body.entryTime ? new Date(req.body.entryTime) : new Date(),
        exitTime: req.body.exitTime ? new Date(req.body.exitTime) : undefined,
      }).returning();
      res.json(newTrade[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to insert trade' });
    }
  });

  app.post('/api/trades/upload', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!ai) {
        res.status(500).json({ error: 'Gemini API is not configured' });
        return;
      }
      
      const { imageBytes, mimeType } = req.body;
      if (!imageBytes || !mimeType) {
        res.status(400).json({ error: 'Missing image data' });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            text: "Extract the trading history from this screenshot. Return a list of trades with symbol, direction (buy/sell), lotSize, entryTime, exitTime (use entryTime if not clear), entryPrice, exitPrice (use entry price if not clear or 0), profit, swap, commission. Use ISO 8601 strings for dates. Use 0 for missing numbers. The MT5 ticket number can be ignored or put in symbol if needed, but focus on symbol.",
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBytes,
            },
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                direction: { type: Type.STRING },
                lotSize: { type: Type.NUMBER },
                entryTime: { type: Type.STRING },
                exitTime: { type: Type.STRING },
                entryPrice: { type: Type.NUMBER },
                exitPrice: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                swap: { type: Type.NUMBER },
                commission: { type: Type.NUMBER },
                mt5Ticket: { type: Type.STRING },
              }
            }
          }
        }
      });

      const extractedTradesText = response.text;
      if (!extractedTradesText) {
        throw new Error("Failed to extract text from response");
      }

      const extractedTrades = JSON.parse(extractedTradesText);
      
      const insertedTrades = [];
      for (const tradeData of extractedTrades) {
        const sanitizeNum = (val: any) => {
          if (!val) return '0';
          return val.toString().replace(/\s+/g, '').replace(/,/g, '');
        };

        const newTrade = await db.insert(trades).values({
          userId: req.user.uid,
          mt5Ticket: tradeData.mt5Ticket ? `${tradeData.mt5Ticket}-${Math.random().toString(36).substring(7)}` : null,
          symbol: tradeData.symbol || 'UNKNOWN',
          direction: tradeData.direction || 'Buy',
          lotSize: sanitizeNum(tradeData.lotSize) || '0.01',
          entryTime: tradeData.entryTime ? new Date(tradeData.entryTime.replace(/\./g, '-')) : new Date(),
          exitTime: tradeData.exitTime ? new Date(tradeData.exitTime.replace(/\./g, '-')) : undefined,
          entryPrice: sanitizeNum(tradeData.entryPrice),
          exitPrice: sanitizeNum(tradeData.exitPrice),
          profit: sanitizeNum(tradeData.profit),
          swap: sanitizeNum(tradeData.swap),
          commission: sanitizeNum(tradeData.commission),
        }).returning();
        insertedTrades.push(newTrade[0]);
      }

      res.json({ success: true, count: insertedTrades.length, trades: insertedTrades });
    } catch (e: any) {
      console.error('Error parsing trades:', e);
      if (e.cause) {
        console.error('Error cause:', e.cause);
      }
      if (e.detail) {
        console.error('Error detail:', e.detail);
      }
      res.status(500).json({ error: 'Failed to parse trades from image', details: e.message, cause: e.cause?.message || e.cause });
    }
  });

  // Delete single trade
  app.delete('/api/trades/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      await db.delete(trades)
        .where(eq(trades.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete trade' });
    }
  });

  // Delete all trades for user
  app.delete('/api/trades', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await db.delete(trades)
        .where(eq(trades.userId, req.user.uid));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete all trades' });
    }
  });

  // Analytics placeholder
  app.get('/api/analytics/summary', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const allTrades = await db.select().from(trades).where(eq(trades.userId, req.user.uid));
      const totalPnL = allTrades.reduce((sum, t) => sum + Number(t.profit || 0), 0);
      const wins = allTrades.filter(t => Number(t.profit || 0) > 0).length;
      const winRate = allTrades.length ? (wins / allTrades.length) * 100 : 0;
      res.json({ totalPnL, winRate, totalTrades: allTrades.length });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
