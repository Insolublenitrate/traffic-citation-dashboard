import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We initialize inside the GET request to avoid build-time errors when env vars aren't present
export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase credentials in environment variables" }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(request.url);
  
  // Get bounding box coordinates from query parameters
  const minLng = searchParams.get('min_lng') || '-180';
  const minLat = searchParams.get('min_lat') || '-90';
  const maxLng = searchParams.get('max_lng') || '180';
  const maxLat = searchParams.get('max_lat') || '90';

  // Call our Supabase RPC function  // Construct PostGIS bounding box query using supabase.rpc
  const { data, error } = await supabase.rpc('get_traffic_stops_in_bounds', {
    min_lng: parseFloat(minLng),
    min_lat: parseFloat(minLat),
    max_lng: parseFloat(maxLng),
    max_lat: parseFloat(maxLat)
  });

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
