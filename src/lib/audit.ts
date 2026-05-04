import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAuditLog(action: string, details: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null;
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action,
        details,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
