import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

type Role = "admin" | "user" | "public";
type ActionType = "MUTATION" | "QUERY";

export interface ActionState<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any; // Allow additional return properties like csv, etc.
}

export function createSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput> | null,
  role: Role,
  actionType: ActionType,
  actionName: string,
  handler: (parsedInput: TInput, session: any) => Promise<ActionState<TOutput>>
) {
  return async (input: TInput): Promise<ActionState<TOutput>> => {
    try {
      // 1. Authentication & Authorization Check
      let session = null;
      if (role !== "public") {
        session = await getServerSession(authOptions);
        if (!session) {
          return { success: false, message: "Unauthorized: Anda belum login." };
        }
        
        if (role === "admin" && !session.user?.isAdmin) {
          return { success: false, message: "Forbidden: Akses ditolak. Hanya untuk Admin." };
        }
      }

      // 2. Input Validation
      let parsedInput = input;
      if (schema) {
        const result = schema.safeParse(input);
        if (!result.success) {
          return { 
            success: false, 
            message: "Validation Error: Input tidak valid.",
            errors: result.error.flatten().fieldErrors
          };
        }
        parsedInput = result.data;
      }

      // 3. Core Execution
      const result = await handler(parsedInput, session);

      // 4. Automated Audit Logging for Mutations
      if (result.success && actionType === "MUTATION" && role !== "public") {
        try {
          // Fire and forget audit log to not block the response
          createAuditLog(actionName, `Action ${actionName} executed successfully.`).catch(console.error);
        } catch (e) {
          console.error("Failed to create audit log", e);
        }
      }

      return result;

    } catch (error: any) {
      console.error(`Action Error [${actionName}]:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Terjadi kesalahan internal pada server." 
      };
    }
  };
}
