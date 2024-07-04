function removeItem(itemId) {
    $.ajax({
        url: "/remove",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ id: itemId }),
        success: function (data) {
            $(`#${itemId}`).remove()
        },
        error: function (error) {
            console.error("Error:", error);
        }
    });
}

async function updateAlbumOptions() {
    const answer = $("#answer").val();
    const res = await $.getJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(answer)}&country=US&media=music&entity=album&limit=10`);
    const data = res;

    if (data.resultCount > 0) {
        const albumOptions = $("#album-options");
        albumOptions.empty();
        data.results.forEach(result => {
            const option = $("<option></option>")
                .text(`${result.collectionName} by ${result.artistName}`)
                .data({
                    coverUrl: result.artworkUrl100.replace("100x100", "1000x1000"),
                    albumName: result.collectionName,
                    collectionViewUrl: result.collectionViewUrl
                });
            albumOptions.append(option);
        });
        updateAlbumCover();
    }
}

function updateAlbumCover() {
    const answer = $("#answer");
    const albumCover = $("#album-cover");
    const albumOptions = $("#album-options");
    const cover_url = $("#cover-url");
    const selectedOption = albumOptions.find("option:selected");
    const album_url = $("#album-url");
    const autocomplete = $("#autocomplete");

    albumCover.css("visibility", "visible");
    albumOptions.css("visibility", "visible");
    albumCover.attr("src", selectedOption.data("coverUrl"));
    cover_url.val(selectedOption.data("coverUrl"));
    album_url.val(selectedOption.data("collectionViewUrl"));
    if (autocomplete.prop("checked")) {
        answer.val(selectedOption.data("albumName"));
    }
}

$("#answer").on("change", updateAlbumOptions);
$("#album-options").on("change", updateAlbumCover);