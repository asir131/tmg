const BLOCKED_COMPETITIONS_KEY = 'blocked_competitions';

/**
 * Get all blocked competition IDs from localStorage
 */
export function getBlockedCompetitions(): string[] {
  try {
    const stored = localStorage.getItem(BLOCKED_COMPETITIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch (error) {
    console.error('Error reading blocked competitions:', error);
    return [];
  }
}

/**
 * Check if a competition is blocked
 */
export function isCompetitionBlocked(competitionId: string): boolean {
  const blocked = getBlockedCompetitions();
  return blocked.includes(competitionId);
}

/**
 * Add a competition to the blocked list
 */
export function addBlockedCompetition(competitionId: string): void {
  try {
    const blocked = getBlockedCompetitions();
    // Avoid duplicates
    if (!blocked.includes(competitionId)) {
      blocked.push(competitionId);
      localStorage.setItem(BLOCKED_COMPETITIONS_KEY, JSON.stringify(blocked));
    }
  } catch (error) {
    console.error('Error adding blocked competition:', error);
  }
}

/**
 * Remove a competition from the blocked list (for testing/admin purposes)
 */
export function removeBlockedCompetition(competitionId: string): void {
  try {
    const blocked = getBlockedCompetitions();
    const filtered = blocked.filter(id => id !== competitionId);
    localStorage.setItem(BLOCKED_COMPETITIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing blocked competition:', error);
  }
}

/**
 * Clear all blocked competitions (for testing/admin purposes)
 */
export function clearBlockedCompetitions(): void {
  try {
    localStorage.removeItem(BLOCKED_COMPETITIONS_KEY);
  } catch (error) {
    console.error('Error clearing blocked competitions:', error);
  }
}

