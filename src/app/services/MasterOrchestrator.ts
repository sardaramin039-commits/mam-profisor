// MasterOrchestrator.ts
import { AcademicLevel, LEVEL_PROFILES } from './LevelProfiles';
import { buildLevelCalibratedBlueprint, AcademicBlueprint } from './BlueprintAndOutlineAgent';
import { AdaptiveCitationManager } from './AdaptiveCitationManager';
import {
  writeCalibratedSubSection,
  generateCalibratedConclusion,
  generateLevelDesignStylesheet
} from './AdaptiveWriterAndDesigner';

export interface CompleteAcademicWorkResult {
  metadata: {
    title: string;
    level: string;
    targetWords: number;
    designSpec: (typeof LEVEL_PROFILES)[AcademicLevel]['designSpec'];
  };
  cssStylesheet: string;
  documentSections: {
    dedicationAndAck: string;
    abstractKurdish: string;
    abstractEnglish: string;
    introductionOrGateway: string;
    coreChapters: string[];
    conclusion: string;
    bibliography: string;
  };
}

export interface MasterOrchestrationProgress {
  stage: 'blueprint' | 'writing' | 'conclusion' | 'bibliography' | 'completed';
  percent: number;
  message: string;
  currentChapter?: string;
  currentSubSection?: string;
}

export async function generateCompleteAcademicWork(
  title: string,
  level: AcademicLevel,
  onProgress?: (progress: MasterOrchestrationProgress) => void
): Promise<CompleteAcademicWorkResult> {
  const profile = LEVEL_PROFILES[level];
  const citationManager = new AdaptiveCitationManager(level);

  onProgress?.({
    stage: 'blueprint',
    percent: 10,
    message: `دروستکردنی پێشەکی، دەروازە و نەخشەی ئەندازیاری بەپێی «${profile.kurdishTitle}»...`
  });

  // هەنگاوی ١: دروستکردنی پێشەکی، پوختە و پێڕستی تایبەتمەند بە ئاستەکە
  const blueprint = await buildLevelCalibratedBlueprint(title, level);

  const compiledChaptersMarkdown: string[] = [];
  const allFindingsTracker: string[] = [];
  let rollingLastParagraph = '';

  // هەژمارکردنی کۆی گشتیی لقەکان بۆ ڕێژەی بەرەوپێشچوون
  let totalSubSectionsCount = 0;
  for (const ch of blueprint.chapters) {
    for (const sec of ch.sections) {
      totalSubSectionsCount += sec.subSections.length;
    }
  }
  let completedSubSections = 0;

  // هەنگاوی ٢: نووسینی زنجیرەیی هەموو بەش و تەوەر و لقەکان
  for (let chIndex = 0; chIndex < blueprint.chapters.length; chIndex++) {
    const chapter = blueprint.chapters[chIndex];
    let chapterMd = `# ${chapter.title}\n\n`;

    for (const section of chapter.sections) {
      chapterMd += `## ${section.title}\n\n`;

      for (let i = 0; i < section.subSections.length; i++) {
        const currentSub = section.subSections[i];
        const nextSub = i + 1 < section.subSections.length ? section.subSections[i + 1] : undefined;

        completedSubSections++;
        const percent = Math.min(85, Math.round(15 + (completedSubSections / Math.max(1, totalSubSectionsCount)) * 65));

        onProgress?.({
          stage: 'writing',
          percent,
          message: `نووسینی لقەکە بەپێی Micro-Topics: ${currentSub.code} ${currentSub.title}`,
          currentChapter: chapter.title,
          currentSubSection: `${currentSub.code} ${currentSub.title}`
        });

        const writtenSub = await writeCalibratedSubSection({
          thesisTitle: title,
          level,
          chapterTitle: chapter.title,
          sectionTitle: section.title,
          subSection: currentSub,
          previousClosingParagraph: rollingLastParagraph,
          nextSubSectionTitle: nextSub?.title,
          citationManager
        });

        chapterMd += `${writtenSub.fullSubSectionMarkdown}\n\n`;
        rollingLastParagraph = writtenSub.lastParagraph;
        allFindingsTracker.push(...writtenSub.keyFindings);
      }
    }

    compiledChaptersMarkdown.push(chapterMd);
  }

  onProgress?.({
    stage: 'conclusion',
    percent: 88,
    message: `نووسینی ئەنجام و ڕاسپاردەکان بەپێی کالیبراسیۆنی ${profile.kurdishTitle}...`
  });

  // هەنگاوی ٣: نووسینی ئەنجام و ڕاسپاردەکان بەپێی ئاستەکە
  const conclusionMarkdown = await generateCalibratedConclusion(title, level, allFindingsTracker);

  onProgress?.({
    stage: 'bibliography',
    percent: 95,
    message: 'کۆکردنەوەی بیبلۆگرافیای فرەزمانی و ستایلی چاپ...'
  });

  // هەنگاوی ٤: کۆکردنەوەی لیستی سەرچاوەکان و ستایلی دیزاین
  const bibliographyMarkdown = citationManager.buildBibliographySection();
  const cssStylesheet = generateLevelDesignStylesheet(level);

  onProgress?.({
    stage: 'completed',
    percent: 100,
    message: 'تەواوی کارە ئەکادیمییەکە بە سەرکەوتوویی ئامادە کرا.'
  });

  return {
    metadata: {
      title,
      level: profile.kurdishTitle,
      targetWords: profile.structure.totalWords,
      designSpec: profile.designSpec
    },
    cssStylesheet,
    documentSections: {
      dedicationAndAck: blueprint.frontMatterAndIntro.dedicationAndAck,
      abstractKurdish: blueprint.frontMatterAndIntro.abstractKurdish,
      abstractEnglish: blueprint.frontMatterAndIntro.abstractEnglish,
      introductionOrGateway: blueprint.frontMatterAndIntro.fullIntroductionMarkdown,
      coreChapters: compiledChaptersMarkdown,
      conclusion: conclusionMarkdown,
      bibliography: bibliographyMarkdown
    }
  };
}
