import type { CharacterRow } from "@/lib/db/types";

export interface ICharacterRepository {
  findByProject(projectId: string): Promise<CharacterRow[]>;
  findById(id: string): Promise<CharacterRow | null>;
  create(projectId: string, data: CreateCharacterInput): Promise<CharacterRow>;
  update(id: string, data: UpdateCharacterInput): Promise<CharacterRow | null>;
  delete(id: string): Promise<void>;
}

export type CreateCharacterInput = {
  name: string;
  appearance?: string;
  clothing?: string;
  description?: string;
};

export type UpdateCharacterInput = Partial<CreateCharacterInput>;
