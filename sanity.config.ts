import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'autobrothers',
  title: 'AutoBrothers Admin',
  projectId: 'YOUR_SANITY_PROJECT_ID', // ⚠️ Yahan sanity.org se apni ID daalein
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})