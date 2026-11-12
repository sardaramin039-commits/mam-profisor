import { db } from './index';
import { users } from './schema';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user synch failed:", error);
    throw new Error("Database user synch failed. Please try again later.", { cause: error });
  }
}
