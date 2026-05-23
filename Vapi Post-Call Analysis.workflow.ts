import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Vapi Post-Call Analysis
// Nodes   : 8  |  Connections: 8
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// VapiEndOfCallWebhook               webhook
// ExtractCallData                    code
// CheckCallAnswered                  if
// AnalyseWithOpenai                  httpRequest                [creds]
// ParseClaudeResponse                code
// UpdateCrmRow                       googleSheets               [creds]
// SendFallbackEmail                  gmail                      [creds]
// RespondToVapi                      respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// VapiEndOfCallWebhook
//    → ExtractCallData
//      → CheckCallAnswered
//        → AnalyseWithOpenai
//          → ParseClaudeResponse
//            → UpdateCrmRow
//              → RespondToVapi
//       .out(1) → SendFallbackEmail
//          → RespondToVapi (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'rR5CcIK8vg7DQOEH',
    name: 'Vapi Post-Call Analysis',
    active: true,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class VapiPostCallAnalysisWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000001',
        webhookId: 'vapi-end-of-call',
        name: 'Vapi End Of Call Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [0, 0],
    })
    VapiEndOfCallWebhook = {
        httpMethod: 'POST',
        path: 'vapi/end-of-call',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000002',
        name: 'Extract Call Data',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [220, 0],
    })
    ExtractCallData = {
        mode: 'runOnceForEachItem',
        jsCode: `
const body = $input.item.json.body || $input.item.json;
const message = body.message || body;

// Only process end-of-call-report events
if (message.type !== 'end-of-call-report') return [];

const call = message.call || {};
const metadata = call.metadata || {};

// transcript and endedReason live on message, not on call
const transcript = message.transcript || message.artifact?.transcript || '';
const endedReason = message.endedReason || 'unknown';

return {
  json: {
    transcript,
    endedReason,
    callStatus: endedReason,
    leadName: metadata.leadName || message.customer?.name || call.customer?.name || '',
    email: metadata.email || message.customer?.email || call.customer?.email || '',
    phone: message.customer?.number || call.customer?.number || '',
    rowNumber: metadata.rowNumber || null,
    callId: call.id || '',
    durationSeconds: message.durationSeconds || 0,
  }
};
`,
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000003',
        name: 'Check Call Answered',
        type: 'n8n-nodes-base.if',
        version: 2.2,
        position: [440, 0],
    })
    CheckCallAnswered = {
        conditions: {
            options: {
                caseSensitive: false,
                leftValue: '',
                typeValidation: 'loose',
            },
            conditions: [
                {
                    leftValue: '={{ $json.transcript }}',
                    rightValue: '',
                    operator: {
                        type: 'string',
                        operation: 'notEmpty',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000004',
        name: 'Analyse With OpenAI',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [660, -120],
        // Replace with your n8n OpenAI credential id/name.
        credentials: { openAiApi: { id: 'YOUR_OPENAI_CRED_ID', name: 'OpenAI' } },
    })
    AnalyseWithOpenai = {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'openAiApi',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={{ JSON.stringify({ "model": "gpt-4o-mini", "max_tokens": 512, "messages": [{ "role": "system", "content": "You are a call analyst. Analyse the provided phone call transcript and return ONLY a valid JSON object with these exact keys: { \\"sentiment\\": \\"positive\\" | \\"neutral\\" | \\"negative\\", \\"sentimentScore\\": number from 1-10, \\"feedbackSummary\\": string max 100 chars summarising the key feedback, \\"recommendedAction\\": string describing the best next step }. No markdown, no explanation, just the JSON object." }, { "role": "user", "content": "Call transcript for " + $json.leadName + ":\\n\\n" + $json.transcript }] }) }}',
        options: {},
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000005',
        name: 'Parse Claude Response',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [880, -120],
    })
    ParseClaudeResponse = {
        mode: 'runOnceForEachItem',
        jsCode: `
const responseBody = $input.item.json;
const rawText = responseBody.choices?.[0]?.message?.content || '{}';

let parsed;
try {
  parsed = JSON.parse(rawText);
} catch (e) {
  // Fallback if wrapped in markdown
  const match = rawText.match(/\\{[\\s\\S]*\\}/);
  parsed = match ? JSON.parse(match[0]) : {};
}

const prev = $('Extract Call Data').item.json;

return {
  json: {
    ...prev,
    sentiment: parsed.sentiment || 'neutral',
    sentimentScore: parsed.sentimentScore || 5,
    feedbackSummary: parsed.feedbackSummary || '',
    recommendedAction: parsed.recommendedAction || '',
  }
};
`,
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000006',
        name: 'Update CRM Row',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [1100, -120],
        credentials: {
            googleSheetsOAuth2Api: { id: 'YOUR_GOOGLE_SHEETS_OAUTH2_CRED_ID', name: 'Google Sheets OAuth2' },
        },
    })
    UpdateCrmRow = {
        operation: 'update',
        documentId: {
            __rl: true,
            value: 'YOUR_GOOGLE_SHEET_DOC_ID',
            mode: 'id',
        },
        sheetName: {
            __rl: true,
            value: 'Leads',
            mode: 'name',
        },
        columns: {
            mappingMode: 'defineBelow',
            value: {
                Phone: '={{ $json.phone.startsWith("+") ? $json.phone.slice(1) : $json.phone }}',
                'Call Status': 'Completed',
                'Sentiment Score': '={{ $json.sentimentScore }}',
                'Feedback Summary': '={{ $json.feedbackSummary }}',
                'Recommended Action': '={{ $json.recommendedAction }}',
            },
            matchingColumns: ['Phone'],
            schema: [],
        },
        options: {},
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000007',
        name: 'Send Fallback Email',
        type: 'n8n-nodes-base.gmail',
        version: 2.1,
        position: [660, 120],
        // Replace with your n8n Gmail OAuth2 credential id/name.
        credentials: { gmailOAuth2: { id: 'YOUR_GMAIL_OAUTH2_CRED_ID', name: 'Gmail OAuth2' } },
    })
    SendFallbackEmail = {
        operation: 'send',
        sendTo: '={{ $json.email }}',
        subject: '={{ "We tried calling you, " + $json.leadName + " — How\'s it going?" }}',
        emailType: 'html',
        message: `={{
  const name = $json.leadName || 'there';
  return \`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi \${name}! 👋</h2>
  <p>We tried giving you a quick call today to check in, but it looks like we missed you.</p>
  <p>We'd love to hear how things are going. Feel free to reply to this email or hop on a quick call with us anytime.</p>
  <p>In the meantime, if you have any questions or need help getting started, we're here for you.</p>
  <p>Thanks,<br><strong>{{YOUR_TEAM_NAME}}</strong></p>
</div>\`;
}}`,
        options: {},
    };

    @node({
        id: 'd4e5f6a7-0004-0004-0004-000000000008',
        name: 'Respond To Vapi',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.1,
        position: [1320, 0],
    })
    RespondToVapi = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ received: true }) }}',
        options: {
            responseCode: 200,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.VapiEndOfCallWebhook.out(0).to(this.ExtractCallData.in(0));
        this.ExtractCallData.out(0).to(this.CheckCallAnswered.in(0));
        this.CheckCallAnswered.out(0).to(this.AnalyseWithOpenai.in(0));
        this.CheckCallAnswered.out(1).to(this.SendFallbackEmail.in(0));
        this.AnalyseWithOpenai.out(0).to(this.ParseClaudeResponse.in(0));
        this.ParseClaudeResponse.out(0).to(this.UpdateCrmRow.in(0));
        this.UpdateCrmRow.out(0).to(this.RespondToVapi.in(0));
        this.SendFallbackEmail.out(0).to(this.RespondToVapi.in(0));
    }
}
