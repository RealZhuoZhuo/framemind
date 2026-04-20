import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db";
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
    await ensureDatabaseSchema();
    return db.select().from(characters).where(eq(characters.projectId, projectId));
  }

  async findById(id: string): Promise<CharacterRow | null> {
    await ensureDatabaseSchema();
    const rows = await db.select().from(characters).where(eq(characters.id, id));
    return rows[0] ?? null;
  }

  async create(projectId: string, data: CreateCharacterInput): Promise<CharacterRow> {
    await ensureDatabaseSchema();
    const rows = await db
      .insert(characters)
      .values({
        id: randomUUID(),
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
    await ensureDatabaseSchema();
    const rows = await db
      .update(characters)
      .set(data)
      .where(eq(characters.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await ensureDatabaseSchema();
    await db.delete(characters).where(eq(characters.id, id));
  }
}
