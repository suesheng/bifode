import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projekteCollection = defineCollection({
  loader: glob({ base: './src/content/projekte', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const eventsCollection = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    summary: z.string(),
    summaryEn: z.string().optional(),
    /** ISO 8601, e.g. 2026-09-10T15:00:00+02:00 */
    start: z.string(),
    end: z.string().optional(),
    location: z.string(),
    locationEn: z.string().optional(),
    online: z.boolean().optional().default(false),
    registrationUrl: z.string().url().optional(),
    /** Hidden from lists and .ics until ready */
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  projekte: projekteCollection,
  events: eventsCollection,
};
