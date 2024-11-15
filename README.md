# Notion Delete API

A Next.js API endpoint for safely deleting items from Notion databases while respecting API rate limits.

## Features

- Delete items from multiple Notion databases
- Dry run support to preview deletions
- Rate limit handling
- Asynchronous processing via Trigger.dev
- Filter support for targeted deletions

## API Usage

Send a POST request to `/api/delete`:

```json
{
  "notionToken": "your-notion-token",
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"],  // Optional
  "dryRun": true,  // Optional, defaults to true
  "filter": {  // Optional
    "property": "Status",
    "select": {
      "equals": "Archived"
    }
  }
}
```

### Available Databases

- `QBO_PROJECTS`: QBO Projects (OS)
- `BUYER_INFORMATION`: Buyer Information (OS)
- `SKU_INFORMATION`: SKU Information (OS)
- `SUPPLIER_INFORMATION`: Supplier Information (OS)
- `PROJECT_TRANSACTIONS`: Project Transactions (OS)

### Response

```json
{
  "message": "Task triggered successfully",
  "taskId": "run_abc123",
  "dryRun": true,
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"]
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

## Important Notes

- Always test with `dryRun: true` first
- The task runs asynchronously - use the taskId to check progress
- Deletion cannot be undone
- Rate limits are automatically respected
