import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return new NextResponse('Missing coordinates', { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const zoom = 14;

  const n = Math.pow(2, zoom);
  const x = Math.floor(n * ((lng + 180) / 360));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2);

  try {
    const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    
    let response: Response;
    try {
       response = await fetch(url, { 
         headers: {
           'User-Agent': 'GeoTagPro/1.0 (Contact: admin@example.com)'
         },
         signal: AbortSignal.timeout(5000) 
       });
    } catch (fetchError) {
       console.error("Fetch error to static map service:", fetchError);
       return new NextResponse('Service Unavailable', { status: 503 });
    }
    
    if (!response.ok) {
       return new NextResponse('Failed to fetch tile', { status: response.status });
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error("Error fetching static map:", error);
    return new NextResponse('Error fetching map', { status: 500 });
  }
}
