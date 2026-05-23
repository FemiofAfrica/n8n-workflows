import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : AI Lead Nurturing — CRON Dialer
// Nodes   : 6  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// ManualTrigger                      manualTrigger
// ReadLeads                          googleSheets               [creds]
// FilterAndPrepareCalls              code
// TriggerVapiCall                    httpRequest                [creds]
// UpdateCallStatus                   googleSheets               [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → ReadLeads
//      → FilterAndPrepareCalls
//        → TriggerVapiCall
//          → UpdateCallStatus
// ManualTrigger
//    → ReadLeads (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'Z37kHMNUGAD5CifH',
    name: 'AI Lead Nurturing — CRON Dialer',
    active: true,
    settings: {
        executionOrder: 'v1',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
        timeSavedMode: 'fixed',
        binaryMode: 'separate',
    },
})
export class AiLeadNurturingCronDialerWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000001',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.2,
        position: [0, -96],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'hours',
                },
            ],
        },
    };

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000002',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [0, 112],
    })
    ManualTrigger = {};

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000004',
        name: 'Read Leads',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [272, 0],
        // Replace these placeholders with your n8n credential id/name.
        credentials: {
            googleSheetsOAuth2Api: { id: 'YOUR_GOOGLE_SHEETS_OAUTH2_CRED_ID', name: 'Google Sheets OAuth2' },
        },
    })
    ReadLeads = {
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
        options: {
            returnFirstMatch: true,
        },
    };

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000005',
        name: 'Filter And Prepare Calls',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [480, 0],
    })
    FilterAndPrepareCalls = {
        jsCode: `const items = $input.all();
const today = new Date();
const isManual = $execution.mode === 'manual' || $execution.mode === 'integrated';
const leads = [];

for (const item of items) {
  const row = item.json;
  if (row['Call Status'] !== 'Pending') continue;

  const signupDate = new Date(row['Signup Date']);
  const diffDays = (today - signupDate) / (1000 * 60 * 60 * 24);

  leads.push({
    json: {
      leadName: row['Lead Name'],
      phone: row['Phone'],
      email: row['Email'],
      signupDate: row['Signup Date'],
      rowNumber: item.json.row_number,
    }
  });
}

return leads;`,
    };

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000006',
        name: 'Trigger Vapi Call',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [704, 0],
        // Create an n8n "HTTP Header Auth" credential with `Authorization: Bearer <VAPI_API_KEY>`.
        credentials: { httpHeaderAuth: { id: 'YOUR_VAPI_HEADER_AUTH_CRED_ID', name: 'Vapi Header Auth' } },
    })
    TriggerVapiCall = {
        method: 'POST',
        url: 'https://api.vapi.ai/call/phone',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "assistantId": "YOUR_VAPI_ASSISTANT_ID",
  "phoneNumberId": "YOUR_VAPI_PHONE_NUMBER_ID",
  "customer": {
    "name": "{{ $json.leadName }}",
    "number": "{{ $json.phone }}"
  },
  "assistantOverrides": {
    "firstMessage": "Hi {{ $json.leadName }}, this is {{YOUR_BRAND_NAME}}. It's been a little while since you tried {{YOUR_PRODUCT_NAME}}. How's your experience so far?"
  },
  "metadata": {
    "leadName": "{{ $json.leadName }}",
    "email": "{{ $json.email }}",
    "rowNumber": {{ $json.rowNumber }}
  }
}`,
        options: {},
    };

    @node({
        id: 'a1b2c3d4-0001-0001-0001-000000000007',
        name: 'Update Call Status',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [928, 0],
        credentials: {
            googleSheetsOAuth2Api: { id: 'YOUR_GOOGLE_SHEETS_OAUTH2_CRED_ID', name: 'Google Sheets OAuth2' },
        },
    })
    UpdateCallStatus = {
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
                row_number: '={{ $json.metadata.rowNumber }}',
                'Call Status': 'Initiated',
                Phone: '={{ $json.customer.number }}',
                Email: '={{ $json.metadata.email }}',
                'Lead Name': '={{ $json.metadata.leadName }}',
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
                    removed: false,
                },
                {
                    id: 'Phone',
                    displayName: 'Phone',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: false,
                },
                {
                    id: 'Email',
                    displayName: 'Email',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: false,
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
            attemptToConvertTypes: false,
            convertFieldsToString: false,
        },
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.ReadLeads.in(0));
        this.ManualTrigger.out(0).to(this.ReadLeads.in(0));
        this.ReadLeads.out(0).to(this.FilterAndPrepareCalls.in(0));
        this.FilterAndPrepareCalls.out(0).to(this.TriggerVapiCall.in(0));
        this.TriggerVapiCall.out(0).to(this.UpdateCallStatus.in(0));
    }
}
