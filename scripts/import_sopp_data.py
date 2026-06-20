import os
import argparse
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

def main():
    load_dotenv('.env.local')
    parser = argparse.ArgumentParser(description='Import SOPP Data into Supabase.')
    parser.add_argument('--file', required=True, help='Path to the zipped CSV file')
    parser.add_argument('--agency', required=True, help='Name of the law enforcement agency')
    args = parser.parse_args()

    # 1. Initialize Supabase client
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
    supabase: Client = create_client(url, key)

    print(f"Reading chunks from {args.file}...")
    chunksize = 5000
    total_processed = 0
    total_inserted = 0

    # 2. Iterate through chunks
    for chunk in pd.read_csv(args.file, compression='zip', chunksize=chunksize, dtype=str):
        print(f"Processing chunk (rows {total_processed} to {total_processed + len(chunk)})...")
        total_processed += len(chunk)
        
        # Drop rows with missing lat/lng
        df = chunk.dropna(subset=['lat', 'lng'])
        
        if df.empty:
            continue
            
        records_to_insert = []
        
        for _, row in df.iterrows():
            # SOPP Columns map:
            date_str = str(row.get('date', ''))
            time_str = str(row.get('time', ''))
            
            if 'nan' in date_str.lower() or not date_str:
                continue # Skip rows with no date
                
            if 'nan' in time_str.lower() or not time_str:
                time_str = "00:00:00"
                
            stop_date = f"{date_str} {time_str}".strip()
                
            reason = row.get('reason_for_stop', 'Unknown')
            if pd.isna(reason): reason = 'Unknown'
            
            outcome = row.get('outcome', 'Warning')
            if pd.isna(outcome): outcome = 'Warning'
            
            search_conducted = str(row.get('search_conducted', 'false')).lower() == 'true'
            
            # Defaulting contraband_found to False as discussed
            contraband_found = False
            
            try:
                lat = float(row['lat'])
                lng = float(row['lng'])
            except ValueError:
                continue
                
            location_wkt = f"SRID=4326;POINT({lng} {lat})"
            
            records_to_insert.append({
                'stop_date': stop_date,
                'agency_name': args.agency,
                'reason_for_stop': str(reason),
                'outcome': str(outcome),
                'search_conducted': search_conducted,
                'contraband_found': contraband_found,
                'lat': lat,
                'lng': lng,
                'location': location_wkt
            })
            
        if not records_to_insert:
            continue
            
        # Push batch to Supabase
        try:
            supabase.table('traffic_stops').insert(records_to_insert).execute()
            total_inserted += len(records_to_insert)
            print(f"  -> Inserted {len(records_to_insert)} records.")
        except Exception as e:
            print(f"Error inserting batch: {e}")

    print(f"\nDone! Processed {total_processed} total rows. Successfully inserted {total_inserted} records with valid coordinates.")

if __name__ == "__main__":
    main()
