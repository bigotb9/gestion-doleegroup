import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!passwordMatch) return null

        // Parse custom permissions if set
        let permissions: string[] | null = null
        if (user.permissions) {
          try { permissions = JSON.parse(user.permissions) } catch { permissions = null }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatarUrl,
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...authConfig.callbacks as any,
    // Re-fetch role + permissions from DB on every session read so that
    // changes made by a manager take effect immediately without re-login.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, permissions: true, isActive: true, avatarUrl: true },
          })
          if (dbUser) {
            session.user.id = token.id
            session.user.role = dbUser.role
            session.user.image = dbUser.avatarUrl ?? token.image ?? null
            session.user.permissions = dbUser.permissions
              ? (() => { try { return JSON.parse(dbUser.permissions!) } catch { return null } })()
              : null
          }
        } catch {
          // DB indisponible — on utilise les données du token JWT
          session.user.id = token.id
          session.user.role = token.role
          session.user.image = token.image ?? null
          session.user.permissions = token.permissions ?? null
        }
      }
      return session
    },
  },
})
