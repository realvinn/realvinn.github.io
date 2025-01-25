document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('searchTitleInput');
    const artistInput = document.getElementById('searchArtistInput');
    const searchBtn = document.getElementById('searchButton');
    const clearBtn = document.getElementById('clearButton');
  
    // Handle the "Search" button click
    if (searchBtn) {
      searchBtn.addEventListener('click', searchSongs);
    }
  
    // Handle "Clear" button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (titleInput) titleInput.value = "";
        if (artistInput) artistInput.value = "";
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) resultsContainer.innerHTML = "";
      });
    }
  });
  
  /*************************************************************
   * 1) Levenshtein Distance for Tighter Fuzzy Matching
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
   * Quick fuzzy match with substring OR distance <= 1
   */
  function fuzzyMatch(query, text) {
    // If text includes the query exactly
    if (text.includes(query)) return true;
  
    // Otherwise, approximate distance
    const distance = levenshteinDistance(query, text);
    // THRESHOLD = 1 => extremely tight
    return distance <= 1;
  }
  
  /*************************************************************
   * 2) Main Search Function
   *************************************************************/
  async function searchSongs() {
    const titleQuery = (document.getElementById('searchTitleInput')?.value ?? "").trim().toLowerCase();
    const artistQuery = (document.getElementById('searchArtistInput')?.value ?? "").trim().toLowerCase();
    const resultsContainer = document.getElementById('resultsContainer');
  
    resultsContainer.innerHTML = "Searching...";
  
    try {
      // Replace with your actual Flask endpoint on Render
      const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const songs = await response.json();
  
      // Filter using fuzzy match for both title & artist
      let filtered = songs.filter((song) => {
        const t = song.title.toLowerCase();
        const a = song.artist.toLowerCase();
  
        let titleOk = true;
        let artistOk = true;
  
        if (titleQuery) {
          titleOk = fuzzyMatch(titleQuery, t);
        }
        if (artistQuery) {
          artistOk = fuzzyMatch(artistQuery, a);
        }
        return titleOk && artistOk;
      });
  
      // Now check if results exceed 50
      const totalMatches = filtered.length;
      let truncated = false;
      if (filtered.length > 50) {
        filtered = filtered.slice(0, 50);
        truncated = true;
      }
  
      if (filtered.length === 0) {
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
  
        filtered.forEach((song) => {
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
  
        // If we truncated results, add a note
        if (truncated) {
          tableHTML += `
            <p style="margin-top: 1rem; color: #ff7f3f; font-weight: 600;">
              We found ${totalMatches} matches. Showing only the first 50. Please be more specific!
            </p>
          `;
        }
  
        resultsContainer.innerHTML = tableHTML;
      }
  
    } catch (error) {
      console.error("Error fetching songs:", error);
      resultsContainer.innerHTML = `<p>Failed to load songs. Error: ${error.message}</p>`;
    }
  }  