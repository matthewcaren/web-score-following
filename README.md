# web-score-following
Real-time score following on the web, via a framework that runs Python signal-processing code in the browser. This repository includes both code for the web implementation as well an annotated downbeat dataset to measure its performance.

Developed as part of the [ConcertCue](https://concertcue.org/) project at the MIT Music Technology Lab.


## Running the system
The score-following system lives inside a React web app. From the `web` directory, install all package dependencies by running:
```
npm install
```

Once the packages have been installed, launch the web app with:
```
npm install
```
This should launch the app on port `3000`.


## Dataset
The `data` directory contains a dataset of downbeat annotations across a corpus of 18 recordings (6 pieces, 3 performances per piece). Annotations are in separate csv files per performance and are given in seconds since the start of the piece. Links to the associated audio files (via YouTube) and basic metadata are listed in [`catalog.csv`](/data/catalog.csv).
