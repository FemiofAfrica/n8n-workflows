import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Vapi Tool — Request Feedback
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// VapiToolWebhook                    webhook
// SendFeedbackEmail                  gmail                      [creds]
// UpdateReviewSent                   googleSheets               [creds]
// RespondToVapi                      respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// VapiToolWebhook
//    → SendFeedbackEmail
//      → UpdateReviewSent
//        → RespondToVapi
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'rdGBXXAyNYKpXPEH',
    name: 'Vapi Tool — Request Feedback',
    active: true,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class VapiToolRequestFeedbackWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'c3d4e5f6-0003-0003-0003-000000000001',
        webhookId: 'vapi-tool-review-link',
        name: 'Vapi Tool Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [0, 0],
    })
    VapiToolWebhook = {
        httpMethod: 'POST',
        path: 'vapi-tool/review-link',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'c3d4e5f6-0003-0003-0003-000000000002',
        // Optional n8n node webhook id; safe to remove or replace in your own instance.
        webhookId: 'YOUR_N8N_NODE_WEBHOOK_ID',
        name: 'Send Feedback Email',
        type: 'n8n-nodes-base.gmail',
        version: 2.1,
        position: [224, 0],
        // Replace with your n8n Gmail OAuth2 credential id/name.
        credentials: { gmailOAuth2: { id: 'YOUR_GMAIL_OAUTH2_CRED_ID', name: 'Gmail OAuth2' } },
    })
    SendFeedbackEmail = {
        sendTo: '={{ $json.body.message?.call?.metadata?.email || $json.body.email || "" }}',
        subject:
            '={{ "We\'d love your feedback, " + ($json.body.message?.call?.metadata?.leadName || $json.body.message?.call?.customer?.name || "friend") + "!" }}',
        emailType: 'html',
        message:
            '={{ (function(){ var name = ($json.body.message && $json.body.message.call && $json.body.message.call.metadata && $json.body.message.call.metadata.leadName) ? $json.body.message.call.metadata.leadName : (($json.body.message && $json.body.message.call && $json.body.message.call.customer) ? $json.body.message.call.customer.name : "there"); return "<div style=\\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\\"><h2>Hey " + name + "! 👋</h2><p>Thanks again for chatting with us. We really appreciate you taking the time.</p><p>We&#39;d love to hear a little more &#8212; just hit reply:</p><ul style=\\"line-height: 1.8;\\"><li>What&#39;s one thing you enjoy most?</li><li>Is there anything we could do better?</li></ul><p>Thanks,<br><strong>{{YOUR_TEAM_NAME}}</strong></p></div>"; })() }}',
        options: {},
    };

    @node({
        id: 'c3d4e5f6-0003-0003-0003-000000000003',
        name: 'Update Review Sent',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [448, 0],
        credentials: {
            googleSheetsOAuth2Api: { id: 'YOUR_GOOGLE_SHEETS_OAUTH2_CRED_ID', name: 'Google Sheets OAuth2' },
        },
    })
    UpdateReviewSent = {
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
                row_number: '={{ $("Vapi Tool Webhook").item.json.body.message.call.metadata.rowNumber }}',
                'Call Status': 'Review Requested',
                'Recommended Action': 'Feedback email sent',
            },
            matchingColumns: ['row_number'],
            schema: [
                {
                    id: 'Lead Name',
                    displayName: 'Lead Name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'Phone',
                    displayName: 'Phone',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: true,
                },
                {
                    id: 'Email',
                    displayName: 'Email',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: true,
                },
                {
                    id: 'Signup Date',
                    displayName: 'Signup Date',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: true,
                },
                {
                    id: 'Call Status',
                    displayName: 'Call Status',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'Recommended Action',
                    displayName: 'Recommended Action',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'row_number',
                    displayName: 'row_number',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'number',
                    canBeUsedToMatch: true,
                    readOnly: true,
                    removed: false,
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'c3d4e5f6-0003-0003-0003-000000000004',
        name: 'Respond To Vapi',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.1,
        position: [672, 0],
    })
    RespondToVapi = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ result: "Feedback request email sent" }) }}',
        options: {
            responseCode: 200,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.VapiToolWebhook.out(0).to(this.SendFeedbackEmail.in(0));
        this.SendFeedbackEmail.out(0).to(this.UpdateReviewSent.in(0));
        this.UpdateReviewSent.out(0).to(this.RespondToVapi.in(0));
    }
}
