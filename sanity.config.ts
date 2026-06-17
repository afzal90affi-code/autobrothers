import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'autobrothers',
  title: 'AutoBrothers Admin',
  projectId: 'nub55wmw', // ⚠️ Yahan sanity.org se apni ID daalein
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})