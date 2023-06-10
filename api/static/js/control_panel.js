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
      option.text = `${result.collectionName} by ${result.artistName}`;
      option.dataset.coverUrl = result.artworkUrl100.replace('100x100', '1000x1000');
      option.dataset.albumName = result.collectionName;
      option.dataset.collectionViewUrl = result.collectionViewUrl;
      albumOptions.appendChild(option);
    });
    updateAlbumCover();
  }
}

function updateAlbumCover() {
  const answer = document.getElementById('answer');
  const albumCover = document.getElementById('album-cover');
  const albumOptions = document.getElementById('album-options');
  const cover_url = document.getElementById('cover-url');
  const selectedOption = albumOptions.options[albumOptions.selectedIndex];
  const album_url = document.getElementById('album-url');
  const autocomplete = document.getElementById('autocomplete')

  albumCover.style.visibility = "visible"
  albumOptions.style.visibility = "visible"
  albumCover.src = selectedOption.dataset.coverUrl;
  cover_url.value = selectedOption.dataset.coverUrl;
  album_url.value = selectedOption.dataset.collectionViewUrl;
  if(autocomplete.checked) {
    answer.value = selectedOption.dataset.albumName
  }
}

document.getElementById('answer').addEventListener('change', updateAlbumOptions);
document.getElementById('album-options').addEventListener('change', updateAlbumCover);
