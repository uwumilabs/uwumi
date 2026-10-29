"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { Github } from "@/components/svg";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataService } from "../../lib/data";
import { AdminAnalytics } from "../../types";
import { LoadingCard } from "../../components/Loading";
import { formatNumber } from "../../lib/utils";
import { useUser } from "@clerk/nextjs";
import GitHubAnalyticsComponent from "./github-analytics";
import { CHART, StatRow, Breakdown } from "./charts";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await DataService.getAdminAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingCard className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingCard className="lg:col-span-2" />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-card p-8">
        <p className="font-display text-lg font-medium lowercase text-ink">Analytics did not load</p>
        <p className="mt-1 text-sm text-error">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-4 font-display text-sm font-medium lowercase text-primary-foreground transition-colors duration-micro ease-out hover:bg-signal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    { title: "Total Users", value: analytics.stats.totalUsers.toLocaleString() },
    { title: "Active Users", value: analytics.stats.activeUsers.toLocaleString() },
    { title: "Total Content", value: analytics.stats.totalContent.toLocaleString() },
    { title: "Monthly Views", value: formatNumber(analytics.stats.monthlyViews) },
  ];

  const contentData = [
    { name: "Anime", value: analytics.contentStats.anime },
    { name: "Manga", value: analytics.contentStats.manga },
    { name: "Movies", value: analytics.contentStats.movies },
  ];

  const dayLabel = (value: string) =>
    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium lowercase text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back,{" "}
          {user?.firstName || user?.emailAddresses[0]?.emailAddress}! Here&apos;s
          what&apos;s happening with Uwumi.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp aria-hidden />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="github">
            <Github aria-hidden />
            <span>GitHub Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatRow stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                {(["users", "views"] as const).map((key) => (
                  <figure key={key} className="m-0">
                    <figcaption className="mb-2 font-display text-sm font-medium lowercase text-muted-foreground">
                      {key}
                    </figcaption>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.userActivity} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke={CHART.grid} vertical={false} />
                        <XAxis dataKey="date" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={dayLabel} interval={1} padding={{ left: 8, right: 8 }} />
                        <YAxis stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={CHART.tooltip} labelFormatter={dayLabel} />
                        <Line type="monotone" dataKey={key} stroke={CHART.series[0]} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </figure>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Breakdown items={contentData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="github">
          <GitHubAnalyticsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
