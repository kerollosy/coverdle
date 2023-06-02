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
        // Handle any errors
        console.error('Error:', error);
      });
  }
  