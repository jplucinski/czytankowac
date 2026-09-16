import { z } from 'zod';

export const Recommendation = z.enum(['FILL_UP', 'NORMAL', 'WAIT']);
export const Direction = z.enum(['UP', 'STABLE', 'DOWN']);
export const Fuel = z.enum(['PB95', 'DIESEL']);

export const FuelForecastSchema = z.object({
  fuel: Fuel,
  direction: Direction,
  recommendation: Recommendation,
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(160),
});

export const SourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.string().datetime(),
});

export const ForecastSchema = z
  .object({
    asOf: z.string().datetime(),
    market: z.literal('PL'),
    horizonDays: z.literal(7),
    fuels: z.array(FuelForecastSchema).length(2),
    sources: z.array(SourceSchema).min(3),
  })
  .superRefine((data, ctx) => {
    const fuels = data.fuels.map((f) => f.fuel);
    const unique = new Set(fuels);
    if (unique.size !== 2 || !unique.has('PB95') || !unique.has('DIESEL')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Forecast must include exactly one PB95 and one DIESEL entry',
        path: ['fuels'],
      });
    }
  });

export type Recommendation = z.infer<typeof Recommendation>;
export type Direction = z.infer<typeof Direction>;
export type Fuel = z.infer<typeof Fuel>;
export type FuelForecast = z.infer<typeof FuelForecastSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Forecast = z.infer<typeof ForecastSchema>;
