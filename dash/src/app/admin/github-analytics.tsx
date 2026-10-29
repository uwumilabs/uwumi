import React, { useState, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
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
import { githubService, GitHubAnalytics } from "@/services/github";
import { CHART, StatRow, Breakdown } from "./charts";

const GitHubAnalyticsComponent = () => {
  const [analytics, setAnalytics] = useState<GitHubAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await githubService.getAnalytics();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch GitHub analytics"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Fetching GitHub analytics">
        <div className="h-28 rounded-lg bg-card motion-safe:animate-pulse" />
        <div className="h-28 rounded-lg bg-card motion-safe:animate-pulse" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-lg bg-card motion-safe:animate-pulse lg:col-span-2" />
          <div className="h-80 rounded-lg bg-card motion-safe:animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-card p-8">
        <p className="font-display text-lg font-medium lowercase text-ink">
          Failed to Load GitHub Data
        </p>
        <p className="mt-1 text-sm text-error">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 font-display text-sm font-medium lowercase text-primary-foreground transition-colors duration-micro ease-out hover:bg-signal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const repoStats = [
    { title: "Total Downloads", value: formatNumber(analytics.totalDownloads) },
    { title: "GitHub Stars", value: formatNumber(analytics.repository.stargazers_count) },
    { title: "Forks", value: formatNumber(analytics.repository.forks_count) },
    { title: "Watchers", value: formatNumber(analytics.repository.watchers_count) },
  ];

  const pillLink =
    "inline-flex h-9 items-center gap-2 rounded-full px-4 font-display text-sm font-medium lowercase text-ink shadow-[inset_0_0_0_1.5px_var(--color-rule-2)] transition-colors duration-micro ease-out hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-3 font-display text-2xl font-medium lowercase text-foreground">
            <Github className="h-6 w-6" aria-hidden />
            GitHub Analytics
          </h2>
          <p className="text-muted-foreground">Real-time insights from your repository</p>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground tabular-nums">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchAnalytics} className={pillLink}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-card p-6 md:flex-row">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-medium text-ink">
            {analytics.repository.full_name}
          </h3>
          <p className="mt-1 max-w-[65ch] text-ink-2">{analytics.repository.description}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Language</dt>
              <dd className="m-0">{analytics.repository.language}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="m-0 tabular-nums">{formatDate(analytics.repository.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Size</dt>
              <dd className="m-0 tabular-nums">{formatBytes(analytics.repository.size * 1024)}</dd>
            </div>
          </dl>
        </div>
        <a
          href={`https://github.com/${analytics.repository.full_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className={pillLink}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span>View on GitHub</span>
        </a>
      </div>

      <StatRow stats={repoStats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Download Trends by Version</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.downloadTrends} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="version" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} padding={{ left: 8, right: 8 }} />
                <YAxis stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value as number)} />
                <Tooltip
                  contentStyle={CHART.tooltip}
                  formatter={(value) => [formatNumber(value as number), "Downloads"]}
                />
                <Line type="monotone" dataKey="downloads" stroke={CHART.series[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown
              items={analytics.assetBreakdown.map((item) => ({ name: item.name, value: item.downloads }))}
              format={formatNumber}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Release History</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-rule text-left">
                {["Version", "Downloads", "Assets", "Published", "Actions"].map((head) => (
                  <th key={head} className="px-6 py-3 font-display font-medium lowercase text-muted-foreground">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.releases.map((release) => (
                <tr key={release.id} className="border-b border-rule last:border-b-0 transition-colors duration-micro ease-out hover:bg-paper-3">
                  <td className="px-6 py-3">
                    <p className="font-display font-medium text-ink">{release.tag_name}</p>
                    <p className="text-muted-foreground">{release.name}</p>
                  </td>
                  <td className="px-6 py-3 tabular-nums text-ink">{formatNumber(release.download_count)}</td>
                  <td className="px-6 py-3 tabular-nums text-ink-2">{release.assets.length} files</td>
                  <td className="px-6 py-3 tabular-nums text-ink-2">{formatDate(release.published_at)}</td>
                  <td className="px-6 py-3">
                    <a
                      href={`https://github.com/${analytics.repository.full_name}/releases/tag/${release.tag_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ink underline-offset-4 hover:underline hover:decoration-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {analytics.releases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-muted-foreground">
                    No releases published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default GitHubAnalyticsComponent;
