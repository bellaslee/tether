import { describe, expect, it } from 'vitest';
import { computeRelationshipHearts } from './relationship-warmth';

describe('computeRelationshipHearts', () => {
  it('reaches full hearts with baseline 10, saturated frequency, recent touch, and low tenure', () => {
    const now = new Date('2026-05-11T15:00:00.000Z');
    const { filled, max } = computeRelationshipHearts({
      lastInteractionAt: '2026-05-11T14:00:00.000Z',
      metAt: null,
      createdAt: '2099-01-01',
      interactionCount: 50,
      personCategoryName: 'friend',
      relationshipHeartsBaselineHalves: 20,
      now,
    });
    expect(max).toBe(10);
    expect(filled).toBe(10);
  });
});
