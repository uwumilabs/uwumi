import { AdminAnalytics, MediaItem } from "../types";

/**
 * Mock data service - replace with real API calls in production
 */
export const MOCK_DATA = {
  analytics: {
    stats: {
      totalUsers: 1250,
      activeUsers: 875,
      totalContent: 45,
      monthlyViews: 125000,
    },
    userActivity: [
      { date: "2024-01-10", users: 45, views: 234 },
      { date: "2024-01-11", users: 52, views: 287 },
      { date: "2024-01-12", users: 48, views: 312 },
      { date: "2024-01-13", users: 61, views: 398 },
      { date: "2024-01-14", users: 58, views: 445 },
      { date: "2024-01-15", users: 67, views: 523 },
      { date: "2024-01-16", users: 73, views: 612 },
    ],
    contentStats: {
      anime: 25,
      manga: 15,
      movies: 5,
    },
    popularContent: {
      anime: [
        {
          id: "1",
          title: "Attack on Titan",
          rating: 9.0,
          poster:
            "https://images.pexels.com/photos/1040160/pexels-photo-1040160.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
        {
          id: "2",
          title: "Demon Slayer",
          rating: 8.7,
          poster:
            "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
        {
          id: "3",
          title: "My Hero Academia",
          rating: 8.5,
          poster:
            "https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
      ],
      manga: [
        {
          id: "1",
          title: "One Piece",
          rating: 9.2,
          cover:
            "https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
        {
          id: "2",
          title: "Naruto",
          rating: 8.9,
          cover:
            "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
      ],
      movies: [
        {
          id: "1",
          title: "Your Name",
          rating: 8.4,
          poster:
            "https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
        {
          id: "2",
          title: "Spirited Away",
          rating: 9.3,
          poster:
            "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400",
        },
      ],
    },
  } as AdminAnalytics,
} as const;

/**
 * Data service class for handling API calls
 */
export class DataService {
  /**
   * Simulate API delay
   */
  private static async delay(ms: number = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get admin analytics data
   */
  static async getAdminAnalytics(): Promise<AdminAnalytics> {
    await this.delay(500);
    return MOCK_DATA.analytics;
  }

  /**
   * Get popular content by type
   */
  static async getPopularContent(
    type: "anime" | "manga" | "movies"
  ): Promise<MediaItem[]> {
    await this.delay(300);
    return MOCK_DATA.analytics.popularContent[type];
  }

  /**
   * Get user activity data
   */
  static async getUserActivity(): Promise<
    Array<{ date: string; users: number; views: number }>
  > {
    await this.delay(300);
    return MOCK_DATA.analytics.userActivity;
  }

  /**
   * Get content statistics
   */
  static async getContentStats(): Promise<{
    anime: number;
    manga: number;
    movies: number;
  }> {
    await this.delay(200);
    return MOCK_DATA.analytics.contentStats;
  }
}

export default DataService;
