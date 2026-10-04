import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini client with telemetry header per guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface DayRecoveryRecordInput {
  id: string;
  dayShort: string;
  dayFull: string;
  nightCycles: number;
  middayCrp: boolean;
  eveningCrp: boolean;
  morningProtocolDone: boolean;
  preSleepRoutineDone: boolean;
  notes?: string;
}

// POST endpoint: /api/sleep-coach/advice
// Analyzes weeklyData and generates personalized sleep coach advice using Gemini API
app.post('/api/sleep-coach/advice', async (req, res) => {
  try {
    const { weeklyData, wakeTime = '06:30', targetCycles = 5 } = req.body as {
      weeklyData?: DayRecoveryRecordInput[];
      wakeTime?: string;
      targetCycles?: number;
    };

    if (!weeklyData || !Array.isArray(weeklyData) || weeklyData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'weeklyData is required and must be a non-empty array',
      });
    }

    // 1. Analyze weeklyData metrics
    let totalNightCycles = 0;
    let totalCrps = 0;
    let morningProtocolsCount = 0;
    let preSleepRoutinesCount = 0;
    const daysSummaryList: string[] = [];

    for (const d of weeklyData) {
      totalNightCycles += d.nightCycles;
      const crpCount = (d.middayCrp ? 1 : 0) + (d.eveningCrp ? 1 : 0);
      totalCrps += crpCount;
      if (d.morningProtocolDone) morningProtocolsCount++;
      if (d.preSleepRoutineDone) preSleepRoutinesCount++;

      daysSummaryList.push(
        `${d.dayShort} (${d.dayFull}): ${d.nightCycles} циклів сну (${(d.nightCycles * 1.5).toFixed(1)} год), ` +
        `денні паузи CRP: ${d.middayCrp ? 'Полудень (+1)' : '—'}, ${d.eveningCrp ? 'Вечір (+1)' : '—'}, ` +
        `ранок 90 хв: ${d.morningProtocolDone ? 'Так' : 'Ні'}, ` +
        `wind-down: ${d.preSleepRoutineDone ? 'Так' : 'Ні'}` +
        (d.notes ? ` [Примітка: ${d.notes}]` : '')
      );
    }

    const totalRecoveryUnits = totalNightCycles + totalCrps;
    const targetUnits = 35; // Nick Littlehales' 35 recovery units/week
    const deficitOrSurplus = totalRecoveryUnits - targetUnits;

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured. Generating algorithmic R90 advice.');
      return res.json({
        success: true,
        source: 'algorithmic',
        advice:
          totalRecoveryUnits >= 35
            ? `Чудовий баланс! Ви досягли ${totalRecoveryUnits} одиниць відновлення з 35 цільових. Завдяки денним паузам CRP ваші циркадні ритми стабільні.`
            : `За тиждень зафіксовано ${totalRecoveryUnits} циклів (дефіцит ${Math.abs(deficitOrSurplus)}). Не компенсуйте це валянням у ліжку, а використайте 30-хвилинний денний CRP о 13:00–14:00.`,
        focusArea: totalRecoveryUnits >= 35 ? 'Ритм чемпіонів (35/35)' : 'Компенсація дефіциту через CRP',
        actionItem: 'Утримайте фіксований час пробудження ' + wakeTime + ' та виконайте 30 хв CRP.',
        cyclesAssessment: `${totalRecoveryUnits} / ${targetUnits} циклів (${Math.round((totalRecoveryUnits / targetUnits) * 100)}% норми R90)`,
        readinessScore: Math.min(98, Math.max(65, 70 + (totalRecoveryUnits - 28) * 4)),
      });
    }

    // 2. Call Gemini API with @google/genai using model gemini-3.8-flash
    const prompt = `Проаналізуйте тижневі біометричні дані сну користувача (методика R90 Ніка Літлхелса) та згенеруйте персональну пораду на сьогодні для головного екрана додатку (Сьогодні).

Дані користувача:
- Фіксований час пробудження: ${wakeTime}
- Бажана кількість нічних циклів: ${targetCycles} циклів (${(targetCycles * 1.5).toFixed(1)} год)
- Сумарно за тиждень: ${totalRecoveryUnits} / ${targetUnits} одиниць відновлення (${totalNightCycles} нічних циклів + ${totalCrps} денних пауз CRP)
- Різниця від стандарту 35 циклів: ${deficitOrSurplus >= 0 ? `+${deficitOrSurplus}` : `${deficitOrSurplus}`}
- Виконання ранкового протоколу перших 90 хвилин: ${morningProtocolsCount}/${weeklyData.length} днів
- Виконання вечірнього ритуалу wind-down: ${preSleepRoutinesCount}/${weeklyData.length} днів

Деталізація по днях:
${daysSummaryList.join('\n')}

Вимоги до відповіді:
1. advice: Персональна, змістовна текстова порада на сьогодні (2-3 чітких речення українською мовою). Зверніть увагу на дні з просіданням циклів (наприклад, п'ятниця чи вихідні) або навпаки похваліть стабільність. Підкресліть філософію R90: оцінюємо сон не годинами за одну ніч, а блоками по 90 хвилин у межах тижня.
2. focusArea: Ключовий фокус дня у 2-4 слова (наприклад: "Синхронізація ритму", "Компенсація через денний CRP", "Оптимізація відновлення").
3. actionItem: 1 конкретна практична дія на сьогодні (наприклад: "Заплануйте 30 хв CRP без екранів о 13:30" або "Почніть вечірній wind-down на 15 хв раніше").
4. cyclesAssessment: Лаконічний статус тижневого рахунку (наприклад: "${totalRecoveryUnits} / 35 циклів · 94% від норми R90").
5. readinessScore: Число від 60 до 100 (індекс готовності / бадьорості).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Ви — персональний біометричний тренер сну та відновлення (Sleep Coach) за методологією R90 Ніка Літлхелса (Nick Littlehales). Ваша мета — надати стислу, глибоку та мотивуючу персональну пораду на основі тижневої матриці циклів сну та денних відновлювальних періодів CRP. Відповідайте виключно українською мовою.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.STRING,
              description: 'Персональна текстова порада для користувача на сьогодні (2-3 змістовних речення).',
            },
            focusArea: {
              type: Type.STRING,
              description: 'Ключовий фокус дня, наприклад: "Компенсація CRP", "Стабільність ритму".',
            },
            actionItem: {
              type: Type.STRING,
              description: 'Конкретна дія на сьогодні (1 лаконічне речення).',
            },
            cyclesAssessment: {
              type: Type.STRING,
              description: 'Оцінка тижневого балансу циклів (наприклад, "32/35 циклів · Оптимальний рівень").',
            },
            readinessScore: {
              type: Type.NUMBER,
              description: 'Оцінка готовності від 60 до 100.',
            },
          },
          required: ['advice', 'focusArea', 'actionItem', 'cyclesAssessment', 'readinessScore'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      source: 'gemini',
      advice: parsed.advice,
      focusArea: parsed.focusArea,
      actionItem: parsed.actionItem,
      cyclesAssessment: parsed.cyclesAssessment,
      readinessScore: parsed.readinessScore,
    });
  } catch (error: any) {
    console.warn('Gemini API call failed or unavailable, falling back to algorithmic R90 advice:', error?.message);

    const { weeklyData, wakeTime = '06:30' } = req.body as {
      weeklyData?: DayRecoveryRecordInput[];
      wakeTime?: string;
    };

    let totalNightCycles = 0;
    let totalCrps = 0;
    if (weeklyData && Array.isArray(weeklyData)) {
      for (const d of weeklyData) {
        totalNightCycles += d.nightCycles;
        totalCrps += (d.middayCrp ? 1 : 0) + (d.eveningCrp ? 1 : 0);
      }
    }
    const totalRecoveryUnits = totalNightCycles + totalCrps;
    const targetUnits = 35;
    const deficitOrSurplus = totalRecoveryUnits - targetUnits;

    return res.json({
      success: true,
      source: 'algorithmic',
      advice:
        totalRecoveryUnits >= 35
          ? `Чудовий баланс! Ви досягли ${totalRecoveryUnits} одиниць відновлення з 35 цільових. Завдяки денним паузам CRP ваші циркадні ритми стабільні.`
          : `За тиждень зафіксовано ${totalRecoveryUnits} циклів (дефіцит ${Math.abs(deficitOrSurplus)}). Не намагайтеся компенсувати це довшим валянням у ліжку, а використайте 30-хвилинний денний CRP о 13:00–14:00 для вирівнювання ритму.`,
      focusArea: totalRecoveryUnits >= 35 ? 'Ритм чемпіонів (35/35)' : 'Компенсація через денний CRP',
      actionItem: `Утримайте стабільний підйом о ${wakeTime} та проведіть 30 хв CRP без смартфонів.`,
      cyclesAssessment: `${totalRecoveryUnits} / ${targetUnits} циклів (${Math.round((totalRecoveryUnits / targetUnits) * 100)}% норми R90)`,
      readinessScore: Math.min(98, Math.max(68, 72 + (totalRecoveryUnits - 28) * 3)),
    });
  }
});

// Vite middleware mounting or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sleep Coach server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
