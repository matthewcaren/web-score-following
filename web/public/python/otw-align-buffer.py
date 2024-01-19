time_since_start = time.perf_counter() - start_time

unpacked_samples = [a for a in iter(samples_jsproxy)]

if not started and abs(sum(unpacked_samples[:10])) > 0.005:
    started = True
    start_time = time.perf_counter()
    time_since_start = 0

if started:
    new_samples = np.array(unpacked_samples)

    chroma = chroma_maker.insert(new_samples)
    current_pos = otw.insert(chroma)
    fr = PARAMS["sr"] / PARAMS["ref_hop_len"]  # feature-rate
    current_time = current_pos / fr

    path.append([time_since_start, current_pos])

    if not saved and (current_pos / ref.shape[1]) >= 0.997:
        la_rt.save_from_browser(np.array(path), "path.csv")
        saved = True


# return position as percentage of piece
np.clip(current_pos / ref.shape[1], 0, 1)
