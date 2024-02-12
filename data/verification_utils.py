import numpy as np
import wave
import os

def loudness(x, win_len, hop_size):
    window = np.hanning(win_len)
    n_hops = int(np.ceil((len(x) - win_len + hop_size) / hop_size))

    # zero-pad end of window as needed:
    new_x_len = (n_hops - 1) * hop_size + win_len
    if new_x_len > len(x):
        x = np.concatenate((x, np.zeros(new_x_len - len(x))))

    output = np.empty(n_hops, dtype = np.float32)

    for h in range(n_hops):
        start = h * hop_size
        windowed = x[start:(start + win_len)] * window
        output[h] = np.sqrt(np.mean(windowed**2))

    return output


def verif_array_to_str(arr):
    verif_string = np.array2string(arr,
                                   precision=3,
                                   separator=' ',
                                   suppress_small=True,
                                   max_line_width=np.inf,
                                   floatmode='fixed')
    return verif_string[1:-1]


def load_time_instances(csv_file):
    '''csv_file contains time instances, typically exported from sonic visualizer, 
    where first column is the time (in seconds). 
    Return a numpy array of times in seconds'''

    with open(csv_file) as f:
        lines = f.readlines()
    times = [float(l.strip().split(',')[0]) for l in lines]
    return np.array(times)
        
def write_wave(data, filepath):
    'write single-channel PCM float audio data, sampled at sr, as a 16 bit mono wave file to filepath'
    with wave.open(filepath, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(44100)
        data = data * (2**15)
        data = data.astype(np.int16)
        f.writeframes(data.tobytes())