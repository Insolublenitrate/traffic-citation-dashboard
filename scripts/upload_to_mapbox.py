import os
import argparse
import requests
import json
import time
from requests_toolbelt.multipart.encoder import MultipartEncoder

def main():
    parser = argparse.ArgumentParser(description='Upload NDJSON to Mapbox Tiling Service and Publish Tileset.')
    parser.add_argument('--username', required=True, help='Mapbox username')
    parser.add_argument('--token', required=True, help='Mapbox secret access token (sk...)')
    parser.add_argument('--file', required=True, help='Path to the NDJSON or GZ file')
    args = parser.parse_args()

    username = args.username
    token = args.token
    file_path = args.file
    
    source_id = "ohio-traffic-stops-source"
    tileset_id = f"{username}.ohio-traffic-stops"
    
    # 1. Create Tileset Source
    print(f"Creating/Updating Tileset Source: mapbox://tileset-source/{username}/{source_id}")
    url = f"https://api.mapbox.com/tilesets/v1/sources/{username}/{source_id}?access_token={token}"
    
    # Use requests-toolbelt to stream the multipart/form-data upload
    m = MultipartEncoder(
        fields={'file': ('ohio_traffic_stops.ldgeojson', open(file_path, 'rb'), 'application/json')}
    )
    
    print("Uploading to Mapbox Tiling Service (this may take a few minutes)...")
    response = requests.post(url, data=m, headers={'Content-Type': m.content_type})
        
    if response.status_code not in [200, 201]:
        print(f"Error creating source: {response.text}")
        return
    print("Source created successfully!")

    # 2. Create Recipe
    print("Creating Mapbox Recipe...")
    recipe = {
        "version": 1,
        "layers": {
            "traffic_stops": {
                "source": f"mapbox://tileset-source/{username}/{source_id}",
                "minzoom": 0,
                "maxzoom": 16
            }
        }
    }
    
    # 3. Create or Update Tileset with Recipe
    print(f"Creating Tileset: {tileset_id}")
    url_create = f"https://api.mapbox.com/tilesets/v1/{tileset_id}?access_token={token}"
    response = requests.post(
        url_create, 
        headers={"Content-Type": "application/json"},
        json={"recipe": recipe, "name": "Ohio Traffic Stops"}
    )
    
    # If 400 or 409 because it exists, we can try to update the recipe
    if response.status_code not in [200, 201]:
        if 'already exists' in response.text or response.status_code == 400:
            print("Tileset may already exist. Updating recipe instead...")
            url_update = f"https://api.mapbox.com/tilesets/v1/{tileset_id}/recipe?access_token={token}"
            response = requests.patch(
                url_update,
                headers={"Content-Type": "application/json"},
                json=recipe
            )
            if response.status_code not in [200, 201, 204]:
                print(f"Error updating recipe: {response.text}")
                return
        else:
            print(f"Error creating tileset: {response.text}")
            return
            
    print("Tileset created/updated successfully!")

    # 4. Publish Tileset
    print(f"Publishing Tileset {tileset_id}...")
    url_publish = f"https://api.mapbox.com/tilesets/v1/{tileset_id}/publish?access_token={token}"
    response = requests.post(url_publish)
    
    if response.status_code not in [200, 201]:
        print(f"Error publishing tileset: {response.text}")
        return
        
    print("\nSUCCESS! Tileset has been queued for publishing.")
    print("This can take anywhere from a few minutes to an hour depending on Mapbox server load.")
    print(f"You can monitor the status at: https://studio.mapbox.com/tilesets/{tileset_id}")

if __name__ == "__main__":
    main()
