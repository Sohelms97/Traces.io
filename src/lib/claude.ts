export type DocumentType = 
  | 'bill_of_lading' 
  | 'investment_contract' 
  | 'commercial_invoice' 
  | 'packing_list' 
  | 'payment_slip' 
  | 'inspection_report' 
  | 'clearing_document' 
  | 'grn' 
  | 'product_list' 
  | 'auto_detect';

export interface ExtractionResult {
  data: any;
  confidence_notes: Record<string, string>;
  document_type: DocumentType;
}

const extractionPrompts: Record<string, string> = {
  bill_of_lading: `Extract the following information from this Bill of Lading document and return ONLY a valid JSON object with these exact keys:
{
  bl_number: "",
  shipper_name: "",
  consignee_name: "",
  port_of_loading: "",
  port_of_discharge: "",
  vessel_name: "",
  voyage_number: "",
  container_number: "",
  seal_number: "",
  goods_description: "",
  gross_weight: "",
  net_weight: "",
  number_of_packages: "",
  etd_date: "",
  freight_terms: "",
  confidence_notes: {}
}
For each field you are uncertain about, add a note in confidence_notes with the field name and reason. If a field is not found, use null. Return ONLY the JSON, no explanation.`,

  investment_contract: `Extract the following information from this Investment Contract and return ONLY a valid JSON object with these exact keys:
{
  investor_name: "",
  investment_amount: "",
  agreement_date: "",
  payment_terms: "",
  expected_roi: "",
  contract_reference: "",
  parties_involved: [],
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  commercial_invoice: `Extract the following information from this Commercial Invoice and return ONLY a valid JSON object with these exact keys:
{
  invoice_number: "",
  invoice_date: "",
  supplier_name: "",
  buyer_name: "",
  product_description: "",
  quantity: "",
  unit_price: "",
  total_amount: "",
  currency: "",
  payment_terms: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  packing_list: `Extract the following information from this Packing List and return ONLY a valid JSON object with these exact keys:
{
  supplier_name: "",
  product_name: "",
  number_of_cartons: "",
  quantity_per_carton: "",
  gross_weight: "",
  net_weight: "",
  total_packages: "",
  container_number: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  payment_slip: `Extract the following information from this Payment Slip / SWIFT Copy and return ONLY a valid JSON object with these exact keys:
{
  transfer_date: "",
  amount: "",
  currency: "",
  sender_name: "",
  sender_bank: "",
  receiver_name: "",
  receiver_bank: "",
  reference_number: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  inspection_report: `Extract the following information from this Pre-Shipment Inspection Report and return ONLY a valid JSON object with these exact keys:
{
  inspection_date: "",
  inspector_name: "",
  product_name: "",
  result: "",
  certificate_number: "",
  specifications: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  clearing_document: `Extract the following information from this Customs Clearing Document and return ONLY a valid JSON object with these exact keys:
{
  clearance_date: "",
  declaration_number: "",
  hs_code: "",
  duty_amount: "",
  vat_amount: "",
  total_clearing_cost: "",
  agent_name: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,

  grn: `Extract the following information from this Goods Received Note (GRN) and return ONLY a valid JSON object with these exact keys:
{
  grn_number: "",
  date: "",
  supplier_name: "",
  product_name: "",
  quantity_received: "",
  condition: "",
  verified_by: "",
  confidence_notes: {}
}
Return ONLY the JSON, no explanation.`,
};

export async function extractDataFromDocument(
  base64Data: string, 
  fileType: string, 
  documentType: DocumentType
): Promise<ExtractionResult> {
  const apiKey = localStorage.getItem('traces_api_key');
  if (!apiKey) {
    throw new Error('Anthropic API Key not found. Please add it in Settings -> Integrations.');
  }

  const prompt = documentType === 'auto_detect' 
    ? "Identify the type of this document and extract all relevant ERP data. Return ONLY a JSON object with 'document_type' and the extracted fields."
    : (extractionPrompts[documentType] || "Extract all relevant data from this document and return as JSON.");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: fileType,
                data: base64Data
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to extract data');
    }

    const result = await response.json();
    const textResponse = result.content[0].text;
    
    // Find JSON in the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      data,
      confidence_notes: data.confidence_notes || {},
      document_type: data.document_type || documentType
    };
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
}
