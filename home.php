<!DOCTYPE html>

<html lang="it">
    <head>
        <link rel="stylesheet" href="home.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
        <title>Slide selection</title>
    </head>
    <body>
        <h1>Tool di annotazione collaborativo per immagini istologiche digitali</h1>
        <h3>Seleziona l'immagine che vuoi visualizzare cliccando sul pulsante qua sotto:</h3>
        
        <div class="dropdown">
            <button class="dropbtn" id="selection">Scegli l'immagine</button>
            <div id="myDropdown" class="dropdown-content">
                <?php
                    require 'home_functions.php';
                    if (!empty($_FILES['file']['name'])) {uploadNewImage($_FILES['file']['name'], $_POST['format']);}
                    echo getAvailableImages();
                ?>
            </div>
        </div>
        <form name="file" action="viewer.php" method="post" enctype="multipart/form-data">
            <input id="slideID" name="id" hidden="true">
            <input type="submit" id="viewer" name="Upload" value="Visualizza immagine" disabled="true">
        </form>
        <h3>Non trovi l'immagine che vuoi?</h3>
        <form name="file" action="" method="post" enctype="multipart/form-data">
            <input type="file" id="select-file" name="file" value="" />
            <input id="format" name="format" hidden="true">
            <input type="submit" id="upload-file" name="Upload" value="Carica immagine" disabled="true">
            <span id="error"></span>
        </form>
        <script src="home.js"></script>
    </body>
</html>