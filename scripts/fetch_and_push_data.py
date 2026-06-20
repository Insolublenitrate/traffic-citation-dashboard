import os
import pandas as pd
import openpolicedata as opd
from supabase import create_client, Client

def main():
    # 1. Initialize Supabase client
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
    supabase: Client = create_client(url, key)

    print("Fetching traffic stops data for Montgomery County, MD...")
    
    # 2. Pull data using openpolicedata
    src = opd.Source(source_name="Montgomery County", state="MD")
    
    # Load the latest year of data for 'TRAFFIC STOPS' (using a specific year to keep the pipeline fast)
    table = src.load(table_type='TRAFFIC STOPS', year=2023)
    df = table.table
    
    print(f"Loaded {len(df)} records. Cleaning data...")
    
    # 3. Clean the data
    # Montgomery County data usually has 'Latitude' and 'Longitude' columns.
    lat_col = next((col for col in df.columns if col.lower() in ['latitude', 'lat']), None)
    lng_col = next((col for col in df.columns if col.lower() in ['longitude', 'lon', 'lng']), None)
    
    if not lat_col or not lng_col:
        raise ValueError("Could not find latitude or longitude columns in the dataset")
        
    # Drop rows with missing coordinates (crucial for mapping!)
    df = df.dropna(subset=[lat_col, lng_col])
    
    records_to_insert = []
    
    # We'll limit to the first 10,000 records for the sake of the automated pipeline time limits
    for _, row in df.head(10000).iterrows():
        # Safely extract data based on standard Montgomery County fields
        stop_date = row.get('Date Of Stop') or pd.Timestamp.now()
        agency = row.get('Agency') or 'Montgomery County Police'
        reason = row.get('Description') or 'Unknown'
        outcome = row.get('Violation Type') or 'Warning'
        search = str(row.get('Search Conducted')).lower() == 'yes'
        contraband = str(row.get('Contraband')).lower() == 'yes' or 'Contraband Found' in str(row.get('Search Disposition', ''))
        
        lat = float(row[lat_col])
        lng = float(row[lng_col])
        
        # Construct the PostGIS Point string
        location_wkt = f"SRID=4326;POINT({lng} {lat})"
        
        records_to_insert.append({
            'stop_date': str(stop_date),
            'agency_name': str(agency),
            'reason_for_stop': str(reason),
            'outcome': str(outcome),
            'search_conducted': search,
            'contraband_found': contraband,
            'lat': lat,
            'lng': lng,
            'location': location_wkt
        })
        
    print(f"Pushing {len(records_to_insert)} records to Supabase...")
    
    # 4. Push to Supabase in batches of 1000 to avoid request limits
    batch_size = 1000
    for i in range(0, len(records_to_insert), batch_size):
        batch = records_to_insert[i:i + batch_size]
        try:
            supabase.table('traffic_stops').insert(batch).execute()
        except Exception as e:
            print(f"Error inserting batch {i}: {e}")
            
    print("Data push complete!")

if __name__ == "__main__":
    main()
