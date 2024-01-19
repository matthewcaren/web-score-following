ref = la_rt.file_to_np_cens(REF_FILEPATH, PARAMS)

# streaming:
otw = la_rt.OTW(ref, PARAMS["otw"])

# return length of ref features
ref.size
