import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=dailylearning';

async function fetchNeynarAPI(url: string) {
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'api_key': NEYNAR_API_KEY as string
    }
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  const cursor = searchParams.get('cursor');
  console.log(fid)

  if (!fid) {
    return NextResponse.json({ error: 'fid is required' }, { status: 400 });
  }

  try {

    let url = new URL(NEYNAR_API_URL);
    url.searchParams.append('viewer_fid', fid);
    url.searchParams.append('limit', '3');
    url.searchParams.append('reply_depth', '2');
    url.searchParams.append('include_chronological_parent_casts', 'false');
    url.searchParams.append('type', 'hash');

    if (cursor) {
      url.searchParams.append('cursor', cursor);
    }

    const conversationResponse = await fetchNeynarAPI(url.toString());
    return NextResponse.json(conversationResponse);
  } catch (error) {
    console.error('Error fetching event feed:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the event feed' }, { status: 500 });
  }
}