import DB from "../../../../database/index.schema";
import { logger } from "../../../utils/logger";
import { EVENT_TYPES, METRIC_NAMES, METRIC_UNITS } from "../analytics.interface";
import AnalyticsEventService from "./analytics-event.service";

/**
 * User Behavior Analytics Service
 * Tracks and analyzes user patterns, session behavior, and engagement metrics
 */
class UserBehaviorService {
  private analyticsEventService = new AnalyticsEventService();

  /**
   * Track user interaction patterns
   */
  public async trackUserInteraction(
    userId: number,
    interactionType: string,
    targetId?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.analyticsEventService.trackUserActivity({
        userId,
        eventType: interactionType,
        eventData: {
          targetId,
          interactionTime: new Date(),
          ...metadata,
        },
      });

      logger.info("🔄 User interaction tracked", {
        userId,
        interactionType,
        targetId,
      });
    } catch (error) {
      logger.error("❌ Failed to track user interaction", {
        error: error.message,
        userId,
        interactionType,
      });
    }
  }

  /**
   * Analyze user engagement patterns over time periods
   */
  public async analyzeUserEngagement(userId: number, days?: number): Promise<any> {
    try {
      const startDate = days ? new Date() : null;
      if (startDate && days) {
        startDate.setDate(startDate.getDate() - days);
      }

      // Get user activity for the specified period (or all time if no days specified)
      let query = DB("user_activity_events")
        .where("user_id", userId);

      if (startDate) {
        query = query.where("created_at", ">=", startDate);
      }

      const activities = await query.orderBy("created_at", "desc");

      // Calculate engagement metrics
      const totalActivities = activities.length;
      const uniqueDays = new Set(
        // SQLite returns created_at as a string — must coerce to Date before calling .toDateString()
        activities.map(activity => new Date(activity.created_at).toDateString())
      ).size;

      const eventTypeCounts = activities.reduce((acc, activity) => {
        acc[activity.event_type] = (acc[activity.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate daily activity averages
      const dailyActivityAvg = uniqueDays > 0 ? totalActivities / uniqueDays : 0;

      // Find most active hours
      const hourlyActivity = activities.reduce((acc, activity) => {
        // Same coercion needed here — getHours() only works on Date objects
        const hour = new Date(activity.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostActiveHour = Object.entries(hourlyActivity)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "0";

      // Count total questions asked (chat_message_send events)
      const total_questions = eventTypeCounts["chat_message_send"] || 0;

      // Calculate average response time from chat_analytics table
      const avgResponseQuery = DB("chat_analytics")
        .where("user_id", userId)
        .whereNotNull("response_time_ms")
        .avg("response_time_ms as avg_response_time_ms")
        .first();

      const avgResponseResult = await avgResponseQuery;
      const avg_response_time_ms = avgResponseResult?.avg_response_time_ms
        ? Math.round(Number(avgResponseResult.avg_response_time_ms))
        : null;

      const engagement = {
        userId,
        totalActivities,
        total_questions,
        avg_response_time_ms,
        uniqueActiveDays: uniqueDays,
        dailyActivityAverage: Math.round(dailyActivityAvg * 100) / 100,
        mostActiveHour: parseInt(mostActiveHour as string),
        eventTypeBreakdown: eventTypeCounts,
        engagementScore: this.calculateEngagementScore(totalActivities, uniqueDays, days || 30), // Default to 30 days for score calculation
      };

      logger.info("📊 User engagement analyzed", {
        userId,
        engagementScore: engagement.engagementScore,
        totalActivities,
        total_questions,
        avg_response_time_ms,
      });

      return engagement;
    } catch (error) {
      logger.error("❌ Failed to analyze user engagement", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user behavior insights for multiple users
   */
  public async getUserBehaviorInsights(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<any> {
    try {
      // Get aggregated user behavior data
      const behaviorData = await DB("user_activity_events")
        .select("user_id")
        .count("* as total_activities")
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate)
        .groupBy("user_id")
        .orderBy("total_activities", "desc")
        .limit(limit);

      // Get unique days separately for each user
      const uniqueDaysData = await DB.raw(`
        SELECT user_id, COUNT(DISTINCT DATE(created_at)) as unique_days
        FROM user_activity_events
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY user_id
      `, [startDate, endDate]);

      // Get most common event types
      const eventTypeStats = await DB("user_activity_events")
        .select("event_type")
        .count("* as count")
        .where("created_at", ">=", startDate)
        .where("created_at", "<=", endDate)
        .groupBy("event_type")
        .orderBy("count", "desc");

      // Calculate period metrics
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Create a map for quick lookup of unique days
      const uniqueDaysMap = uniqueDaysData.rows.reduce((acc: any, item: any) => {
        acc[item.user_id] = parseInt(item.unique_days);
        return acc;
      }, {} as Record<number, number>);

      const insights = {
        period: {
          startDate,
          endDate,
          days: periodDays,
        },
        userBehavior: behaviorData.map(user => {
          const uniqueDays = uniqueDaysMap[user.user_id] || 1;
          return {
            userId: user.user_id,
            totalActivities: parseInt(user.total_activities),
            uniqueActiveDays: uniqueDays,
            avgDailyActivity: Math.round((user.total_activities / uniqueDays) * 100) / 100,
            engagementScore: this.calculateEngagementScore(
              parseInt(user.total_activities),
              uniqueDays,
              periodDays
            ),
          };
        }),
        eventTypeDistribution: eventTypeStats.map(stat => ({
          eventType: stat.event_type,
          count: parseInt(stat.count),
          percentage: Math.round((stat.count / behaviorData.reduce((sum, u) => sum + parseInt(u.total_activities), 0)) * 10000) / 100,
        })),
        summary: {
          totalUsers: behaviorData.length,
          totalActivities: behaviorData.reduce((sum, user) => sum + parseInt(user.total_activities), 0),
          avgActivitiesPerUser: Math.round((behaviorData.reduce((sum, user) => sum + parseInt(user.total_activities), 0) / behaviorData.length) * 100) / 100,
        },
      };

      logger.info("📈 User behavior insights generated", {
        totalUsers: insights.summary.totalUsers,
        totalActivities: insights.summary.totalActivities,
        period: periodDays,
      });

      return insights;
    } catch (error) {
      logger.error("❌ Failed to get user behavior insights", {
        error: error.message,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Track user feature usage patterns
   */
  public async trackFeatureUsage(
    userId: number,
    featureName: string,
    featureData?: Record<string, any>
  ): Promise<void> {
    try {
      await this.analyticsEventService.trackUserActivity({
        userId,
        eventType: EVENT_TYPES.API_REQUEST,
        eventData: {
          featureName,
          timestamp: new Date(),
          ...featureData,
        },
      });

      logger.info("🎯 Feature usage tracked", {
        userId,
        featureName,
      });
    } catch (error) {
      logger.error("❌ Failed to track feature usage", {
        error: error.message,
        userId,
        featureName,
      });
    }
  }

  /**
   * Calculate engagement score based on activity and consistency
   */
  private calculateEngagementScore(
    totalActivities: number,
    uniqueDays: number,
    periodDays: number
  ): number {
    // Engagement score: (activities per day * consistency factor) * 10
    // Consistency factor: unique active days / total period days
    const avgActivitiesPerDay = totalActivities / Math.max(uniqueDays, 1);
    const consistencyFactor = uniqueDays / Math.max(periodDays, 1);

    const score = Math.min((avgActivitiesPerDay * consistencyFactor) * 10, 100);
    return Math.round(score * 100) / 100;
  }

  /**
   * Get user retention metrics
   */
  public async getUserRetentionMetrics(cohortStartDate: Date, days: number = 30): Promise<any> {
    try {
      const cohortEndDate = new Date(cohortStartDate);
      cohortEndDate.setDate(cohortEndDate.getDate() + 1);

      // Get users who registered in the cohort period
      const cohortUsers = await DB("users")
        .select("id", "created_at")
        .where("created_at", ">=", cohortStartDate)
        .where("created_at", "<", cohortEndDate);

      if (cohortUsers.length === 0) {
        return {
          cohortDate: cohortStartDate,
          cohortSize: 0,
          retentionByDay: [],
        };
      }

      // Calculate retention for each day
      const retentionByDay = [];
      for (let day = 1; day <= days; day++) {
        const checkDate = new Date(cohortStartDate);
        checkDate.setDate(checkDate.getDate() + day);

        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const activeUsers = await DB("user_activity_events")
          .whereIn("user_id", cohortUsers.map(u => u.id))
          .where("created_at", ">=", checkDate)
          .where("created_at", "<", nextDate)
          .countDistinct("user_id as count")
          .first();

        const retentionRate = (Number(activeUsers.count) / cohortUsers.length) * 100;

        retentionByDay.push({
          day,
          date: checkDate.toISOString().split('T')[0],
          activeUsers: Number(activeUsers.count),
          retentionRate: Math.round(retentionRate * 100) / 100,
        });
      }

      const metrics = {
        cohortDate: cohortStartDate.toISOString().split('T')[0],
        cohortSize: cohortUsers.length,
        retentionByDay,
        summary: {
          day1Retention: retentionByDay[0]?.retentionRate || 0,
          day7Retention: retentionByDay[6]?.retentionRate || 0,
          day30Retention: retentionByDay[29]?.retentionRate || 0,
        },
      };

      logger.info("📊 User retention metrics calculated", {
        cohortDate: metrics.cohortDate,
        cohortSize: metrics.cohortSize,
        day1Retention: metrics.summary.day1Retention,
      });

      return metrics;
    } catch (error: any) {
      logger.error("❌ Failed to calculate retention metrics", {
        error: error.message,
        cohortStartDate,
      });
      throw error;
    }
  }

  /**
   * Get Platform Overview Metrics (DAU, WAU, Stickiness, WoW Growth)
   */
  public async getPlatformOverviewMetrics(): Promise<any> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate DAU
      const dauResult = await DB("user_activity_events")
        .where("created_at", ">=", oneDayAgo)
        .countDistinct("user_id as count")
        .first();
      const dau = Number(dauResult?.count || 0);

      // Calculate WAU
      const wauResult = await DB("user_activity_events")
        .where("created_at", ">=", sevenDaysAgo)
        .countDistinct("user_id as count")
        .first();
      const wau = Number(wauResult?.count || 0);

      // Calculate Previous WAU (7-14 days ago) for Growth
      const prevWauResult = await DB("user_activity_events")
        .where("created_at", ">=", fourteenDaysAgo)
        .where("created_at", "<", sevenDaysAgo)
        .countDistinct("user_id as count")
        .first();
      const prevWau = Number(prevWauResult?.count || 0);

      // Calculate MAU
      const mauResult = await DB("user_activity_events")
        .where("created_at", ">=", thirtyDaysAgo)
        .countDistinct("user_id as count")
        .first();
      const mau = Number(mauResult?.count || 0);

      // Stickiness (DAU/MAU ratio) - Highly dynamic metric measuring daily engagement
      const stickiness = mau > 0 ? (dau / mau) * 100 : 0;

      // WoW Growth Rate - Highly dynamic metric measuring expansion
      // If prevWau is 0 but we have users now, that's 100% growth
      let wowGrowth = 0;
      if (prevWau > 0) {
        wowGrowth = ((wau - prevWau) / prevWau) * 100;
      } else if (wau > 0) {
        wowGrowth = 100;
      }

      return {
        daily_active_users: dau,
        weekly_active_users: wau,
        stickiness: Math.round(stickiness * 100) / 100,
        wow_growth: Math.round(wowGrowth * 100) / 100,
      };
    } catch (error: any) {
      logger.error("❌ Failed to get platform overview metrics", { error: error.message });
      throw error;
    }
  }

  /**
   * Get Popular Topics by analyzing chat messages
   */
  public async getPopularTopics(limit: number = 10): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch recent user messages
      const messages = await DB("messages")
        .select("content")
        .where("role", "user")
        .where("created_at", ">=", thirtyDaysAgo)
        .limit(1000); // Analyze the last 1000 messages

      if (messages.length === 0) return [];

      const stopWords = new Set([
        "the", "and", "is", "in", "it", "to", "of", "for", "with", "on", "a", "an",
        "how", "what", "can", "you", "tell", "me", "about", "i", "need", "help", "my",
        "this", "that", "are", "be", "do", "does", "did", "have", "has", "had", "was",
        "were", "will", "would", "should", "could", "as", "at", "by", "from", "or"
      ]);

      const wordCounts: Record<string, number> = {};

      for (const msg of messages) {
        if (!msg.content) continue;
        // Extract words (3+ chars)
        const words = msg.content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        for (const word of words) {
          if (!stopWords.has(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        }
      }

      // Sort by frequency and map to Popular Question interface structure
      const sortedTopics = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([topic, count]) => ({
          eventType: topic.charAt(0).toUpperCase() + topic.slice(1), // Capitalize format needed by frontend
          count,
          percentage: Math.round((count / messages.length) * 100)
        }));

      return sortedTopics;
    } catch (error: any) {
      logger.error("❌ Failed to extract popular topics", { error: error.message });
      throw error;
    }
  }
}

export default UserBehaviorService;