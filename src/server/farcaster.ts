import 'server-only'

export async function getChannelDetails(id: string) {
    const options = {
        method: 'GET',
        headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY! },
    };

    try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/channel?id=${id}&type=id`, options);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}



export async function getNewMembers(id: string) {
    const options = {
        method: 'GET',
        headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY! }
    };

    try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/channel/followers?id=${id}&limit=5`, options)

        const data = await response.json();
        return data;
    } catch (err) {
        throw err;
    }
}