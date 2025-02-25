// src/app/api/generate-component/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { trackEvent } from "~/lib/posthog/server";
import { Anthropic } from "@anthropic-ai/sdk";

// Set up Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse the request body
    const body = await req.json();
    const { subject } = body;

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 },
      );
    }

    // Track the event
    // trackEvent(session.user.fid, "interactive_component_requested", {
    //   username: session.user.username,
    //   subject,
    // });

    // Check if a component for this subject already exists
    // const existingComponent = await db.query.interactiveComponents.findFirst({
    //   where: (components, { eq, and, like }) =>
    //     and(
    //       eq(components.status, "active"),
    //       like(components.subject, `%${subject}%`),
    //     ),
    // });

    // if (existingComponent) {
    //   return NextResponse.json({
    //     success: true,
    //     componentId: existingComponent.id,
    //     isNew: false,
    //   });
    // }

    // Generate a new component using Claude
    const prompt = generatePrompt(subject);
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system: `You are an expert at creating educational interactive React components. 
      Your task is to generate a React component that explains the requested subject in an engaging and interactive way.
      The component will be rendered using react-live, so it must be valid React code that can be rendered directly.
      Ensure the component is self-contained and follows React best practices.`,
    });

    // Extract the component code from the response
    const componentCode = extractComponentCode(
      (response.content?.[0] as any)?.text ?? "",
    );

    if (!componentCode) {
      return NextResponse.json(
        { success: false, error: "Failed to generate component" },
        { status: 500 },
      );
    }
    console.log(componentCode);
    // Create a new component in the database
    // const newComponent = await db
    //   .insert(db.interactiveComponents)
    //   .values({
    //     subject,
    //     code: componentCode,
    //     createdBy: session.user.id,
    //     status: "active",
    //     views: 0,
    //     likes: 0,
    //   })
    //   .returning();

    return NextResponse.json({
      success: true,
      //   componentId: newComponent[0].id,
      component: componentCode,
      isNew: true,
    });
  } catch (error) {
    console.error("Error generating component:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate component" },
      { status: 500 },
    );
  }
}

function generatePrompt(subject: string): string {
  return `
    I need you to create an interactive React component for react-live that explains the topic: "${subject}".
    
    Requirements:
    1. The component should be educational and engaging
    2. Use inline styles or className with Tailwind CSS classes for styling
    3. Make it interactive with at least one of the following:
       - Sliders to adjust parameters
       - Buttons to toggle between different concepts
       - Animated visualizations
       - Interactive diagrams
       - Simple quizzes or challenges
    4. The code should be completely self-contained in a single React component
    5. Use React hooks appropriately (useState, useEffect, etc.)
    6. Keep the component focused on explaining "${subject}" clearly
    7. Start with a functional component export like: "function InteractiveComponent() {"
    8. DO NOT use imports or require statements - all dependencies will be provided in scope
    9. Available libraries in scope: React and its hooks, recharts, lucide-react icons
    10. Include visualizations when appropriate
    11. Component should be accessible and work well on both desktop and mobile screens
    
    Return ONLY the React component code without any explanations, wrapped in triple backticks.
  `;
}

function extractComponentCode(responseText: string): string | null {
  // Extract code between triple backticks
  const codeRegex = /```(?:jsx|tsx)?([\s\S]*?)```/;
  const match = responseText.match(codeRegex);

  if (match && match[1]) {
    let code = match[1].trim();

    // Check if the code has any import statements, and remove them
    code = code.replace(/^import.*?;(\r?\n)*/gm, "");

    return code;
  }

  return null;
}
