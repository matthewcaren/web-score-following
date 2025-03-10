# web score following
Real-time score following on the web, via a framework that runs Python signal-processing code in the browser. This repository includes both code for the web implementation as well an annotated downbeat dataset to measure its performance.

Developed as part of the [ConcertCue](https://concertcue.org/) project at the MIT Music Technology Lab.

Presented at Web Audio Conference (WAC) 2024.


## Running the system
The score-following system lives in a React web app. From the `web` directory, install all package dependencies by running:
```
npm install
```
Once the packages have been installed, launch the web app with:
```
npm start
```
This should launch the app on port `3000`.


## Dataset
The `data` directory contains a dataset of downbeat annotations across a corpus of 18 recordings (6 pieces, 3 performances per piece). Annotations are in separate csv files per performance and are given in seconds since the start of the piece. Note that the actual audio files are not included; links to the audio files (via YouTube) and basic metadata are listed in [`catalog.csv`](/data/catalog.csv).

Each piece has its own directory, which should contain three CSV annotation files and three corresponding audio files. Both directory names and annotation/audio file names must match the _Piece_ and _Artist/Conductor ID_ fields in `catalog.csv` exactly (e.g. for each performance there should be a `data/[Piece]/[Artist/Conductor ID].csv` file and a `data/[Piece]/[Artist/Conductor ID].mp3` file).

To use the dataset, download the audio files from the links (as MP3) and make sure that their names and locations are correct. Then, navigate to the top of the `data` directory and run:
```
python verify_data.py
```
This script will check attributes of the local audio files against expected values to verify that you have the correct audio data. It will also extract the correct audio excerpts from the downloaded audio clips and create **aligned** files (`*-aligned.csv` and `*-aligned.wav`), which contain the processed, ready-to-use audio/annotation paired data. These are the files that should be used to test performance.
