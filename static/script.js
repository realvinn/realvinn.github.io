document.addEventListener('DOMContentLoaded', () => {
    // Attach real-time "input" listeners
    const titleInput = document.getElementById('searchTitleInput');
    const artistInput = document.getElementById('searchArtistInput');
    
    if (titleInput && artistInput) {
      titleInput.addEventListener('input', searchSongs);
      artistInput.addEventListener('input', searchSongs);
    }
  });

/***************************************************************
 * 1) Fuzzy Matching with Levenshtein Distance
 ***************************************************************/
function levenshteinDistance(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    const dp = Array.from({ length: lenA + 1 }, () =>
      new Array(lenB + 1).fill(0)
    );
  
    // Base cases
    for (let i = 0; i <= lenA; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= lenB; j++) {
      dp[0][j] = j;
    }
  
    // Fill dp table
    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        if (a[i - 1] === b[j - 1]) {
          // Characters match
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          // Insert, remove, or substitute
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
  
    return dp[lenA][lenB];
  }
  
  /**
   * Returns true if 'text' matches 'query' either exactly (includes)
   * or approximately (Levenshtein within a small threshold).
   */
  function fuzzyMatch(query, text) {
    // Quick check: direct substring match
    if (text.includes(query)) return true;
  
    // If not, check approximate distance
    const distance = levenshteinDistance(query, text);
    // You can adjust threshold depending on how lenient you want to be.
    const threshold = 2; 
    return distance <= threshold;
  }
  
  /***************************************************************
   * 2) Search Logic - Title + Artist + Fuzzy
   ***************************************************************/
  /**
   * Called whenever user types in either input box or on button click.
   * Fetches song data, filters by fuzzy matching on title & artist,
   * and displays a zebra-striped table.
   */
  async function searchSongs() {
    // Get user inputs (for title and artist)
    const titleQuery = document
      .getElementById('searchTitleInput')
      .value.trim()
      .toLowerCase();
    const artistQuery = document
      .getElementById('searchArtistInput')
      .value.trim()
      .toLowerCase();
  
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = "Searching...";
  
    try {
      // Fetch data from your Flask endpoint on Render
      const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const songs = await response.json();
  
      // Filter function: match if both queries pass (if not empty)
      const filteredSongs = songs.filter((song) => {
        const titleLower = song.title.toLowerCase();
        const artistLower = song.artist.toLowerCase();
  
        // If user typed something for title, check fuzzy match
        let titlePass = true;
        if (titleQuery) {
          titlePass = fuzzyMatch(titleQuery, titleLower);
        }
  
        // If user typed something for artist, check fuzzy match
        let artistPass = true;
        if (artistQuery) {
          artistPass = fuzzyMatch(artistQuery, artistLower);
        }
  
        // Must pass both if both are non-empty
        return titlePass && artistPass;
      });
  
      // Build a table with alternating row colors
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
              <!-- .song-id class for special styling -->
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
  
  /***************************************************************
   * 3) Real-Time "Search as You Type"
   ***************************************************************/
  /**
   * Attach this to input events on each search box so it triggers
   * searchSongs() on each keystroke.
   */
  function setupSearchListeners() {
    const titleInput = document.getElementById('searchTitleInput');
    const artistInput = document.getElementById('searchArtistInput');
  
    if (titleInput && artistInput) {
      // "input" event fires on each keystroke
      titleInput.addEventListener('input', searchSongs);
      artistInput.addEventListener('input', searchSongs);
    }
  }
  
  // Optionally call setupSearchListeners() automatically
  document.addEventListener('DOMContentLoaded', setupSearchListeners);  