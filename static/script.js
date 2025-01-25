document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('searchTitleInput');
    const artistInput = document.getElementById('searchArtistInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearButton');
  
    // When "Search" is clicked
    if (searchButton) {
      searchButton.addEventListener('click', searchSongs);
    }
  
    // Optional: If you want search as you type, uncomment below
    // titleInput.addEventListener('input', searchSongs);
    // artistInput.addEventListener('input', searchSongs);
  
    // Clear inputs and results
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (titleInput) titleInput.value = "";
        if (artistInput) artistInput.value = "";
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) resultsContainer.innerHTML = "";
      });
    }
  });
  
  /*************************************************************
   * 1) Levenshtein Distance for Fuzzy Matching
   *************************************************************/
  function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );
  
    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    return matrix[a.length][b.length];
  }
  
  /**
   * Returns true if 'text' fuzzy-matches 'query'.
   * We also do a direct 'includes' check for partial substring match.
   * e.g. "sicjo mode" -> "sicko mode"
   */
  function fuzzyMatch(query, text) {
    // Quick substring check
    if (text.includes(query)) return true;
  
    // Otherwise, approximate distance
    const distance = levenshteinDistance(query, text);
    // A threshold of ~3 handles short typos
    return distance <= 3;
  }
  
  /*************************************************************
   * 2) Main Search Function
   *************************************************************/
  async function searchSongs() {
    const titleQuery = (document.getElementById('searchTitleInput').value || "").trim().toLowerCase();
    const artistQuery = (document.getElementById('searchArtistInput').value || "").trim().toLowerCase();
    const resultsContainer = document.getElementById('resultsContainer');
  
    resultsContainer.innerHTML = "Searching...";
  
    try {
      // Fetch from your Render backend or wherever your Flask is hosted
      const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const songs = await response.json();
  
      // Filter for matches on both Title & Artist if provided
      const filteredSongs = songs.filter((song) => {
        const titleLower = song.title.toLowerCase();
        const artistLower = song.artist.toLowerCase();
  
        let titleMatches = true;
        let artistMatches = true;
  
        if (titleQuery) {
          titleMatches = fuzzyMatch(titleQuery, titleLower);
        }
        if (artistQuery) {
          artistMatches = fuzzyMatch(artistQuery, artistLower);
        }
  
        // Must pass both if both queries are non-empty
        return titleMatches && artistMatches;
      });
  
      if (filteredSongs.length === 0) {
        resultsContainer.innerHTML = "<p>No songs found.</p>";
      } else {
        let tableHTML = `
          <table class="song-table">
            <thead>
              <tr>
                <th>Song #</th>
                <th>Title</th>
                <th>Artist</th>
              </tr>
            </thead>
            <tbody>
        `;
  
        filteredSongs.forEach((song) => {
          tableHTML += `
            <tr>
              <td class="song-id">${song.song_number}</td>
              <td>${song.title}</td>
              <td>${song.artist}</td>
            </tr>
          `;
        });
  
        tableHTML += `
            </tbody>
          </table>
        `;
  
        resultsContainer.innerHTML = tableHTML;
      }
  
    } catch (error) {
      console.error("Error fetching songs:", error);
      resultsContainer.innerHTML = `<p>Failed to load songs. Error: ${error.message}</p>`;
    }
  }
  