# AniQuirk 
**AniQuirk is a dynamic web application designed for anime lovers to explore, search, and manage their favorite anime series. With a sleek and user-friendly interface, AniQuirk allows users to discover trending anime, seasonal releases, and maintain a personalized watchlist, all powered by the Jikan API.**

- **Live Demo:** https://aniquirk.netlify.app/

![image](https://github.com/user-attachments/assets/d849cb50-dea5-4391-932f-51f268da8490)

# Features
- **Search Functionality:** Users can search for any anime by title and view detailed information.
- **Trending Anime:** Displays a list of currently trending anime.
- **Seasonal Anime:** Shows anime that are currently airing in the current season.
- **Watchlist Management:** Users can add or remove anime from their personal watchlist.
- **Responsive Design:** The application is fully responsive and works on various devices.
- **Detailed Anime Information:** Access comprehensive details about each anime, including synopsis, genres, studios, and more.

# Technologies Used
- **HTML5:** For structuring the web pages.
- **CSS3:** For styling the application with a modern look.
- **JavaScript:** For dynamic content and interactivity.
- **Jikan API:** A RESTful API for accessing MyAnimeList data.
- **Font Awesome:** For icons used throughout the application.
- **Local Storage:** For saving user watchlist data.

# Usage
- **Search for Anime:** Use the search bar at the top of the page to find any anime by title.
- **View Trending Anime:** Click on the "Trending Now" section to see the most popular anime.
- **Check Seasonal Anime:** Click on the "Seasonal" button to view anime currently airing.
- **Manage Your Watchlist:** Click on the bookmark icon on any anime card to add or remove it from your watchlist.
- **View Anime Details:** Click on any anime card to see detailed information, including synopsis, genres, and trailers.

# API Integration
AniQuirk utilizes the Jikan API to fetch anime data. The following endpoints are used:

- **Top Anime:** `/top/anime` - Fetches the top trending anime.
- **Seasonal Anime:** `/seasons/now` - Fetches anime currently airing in the current season.
- **Search Anime:** `/anime?q={query}` - Searches for anime based on the user's query.
- **Anime Details:** `/anime/{id}` - Fetches detailed information about a specific anime.

# Rate Limiting
**To prevent exceeding the API rate limits, AniQuirk implements a delay between requests. The default delay is set to 400 milliseconds, ensuring smooth and efficient data retrieval without overwhelming the API.**

# Code-Snippet Example
Here's a snippet of how AniQuirk fetches data from the Jikan API:
```js
async function fetchAPI(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const now = Date.now();
    if (apiCache[url] && apiCache[url].timestamp > now - CACHE_EXPIRATION) {
        return apiCache[url].data;
    }
    
    await delay(RATE_LIMIT_DELAY);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Rate limited, retrying after delay...');
                await delay(1000);
                return fetchAPI(endpoint);
            }
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        apiCache[url] = {
            data: data,
            timestamp: now
        };
        
        return data;
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}
```

# Contact
For any inquiries or feedback, feel free to reach out:
- Author: Ujjawal Singh
- GitHub: volksgeistt
- Email: unrealvolksgeist@gmail.com

Explore the vast world of anime with AniQuirk! If you encounter any issues or have suggestions for improvements, please open an issue in the repository. Happy anime watching!

