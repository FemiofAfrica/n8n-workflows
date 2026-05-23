# RAG — Chat (n8n Workflow Export)

This folder contains a sanitized n8n workflow export:

- `RAG — Chat.workflow.json`

It’s intended for portfolio sharing and reuse. Instance-specific credential bindings have been removed.

## Import Into n8n

1. In n8n, go to **Workflows**.
2. Use **Import from File** and select `RAG — Chat.workflow.json`.
3. Open the workflow and re-connect the required credentials.

## Credentials / Configuration

The export includes `meta.redactedCredentials` to hint which credential types were removed. In this workflow it includes:

- `postgres`
- `ollamaApi`
- `groqApi`

After importing, open each affected node and select the correct credential(s) for your instance.

## Notes

- The JSON is exported with `"active": false` so importing it won’t auto-enable anything.
- Pinned data and static workflow data are stripped from this public export.

