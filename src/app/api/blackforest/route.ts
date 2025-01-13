import "server-only";

export async function GET(req: Request) {
  // Get ID from query params
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    console.log("Request rejected: Missing ID");
    return Response.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    // First fetch: Get the URL
    const urlResponse = await fetch(
      `https://api.bfl.ml/v1/get_result?id=${id}`,
    );
    const urlData = await urlResponse.json();

    // Check if we got a valid URL from the first request
    if (!urlData.id) {
      return Response.json(
        { status: "failed", error: "No image URL in response" },
        { status: 404 },
      );
    }

    if (urlData.status === "Pending") {
      return Response.json({ status: "pending" });
    }

    if (urlData.status === "Ready") {
      // Second fetch: Get the actual image
      const imageResponse = await fetch(urlData.result.sample);

      if (!imageResponse.ok) {
        return Response.json(
          { status: "failed", error: "Failed to fetch image" },
          { status: imageResponse.status },
        );
      }

      // Convert image to buffer and send it back
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");

      return Response.json({
        status: "completed",
        output: `data:image/jpeg;base64,${base64Image}`,
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  const url = "https://api.bfl.ml/v1/flux-pro-1.1";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": process.env.BLACK_FOREST_API_KEY!,
    },
    body: JSON.stringify({
      prompt: body.prompt,
      width: body.width,
      height: body.height,
      prompt_upsampling: false,
      safety_tolerance: 2,
      output_format: "jpeg",
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
