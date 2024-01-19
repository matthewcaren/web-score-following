# streaming:
otw = la_rt.OTW(ref, PARAMS["otw"])

path = []
alignment_log = []
current_pos = -1
current_time = -1

started = False
start_time = None

# debugging
saved = False

# return length of ref features
ref.size
