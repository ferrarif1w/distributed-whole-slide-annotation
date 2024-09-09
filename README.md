# Distributed whole slide annotation
## Source code for my bachelor's degree thesis project (thesis available at [this link](https://hdl.handle.net/20.500.12608/48835))

This is the first version of a distributed annotation tool for whole slide images. This tool allows to store whole slide images in a variety of formats into a local database and access them in a web application. This application allows the user to view the image and dynamically update its quality as they zoom in and out. The whole slide images are elaborated using the Python binding of the [OpenSlide](https://doi.org/https://doi.org/10.4103/2153-3539.119005) library.

## How to set up the application (Windows)

This application was executed on a local Windows machine using the [XAMPP](https://www.apachefriends.org/it/index.html) environment.
After cloning the repository in your folder of choice and downloading and installing XAMPP, open the XAMPP Control Panel. Click on the "Config" button of the Apache row and then click on "Apache (httpd.conf)". This will open the httpd.conf file. Search for the row `DocumentRoot "file_path"`. Replace the file path with that of the `src` subfolder of the folder where you cloned the repo. After that row, insert a new row reading `<Directory "same file path as previous row">` (the angle brackets must be typed in). Also, take note of the server name written in the row `ServerName <server_name>`.
Save and close the file. Click on the "Start" button of the Apache row. Apache should start running. Open your browser of choice and type the server name in the address bar. The starting page of the application will load.

## How to use the application

From the starting page of the application, the user can select the image to view and store new ones in a local database. The code accesses a local database with the table `slide` with the following columns: `riferimento_file`, `formato`, `utente`. The details of the database used in the code are:
- port 5432
- database name `final_db`
- username `postgres`
- password `armin123`
The images that are to be used must be stored in the subfolder `src/images`.