# RAG — Chat (n8n Workflow Export)

This folder contains sanitized n8n workflow exports:

- `RAG — Chat.workflow.json`
- `RAG — Document Ingestion.workflow.json`

It’s intended for portfolio sharing and reuse. Instance-specific credential bindings have been removed.

## How The Two Workflows Fit Together

```mermaid
flowchart LR
  subgraph Ingest["Workflow: RAG — Document Ingestion"]
    GD["Google Drive Trigger\n(n8n-nodes-base.googleDriveTrigger)"] --> DL["Download File\n(n8n-nodes-base.googleDrive)"]
    TS["Recursive Character Text Splitter\n(textSplitterRecursiveCharacterTextSplitter)"] --> Loader["Default Data Loader\n(documentDefaultDataLoader)"]
    Emb1["Embeddings Ollama\n(embeddingsOllama)"] --> PGI["PGVector Insert\n(vectorStorePGVector)"]
    Loader --> PGI
    DL --> PGI
  end

  subgraph Store["Shared Storage"]
    PG["Postgres + PGVector\n(shared vector store)"]
  end

  subgraph Chat["Workflow: RAG — Chat"]
    Trigger["Chat Trigger\n(chatTrigger)"] --> Agent["RAG Agent\n(agent)"]
    Groq["Groq LLM\n(lmChatGroq)"] --> Agent
    KB["Knowledge Base\n(vectorStorePGVector)"] --> Agent
    Emb2["Embeddings Ollama\n(embeddingsOllama)"] --> KB
  end

  PGI --> PG
  PG --> KB
```

In short: ingestion watches Google Drive, fetches new/updated files, chunks them, embeds them, and inserts them into **PGVector**. The chat workflow queries that same PGVector store as its “Knowledge Base” tool.

## Import Into n8n

1. In n8n, go to **Workflows**.
2. Use **Import from File** and select `RAG — Chat.workflow.json`.
3. Open the workflow and re-connect the required credentials.

## Credentials / Configuration

Each export includes `meta.redactedCredentials` to hint which credential types were removed. These workflows use:

- `postgres`
- `ollamaApi`
- `groqApi`
- `googleDriveOAuth2Api`

After importing, open each affected node and select the correct credential(s) for your instance.

## Notes

- The JSON is exported with `"active": false` so importing it won’t auto-enable anything.
- Pinned data and static workflow data are stripped from this public export.
