import os
import argparse
import pandas as pd
import json

def main():
    parser = argparse.ArgumentParser(description='Convert SOPP Data to Line-Delimited GeoJSON for Mapbox.')
    parser.add_argument('--file', required=True, help='Path to the zipped CSV file')
    parser.add_argument('--agency', required=True, help='Name of the law enforcement agency')
    parser.add_argument('--output', required=True, help='Output NDJSON file path')
    args = parser.parse_args()

    print(f"Reading chunks from {args.file} and writing to {args.output}...")
    chunksize = 50000
    total_processed = 0

    with open(args.output, 'w', encoding='utf-8') as out_f:
        for chunk in pd.read_csv(args.file, compression='zip', chunksize=chunksize, dtype=str):
            print(f"Processing chunk (rows {total_processed} to {total_processed + len(chunk)})...")
            total_processed += len(chunk)
            
            # Drop rows with missing lat/lng
            df = chunk.dropna(subset=['lat', 'lng'])
            
            if df.empty:
                continue
            
            for _, row in df.iterrows():
                try:
                    lat = float(row['lat'])
                    lng = float(row['lng'])
                except ValueError:
                    continue
                
                # Basic cleanup
                date_str = str(row.get('date', ''))
                time_str = str(row.get('time', ''))
                
                if 'nan' in date_str.lower() or not date_str:
                    continue
                
                if 'nan' in time_str.lower() or not time_str:
                    time_str = "00:00:00"
                    
                stop_date = f"{date_str} {time_str}".strip()
                
                # Extract year
                try:
                    year = int(date_str.split('-')[0])
                except (ValueError, IndexError):
                    year = 0

                reason = str(row.get('violation', 'Unknown'))
                if reason.lower() == 'nan': reason = 'Unknown'
                
                outcome = str(row.get('outcome', 'Warning'))
                if outcome.lower() == 'nan': outcome = 'Warning'

                dept = str(row.get('department_name', args.agency))
                if dept.lower() == 'nan': dept = args.agency
                
                search_conducted = str(row.get('search_conducted', 'False')).lower() == 'true'
                contraband_found = str(row.get('contraband_found', 'False')).lower() == 'true'
                
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    },
                    "properties": {
                        "agency_name": dept,
                        "stop_date": stop_date,
                        "year": year,
                        "reason": reason,
                        "outcome": outcome,
                        "search_conducted": search_conducted,
                        "contraband_found": contraband_found
                    }
                }
                
                out_f.write(json.dumps(feature) + "\n")

    print(f"Finished writing {total_processed} rows to {args.output}")

if __name__ == "__main__":
    main()
