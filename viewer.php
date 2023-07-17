<!DOCTYPE html>

<html lang="it">
    <head>
        <link rel="stylesheet" href="viewer.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
        <title>Slide viewer</title>
    </head>
    <body>
        <?php
            $id = $_POST['id'];
            echo "<span hidden='true' id='imgID'>".$id."</span>";
        ?>
        <div class="slidercontainer">
            <input type="range" min="100" max="5000" value="0" class="slider" id="slider">
        </div>
        <p> Valore: <span id="val"></span>
        <span id="loading"></span>
        </p>

        <div class="imagecontainer">
            <img id="slide" alt="boh">
        </div>
        <script src="viewer.js"></script>
    </body>
</html>
