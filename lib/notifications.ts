import { prisma } from "./prisma"

export async function createNotification(
  userId: string,
  titre: string,
  corps: string,
  type: "info" | "warning" | "success" | "error" = "info",
  lienUrl?: string
) {
  return prisma.notification.create({
    data: { userId, titre, corps, type, lienUrl },
  })
}

export async function notifyManagers(
  titre: string,
  corps: string,
  type: "info" | "warning" | "success" | "error" = "info",
  lienUrl?: string
) {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true },
    select: { id: true },
  })

  await Promise.all(
    managers.map((m) => createNotification(m.id, titre, corps, type, lienUrl))
  )
}
