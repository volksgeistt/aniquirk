const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const animeContainer = document.getElementById('anime-container');
const watchlistContainer = document.getElementById('watchlist-container');
const seasonalContainer = document.getElementById('seasonal-container');
const searchContainer = document.getElementById('search-container');
const showWatchlistButton = document.getElementById('show-watchlist');
const showSeasonalButton = document.getElementById('show-seasonal');
const backToTrendingButton = document.getElementById('back-to-trending');
const loadingIndicator = document.getElementById('loading');
const noResultsMessage = document.getElementById('no-results');
const animeModal = document.getElementById('anime-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseButton = document.querySelector('.close');
const heroBanner = document.getElementById('hero-banner');
const exploreButton = document.getElementById('explore-btn');

const trendingHeading = document.getElementById('trending-heading');
const resultsHeading = document.getElementById('results-heading');
const watchlistHeading = document.getElementById('watchlist-heading');
const seasonalHeading = document.getElementById('seasonal-heading');

const filterAll = document.getElementById('filter-all');
const filterTV = document.getElementById('filter-tv');
const filterMovie = document.getElementById('filter-movie');
const filterOVA = document.getElementById('filter-ova');

const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 400; 
const CACHE_EXPIRATION = 30 * 60 * 1000; 
const MAX_TRENDING_ITEMS = 20; 

const apiCache = {};

let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let activeContainer = animeContainer;
let activeFilter = 'all';
let lastSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    
    hideNoResults();
    
    showLoading(true);
    
    loadTrendingAnime().catch(error => {
        console.error('Error during initial load:', error);
        showNoResults();
    });
    
    updateHeroBanner();
    applyTheme();
}

function setupEventListeners() {
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    showWatchlistButton.addEventListener('click', showWatchlist);
    showSeasonalButton.addEventListener('click', showSeasonalAnime);
    backToTrendingButton.addEventListener('click', showTrending);
    exploreButton.addEventListener('click', showTrending);

    filterAll.addEventListener('click', () => applyFilter('all'));
    filterTV.addEventListener('click', () => applyFilter('tv'));
    filterMovie.addEventListener('click', () => applyFilter('movie'));
    filterOVA.addEventListener('click', () => applyFilter('ova'));

    modalCloseButton.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === animeModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && animeModal.style.display === 'block') {
            closeModal();
        }
    });
}

function applyTheme() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
        document.body.classList.add('dark-theme');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

async function loadTrendingAnime() {
    showLoading(true);
    hideNoResults();
    
    try {
        const data = await fetchAPI('/top/anime?limit=20');
        if (data && data.data && data.data.length > 0) {
            renderAnimeGrid(data.data, animeContainer);
            hideNoResults();
            return data;
        } else {
            throw new Error('No anime data returned from API');
        }
    } catch (error) {
        console.error('Error loading trending anime:', error);
        
        if (animeContainer.children.length === 0) {
            showNoResults();
        }
        
        throw error;
    } finally {
        showLoading(false);
    }
}

