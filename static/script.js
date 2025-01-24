async function searchSongs() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('resultsContainer');

  resultsContainer.innerHTML = "Searching...";

  try {
      const response = await fetch("https://flask-song-app-zfwd.onrender.com/songs");
      
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const songs = await response.json();
      
      const filteredSongs = songs.filter(song => 
          song.title.toLowerCase().includes(query) || 
          song.artist.toLowerCase().includes(query)
      );

      if (filteredSongs.length === 0) {
          resultsContainer.innerHTML = "<p>No songs found.</p>";
      } else {
          resultsContainer.innerHTML = filteredSongs.map(song => 
              `<p>${song.song_number}: ${song.title} by ${song.artist}</p>`
          ).join('');
      }
  } catch (error) {
      console.error("Error fetching songs:", error);
      resultsContainer.innerHTML = `<p>Failed to load songs. Error: ${error.message}</p>`;
  }
}
