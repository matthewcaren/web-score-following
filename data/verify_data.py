import numpy as np
import librosa
import os, sys
import csv

sys.tracebacklimit = 0

catalog = []

# read the catalog
with open('catalog.csv', newline='') as f:
    print('reading catalog...\n')
    reader = csv.DictReader(f)
    catalog = [line for line in reader]

pieces = set([performance['Piece'] for performance in catalog])

# verify that a directory for each piece exists
dirs = [d for d in os.listdir('.') if os.path.isdir(os.path.join('.', d))]
piece_dirs = [d for d in dirs if d in pieces]
assert set(piece_dirs) == pieces, 'missing piece directories for: ' + str([p for p in pieces if p not in piece_dirs])

print('verified directory structure ✅\n')

########

for dir in dirs: 
    performances = [p for p in catalog if p['Piece'] == dir]
    dir_contents = [d for d in os.listdir(dir)]
    for p in performances:
        pID = p['Artist/Conductor ID']
        assert f'{pID}.csv' in dir_contents, f'missing annotation file: {dir}/{pID}.csv'
        assert f'{pID}.wav' in dir_contents, f'missing audio file: {dir}/{pID}.wav'

print('verified files match catalog ✅\n')

########

for dir in dirs:
    performances = [p for p in catalog if p['Piece'] == dir]

    for p in performances:
        pID = p['Artist/Conductor ID']
        print(f'checking contents of {dir}/{pID}.wav', end='\r')
        sys.stdout.write('\x1b[2K')
        
        samples, sample_rate = librosa.load(f'{dir}/{pID}.wav', sr=None)
        assert sample_rate == 44100, f'{dir}/{pID}.wav does not have a sample rate of 44.1k'

        verif_vec = np.array([np.mean(np.abs(samples)), np.median(np.abs(samples)), np.std(samples)])
        verif_string = np.array2string(verif_vec, precision=3, separator=',', suppress_small=True)
        assert verif_string == p['Verification Vector'], f'{dir}/{pID}.wav does not match expected data, this may be the wrong audio file'

print('verified audio contents ✅\n')

print("all looks good!")
