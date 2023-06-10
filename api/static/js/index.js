
$(document).ready(function () {
  // DOM elements
  const mainButton = $("#mainButton");
  const guessInput = $("#guessInput");
  const submitGuessButton = $("#submitGuessButton");
  const idkButton = $("#idk");
  const timerElement = $("#timer");
  const guessSection = $("#guessSection");
  const mainElement = $("#main");
  const poster = $("#album-cover");
  const loading_screen = $("#loading-screen");

  const info = $("#info");
  const info_overlay = $("#info-overlay");
  const info_orig_overlay = info_overlay.attr("class");
  const info_close_overlay = $("#info-close-button");
  const info_play_now = $("#info-play-now-button");

  const gameDetails = $(".game-details");

  const contact = $("#contact");
  const contact_overlay = $("#contact-overlay");
  const contact_orig_overlay = contact_overlay.attr("class");
  const contact_close_overlay = $("#contact-close-button");

  const gameOver = $("#gameOver");
  const gameStatus = $("#status");
  const albumInfo = $("#albumInfo");
  const album_url = gameDetails.data("album_url");

  let timeLeft = gameDetails.data("time_left");
  const countdownElement = $("#countdown");
  const nextPuzzle = $("#nextPuzzle");

  // Game variables
  let countdown;
  let imaged;
  let remainingTime = 5;
  let defaultRemainingTime = remainingTime;
  let sampleSize = (remainingTime * 100) - 100;
  let defaultSampleSize = sampleSize;
  let pixelate = Math.trunc(sampleSize / (remainingTime * 10));
  let guesses = 3;
  let defaultGuesses = guesses;
  let started = false;
  const correctAnswer = gameDetails.data("answer");
  const options = window.puzzles;
  gameDetails.remove();


  // Canvas variables
  let width;
  let height;
  let pixelData;
  let canvas = $('<canvas></canvas>');
  const context = canvas[0].getContext("2d", { willReadFrequently: true });


  function handlePlayStatus() {
    const playedStatus = localStorage.getItem("played");

    if (playedStatus) {
      playResult = localStorage.getItem("played").split(" ")[0];
      playDate = localStorage.getItem("played").split(" ")[1];

      if (playDate === gameDetails.data("current_date")) {
        if (playResult === "won") {
          showWinScreen();
        } else if (playResult === "lost") {
          showFailScreen();
        }
      }
    }
  }

  // Append the canvas to the main element
  mainElement.append(canvas);

  // Add event listeners
  mainButton.on("click", handleMainButtonClick);
  submitGuessButton.on("click", handleSubmitGuess);
  idkButton.on("click", handleIdkButtonClick);

  function removeDataLists() {
    const existingOptions = $("#albums");
    existingOptions.remove();
  }

  guessInput.on('input', function () {
    let val = guessInput.val();
    if (!val) {
      return false;
    }

    if (val.length >= 2) {
      // Remove existing data list
      removeDataLists();

      let datalist = $("<datalist></datalist>");
      datalist.attr("id", "albums");
      guessInput.parent().append(datalist);
      for (const option of options) {
        let albumName = option.albumName;
        let artist = option.artist;
        // Check if the value is one of the options
        if (val === albumName) {
          removeDataLists();
        } else if (albumName.toUpperCase().includes(val.toUpperCase())) {
          let option_element = $("<option></option>");
          option_element.attr("value", albumName);
          option_element.html(artist);
          datalist.append(option_element);
        }
      }
    } else {
      removeDataLists();
    }
  });

  function imageDepixel() {
    imaged = setInterval(depixel, 100);
  }

  function depixel() {
    sampleSize -= pixelate;
    if (sampleSize > defaultSampleSize / (defaultSampleSize + 100) / 100) {
      for (let y = 0; y < height; y += sampleSize) {
        for (let x = 0; x < width; x += sampleSize) {
          const pixelIndex = (x + y * width) * 4;
          const pixelColor = `rgba(${pixelData[pixelIndex]}, ${pixelData[pixelIndex + 1]}, ${pixelData[pixelIndex + 2]}, ${pixelData[pixelIndex + 3]})`;
          context.fillStyle = pixelColor;
          context.fillRect(x, y, sampleSize, sampleSize);
        }
      }
    }
  }

  function startCountdown() {
    countdown = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    remainingTime--;
    timerElement.text(remainingTime);
    if (remainingTime === 0) {
      alert("Time's up! You lose.");
      showFailScreen();
    }
  }

  info.on('click', function () {
    info_overlay.addClass("is-open");
  });

  info_close_overlay.on('click', () => {
    info_overlay.attr("class", info_orig_overlay);
  });
  info_play_now.on('click', () => {
    info_overlay.attr("class", info_orig_overlay);
  });

  contact.on('click', function () {
    contact_overlay.addClass("is-open");
  });

  contact_close_overlay.on('click', () => {
    contact_overlay.attr("class", contact_orig_overlay);
  });

  // Handle click on the main button
  function handleMainButtonClick() {
    if (started) {
      clearInterval(countdown);
      clearInterval(imaged);
      mainButton.hide();
      guessSection.show();
    } else {
      startCountdown();
      imageDepixel();
      mainButton.text("Guess");
      started = true;
    }
  }

  // Handle click on the submit guess button
  function handleSubmitGuess() {
    const userGuess = guessInput.val().toLowerCase().trim();
    if (userGuess === correctAnswer.toLowerCase()) {
      alert("Correct! You win!");
      showWinScreen();
    } else {
      guesses--;
      if (guesses === 0) {
        alert("Game over. You lose.");
        showFailScreen();
      } else {
        alert("Wrong! Guesses left: " + guesses);
        startCountdown();
        imageDepixel();
        guessInput.val("");
        removeDataLists();
        mainButton.show();
        guessSection.hide();
      }
    }
  }

  // Handle click on the "I don't know" button
  function handleIdkButtonClick() {
    showFailScreen();
  }

  function gameFinish() {
    clearInterval(countdown);
    clearInterval(imaged);
    context.drawImage(image, 0, 0);
    mainButton.hide();
    guessSection.hide();
    timerElement.hide();
    gameOver.show();
    nextPuzzle.show();
  }

  function showFailScreen() {
    localStorage.setItem("played", `lost ${gameDetails.data("current_date")}`);
    gameStatus.html("Try Again Tomorrow!");
    gameStatus.css("color", "red");
    albumInfo.html(`Today's album was <a id="album_url" href="${album_url}" target="_blank">${correctAnswer}</a>`);
    gameFinish();
  }

  function showWinScreen() {
    localStorage.setItem("played", `won ${gameDetails.data("current_date")}`);
    albumInfo.html(`You correctly guessed <a id="album_url" href="${album_url}" target="_blank">${correctAnswer}</a> in ${(defaultRemainingTime - remainingTime) + 1} ${(defaultRemainingTime - remainingTime) + 1 === 1 ? 'second' : 'seconds'} using ${(defaultGuesses - guesses) + 1} ${(defaultGuesses - guesses) + 1 === 1 ? 'guess' : 'guesses'}`);
    gameFinish();
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [hours, minutes, remainingSeconds]
      .map(v => v < 10 ? "0" + v : v)
      .join(":");
  }
  countdownElement.text(formatTime(timeLeft));

  const dayCountdown = setInterval(() => {
    timeLeft -= 1;
    countdownElement.text(formatTime(timeLeft));
    if (timeLeft === 0) {
      clearInterval(dayCountdown);
    }
  }, 1000);

  // Load the image and pixelate the canvas
  const image = new Image();
  image.src = poster.attr("src");
  image.crossOrigin = "Anonymous";
  image.onload = function () {
    // Replaces the img with the canvas so it's in the same position
    poster.replaceWith(canvas);

    width = image.width;
    height = image.height;

    mainElement.css("display", "flex");
    loading_screen.hide();

    canvas.attr("width", width);
    canvas.attr("height", height);
    context.drawImage(image, 0, 0);

    pixelData = context.getImageData(0, 0, width, height).data;
    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        const pixelIndex = (x + (y * width)) * 4;
        const pixelColor = `rgba(${pixelData[pixelIndex]}, ${pixelData[pixelIndex + 1]}, ${pixelData[pixelIndex + 2]}, ${pixelData[pixelIndex + 3]})`;
        context.fillStyle = pixelColor;
        context.fillRect(x, y, sampleSize, sampleSize);
      }
    }
    handlePlayStatus();
  }

  image.onerror = function () {
    alert("Failed to load the image");
  }
});


function setFocus(state) {
  var element = $(document.activeElement);
  if (state) {
    element.parent().addClass("focus");
  } else {
    var box = $("#input-box");
    box.removeClass("focus");
    $("input, textarea").each(function () {
      var parent = $(this).closest(".input-box");
      if ($(this).val()) {
        parent.addClass("focus");
      } else {
        parent.removeClass("focus");
      }
    });
  }
}

function checkEmailValidity() {
  let emailInput = $("#email-input");

  if (emailInput[0].checkValidity()) {
    emailInput.parent().removeClass("error")
    emailInput.removeClass("error")
  } else {
    emailInput.parent().addClass("error");
    emailInput.addClass("error")
  }
  if (emailInput.val() == 0) {
    emailInput.removeClass("error")
    emailInput.parent().removeClass("error")
  }
}
