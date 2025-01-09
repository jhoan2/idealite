import "server-only";

export async function getChannelDetails(id: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel?id=${id}&type=id`,
      options,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getNewMembers(id: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel/followers?id=${id}&limit=5`,
      options,
    );

    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getFarcasterUser(fid: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      options,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function checkIfMember(fid: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel/member/list?channel_id=idealite&fid=${fid}`,
      options,
    );
    const data = await response.json();
    return data.members.length > 0;
  } catch (err) {
    throw err;
  }
}

export async function inviteToChannel(fid: number) {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
    body: JSON.stringify({
      role: "member",
      signer_uuid: process.env.PERSONAL_NEYNAR_SIGNER_UUID,
      channel_id: "idealite",
      fid: fid,
    }),
  };

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/channel/member/invite`,
      options,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function crawlUrl(url: string) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      api_key: process.env.NEYNAR_API_KEY!,
    },
  };

  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast/embed/crawl?url=${encodedUrl}`,
      options,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}
