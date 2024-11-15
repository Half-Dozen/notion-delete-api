import { NextResponse } from 'next/server';
import { tasks } from "@trigger.dev/sdk/v3";

// Database IDs configuration
const NOTION_DATABASES = {
  QBO_PROJECTS: "6bf327c6c1454c71a797baca43635424",
  BUYER_INFORMATION: "0fb39294c1c04b9dbe436fdf9dc77d7c",
  SKU_INFORMATION: "7c50b7c96b004b71bacc271941240ff3",
  SUPPLIER_INFORMATION: "0ea639b92bc4469c95d96c4731293d40",
  PROJECT_TRANSACTIONS: "2e913dfc17cf4e27a42487d316b3a18b"
} as const;

// Type for the request body
interface DeleteRequest {
  notionToken?: string;
  databases?: (keyof typeof NOTION_DATABASES)[];
  dryRun?: boolean;
  filter?: any;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body: DeleteRequest = await request.json();

    // Validate required fields
    if (!body.notionToken) {
      return NextResponse.json(
        { error: "notionToken is required" },
        { status: 400 }
      );
    }

    // Use environment variable token if not provided
    const notionToken = body.notionToken || process.env.NOTION_TOKEN;

    // Trigger the deletion task
    const taskResult = await tasks.trigger("delete-notion-items", {
      notionToken,
      databases: body.databases || Object.keys(NOTION_DATABASES),
      dryRun: body.dryRun ?? true, // Default to dry run for safety
      filter: body.filter
    });

    // Return immediately with the task ID
    return NextResponse.json({
      message: "Task triggered successfully",
      taskId: taskResult.id,
      dryRun: body.dryRun ?? true,
      databases: body.databases || Object.keys(NOTION_DATABASES)
    });
  } catch (error: any) {
    console.error('Error triggering task:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
