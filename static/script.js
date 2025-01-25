document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('searchTitleInput');
  const artistInput = document.getElementById('searchArtistInput');
  const searchButton = document.getElementById('searchButton');
  
  let searchTimeout;

  if (titleInput && artistInput && searchButton) {
    // Run search on button click
    searchButton.addEventListener('click', searchSongs);

    // Debounce input event: Trigger search 3 seconds after typing starts
    const debounceSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchSongs();
      }, 3000);
    };

    titleInput.addEventListener('input', debounceSearch);
    artistInput.addEventListener('input', debounceSearch);
  }
});

// Levenshtein Distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

// Fuzzy match with threshold
function fuzzyMatch(query, text) {
  const distance = levenshteinDistance(query, text);
  const threshold = 2;  // Adjust threshold for typo tolerance
  return distance <= threshold || text.includes(query);
}

// Search function
async function searchSongs() {
  const titleQuery = document.getElementById('searchTitleInput').value.trim().toLowerCase();
  const artistQuery = document.getElementById('searchArtistInput').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('resultsContainer');

  resultsContainer.innerHTML = "Searching...";

  try {
    const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const songs = await response.json();

    const filteredSongs = songs.filter((song) => {
      const titleLower = song.title.toLowerCase();
      const artistLower = song.artist.toLowerCase();
      return (
        (titleQuery === "" || fuzzyMatch(titleQuery, titleLower)) &&
        (artistQuery === "" || fuzzyMatch(artistQuery, artistLower))
      );
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
    resultsContainer.innerHTML = `<p>Failed to load songs. Error: ${error.message}</p>`;
  }
}
