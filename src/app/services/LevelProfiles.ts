import { LEVEL_PROFILES as CORE_LEVEL_PROFILES, AcademicLevel, LevelCalibrationProfile as CoreLevelProfile } from '../../lib/gemini/LevelProfiles';
import { LEVEL_PROFILES as UI_LEVEL_PROFILES, LevelCalibrationProfile as UILevelProfile } from '../models/level-profiles';

export type { AcademicLevel };

export interface LevelCalibrationProfile extends CoreLevelProfile {
  designSpec: UILevelProfile['designSpec'];
}

export const LEVEL_PROFILES: Record<AcademicLevel, LevelCalibrationProfile> = {
  school: {
    ...CORE_LEVEL_PROFILES.school,
    designSpec: UI_LEVEL_PROFILES.school.designSpec
  },
  bachelor: {
    ...CORE_LEVEL_PROFILES.bachelor,
    designSpec: UI_LEVEL_PROFILES.bachelor.designSpec
  },
  master: {
    ...CORE_LEVEL_PROFILES.master,
    designSpec: UI_LEVEL_PROFILES.master.designSpec
  },
  phd: {
    ...CORE_LEVEL_PROFILES.phd,
    designSpec: UI_LEVEL_PROFILES.phd.designSpec
  }
};
