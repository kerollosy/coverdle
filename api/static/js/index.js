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
const info_overlay = document.querySelector("#info-overlay")
const info_orig_overlay = info_overlay.className
const info_close_overlay = document.querySelector("#info-close-button")
const info_play_now = document.querySelector("#info-play-now-button")

const gameDetails = document.querySelector(".game-details")

const contact = document.getElementById("contact")
const contact_overlay = document.querySelector("#contact-overlay")
const contact_orig_overlay = contact_overlay.className
const contact_close_overlay = document.querySelector("#contact-close-button")
const contact_send_message = document.getElementById("contact-send-message")

const gameOver = document.getElementById("gameOver")
const gameStatus = document.getElementById("status")
const albumInfo = document.getElementById("albumInfo")
const album_url = gameDetails.dataset.album_url

let timeLeft = gameDetails.dataset.time_left
const countdownElement = document.getElementById("countdown")
const nextPuzzle = document.getElementById("nextPuzzle")


// Game variables
let countdown
let imaged
let remainingTime = 5
let defaultRemainingTime = remainingTime
let sampleSize = (remainingTime * 100) - 100
let defaultSampleSize = sampleSize
let pixelate = Math.trunc(sampleSize / (remainingTime * 10))
let guesses = 3
let defaultGuesses = guesses
let started = false
const correctAnswer = gameDetails.dataset.answer
const options = window.puzzles
gameDetails.remove()


// Canvas variables
let width
let height
let pixelData
let canvas = document.createElement("canvas")
canvas.width = width
canvas.height = height
const context = canvas.getContext("2d", { willReadFrequently: true })


const now = new Date();
const currentEgyptTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));

function handlePlayStatus() {
  const playedStatus = localStorage.getItem("played")

  if (playedStatus) {
    playResult = localStorage.getItem("played").split(" ")[0]
    playDate = localStorage.getItem("played").split(" ")[1]

    if (playDate == `${gameDetails.dataset.current_date}`) {
      if (playResult == "won") {
        showWinScreen()
      } else if (playResult == "lost") {
        showFailScreen()
      }
    }
  }
}

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
    for (const option of options) {
      let albumName = option.albumName;
      let artist = option.artist
      // Check if the value is one of the options
      if (val == albumName) {
        removeDataLists()
      } else if (albumName.toUpperCase().includes(val.toUpperCase())) {
        let option_element = document.createElement("option")
        option_element.setAttribute("value", albumName)
        option_element.innerHTML = artist
        datalist.appendChild(option_element)
      }
    }
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
    alert("Time's up! You lose.")
    showFailScreen()
  }
}


info.addEventListener('click', function () {
  info_overlay.className = info_overlay.className + " is-open"
})

info_close_overlay.addEventListener('click', () => {
  info_overlay.className = info_orig_overlay
})
info_play_now.addEventListener('click', () => {
  info_overlay.className = info_orig_overlay
})


contact.addEventListener('click', function () {
  contact_overlay.className = contact_overlay.className + " is-open"
})

contact_close_overlay.addEventListener('click', () => {
  contact_overlay.className = contact_orig_overlay
})


function setFocus(state) {
  var element = document.activeElement;
  if (state) {
    setTimeout(function () {
      if (element && element.parentNode) {
        element.parentNode.classList.add("focus");
      }
    });
  } else {
    var box = document.querySelector("#input-box");
    if (box) {
      box.classList.remove("focus");
    }
    var inputs = document.querySelectorAll("input");
    inputs.forEach(function (input) {
      var parent = input.closest(".input-box");
      if (parent) {
        if (input.value) {
          parent.classList.add("focus");
        } else {
          parent.classList.remove("focus");
        }
      }
    });
  }
}


function checkEmailValidity() {
  var emailInput = document.getElementById("email-input");

  if (emailInput.validity.valid) {
    emailInput.parentNode.classList.remove("error")
    emailInput.classList.remove("error")
  } else {
    emailInput.parentNode.classList.add("error");
    emailInput.classList.add("error")
  }
  if (emailInput.value.length <= 0) {
    emailInput.classList.remove("error")
    emailInput.parentNode.classList.remove("error")
  }
}


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
  const userGuess = guessInput.value.toLowerCase().trim()
  if (userGuess === correctAnswer.toLowerCase()) {
    alert("Correct! You win!")
    showWinScreen()
  } else {
    guesses--
    if (guesses === 0) {
      alert("Game over. You lose.")
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
  // alert(`The correct answer was ${correctAnswer}`)
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
  gameOver.style.display = "block"
  nextPuzzle.style.display = "block"
}

function showFailScreen() {
  localStorage.setItem("played", `lost ${gameDetails.dataset.current_date}`);
  gameStatus.innerHTML = "Try Again Tomorrow!"
  gameStatus.style.color = "red"
  albumInfo.innerHTML = `Today's album was <a id="album_url" href="${album_url}" target="_blank">${correctAnswer}</a>`
  gameFinish()
}

function showWinScreen() {
  localStorage.setItem("played", `won ${gameDetails.dataset.current_date}`);
  albumInfo.innerHTML = `You correctly guessed <a id="album_url" href="${album_url}" target="_blank">${correctAnswer}</a> in ${(defaultRemainingTime - remainingTime) + 1} ${((defaultRemainingTime - remainingTime) + 1) === 1 ? 'second' : 'seconds'} using ${(defaultGuesses - guesses) + 1} ${(defaultGuesses - guesses) + 1 === 1 ? 'guess' : 'guesses'}`;
  gameFinish()
}


function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
}
countdownElement.textContent = formatTime(timeLeft);

const dayCountdown = setInterval(() => {
  timeLeft -= 1;
  countdownElement.textContent = formatTime(timeLeft);
  if (timeLeft === 0) {
    clearInterval(dayCountdown);
  }
}, 1000);


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
  handlePlayStatus()
}

image.onerror = function () {
  alert("Failed to load the image")
}
