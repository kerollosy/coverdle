// DOM elements
const mainButton = document.getElementById("mainButton")
const guessInput = document.getElementById("guessInput")
const submitGuessButton = document.getElementById("submitGuessButton")
const idkButton = document.getElementById("idk")
const timerElement = document.getElementById("timer")
const guessSection = document.getElementById("guessSection")
const mainElement = document.getElementById("main")
const poster = document.getElementById("album-cover")
const header = document.getElementById("header")
const loading_screen = document.getElementById("loading-screen")
const info = document.getElementById('info')
const close_overlay = document.querySelector("#info-close-button")
const play_now = document.querySelector("#info-play-now-button")
const overlay = document.querySelector("#info-overlay")
const orig_overlay = overlay.className


// Game variables
let countdown
let imaged
let remainingTime = 5
let sampleSize = (remainingTime * 100) - 100
let defaultSampleSize = sampleSize
let pixelate = Math.trunc(sampleSize / (remainingTime * 10))
let guesses = 3
let started = false
const correctAnswer = "blond"
const options = ["blond", "blonde", "bloray", "blorax", "damn"]


// Canvas variables
let width
let height
let pixelData
let canvas = document.createElement("canvas")
canvas.width = width
canvas.height = height
const context = canvas.getContext("2d", { willReadFrequently: true })


// Cookie
const cookieName = 'gameCookie'
let currentDate = 0
let year = 0
let month = 0
let day = 0
let cookieValue = 0
let play = true



// Append the canvas to the main element
mainElement.appendChild(canvas)

// Add event listeners
mainButton.addEventListener("click", handleMainButtonClick)
submitGuessButton.addEventListener("click", handleSubmitGuess)
idkButton.addEventListener("click", handleIdkButtonClick)


function removeDataLists() {
  const existingOptions = document.querySelectorAll("#albums");
  for (let i = 0; i < existingOptions.length; i++) {
    existingOptions[i].remove();
  }
}

guessInput.addEventListener('input', function () {
  let val = guessInput.value;
  if (!val) {
    return false
  }


  if (val.length >= 2) {
    // Remove existing data list
    removeDataLists()

    let datalist = document.createElement("datalist")
    datalist.setAttribute("id", "albums")
    guessInput.parentNode.appendChild(datalist)
    for (i = 0; i < options.length; i++) {
      // Check if the value is one of the options
      if (val == options[i]) {
        removeDataLists()
      } else if (options[i].toUpperCase().includes(val.toUpperCase())) {
        let option = document.createElement("option")
        option.setAttribute("value", options[i])
        option.innerHTML = options[i]
        datalist.appendChild(option)
      }
    }
    /* CODE FOR USING API (SLOWER)
    $.get("/recommendations", { term: val }, function (data) {
      closeAllLists()
      console.log(data)
      if (data.length) {
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        guessInput.parentNode.appendChild(a);
        for (i = 0; i < data.length; i++) {
          b = document.createElement("DIV");
          b.innerHTML = data[i];
          // b.innerHTML += "<input type='hidden' value='" + data[i] + "'>";
          b.addEventListener("click", function (e) {
            guessInput.value = this.innerHTML;
            closeAllLists();
          });
          a.appendChild(b);
        }
      } else {
        closeAllLists()
      }
    })
    */
  } else {
    removeDataLists()
  }
});



function imageDepixel() {
  imaged = setInterval(depixel, 100)
}

function depixel() {
  sampleSize -= pixelate
  if (sampleSize > defaultSampleSize / (defaultSampleSize + 100) / 100) {
    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        const pixelIndex = (x + y * width) * 4
        const pixelColor = `rgba(${pixelData[pixelIndex]}, ${pixelData[pixelIndex + 1]}, ${pixelData[pixelIndex + 2]}, ${pixelData[pixelIndex + 3]})`
        context.fillStyle = pixelColor
        context.fillRect(x, y, sampleSize, sampleSize)
      }
    }
  }
}


function startCountdown() {
  countdown = setInterval(updateTimer, 1000)
}

function updateTimer() {
  remainingTime--
  timerElement.textContent = remainingTime
  if (remainingTime === 0) {
    clearInterval(imaged)
  }
  if (remainingTime === -1) {
    alert("Time's up! You lose.")
    showFailScreen()
  }
}


info.addEventListener('click', function () {
  overlay.className = overlay.className + " is-open"
});

close_overlay.addEventListener('click', () => {
  overlay.className = orig_overlay
})
play_now.addEventListener('click', () => {
  overlay.className = orig_overlay
})


// Handle click on the main button
function handleMainButtonClick() {
  if (started) {
    clearInterval(countdown)
    clearInterval(imaged)
    mainButton.style.display = "none"
    guessSection.style.display = "block"
  } else {
    startCountdown()
    imageDepixel()
    mainButton.innerText = "Guess"
    started = true
  }
}



// Handle click on the submit guess button
function handleSubmitGuess() {
  const userGuess = guessInput.value.toLowerCase()
  console.log(poster.src)
  if (userGuess === correctAnswer) {
    alert("Correct! You win!")
    showWinScreen()
  } else {
    guesses--
    if (guesses === 0) {
      alert("Game over.")
      showFailScreen()
    } else {
      alert("Wrong! Guesses left: " + guesses)
      startCountdown()
      imageDepixel()
      guessInput.value = ""
      removeDataLists()
      mainButton.style.display = "inline-block"
      guessSection.style.display = "none"
    }
  }
}

// Handle click on the "I don't know" button
function handleIdkButtonClick() {
  showFailScreen()
  alert(`The correct answer was ${correctAnswer}`)
  // if (guesses == 0) {
  //   alert("Game over.")
  //   showFailScreen()
  // } else {
  //   alert("You still have " + remainingTime + " seconds and " + guesses + " guesses left.")
  //   guesses--
  //   startCountdown()
  //   imageDepixel()
  //   mainButton.style.display = "inline-block"
  //   guessSection.style.display = "none"
  // }
}

function gameFinish() {
  clearInterval(countdown)
  clearInterval(imaged)
  context.drawImage(image, 0, 0)
  mainButton.style.display = "none"
  guessSection.style.display = "none"
  timerElement.style.display = "none"
  if(play) {
    // create a cookie
  }
}

function showFailScreen() {
  gameFinish()
}

function showWinScreen() {
  gameFinish()
}

// Load the image and pixelate the canvas
const image = new Image()
image.src = poster.src
image.crossOrigin = "Anonymous"
image.onload = function () {
  // Replaces the img with the canvas so it's in the same position
  poster.parentNode.replaceChild(canvas, poster)

  width = image.width
  height = image.height

  mainElement.style.display = "flex";
  loading_screen.style.display = "none";

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0)

  pixelData = context.getImageData(0, 0, width, height).data
  for (let y = 0; y < height; y += sampleSize) {
    for (let x = 0; x < width; x += sampleSize) {
      const pixelIndex = (x + (y * width)) * 4
      const pixelColor = `rgba(${pixelData[pixelIndex]}, ${pixelData[pixelIndex + 1]}, ${pixelData[pixelIndex + 2]}, ${pixelData[pixelIndex + 3]})`
      context.fillStyle = pixelColor
      context.fillRect(x, y, sampleSize, sampleSize)
    }
  }

  // check cookie, if there is a cookie then sat play to false
  // if not then create a new one and set play to true
}

image.onerror = function () {
  alert("Failed to load the image")
}