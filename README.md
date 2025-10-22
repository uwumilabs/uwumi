<h1 align="center">
  <img src="./assets/images/icon.png" alt="uwumi" width="128" />
  <br />
  Uwumi
</h1>

<p align="center">
  A feature-rich anime, manga and movie streaming app built with React Native and Expo
</p>
<a href="https://discord.gg/n7xVPxbG4R">
  <img
    src="https://img.shields.io/discord/1387063063223599265?color=7289da&label=discord&logo=discord&logoColor=7289d"
    alt="discord"
  />
</a>

## ✨ Features

- 📱 Cross-platform (Android, Android TV) support
- 🎬 Stream anime and movies with multiple quality options
- 📺 Track watch progress across episodes and series
- ⭐ Favorites management for quick access to your preferred content
- 📖 Manga chapter reading functionality
- 🔍 Powerful search with debounced input
- 🌙 Customizable themes with pure black background support
- 🎨 Accent color customization
- 🌐 Multiple server support with dynamic API selection
- 💾 Persistent storage for user preferences

## 📸 Screenshots

| Home & Discovery | Content Details | Video Player | Manga Reader |
|:---------------:|:---------------:|:---------------:|:---------------:|
| <img src="./assets/screenshots/anime.png" alt="Anime Screen" width="250"/> | <img src="./assets/screenshots/anime-info.png" alt="Anime Info" width="250"/> | <img src="./assets/screenshots/video-player.png" alt="Video Player" width="250"/> | <img src="./assets/screenshots/manga-reader.png" alt="Manga Reader" width="250"/> |

| Library & Tracking | Settings & Customization |
|:---------------:|:---------------:|
| <img src="./assets/screenshots/favorites.png" alt="Favorites" width="250"/> | <img src="./assets/screenshots/theme.png" alt="Theme Customization" width="250"/> |

## 🚀 Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/2004durgesh/uwumi.git
   cd uwumi
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

### Environment Variables

Create a `.env` file in the root of the project and add the following variables:

```bash
# API URLs (Currently not in use - kept for reference)
EXPO_PUBLIC_API_URL=  # Leave blank - Original Consumet API endpoint (deprecated)
EXPO_PUBLIC_API_URL_DEV=  # Leave blank - Development API endpoint (deprecated)

EXPO_PUBLIC_EPISODE_API_URL=  # Leave blank - Episodes API endpoint (no longer active)  
EXPO_PUBLIC_EPISODE_API_URL_DEV=  # Leave blank - Development episodes API (no longer active)

# Active Configuration
EXPO_TV=1  # Set to 1 to enable Android TV support (for tv-support branch)
EXPO_TMDB_API_KEY=your_tmdb_api_key_here  # Required: TMDB API key for movie and series data
```

> [!NOTE] 
> This project uses [react-native-consumet](https://github.com/2004durgesh/react-native-consumet) instead of the external Consumet API for content fetching. The API URL variables are currently not in use as the external endpoints are no longer maintained or active. These configuration fields are kept for potential future implementation or reference purposes, so you can leave them blank in your `.env` file.
   

## 🏗️ Building for Production

### Android
```bash
npm run android
```

## 🤝 **Contributing**  

We ❤️ contributions! Whether it's a **bug fix, feature addition, or documentation improvement**, your help makes **Uwumi** even better.  

### 🛠 **How to Contribute**  

1. **Fork** the repository  

2. **Clone your fork**  
   ```bash
   git clone https://github.com/2004durgesh/uwumi.git
   cd uwumi
   ```

3. **Create a new branch**  
   ```bash
      git checkout -b fix/video-player-controls
      ```

   4. **Make your changes**  
      - Follow the existing **code style** and **best practices**.  
      - Ensure your code is **well-tested and functional**.  

   5. **Commit your changes**  
      ```bash
      git commit -m "feat: add manga chapter bookmark functionality"
      ```

   6. **Push to your branch**  
      ```bash
      git push origin fix/video-player-controls
      ```

7. **Open a Pull Request (PR)**  
   - Go to the [**Uwumi repository**](https://github.com/2004durgesh/uwumi).  
   - Click **New Pull Request** and select your branch.  
   - Add a **clear title & description** explaining your changes.  
   - Submit the PR and wait for review! 🚀  

### ✅ **Contribution Guidelines**  

✔️ Keep commit messages **clear and descriptive** (e.g., `fix: Adjust button visibility`).  
✔️ Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.  
✔️ Ensure **no breaking changes** unless necessary.  
✔️ Run tests before submitting a PR (if applicable).  
✔️ If adding a new feature, update the **README** if needed.  

### 🏅 **Need Help?**  

If you have any questions, feel free to:  
💬 **Open an issue** – Report bugs, suggest features, or ask for help.  
🚀 **Your contributions help make Uwumi better!** 🎉  

## 📞 Contact Me

Got a question, idea, or just want to chat? I'm all ears! Feel free to reach out for:

> 🐛 **Bug Reports**\
> 💡 **Feature Suggestions**\
> 🤝 **Collaboration Opportunities**\
> ❓ **General Project Queries**

---

### 📬 Reach Out

* **📧 Email**: [durgeshdwivedi81@gmail.com](mailto:durgeshdwivedi81@gmail.com)
* **💬 Discord**: [Join the community](https://discord.gg/n7xVPxbG4R)



## Acknowledgements
[Consumet](https://github.com/consumet/consumet.ts)\
[Aniyomi](https://github.com/aniyomiorg/aniyomi) - For ui inspiration.\
[Miruro](https://www.miruro.to/watch) - For ui inspiration.