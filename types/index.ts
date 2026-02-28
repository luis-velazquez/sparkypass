// SparkyPass Type Definitions

// Re-export database types for convenience
export {
  type User,
  type NewUser,
  type AuthProvider,
  authProviderValues,
  type UserProgress,
  type NewUserProgress,
  type StudySession,
  type NewStudySession,
  type Bookmark,
  type NewBookmark,
  type SessionType,
  sessionTypeValues,
} from "@/lib/db/schema";

// Re-export question types
export {
  type Question,
  type Category,
  type CategorySlug,
  type Difficulty,
  CATEGORIES,
  getCategoryBySlug,
} from "./question";

// Re-export reward system types
export {
  type VoltageTier,
  type VoltageTierConfig,
  type VoltageTierProgress,
  type AmpsState,
  type WattsTransactionType,
  type WattsCalculation,
  type SRSState,
  type CircuitBreakerState,
  type FriendshipStatus,
  type PowerUpType,
  type PowerUpConfig,
  type LeaderboardTier,
  type PowerGridStatus,
  type ProgressResponse,
  type SessionCompleteResponse,
  type UserDataResponse,
  type StatsResponse,
} from "./reward-system";
