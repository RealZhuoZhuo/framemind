import { ProjectPostgresRepository } from "./postgres/project.postgres";
import { StepPostgresRepository } from "./postgres/step.postgres";
import { CharacterPostgresRepository } from "./postgres/character.postgres";
import { ShotPostgresRepository } from "./postgres/shot.postgres";
import { VideoClipPostgresRepository } from "./postgres/video-clip.postgres";

import type { IProjectRepository } from "./interfaces/project.repository";
import type { IStepRepository } from "./interfaces/step.repository";
import type { ICharacterRepository } from "./interfaces/character.repository";
import type { IShotRepository } from "./interfaces/shot.repository";
import type { IVideoClipRepository } from "./interfaces/video-clip.repository";

export const projectRepo: IProjectRepository = new ProjectPostgresRepository();
export const stepRepo: IStepRepository = new StepPostgresRepository();
export const characterRepo: ICharacterRepository = new CharacterPostgresRepository();
export const shotRepo: IShotRepository = new ShotPostgresRepository();
export const videoClipRepo: IVideoClipRepository = new VideoClipPostgresRepository();
