import { ProjectPostgresRepository } from "./postgres/project.postgres";
import { StepPostgresRepository } from "./postgres/step.postgres";
import { AssetPostgresRepository } from "./postgres/asset.postgres";
import { ShotPostgresRepository } from "./postgres/shot.postgres";
import { VideoClipPostgresRepository } from "./postgres/video-clip.postgres";
import { VideoGenerationTaskPostgresRepository } from "./postgres/video-generation-task.postgres";

import type { IProjectRepository } from "./interfaces/project.repository";
import type { IStepRepository } from "./interfaces/step.repository";
import type { IAssetRepository } from "./interfaces/asset.repository";
import type { IShotRepository } from "./interfaces/shot.repository";
import type { IVideoClipRepository } from "./interfaces/video-clip.repository";
import type { IVideoGenerationTaskRepository } from "./interfaces/video-generation-task.repository";

export const projectRepo: IProjectRepository = new ProjectPostgresRepository();
export const stepRepo: IStepRepository = new StepPostgresRepository();
export const assetRepo: IAssetRepository = new AssetPostgresRepository();
export const shotRepo: IShotRepository = new ShotPostgresRepository();
export const videoClipRepo: IVideoClipRepository = new VideoClipPostgresRepository();
export const videoGenerationTaskRepo: IVideoGenerationTaskRepository = new VideoGenerationTaskPostgresRepository();
