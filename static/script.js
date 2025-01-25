/*************************************************************
 * 1) Fuzzy Matching (Levenshtein Distance)
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
   */
  function fuzzyMatch(query, text) {
    // If the text already includes the query, return true quickly
    if (text.includes(query)) return true;
  
    // Otherwise, check approximate distance
    const distance = levenshteinDistance(query, text);
    // Adjust threshold based on how lenient you want to be
    // e.g. "sicjo" -> "sicko" is 2 edits (j -> k, remove extra letter)
    const threshold = 3;
    return distance <= threshold;
  }
  
  /*************************************************************
   * 2) Search Function
   *************************************************************/
  async function searchSongs() {
    const userQuery = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('resultsContainer');
  
    // Show "Searching..." message
    resultsContainer.innerHTML = "Searching...";
  
    try {
      // Fetch from your Render URL or wherever your Flask app is hosted
      const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const songs = await response.json();
  
      // Filter songs using fuzzy matching on the entire user query
      const filtered = songs.filter(song => {
        const titleLower = song.title.toLowerCase();
        return fuzzyMatch(userQuery, titleLower);
      });
  
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
  
        filtered.forEach(song => {
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
      resultsContainer.innerHTML = `<p>Failed to load songs. Error: ${error.message}</p>`;
    }
  }
  