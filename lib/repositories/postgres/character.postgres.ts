import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type {
  ICharacterRepository,
  CreateCharacterInput,
  UpdateCharacterInput,
} from "../interfaces/character.repository";
import type { CharacterRow } from "@/lib/db/types";

export class CharacterPostgresRepository implements ICharacterRepository {
  async findByProject(projectId: string): Promise<CharacterRow[]> {
    return db.select().from(characters).where(eq(characters.projectId, projectId));
  }

  async findById(id: string): Promise<CharacterRow | null> {
    const rows = await db.select().from(characters).where(eq(characters.id, id));
    return rows[0] ?? null;
  }

  async create(projectId: string, data: CreateCharacterInput): Promise<CharacterRow> {
    const rows = await db
      .insert(characters)
      .values({
        projectId,
        name: data.name,
        appearance: data.appearance ?? "",
        clothing: data.clothing ?? "",
        description: data.description ?? "",
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateCharacterInput): Promise<CharacterRow | null> {
    const rows = await db
      .update(characters)
      .set(data)
      .where(eq(characters.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }
}
