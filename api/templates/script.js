var pixel_state = 0; // Added missing variable declaration
test = true
canvas = 0

// implement loadImage function
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.onerror = () => {
            reject(new Error("Failed to load image"));
        };

        image.src = url;
    });
}

function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.querySelector("div").replaceChild(canvas, document.querySelector("img"));
    return canvas;
}

function pixelate(img, ctx, canvas, value) {
    console.log(value)
    var size = value / 100
    var w = canvas.width * size
    var h = canvas.height * size

    ctx.drawImage(img, 0, 0, w, h);

    ctx.msImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height)
}

function image_pixel(pixelated = true) {
    if (pixelated) {
        if (pixel_state > 24) {
            clearInterval(countdown)
            // restartGame("", false);
            return
        } else {
            loadImage('../static/blond.jpeg').then((image) => {
                pixel_state += 0.5;
                if(test) {
                    canvas = createCanvas(image.width, image.height);
                    test = false
                }
                var ctx = canvas.getContext('2d');
                pixelate(image, ctx, canvas, pixel_state);
            })
        }
    } else { // Image without pixelisation
        loadImage('image.jpg').then((image) => {
            var canvas = createCanvas(image.width, image.height);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
        })
    }
};


function startCountdown() {
    countdown = setInterval(image_pixel, 100)
}

startCountdown()
