import { task } from "@trigger.dev/sdk/v3";
import { Client } from "@notionhq/client";
import pRetry from "p-retry";

// Database IDs configuration
const NOTION_DATABASES = {
  QBO_PROJECTS: "6bf327c6c1454c71a797baca43635424",
  BUYER_INFORMATION: "0fb39294c1c04b9dbe436fdf9dc77d7c",
  SKU_INFORMATION: "7c50b7c96b004b71bacc271941240ff3",
  SUPPLIER_INFORMATION: "0ea639b92bc4469c95d96c4731293d40",
  PROJECT_TRANSACTIONS: "2e913dfc17cf4e27a42487d316b3a18b"
} as const;

interface DeleteNotionItemsPayload {
  notionToken: string;
  databases?: (keyof typeof NOTION_DATABASES)[];
  filter?: any;
  dryRun?: boolean;
  archiveInstead?: boolean;
}

// Create Notion client with retries for rate limits
const createNotionClient = (token: string) => {
  const client = new Client({ 
    auth: token,
    notionVersion: "2022-06-28"
  });
  
  const withRetry = async (operation: () => Promise<any>) => {
    return pRetry(operation, {
      retries: 5,
      onFailedAttempt: async (error) => {
        if (error.name === "APIResponseError" && error.status === 429) {
          const retryAfter = parseInt(error.headers?.["retry-after"] || "5");
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }
      },
    });
  };

  return {
    databases: {
      query: async (args: Parameters<typeof client.databases.query>[0]) => 
        withRetry(() => client.databases.query(args)),
    },
    pages: {
      update: async (args: Parameters<typeof client.pages.update>[0]) =>
        withRetry(() => client.pages.update(args)),
    }
  };
};

// Main task definition
export const deleteNotionItems = task({
  id: "delete-notion-items",
  name: "Delete/Archive Notion Items",
  version: "1.0.0",
  run: async (payload: DeleteNotionItemsPayload, { logger }) => {
    // Log the start of the task
    logger.info("Starting task", { 
      databases: payload.databases,
      dryRun: payload.dryRun,
      action: payload.archiveInstead ? 'archive' : 'delete'
    });

    const notion = createNotionClient(payload.notionToken);
    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      databaseResults: {} as Record<string, {
        name: string,
        processed: number,
        successful: number,
        failed: number,
      }>,
    };

    // Determine which databases to process
    const databasesToProcess = payload.databases 
      ? payload.databases.map(key => ({ 
          id: NOTION_DATABASES[key], 
          name: key 
        }))
      : Object.entries(NOTION_DATABASES).map(([key, id]) => ({ 
          id, 
          name: key 
        }));

    // Process each database
    for (const { id: databaseId, name } of databasesToProcess) {
      try {
        logger.info(`Processing database: ${name}`);
        
        let hasMore = true;
        let startCursor: string | undefined = undefined;
        results.databaseResults[name] = {
          name,
          processed: 0,
          successful: 0,
          failed: 0,
        };

        // Paginate through all items in the database
        while (hasMore) {
          const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
            filter: payload.filter,
          });

          // Process items in batches (respecting rate limits)
          for (const page of response.results) {
            results.totalProcessed++;
            results.databaseResults[name].processed++;
            
            if (!payload.dryRun) {
              try {
                await notion.pages.update({
                  page_id: page.id,
                  archived: true,
                  ...(payload.archiveInstead ? { in_trash: true } : {})
                });
                
                results.successful++;
                results.databaseResults[name].successful++;
                
                logger.info(`Archived page ${page.id} from ${name}`);
                
                // Add a small delay between operations to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 350));
              } catch (error: any) {
                results.failed++;
                results.databaseResults[name].failed++;
                const errorMessage = `Failed to archive page ${page.id} from ${name}: ${error.message}`;
                results.errors.push(errorMessage);
                logger.error(errorMessage);
              }
            }
          }

          hasMore = response.has_more;
          startCursor = response.next_cursor ?? undefined;
        }

        logger.info(`Completed database ${name}`, results.databaseResults[name]);
      } catch (error: any) {
        const errorMessage = `Failed to process database ${name}: ${error.message}`;
        results.errors.push(errorMessage);
        logger.error(errorMessage);
      }
    }

    logger.info("Task completed", results);
    return results;
  },
});
