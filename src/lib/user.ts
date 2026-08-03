import { db } from "@/lib/db";

const LOCAL_USER_ID = "local-demo-user";
const LOCAL_USER_EMAIL = "demo@research-assistant.local";

/**
 * Ensures a local demo user exists in the database.
 * Used as the implicit "current user" for this single-user sandbox.
 */
export async function ensureLocalUser() {
  let user = await db.userProfile.findUnique({ where: { id: LOCAL_USER_ID } });
  if (!user) {
    user = await db.userProfile.create({
      data: {
        id: LOCAL_USER_ID,
        email: LOCAL_USER_EMAIL,
        name: "Researcher",
        affiliation: "—",
        researchInterests: "",
      },
    });
  }
  return user;
}

export function getLocalUserId(): string {
  return LOCAL_USER_ID;
}
