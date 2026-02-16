// ============================================================
// Axon — AI Flashcard Generator (Keyword-Aware)
// Automatically generates flashcards for keywords needing coverage
// ============================================================

import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  KeywordCollection,
  getKeywordsNeedingCards,
  incrementCardCoverage,
} from './keywordManager';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0c4f6a3c`;

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  keywords: {
    primary: string[];
    secondary: string[];
  };
  difficulty?: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export interface FlashcardGenerationRequest {
  keywords: string[];
  count: number;
  courseContext: string;
  topicContext: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Generate flashcards using Gemini AI for specific keywords
 */
export async function generateFlashcardsForKeywords(
  request: FlashcardGenerationRequest
): Promise<GeneratedFlashcard[]> {
  try {
    const response = await fetch(`${BASE_URL}/ai/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        topic: `${request.topicContext} (foco em: ${request.keywords.join(', ')})`,
        count: request.count,
        context: {
          course: request.courseContext,
          keywords: request.keywords,
          difficulty: request.difficulty || 'medium',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `AI error ${response.status}`);
    }

    const data = await response.json();
    return data.flashcards || [];
  } catch (err: any) {
    console.error('[aiFlashcardGenerator] Error generating flashcards:', err);
    throw err;
  }
}

/**
 * Intelligently generate flashcards for keywords that need coverage.
 * Uses the need score to prioritize which keywords to generate for.
 * 
 * @param collection - Current keyword collection
 * @param courseContext - Course name/context
 * @param topicContext - Topic name/context
 * @param maxKeywords - Max number of keywords to generate for
 * @param cardsPerKeyword - Number of flashcards per keyword
 * @param targetCoverage - Minimum desired coverage
 * @returns Generated flashcards and updated keyword collection
 */
export async function generateFlashcardsForGaps(
  collection: KeywordCollection,
  courseContext: string,
  topicContext: string,
  maxKeywords: number = 3,
  cardsPerKeyword: number = 2,
  targetCoverage: number = 3
): Promise<{
  flashcards: GeneratedFlashcard[];
  updatedCollection: KeywordCollection;
  keywordsProcessed: string[];
}> {
  // Identify keywords needing cards
  const needingCards = getKeywordsNeedingCards(collection, targetCoverage, maxKeywords);

  if (needingCards.length === 0) {
    return {
      flashcards: [],
      updatedCollection: collection,
      keywordsProcessed: [],
    };
  }

  // Extract keyword names
  const keywords = needingCards.map(k => k.keyword);

  console.log(`[aiFlashcardGenerator] Generating flashcards for keywords:`, keywords);

  // Generate flashcards via AI
  const flashcards = await generateFlashcardsForKeywords({
    keywords,
    count: keywords.length * cardsPerKeyword,
    courseContext,
    topicContext,
  });

  // Update card coverage for each keyword
  let updatedCollection = { ...collection };
  const keywordsProcessed: string[] = [];

  for (const flashcard of flashcards) {
    // Increment coverage for primary keywords
    for (const kw of flashcard.keywords.primary) {
      updatedCollection = incrementCardCoverage(updatedCollection, kw);
      if (!keywordsProcessed.includes(kw.toLowerCase())) {
        keywordsProcessed.push(kw.toLowerCase());
      }
    }
  }

  console.log(`[aiFlashcardGenerator] Generated ${flashcards.length} flashcards for ${keywordsProcessed.length} keywords`);

  return {
    flashcards,
    updatedCollection,
    keywordsProcessed,
  };
}

/**
 * Batch generate flashcards for multiple topics.
 * Useful for background generation or "fill gaps" features.
 */
export async function batchGenerateFlashcards(
  topicCollections: Array<{
    courseId: string;
    topicId: string;
    courseName: string;
    topicTitle: string;
    keywords: KeywordCollection;
  }>,
  maxKeywordsPerTopic: number = 3,
  cardsPerKeyword: number = 2
): Promise<
  Array<{
    courseId: string;
    topicId: string;
    flashcards: GeneratedFlashcard[];
    updatedKeywords: KeywordCollection;
  }>
> {
  const results = [];

  for (const topic of topicCollections) {
    try {
      const { flashcards, updatedCollection } = await generateFlashcardsForGaps(
        topic.keywords,
        topic.courseName,
        topic.topicTitle,
        maxKeywordsPerTopic,
        cardsPerKeyword
      );

      results.push({
        courseId: topic.courseId,
        topicId: topic.topicId,
        flashcards,
        updatedKeywords: updatedCollection,
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error(`[aiFlashcardGenerator] Error generating for ${topic.topicId}:`, err);
      // Continue with next topic
    }
  }

  return results;
}

/**
 * Estimate how many flashcards should be generated based on keyword states
 */
export function estimateFlashcardNeeds(collection: KeywordCollection): {
  totalGap: number;
  byUrgency: { critical: number; high: number; medium: number };
  recommendedGeneration: number;
} {
  const needingCards = getKeywordsNeedingCards(collection, 3, 999);
  
  let critical = 0;
  let high = 0;
  let medium = 0;

  for (const { needScore, coverage } of needingCards) {
    const gap = 3 - coverage;
    if (needScore > 0.7) {
      critical += gap;
    } else if (needScore > 0.5) {
      high += gap;
    } else {
      medium += gap;
    }
  }

  const totalGap = critical + high + medium;

  // Recommend generating for critical + some high priority
  const recommendedGeneration = Math.min(
    critical + Math.ceil(high * 0.5),
    20 // Cap at 20 to avoid overwhelming the user
  );

  return {
    totalGap,
    byUrgency: { critical, high, medium },
    recommendedGeneration,
  };
}

/**
 * Smart flashcard generation strategy:
 * - Prioritizes keywords with high need score
 * - Respects coverage limits
 * - Avoids overwhelming with too many cards at once
 */
export async function smartGenerateFlashcards(
  collection: KeywordCollection,
  courseContext: string,
  topicContext: string,
  config = {
    maxCardsPerSession: 10,
    targetCoverage: 3,
    minNeedScore: 0.4,
  }
): Promise<{
  flashcards: GeneratedFlashcard[];
  updatedCollection: KeywordCollection;
  stats: {
    keywordsProcessed: number;
    cardsGenerated: number;
    gapReduction: number;
  };
}> {
  const beforeEstimate = estimateFlashcardNeeds(collection);
  
  // Calculate how many keywords we can address
  const maxKeywords = Math.ceil(config.maxCardsPerSession / 2); // ~2 cards per keyword
  
  const result = await generateFlashcardsForGaps(
    collection,
    courseContext,
    topicContext,
    maxKeywords,
    2,
    config.targetCoverage
  );

  const afterEstimate = estimateFlashcardNeeds(result.updatedCollection);

  return {
    ...result,
    stats: {
      keywordsProcessed: result.keywordsProcessed.length,
      cardsGenerated: result.flashcards.length,
      gapReduction: beforeEstimate.totalGap - afterEstimate.totalGap,
    },
  };
}
