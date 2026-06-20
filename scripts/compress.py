import gzip
import shutil

print('Starting compression...')
with open('data sets/ohio_traffic_stops.ldgeojson', 'rb') as f_in:
    with gzip.open('data sets/ohio_traffic_stops.ldgeojson.gz', 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
print('Compression complete!')
