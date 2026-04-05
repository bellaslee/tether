import { z } from 'zod';

export const extractFactsResultSchema = z.object({
  facts: z.array(
    z.object({
      person_id: z.string().uuid(),
      body: z.string().min(1),
    }),
  ),
});

export type ExtractFactsResult = z.infer<typeof extractFactsResultSchema>;

export const suggestTasksResultSchema = z.object({
  tasks: z.array(
    z.object({
      person_id: z.string().uuid().nullable().optional(),
      title: z.string().min(1),
      description: z.string().nullable().optional(),
    }),
  ),
});

export type SuggestTasksResult = z.infer<typeof suggestTasksResultSchema>;

export const summaryContentResultSchema = z.object({
  content: z.string().min(1),
});

export type SummaryContentResult = z.infer<typeof summaryContentResultSchema>;
