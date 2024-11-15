# Notion Delete/Archive API

A Next.js API endpoint for safely deleting or archiving items from Notion databases while respecting API rate limits. Integrates with n8n for automated workflows.

## Features

- Delete or archive items from multiple Notion databases
- Dry run support to preview operations
- Rate limit handling with automatic retries
- Asynchronous processing via Trigger.dev
- Webhook integration for automation chaining
- Comprehensive error handling and logging

## API Usage

Send a POST request to `/api/delete`:

```json
{
  "notionToken": "your-notion-token",
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"],  // Optional
  "dryRun": true,  // Optional, defaults to true
  "archiveInstead": true  // Optional, defaults to true
}
```

### Available Databases

- `QBO_PROJECTS`: QBO Projects (OS)
- `BUYER_INFORMATION`: Buyer Information (OS)
- `SKU_INFORMATION`: SKU Information (OS)
- `SUPPLIER_INFORMATION`: Supplier Information (OS)
- `PROJECT_TRANSACTIONS`: Project Transactions (OS)

### API Response

```json
{
  "message": "Task triggered successfully (archiving items)",
  "taskId": "run_abc123",
  "dryRun": true,
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"],
  "action": "archive"
}
```

### Task Results

The Trigger.dev task will process the request and return results in this format:

```json
{
  "totalProcessed": 100,
  "successful": 95,
  "failed": 5,
  "databaseResults": {
    "QBO_PROJECTS": {
      "name": "QBO_PROJECTS",
      "processed": 50,
      "successful": 48,
      "failed": 2
    }
  },
  "errors": []
}
```

### Webhook Integration

After successful completion (non-dry run), the task sends a POST request to n8n with:

```json
{
  "results": {
    "totalProcessed": 100,
    "successful": 95,
    "failed": 5,
    "databaseResults": {
      "QBO_PROJECTS": {
        "name": "QBO_PROJECTS",
        "processed": 50,
        "successful": 48,
        "failed": 2
      }
    },
    "errors": []
  },
  "action": "archive",
  "timestamp": "2023-11-15T14:30:00.000Z"
}
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
TRIGGER_SECRET_KEY=your-trigger-dev-key
NOTION_TOKEN=your-notion-token
```

3. Run the development server:
```bash
npm run dev
```

## Safety Features

1. Dry Run Mode
- Default: true
- Preview changes without affecting data
- Shows exact items that would be processed

2. Archive Instead of Delete
- Default: true
- Moves items to trash instead of permanent deletion
- Items can be restored if needed

## Rate Limiting

The API implements several measures to respect Notion's rate limits:
- 350ms delay between operations
- Automatic retry with exponential backoff
- Maximum of 5 retry attempts
- Respects Notion's "Retry-After" headers

## Error Handling

- Per-item operation tracking
- Detailed error messages
- Per-database success/failure counts
- Continues processing on individual item failures
- Comprehensive logging in Trigger.dev

## Deployment

The API is deployed on Vercel and can be accessed at:
```
https://notion-delete-api.vercel.app/api/delete
```

## Important Notes

- Always test with `dryRun: true` first
- The task runs asynchronously - use Trigger.dev dashboard to monitor progress
- When `archiveInstead: false`, deletion cannot be undone
- Webhook is only triggered for non-dry run operations
- Rate limits are automatically respected
- Large databases are processed in batches with pagination
