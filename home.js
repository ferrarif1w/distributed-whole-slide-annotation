$(document).ready(function() {
    images = $(".dropdown-link").map(function() {
        return $(this).text();
    }).get();
    if (images.length == 0) {
        $("#selection").text("Nessuna immagine nel database");
    }

    formats = ['.svs','.tif','.ndpi','.vms','.vmu','.scn','.mrxs','.tiff','.svslide','.bif'];
})

$(document).on("click", function(event) {
    let clicked = event.target;
    if (clicked.className!='dropbtn') $("#myDropdown").hide();
    else $("#myDropdown").show();
    if (clicked.className=='dropdown-link') {
        let name = clicked.id;
        $("#slideID").val(name);
        $("#selection").text(name);
        $("#viewer").prop("disabled", false);
    }
})

/*$(".dropbtn").on("click", function() {
    $("#myDropdown").show();
})*/

$("#select-file").on("input", function() {
    $("#upload-file").prop("disabled", false);
    let file = $("#select-file").val().substring(12);
    let len = file.length;
    let poss = formats.map(function(a) {
        return (file.toLowerCase().lastIndexOf(a) + a.length) == len;
    });
    let trueIndex = jQuery.inArray(true, poss);
    if (trueIndex==-1) {
        $("#error").text("Questa immagine non è salvata in uno dei formati accettati da OpenSlide; selezionarne un'altra.");
        $("#upload-file").prop("disabled", true);
    }
    else if (jQuery.inArray(file, images)!=-1) {
        $("#error").text("Questa immagine è già presente nel database; selezionarne un'altra.");
        $("#upload-file").prop("disabled", true);
    }
    else {
        let format = formats[trueIndex];
        console.log(format);
        $("#error").text("");
        $("#format").val(format);
    }
})