import type { Config } from 'tailwindcss'
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { accent: '#F5A623', dark: '#0A1929' } } },
  plugins: [],
}
export default config