import { db } from "@/lib/db";

const LOCAL_USER_ID = "local-demo-user";
const LOCAL_USER_EMAIL = "demo@research-assistant.local";

/**
 * Ensures a local demo user exists in the database.
 * Used as the implicit "current user" for this single-user sandbox.
 */
export async function ensureLocalUser() {
  return db.userProfile.upsert({where:{id:LOCAL_USER_ID},create:{id:LOCAL_USER_ID,email:LOCAL_USER_EMAIL,name:'Researcher',researchInterests:''},update:{}});
}

export function getLocalUserId(): string {
  return LOCAL_USER_ID;
}
