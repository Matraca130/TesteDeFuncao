// ══════════════════════════════════════════════════════════════
// AXON — Course Helper Functions (pure — no dependency on course data)
// ══════════════════════════════════════════════════════════════

import type { Topic, Section, Course, TopicSubcategory } from './course-types';

/** Derive a subcategory from a topic's ID/title pattern */
export function getTopicSubcategory(topic: Topic): TopicSubcategory {
  const id = topic.id.toLowerCase();
  const title = topic.title.toLowerCase();

  if (
    id.includes('artrologia') || id.includes('musculatura') || id.includes('compartment') ||
    title.includes('artrologia') || title.includes('musculatura') || title.includes('compartimento')
  ) {
    return 'Aparelho Locomotor';
  }
  if (
    id.includes('vasc') || id.includes('nerves') || id.includes('inerv') ||
    title.includes('vasculariz') || title.includes('inervac')
  ) {
    return 'Neurovascular';
  }
  return 'Visao Geral';
}

/** Subcategory display config */
export const SUBCATEGORY_CONFIG: Record<TopicSubcategory, { label: string; color: string; dot: string }> = {
  'Visao Geral':        { label: 'Visao Geral',        color: 'text-sky-600',    dot: 'bg-sky-400' },
  'Aparelho Locomotor': { label: 'Aparelho Locomotor',  color: 'text-amber-600',  dot: 'bg-amber-400' },
  'Neurovascular':      { label: 'Neurovascular',       color: 'text-violet-600', dot: 'bg-violet-400' },
};

/** Group a section's topics by derived subcategory, preserving order */
export function groupTopicsBySubcategory(topics: Topic[]): { subcategory: TopicSubcategory; topics: Topic[] }[] {
  const order: TopicSubcategory[] = ['Visao Geral', 'Aparelho Locomotor', 'Neurovascular'];
  const groups = new Map<TopicSubcategory, Topic[]>();

  for (const topic of topics) {
    const sub = getTopicSubcategory(topic);
    if (!groups.has(sub)) groups.set(sub, []);
    groups.get(sub)!.push(topic);
  }

  return order.filter(s => groups.has(s)).map(s => ({ subcategory: s, topics: groups.get(s)! }));
}

/** Group sections by region for display purposes */
export function groupSectionsByRegion(sections: Section[]): { region: string; sections: Section[] }[] {
  const groups: { region: string; sections: Section[] }[] = [];
  const seen = new Map<string, Section[]>();

  for (const sec of sections) {
    const region = sec.region || 'Geral';
    if (!seen.has(region)) {
      const group = { region, sections: [sec] };
      groups.push(group);
      seen.set(region, group.sections);
    } else {
      seen.get(region)!.push(sec);
    }
  }

  return groups;
}

/** Flatten all topics from a course (utility) */
export function getAllTopics(course: Course): Topic[] {
  return course.semesters.flatMap(sem =>
    sem.sections.flatMap(sec => sec.topics)
  );
}

/** Flatten topics including subtopics into a single list of leaf-level items */
export function flattenTopicsWithSubtopics(topics: Topic[]): Topic[] {
  return topics.flatMap(t => t.subtopics && t.subtopics.length > 0 ? t.subtopics : [t]);
}
