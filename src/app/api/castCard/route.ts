import { NextRequest, NextResponse } from 'next/server';
export async function PATCH(req: NextRequest) {
    const { reaction_type, signer_uuid, target, target_author_fid, idem } = await req.json();

    if (!reaction_type || !signer_uuid || !target || !target_author_fid) {
        return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

    try {
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY!,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                reaction_type,
                signer_uuid,
                target,
                target_author_fid,
                idem
            })
        };

        const response = await fetch('https://api.neynar.com/v2/farcaster/reaction', options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${data.message || 'Unknown error'}`);
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'An error occurred while fetching the event feed' }, { status: 500 });
    }
}
