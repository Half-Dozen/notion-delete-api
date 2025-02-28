import { NextResponse } from 'next/server';

// Database IDs configuration
const NOTION_DATABASES = {
  QBO_PROJECTS: "6bf327c6c1454c71a797baca43635424",
  BUYER_INFORMATION: "0fb39294c1c04b9dbe436fdf9dc77d7c",
  SKU_INFORMATION: "7c50b7c96b004b71bacc271941240ff3",
  SUPPLIER_INFORMATION: "0ea639b92bc4469c95d96c4731293d40",
  PROJECT_TRANSACTIONS: "2e913dfc17cf4e27a42487d316b3a18b"
} as const;

// Type for the request body
interface NotionFilter {
  property: string;
  [key: string]: unknown;
}

interface DeleteRequest {
  notionToken?: string;
  databases?: (keyof typeof NOTION_DATABASES)[];
  dryRun?: boolean;
  filter?: NotionFilter;
  archiveInstead?: boolean;
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

    // Trigger the task via Trigger.dev API
    const response = await fetch(
      'https://api.trigger.dev/api/v1/projects/proj_etyyvdcmcvcnxepdwdba/tasks/delete-notion-items/trigger',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRIGGER_SECRET_KEY}`
        },
        body: JSON.stringify({
          payload: {
            notionToken,
            databases: body.databases || Object.keys(NOTION_DATABASES),
            dryRun: body.dryRun ?? true, // Default to dry run for safety
            filter: body.filter,
            archiveInstead: body.archiveInstead ?? true // Default to archive instead of delete
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to trigger task: ${error}`);
    }

    const taskResult = await response.json();

    // Return immediately with the task ID
    return NextResponse.json({
      message: `Task triggered successfully (${body.archiveInstead ?? true ? 'archiving' : 'deleting'} items)`,
      taskId: taskResult.id,
      dryRun: body.dryRun ?? true,
      databases: body.databases || Object.keys(NOTION_DATABASES),
      action: body.archiveInstead ?? true ? 'archive' : 'delete'
    });
  } catch (error) {
    console.error('Error triggering task:', error);
    // Type guard to check if error is an Error object
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
