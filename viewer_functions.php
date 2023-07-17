<?php
    $function = $_GET['function'];
    $data = $_GET['data'];
    $command = 'python ' . getcwd() . '\openslide_calls.py ' . $function . " " . $data;
    $output = shell_exec($command);
    echo json_encode($output);