function removeItem(itemId) {
  console.log(itemId)
  fetch('/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: itemId })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      document.getElementById(itemId).remove();
      document.getElementById(itemId).remove();
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


async function updateAlbumOptions() {
  const answer = document.getElementById('answer').value;
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(answer)}&country=US&media=music&entity=album&limit=10`);
  const data = await res.json();

  if (data.resultCount > 0) {
    const albumOptions = document.getElementById('album-options');
    albumOptions.innerHTML = '';
    data.results.forEach(result => {
      const option = document.createElement('option');
      option.value = result.artworkUrl100.replace('100x100', '1000x1000');
      option.text = `${result.collectionName} by ${result.artistName}`;
      albumOptions.appendChild(option);
    });
    updateAlbumCover();
  }
}

function updateAlbumCover() {
  const albumCover = document.getElementById('album-cover');
  const albumOptions = document.getElementById('album-options');
  const link = document.getElementById('link');
  albumCover.style.visibility = "visible"
  albumOptions.style.visibility = "visible"
  albumCover.src = albumOptions.value;
  link.value = albumOptions.value;
}


document.getElementById('album-options').addEventListener('change', updateAlbumCover);
document.getElementById('answer').addEventListener('change', updateAlbumOptions);