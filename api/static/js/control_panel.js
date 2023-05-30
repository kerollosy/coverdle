const link = document.getElementById("link");
const image = document.getElementById("image");
const image_link = document.getElementById("image link");
// check if this checkbox is clicked
link.addEventListener("click", function() {;
    if(link.checked) {
        image.toggleAttribute("hidden")
        image_link.removeAttribute("hidden")
    } else {
        image_link.toggleAttribute("hidden")
        image.removeAttribute("hidden")
    }
})


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
  