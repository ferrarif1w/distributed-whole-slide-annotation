<?php
    function getAvailableImages() {
        $imageLinks = "";
        $connString = "host=localhost port=5432 dbname=final_db user=postgres password=armin123";
        $connection = pg_connect($connString) or die("Unable to connect to database.");
        $query = "SELECT riferimento_file FROM SLIDE";
        $result = pg_query($connection, $query) or die("Sad");
        pg_close();
        while ($row = pg_fetch_row($result)) {
            $name = $row[0];
            $imageLinks = $imageLinks . '<span class="dropdown-link" id="' . $name .
                '">' . $name . '</span>';
        }
        return $imageLinks;
    }

    function uploadNewImage($filename, $format) {
        $connString = "host=localhost port=5432 dbname=final_db user=postgres password=armin123";
        $connection = pg_connect($connString) or die("Unable to connect to database.");
        $checkQuery = "SELECT * FROM SLIDE WHERE riferimento_file='".$filename."'";
        $result = pg_query($connection, $checkQuery) or die("Sad");
        if (pg_num_rows($result)==0) {
            $query = "INSERT INTO SLIDE VALUES('$filename', '$format', 'email')";
            pg_query($connection, $query) or die("Sad");
        }
        pg_close();
    }