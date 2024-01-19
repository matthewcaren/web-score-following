import sys
import numpy as np
import time

sys.path.insert(0, "..")
import libaudio_rt as la_rt


PARAMS = {
    "sr": 44100,
    "ref_hop_len": 4096,
    "live_hop_len": 3686,
    "n_fft": 8192,
    "otw": {"c": 300, "max_run_count": 3, "diag_weight": 0.4},
}

chroma_maker = la_rt.ChromaMaker(PARAMS["sr"], PARAMS["n_fft"])

path = []
current_pos = -1
current_time = -1

started = False
start_time = -1

# debugging
saved = False
alignment_log = []
annotations = []
