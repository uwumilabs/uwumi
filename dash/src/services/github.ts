// GitHub API service for fetching repository data and release analytics
export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: GitHubAsset[];
  download_count: number;
}

export interface GitHubAsset {
  id: number;
  name: string;
  download_count: number;
  size: number;
  content_type: string;
  browser_download_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string;
  size: number;
}

export interface GitHubAnalytics {
  repository: GitHubRepo;
  releases: GitHubRelease[];
  totalDownloads: number;
  latestRelease: GitHubRelease | null;
  downloadTrends: {
    version: string;
    downloads: number;
    date: string;
  }[];
  assetBreakdown: {
    name: string;
    downloads: number;
    percentage: number;
  }[];
}

class GitHubService {
  private baseUrl = "https://api.github.com";
  private owner = "uwumilabs"; // Your GitHub username or organization
  private repo = "uwumi";

  async fetchRepository(): Promise<GitHubRepo> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.owner}/${this.repo}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchReleases(): Promise<GitHubRelease[]> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch releases: ${response.statusText}`);
    }

    const releases = await response.json();

    // Calculate total downloads for each release
    return releases.map((release: any) => ({
      ...release,
      download_count: release.assets.reduce(
        (total: number, asset: GitHubAsset) => total + asset.download_count,
        0
      ),
    }));
  }

  async getAnalytics(): Promise<GitHubAnalytics> {
    try {
      const [repository, releases] = await Promise.all([
        this.fetchRepository(),
        this.fetchReleases(),
      ]);

      const totalDownloads = releases.reduce(
        (total, release) => total + release.download_count,
        0
      );

      const latestRelease = releases.length > 0 ? releases[0] : null;

      // Create download trends data
      const downloadTrends = releases
        .map((release) => ({
          version: release.tag_name,
          downloads: release.download_count,
          date: release.published_at,
        }))
        .reverse(); // Reverse to show chronological order

      // Create asset breakdown from all releases
      const assetMap = new Map<string, number>();
      releases.forEach((release) => {
        release.assets.forEach((asset) => {
          // Group similar assets (e.g., different architectures of same type)
          let assetType = asset.name;

          // Simplify asset names for better grouping
          if (asset.name.includes("android") || asset.name.includes(".apk")) {
            assetType = "Android APK";
          } else if (
            asset.name.includes("ios") ||
            asset.name.includes(".ipa")
          ) {
            assetType = "iOS IPA";
          } else if (
            asset.name.includes("windows") ||
            asset.name.includes(".exe")
          ) {
            assetType = "Windows";
          } else if (
            asset.name.includes("macos") ||
            asset.name.includes(".dmg")
          ) {
            assetType = "macOS";
          } else if (
            asset.name.includes("linux") ||
            asset.name.includes(".AppImage")
          ) {
            assetType = "Linux";
          }

          const currentCount = assetMap.get(assetType) || 0;
          assetMap.set(assetType, currentCount + asset.download_count);
        });
      });

      const assetBreakdown = Array.from(assetMap.entries())
        .map(([name, downloads]) => ({
          name,
          downloads,
          percentage:
            totalDownloads > 0 ? (downloads / totalDownloads) * 100 : 0,
        }))
        .sort((a, b) => b.downloads - a.downloads);

      return {
        repository,
        releases,
        totalDownloads,
        latestRelease,
        downloadTrends,
        assetBreakdown,
      };
    } catch (error) {
      console.error("Failed to fetch GitHub analytics:", error);

      throw new Error("Error fetching GitHub analytics");
    }
  }
}

export const githubService = new GitHubService();
