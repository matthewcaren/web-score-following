import librosa
import os, sys
import csv
from verification_utils import *

sys.tracebacklimit = 0

catalog = []

# read the catalog
with open('catalog.csv', newline='') as f:
    print('reading catalog...')
    reader = csv.DictReader(f)
    catalog = [line for line in reader]

pieces = set([performance['Piece'] for performance in catalog])

# verify that a directory for each piece exists
dirs = [d for d in os.listdir('.') if os.path.isdir(os.path.join('.', d))]
piece_dirs = [d for d in dirs if d in pieces]
assert set(piece_dirs) == pieces, 'missing piece directories for: ' + str([p for p in pieces if p not in piece_dirs])

print('verified directory structure ✅')

########

for dir in dirs: 
    performances = [p for p in catalog if p['Piece'] == dir]
    dir_contents = [d for d in os.listdir(dir)]
    for p in performances:
        pID = p['Artist/Conductor ID']
        assert f'{pID}.csv' in dir_contents, f'missing annotation file: {dir}/{pID}.csv'
        assert f'{pID}.mp3' in dir_contents, f'missing audio file: {dir}/{pID}.mp3'

print('verified files match catalog ✅\n')

########

verif_data = []

# read verification data
with open('verification_data.csv', newline='') as f:
    print('reading verification data...')
    reader = csv.DictReader(f)
    verif_data = [line for line in reader]

for dir in dirs:
    performances = [p for p in catalog if p['Piece'] == dir]
    performances_verif_data = [p for p in verif_data if p['Piece'] == dir]

    for p, p_data in zip(performances, performances_verif_data):
        # verify WAV data
        pID = p['Artist/Conductor ID']
        print(f'checking contents of {dir}/{pID}.mp3', end='\r')
        sys.stdout.write('\x1b[2K')

        assert pID == p_data['Artist/Conductor ID'], f'data/catalog mismatch with: {dir}/{pID}.mp3'
        
        samples, sample_rate = librosa.load(f'{dir}/{pID}.mp3', sr=None, mono=True)
        assert sample_rate == 44100, f'{dir}/{pID}.mp3 does not have a sample rate of 44.1k'

        verif_vec = loudness(samples[:44100*20], 8192, 4096)
        verif_string = verif_array_to_str(verif_vec)
        assert verif_string == p_data['Vector'], f'{dir}/{pID}.mp3 does not match expected data, this is probably the wrong audio file'

        # process CSV / WAV
        times = load_time_instances(f'{dir}/{pID}.csv')
        start = max(0, times[0] - 1)
        end = times[-1] + 1
        
        write_wave(samples[int(start*44100):int(end*44100)], f'{dir}/{pID}-synced.wav')
        with open(f'{dir}/{pID}-synced.csv', 'w') as f:
            for t in times:
                f.write(f'{t - start}\n')


print('verified audio contents ✅\n')

print("all looks good!\n")



####### TO EXTRACT VERIFICATION DATA

# data_lines = []

# for dir in dirs:
#     performances = [p for p in catalog if p['Piece'] == dir]

#     for p in performances:
#         pID = p['Artist/Conductor ID']
#         samples, sample_rate = librosa.load(f'{dir}/{pID}.mp3', sr=None, mono=True)

#         verif_vec = loudness(samples[:44100*20], 8192, 4096)
#         verif_string = verif_array_to_str(verif_vec)
#         data_lines.append([p['Piece'], pID, verif_string])


# with open('verification_data.csv', 'w', newline='') as csvfile:
#     writer = csv.writer(csvfile)
#     writer.writerow(['Piece', 'Artist/Conductor ID', 'Vector'])
#     writer.writerows(data_lines)
