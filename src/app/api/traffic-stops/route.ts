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
  const min_lng = parseFloat(searchParams.get('min_lng') || '-180');
  const min_lat = parseFloat(searchParams.get('min_lat') || '-90');
  const max_lng = parseFloat(searchParams.get('max_lng') || '180');
  const max_lat = parseFloat(searchParams.get('max_lat') || '90');

  // Call our Supabase RPC function that uses PostGIS ST_MakeEnvelope
  const { data, error } = await supabase.rpc('get_traffic_stops_in_bounds', {
    min_lng,
    min_lat,
    max_lng,
    max_lat
  });

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
