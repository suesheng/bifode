import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projekteCollection = defineCollection({
  loader: glob({ base: './src/content/projekte', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = {
  projekte: projekteCollection,
};