async function loadSeasonalAnime() {
    showLoading(true);
    hideNoResults();
    
    try {
        const data = await fetchAPI('/seasons/now?limit=20');
        if (data && data.data && data.data.length > 0) {
            renderAnimeGrid(data.data, seasonalContainer);
            hideNoResults();
            return data;
        } else {
            throw new Error('No seasonal anime data returned from API');
        }
    } catch (error) {
        console.error('Error loading seasonal anime:', error);
        
        if (seasonalContainer.children.length === 0) {
            showNoResults();
        }
        
        throw error;
    } finally {
        showLoading(false);
    }
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    if (query === lastSearchQuery && searchContainer.children.length > 0) {
        showSearch();
        return;
    }
    
    lastSearchQuery = query;
    showSearch();
    showLoading(true);
    hideNoResults();
    
    try {
        const data = await fetchAPI(`/anime?q=${encodeURIComponent(query)}&limit=20`);
        if (data && data.data && data.data.length > 0) {
            renderAnimeGrid(data.data, searchContainer);
            hideNoResults();
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error searching anime:', error);
        showNoResults();
    } finally {
        showLoading(false);
    }
}

function showTrending() {
    resetActiveState();
    hideAll();
    trendingHeading.classList.remove('hidden');
    animeContainer.classList.remove('hidden');
    backToTrendingButton.classList.add('hidden');
    activeContainer = animeContainer;
    
    if (animeContainer.querySelectorAll('.anime-card').length > 0) {
        hideNoResults();
    } else {
        loadTrendingAnime().catch(error => {
            console.error('Error reloading trending anime:', error);
        });
    }
    
    applyFilter(activeFilter);
}

function showWatchlist() {
    resetActiveState();
    hideAll();
    watchlistHeading.classList.remove('hidden');
    watchlistContainer.classList.remove('hidden');
    backToTrendingButton.classList.remove('hidden');
    activeContainer = watchlistContainer;
    
    renderWatchlist();
}

async function showSeasonalAnime() {
    resetActiveState();
    hideAll();
    seasonalHeading.classList.remove('hidden');
    seasonalContainer.classList.remove('hidden');
    backToTrendingButton.classList.remove('hidden');
    activeContainer = seasonalContainer;
    
    if (seasonalContainer.children.length === 0) {
        await loadSeasonalAnime().catch(error => {
            console.error('Error loading seasonal anime:', error);
        });
    } else {
        if (seasonalContainer.querySelectorAll('.anime-card').length > 0) {
            hideNoResults();
        } else {
            showNoResults();
        }
    }
    
    applyFilter(activeFilter);
}

function showSearch() {
    resetActiveState();
    hideAll();
    resultsHeading.classList.remove('hidden');
    searchContainer.classList.remove('hidden');
    backToTrendingButton.classList.remove('hidden');
    activeContainer = searchContainer;
    
    if (searchContainer.querySelectorAll('.anime-card').length > 0) {
        hideNoResults();
    }
}

function hideAll() {
    animeContainer.classList.add('hidden');
    watchlistContainer.classList.add('hidden');
    seasonalContainer.classList.add('hidden');
    searchContainer.classList.add('hidden');
    trendingHeading.classList.add('hidden');
    resultsHeading.classList.add('hidden');
    watchlistHeading.classList.add('hidden');
    seasonalHeading.classList.add('hidden');
}

function showLoading(show) {
    if (show) {
        loadingIndicator.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading anime...</p>
            </div>
        `;
        loadingIndicator.classList.remove('hidden');
    } else {
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
        }, 300);
    }
}

function showNoResults() {
    noResultsMessage.innerHTML = `
        <div class="no-results-container">
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f50d.svg" alt="Search" class="no-results-icon">
            <h3>Nothing found</h3>
            <p class="no-results-text">
                ${getContextSpecificMessage()}
            </p>
            ${activeContainer === watchlistContainer ? 
                '<button id="browse-anime-btn" class="action-btn primary">Browse Anime</button>' : ''}
        </div>
    `;
    
    const browseBtn = document.getElementById('browse-anime-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', showTrending);
    }
    
    noResultsMessage.classList.remove('hidden');
}

function getContextSpecificMessage() {
    if (activeContainer === watchlistContainer) {
        return "Your watchlist is empty. Start adding anime to keep track of what you want to watch!";
    } else if (activeContainer === searchContainer) {
        return `No results found for "${lastSearchQuery}". Try different keywords or check your spelling.`;
    } else if (activeContainer === seasonalContainer) {
        return "No seasonal anime found. Please try again later or check trending anime.";
    } else {
        return "No anime found. Please try again later or try a different search.";
    }
}

function hideNoResults() {
    noResultsMessage.classList.add('hidden');
}

function resetActiveState() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterAll.classList.add('active');
    activeFilter = 'all';
}

function applyFilter(filter) {
    activeFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${filter}`).classList.add('active');
    
    const cards = activeContainer.querySelectorAll('.anime-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const type = card.dataset.type.toLowerCase();
        if (filter === 'all' || type.includes(filter.toLowerCase())) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        if (cards.length > 0) {
            showNoResults();
        } else if (activeContainer.children.length === 0) {
            showNoResults();
        }
    } else {
        hideNoResults();
    }
}

function renderAnimeGrid(animeList, container) {
    container.innerHTML = '';
    
    if (!animeList || animeList.length === 0) {
        showNoResults();
        return;
    }
    
    const limitedList = container === animeContainer ? 
        animeList.slice(0, MAX_TRENDING_ITEMS) : animeList;
    
    limitedList.forEach(anime => {
        const card = createAnimeCard(anime);
        container.appendChild(card);
    });
    
    hideNoResults();
    
    applyFilter(activeFilter);
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.mal_id;
    card.dataset.type = anime.type || 'Unknown';
    
    const isInWatchlist = watchlist.some(item => item.mal_id === anime.mal_id);
    const posterUrl = anime.images?.jpg?.large_image_url || 'placeholder-image.jpg';
    
    card.innerHTML = `
        <div class="anime-poster-container">
            <img class="anime-poster" src="${posterUrl}" alt="${anime.title}" loading="lazy">
            <span class="anime-type">${anime.type || 'N/A'}</span>
            <span class="anime-score"><i class="fas fa-star"></i> ${anime.score ? anime.score.toFixed(1) : 'N/A'}</span>
            <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}">
                <i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
            </button>
        </div>
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
            <div class="anime-year">
                <i class="fas fa-calendar-alt"></i>
                <span>${anime.aired?.from ? new Date(anime.aired.from).getFullYear() : 'N/A'}</span>
            </div>
        </div>
    `;
    
    card.querySelector('.watchlist-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(anime);
    });
    
    card.addEventListener('click', () => {
        openAnimeDetails(anime.mal_id);
    });
    
    return card;
}

