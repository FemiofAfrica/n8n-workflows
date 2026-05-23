import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Vapi Tool — Mark As Disinterested
// Nodes   : 3  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// VapiToolWebhook                    webhook
// UpdateOptOut                       googleSheets               [creds]
// RespondToVapi                      respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// VapiToolWebhook
//    → UpdateOptOut
//      → RespondToVapi
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'oBUaC0DueePn2L2v',
    name: 'Vapi Tool — Mark As Disinterested',
    active: true,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class VapiToolMarkAsDisinterestedWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'b2c3d4e5-0002-0002-0002-000000000001',
        webhookId: 'vapi-tool-disinterested',
        name: 'Vapi Tool Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [0, 0],
    })
    VapiToolWebhook = {
        httpMethod: 'POST',
        path: 'vapi-tool/disinterested',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'b2c3d4e5-0002-0002-0002-000000000003',
        name: 'Update Opt Out',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [220, 0],
        // Replace with your n8n Google Sheets OAuth2 credential id/name.
        credentials: {
            googleSheetsOAuth2Api: { id: 'YOUR_GOOGLE_SHEETS_OAUTH2_CRED_ID', name: 'Google Sheets OAuth2' },
        },
    })
    UpdateOptOut = {
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
                row_number: '={{ $json.body.message.call.metadata.rowNumber }}',
                'Call Status': 'Opt-out',
                'Recommended Action': 'Do not contact',
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
                    removed: true,
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
        id: 'b2c3d4e5-0002-0002-0002-000000000004',
        name: 'Respond To Vapi',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.1,
        position: [440, 0],
    })
    RespondToVapi = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ result: "Lead marked as opt-out successfully" }) }}',
        options: {
            responseCode: 200,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.VapiToolWebhook.out(0).to(this.UpdateOptOut.in(0));
        this.UpdateOptOut.out(0).to(this.RespondToVapi.in(0));
    }
}
