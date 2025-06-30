import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Star,
  GitFork,
  Eye,
  AlertCircle,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Activity,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Github } from "@/components/svg";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubService, GitHubAnalytics } from "@/services/github";

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

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Fetching GitHub analytics...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to Load GitHub Data
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const repoStats = [
    {
      title: "Total Downloads",
      value: formatNumber(analytics.totalDownloads),
      icon: Download,
      color: "from-green-500 to-emerald-500",
      change: "+23%",
    },
    {
      title: "GitHub Stars",
      value: formatNumber(analytics.repository.stargazers_count),
      icon: Star,
      color: "from-yellow-500 to-orange-500",
      change: "+12%",
    },
    {
      title: "Forks",
      value: formatNumber(analytics.repository.forks_count),
      icon: GitFork,
      color: "from-blue-500 to-cyan-500",
      change: "+8%",
    },
    {
      title: "Watchers",
      value: formatNumber(analytics.repository.watchers_count),
      icon: Eye,
      color: "from-purple-500 to-violet-500",
      change: "+15%",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <Github className="w-7 h-7 mr-3" />
            GitHub Analytics
          </h2>
          <p className="text-muted-foreground">
            Real-time insights from your repository
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Repository Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <Github className="w-5 h-5 mr-2" />
                  {analytics.repository.full_name}
                </h3>
                <p className="text-gray-300 mb-4">
                  {analytics.repository.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    {analytics.repository.language}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDate(analytics.repository.created_at)}
                  </span>
                  <span className="flex items-center">
                    <Activity className="w-4 h-4 mr-1" />
                    {formatBytes(analytics.repository.size * 1024)}
                  </span>
                </div>
              </div>
              <a
                href={`https://github.com/${analytics.repository.full_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {repoStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="border-border hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} p-3`}
                  >
                    <stat.icon className="w-full h-full text-white" />
                  </div>
                  <span className="text-green-500 text-sm font-medium">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </h3>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Download Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Download Trends by Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.downloadTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="version"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value) => [
                      formatNumber(value as number),
                      "Downloads",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="downloads"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Asset Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Download Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.assetBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="downloads"
                  >
                    {analytics.assetBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatNumber(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {analytics.assetBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {formatNumber(item.downloads)} (
                      {item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Releases Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="border-border overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Release History
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Version
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Downloads
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Assets
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.releases.map((release, index) => (
                    <motion.tr
                      key={release.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-secondary/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {release.tag_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {release.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Download className="w-4 h-4 mr-2 text-primary" />
                          <span className="font-semibold text-foreground">
                            {formatNumber(release.download_count)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-secondary rounded-full text-xs font-medium text-foreground">
                          {release.assets.length} files
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(release.published_at)}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://github.com/${analytics.repository.full_name}/releases/tag/${release.tag_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GitHubAnalyticsComponent;