function toggleWatchlist(anime) {
    const index = watchlist.findIndex(item => item.mal_id === anime.mal_id);
    
    if (index === -1) {
        watchlist.push(anime);
        
        document.querySelectorAll(`.anime-card[data-id="${anime.mal_id}"] .watchlist-btn`).forEach(btn => {
            btn.classList.add('active');
            btn.querySelector('i').classList.remove('fa-bookmark-o');
            btn.querySelector('i').classList.add('fa-bookmark');
        });
    } else {
        watchlist.splice(index, 1);
        
        document.querySelectorAll(`.anime-card[data-id="${anime.mal_id}"] .watchlist-btn`).forEach(btn => {
            btn.classList.remove('active');
            btn.querySelector('i').classList.remove('fa-bookmark');
            btn.querySelector('i').classList.add('fa-bookmark-o');
        });
        
        if (activeContainer === watchlistContainer) {
            document.querySelector(`.anime-card[data-id="${anime.mal_id}"]`)?.remove();
            
            if (watchlist.length === 0) {
                showNoResults();
            }
        }
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function renderWatchlist() {
    watchlistContainer.innerHTML = '';
    
    if (watchlist.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    
    watchlist.forEach(anime => {
        const card = createAnimeCard(anime);
        watchlistContainer.appendChild(card);
    });
    
    applyFilter(activeFilter);
}

async function openAnimeDetails(animeId) {
    showLoading(true);
    try {
        const animeData = await fetchAPI(`/anime/${animeId}`);
        const anime = animeData.data;
        
        const charactersData = await fetchAPI(`/anime/${animeId}/characters`);
        
        renderAnimeDetails(anime, charactersData.data);
        
        animeModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading anime details:', error);
    } finally {
        showLoading(false);
    }
}

function renderAnimeDetails(anime, characters) {
    const isInWatchlist = watchlist.some(item => item.mal_id === anime.mal_id);
    
    modalContent.innerHTML = `
        <div class="anime-detail-container">
            <div class="anime-detail-banner">
                <img class="anime-detail-backdrop" src="${anime.images.jpg.large_image_url}" alt="Backdrop">
            </div>
            
            <div class="anime-detail-poster-container">
                <img class="anime-detail-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
            </div>
            
            <div class="anime-detail-info">
                <div class="anime-detail-header">
                    <h2 class="anime-detail-title">${anime.title}</h2>
                    ${anime.title_english && anime.title_english !== anime.title ? `<p>${anime.title_english}</p>` : ''}
                    
                    <div class="anime-detail-meta">
                        <div class="anime-meta-item">
                            <i class="fas fa-tv"></i>
                            <span>${anime.type || 'Unknown'}</span>
                        </div>
                        <div class="anime-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${anime.aired?.from ? new Date(anime.aired.from).getFullYear() : 'N/A'}</span>
                        </div>
                        <div class="anime-meta-item">
                            <i class="fas fa-stopwatch"></i>
                            <span>${anime.duration || 'Unknown'}</span>
                        </div>
                        <div class="anime-meta-item">
                            <i class="fas fa-closed-captioning"></i>
                            <span>${anime.status || 'Unknown'}</span>
                        </div>
                        <div class="anime-meta-item">
                            <i class="fas fa-film"></i>
                            <span>${anime.episodes ? anime.episodes + ' Episodes' : 'Unknown'}</span>
                        </div>
                    </div>
                    
                    <div class="anime-detail-ratings">
                        <div class="rating-box">
                            <i class="fas fa-star"></i>
                            <div>
                                <span>${anime.score ? anime.score.toFixed(2) : 'N/A'}</span>
                                <span class="rating-source">MAL Score</span>
                            </div>
                        </div>
                        <div class="rating-box">
                            <i class="fas fa-users"></i>
                            <div>
                                <span>${anime.scored_by ? anime.scored_by.toLocaleString() : 'N/A'}</span>
                                <span class="rating-source">Users</span>
                            </div>
                        </div>
                        <div class="rating-box">
                            <i class="fas fa-heart"></i>
                            <div>
                                <span>${anime.favorites ? anime.favorites.toLocaleString() : 'N/A'}</span>
                                <span class="rating-source">Favorites</span>
                            </div>
                        </div>
                        <div class="rating-box">
                            <i class="fas fa-eye"></i>
                            <div>
                                <span>${anime.members ? anime.members.toLocaleString() : 'N/A'}</span>
                                <span class="rating-source">Members</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="action-btn primary watchlist-action" data-id="${anime.mal_id}">
                            <i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
                            ${isInWatchlist ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
                        </button>
                        ${anime.url ? `
                            <a href="${anime.url}" target="_blank" class="action-btn">
                                <i class="fas fa-external-link-alt"></i>
                                VIEW ON MAL
                            </a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="anime-detail-section">
                    <h3><i class="fas fa-info-circle"></i> Synopsis</h3>
                    <div class="anime-detail-synopsis">
                        <p>${anime.synopsis || 'No synopsis available.'}</p>
                    </div>
                </div>
                
                ${anime.trailer?.embed_url ? `
                    <div class="anime-detail-section">
                        <h3><i class="fas fa-film"></i> Trailer</h3>
                        <div class="trailer-container">
                            <iframe class="trailer-iframe" src="${anime.trailer.embed_url}" 
                                frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : ''}
                
                <div class="anime-detail-section">
                    <h3><i class="fas fa-tags"></i> Genres</h3>
                    <div class="genre-list">
                        ${anime.genres.map(genre => `
                            <span class="genre-tag">${genre.name}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="anime-detail-section">
                    <h3><i class="fas fa-building"></i> Studios</h3>
                    <div class="studio-list">
                        ${anime.studios.map(studio => `
                            <span class="studio-tag">${studio.name}</span>
                        `).join('')}
                    </div>
                </div>
                
                ${characters.length > 0 ? `
                    <div class="anime-detail-section">
                        <h3><i class="fas fa-users"></i> Main Characters</h3>
                        <div class="character-grid">
                            ${characters.slice(0, 8).map(char => `
                                <div class="character-card">
                                    <img class="character-image" src="${char.character.images.jpg.image_url}" alt="${char.character.name}" loading="lazy">
                                    <div class="character-info">
                                        <div class="character-name">${char.character.name}</div>
                                        <div class="character-role">${char.role}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const watchlistBtn = modalContent.querySelector('.watchlist-action');
    watchlistBtn.addEventListener('click', () => {
        const animeObj = {
            mal_id: anime.mal_id,
            title: anime.title,
            images: anime.images,
            type: anime.type,
            score: anime.score,
            aired: anime.aired
        };
        
        toggleWatchlist(animeObj);
        
        const isNowInWatchlist = watchlist.some(item => item.mal_id === anime.mal_id);
        watchlistBtn.innerHTML = `
            <i class="fas ${isNowInWatchlist ? 'fa-bookmark' : 'fa-bookmark-o'}"></i>
            ${isNowInWatchlist ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
        `;
    });
}

function closeModal() {
    animeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function updateHeroBanner() {
    try {
        const data = await fetchAPI('/top/anime?limit=10');
        if (data && data.data && data.data.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(10, data.data.length));
            const randomAnime = data.data[randomIndex];
            
            heroBanner.style.backgroundImage = `url(${randomAnime.images.jpg.large_image_url})`;
            heroBanner.querySelector('h2').textContent = randomAnime.title;
            heroBanner.querySelector('p').textContent = randomAnime.synopsis ? 
                truncateText(randomAnime.synopsis, 150) : 
                'Explore the vast world of anime with our comprehensive collection';
            
            heroBanner.addEventListener('click', (e) => {
                if (!e.target.closest('.hero-btn')) {
                    openAnimeDetails(randomAnime.mal_id);
                }
            });
        }
    } catch (error) {
        console.error('Error updating hero banner:', error);
    }
}

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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
