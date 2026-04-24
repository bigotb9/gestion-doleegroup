import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Charger .env.local (Next.js convention)
config({ path: ".env.local" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // URL directe pour les migrations (pas le pooler)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
})
