export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Notion Archive API</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Usage</h2>
        <p className="mb-4">Send a POST request to <code className="bg-gray-100 px-2 py-1 rounded">/api/delete</code></p>
        
        <h3 className="text-xl font-semibold mb-2">Request Body:</h3>
        <pre className="bg-gray-100 p-4 rounded mb-4 overflow-x-auto">
{`{
  "notionToken": "your-notion-token",
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"],  // Optional
  "dryRun": true,  // Optional, defaults to true
  "archiveInstead": true,  // Optional, defaults to true (move to trash)
  "filter": {  // Optional
    "property": "Status",
    "select": {
      "equals": "Archived"
    }
  }
}`}
        </pre>

        <h3 className="text-xl font-semibold mb-2">Available Databases:</h3>
        <ul className="list-disc list-inside mb-4">
          <li>QBO_PROJECTS: QBO Projects (OS)</li>
          <li>BUYER_INFORMATION: Buyer Information (OS)</li>
          <li>SKU_INFORMATION: SKU Information (OS)</li>
          <li>SUPPLIER_INFORMATION: Supplier Information (OS)</li>
          <li>PROJECT_TRANSACTIONS: Project Transactions (OS)</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2">Response:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
{`{
  "message": "Task triggered successfully (archiving items)",
  "taskId": "run_abc123",
  "dryRun": true,
  "action": "archive",
  "databases": ["QBO_PROJECTS", "BUYER_INFORMATION"]
}`}
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Important Notes:</h2>
        <ul className="list-disc list-inside">
          <li>Always test with <code className="bg-gray-100 px-2 py-1 rounded">dryRun: true</code> first</li>
          <li>The task runs asynchronously - use the taskId to check progress</li>
          <li>Items are moved to trash by default (<code className="bg-gray-100 px-2 py-1 rounded">archiveInstead: true</code>)</li>
          <li>Rate limits are automatically respected</li>
          <li>Permanent deletion is not supported by the Notion API</li>
        </ul>
      </section>
    </main>
  );
}
