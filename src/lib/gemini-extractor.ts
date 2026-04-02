import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from 'xlsx';

/**
 * Repairs truncated JSON by attempting to close open braces and brackets.
 */
function repairTruncatedJson(json: string): string {
  try {
    JSON.parse(json);
    return json;
  } catch (e) {
    let repaired = json.trim();
    
    // Remove trailing commas or incomplete keys/values
    repaired = repaired.replace(/,\s*$/, "");
    repaired = repaired.replace(/,\s*"[^"]*$/, "");
    repaired = repaired.replace(/:\s*"[^"]*$/, ": null");
    repaired = repaired.replace(/:\s*[^"}\]]*$/, ": null");

    // Count open braces and brackets
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Add missing closing characters
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";

    try {
      JSON.parse(repaired);
      return repaired;
    } catch (innerError) {
      return json; // Return original if repair fails
    }
  }
}

async function generateWithRetry(ai: any, modelName: string, contents: any, config: any, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });
    } catch (error: any) {
      const isRpcError = error.message?.includes('Rpc failed') || error.message?.includes('xhr error');
      if (isRpcError && i < retries) {
        console.warn(`Gemini RPC error, retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}

export async function extractWithGemini(
  fileBase64: string,
  mimeType: string,
  documentType: string
) {
  const apiKey = localStorage.getItem('traces_api_key') || process.env.GEMINI_API_KEY;
  const modelName = localStorage.getItem('traces_ai_model') || 'gemini-3-flash-preview';

  if (!apiKey) {
    throw new Error('No API key found. Please add your Gemini API key in Settings or environment variables.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildExtractionPrompt(documentType);

    const response = await generateWithRetry(ai, modelName, [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: `Please extract data from this ${documentType} document. Be concise and focus on the most important fields.`
          }
        ]
      }
    ], {
      systemInstruction: prompt,
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response. Please try again or check the document quality.');
    }

    // Clean JSON response
    let cleanJson = text.trim();
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```json\n?|```/g, '').trim();
    }
    
    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON Parse Error. Raw text:', text);
      
      // Attempt to repair truncated JSON
      const repaired = repairTruncatedJson(cleanJson);
      try {
        return JSON.parse(repaired);
      } catch (repairError) {
        // Try to find JSON block if it's embedded in text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (innerError) {
            // Try repairing the matched block too
            const repairedMatch = repairTruncatedJson(jsonMatch[0]);
            try {
              return JSON.parse(repairedMatch);
            } catch (finalError) {
              throw new Error('Failed to parse AI response. The document might be too complex or the output was truncated.');
            }
          }
        }
      }
      throw new Error('Failed to parse AI response. The document might be too complex or the format is unrecognized.');
    }
  } catch (error: any) {
    console.error('Gemini Extraction Error:', error);
    if (error.message?.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please check your settings.');
    }
    if (error.message?.includes('Rpc failed') || error.message?.includes('xhr error')) {
      throw new Error('Connection to Gemini AI failed. This is usually a temporary network issue. Please try again.');
    }
    throw error;
  }
}

export function buildExtractionPrompt(docType: string) {
  const prompts: Record<string, string> = {
    "Bill of Lading": `
    You are a shipping document expert.
    Extract key data from this Bill of Lading.
    Return ONLY this exact JSON structure,
    no explanation, no markdown:
    {
      "document_type": "Bill of Lading",
      "bl_number": null,
      "shipper_name": null,
      "consignee_name": null,
      "notify_party": null,
      "port_of_loading": null,
      "port_of_discharge": null,
      "vessel_name": null,
      "voyage_number": null,
      "container_number": null,
      "seal_number": null,
      "goods_description": null,
      "gross_weight": null,
      "net_weight": null,
      "measurement": null,
      "number_of_packages": null,
      "package_type": null,
      "etd_date": null,
      "freight_terms": null,
      "place_of_receipt": null,
      "place_of_delivery": null,
      "bl_date": null,
      "confidence": {
        "bl_number": "high/medium/low",
        "shipper_name": "high/medium/low"
      }
    }`,

    "Commercial Invoice": `
    You are an invoice processing expert.
    Extract key data from this invoice.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Commercial Invoice",
      "invoice_number": null,
      "invoice_date": null,
      "supplier_name": null,
      "supplier_address": null,
      "buyer_name": null,
      "buyer_address": null,
      "product_description": null,
      "quantity": null,
      "unit": null,
      "unit_price": null,
      "total_amount": null,
      "currency": null,
      "payment_terms": null,
      "origin_country": null,
      "hs_code": null,
      "bank_details": null,
      "confidence": {}
    }`,

    "Packing List": `
    Extract key data from this Packing List.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Packing List",
      "supplier_name": null,
      "product_name": null,
      "number_of_cartons": null,
      "quantity_per_carton": null,
      "total_quantity": null,
      "unit": null,
      "gross_weight_per_carton": null,
      "net_weight_per_carton": null,
      "total_gross_weight": null,
      "total_net_weight": null,
      "container_number": null,
      "seal_number": null,
      "origin": null,
      "packing_details": null,
      "size_specifications": null,
      "confidence": {}
    }`,

    "Payment Slip": `
    Extract key data from this Payment Slip
    or SWIFT transfer document.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Payment Slip",
      "transfer_date": null,
      "value_date": null,
      "amount": null,
      "currency": null,
      "sender_name": null,
      "sender_bank": null,
      "sender_account": null,
      "sender_iban": null,
      "receiver_name": null,
      "receiver_bank": null,
      "receiver_account": null,
      "receiver_iban": null,
      "reference_number": null,
      "transaction_id": null,
      "swift_code": null,
      "payment_purpose": null,
      "confidence": {}
    }`,

    "Inspection Report": `
    Extract key data from this Pre-Shipment 
    Inspection Report.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Inspection Report",
      "inspection_date": null,
      "certificate_number": null,
      "inspector_name": null,
      "agency_name": null,
      "product_name": null,
      "supplier_name": null,
      "inspection_result": null,
      "quantity_inspected": null,
      "packing_details": null,
      "size_specifications": null,
      "grade": null,
      "temperature": null,
      "observations": null,
      "expiry_date": null,
      "confidence": {}
    }`,

    "Clearing Document": `
    Extract key data from this Customs 
    Clearing Document. Limit to the most important 15 fields.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Clearing Document",
      "clearance_date": null,
      "declaration_number": null,
      "hs_code": null,
      "product_description": null,
      "customs_value": null,
      "duty_rate": null,
      "duty_amount": null,
      "vat_amount": null,
      "other_charges": null,
      "total_clearing_cost": null,
      "currency": null,
      "clearing_agent": null,
      "port": null,
      "container_number": null,
      "confidence": {}
    }`,

    "Investment Contract": `
    Extract key data from this Investment 
    Contract or Agreement document.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Investment Contract",
      "contract_reference": null,
      "date_of_agreement": null,
      "investor_name": null,
      "investor_contact": null,
      "company_name": null,
      "investment_amount": null,
      "currency": null,
      "payment_schedule": null,
      "expected_roi_percent": null,
      "investment_duration": null,
      "product_details": null,
      "terms_summary": null,
      "signatory_investor": null,
      "signatory_company": null,
      "witness": null,
      "confidence": {}
    }`,

    "Investor Flow Sheet": `
    Extract key data from this Investor 
    Dashboard Flow document or Excel sheet.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Investor Flow Sheet",
      "investment_contract_ref": null,
      "date_of_agreement": null,
      "date_of_transfer": null,
      "amount_received": null,
      "money_receipt_number": null,
      "investment_distribution": null,
      "advance_type": null,
      "item_quantity": null,
      "origin_country": null,
      "supplier_name": null,
      "product_description": null,
      "invoice_number": null,
      "etd": null,
      "eta": null,
      "inspection_details": null,
      "bl_surrender_date": null,
      "clearing_cost": null,
      "clearing_currency": null,
      "payment_terms": null,
      "confidence": {}
    }`,

    "Goods Received Note": `
    Extract key data from this GRN document.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "GRN",
      "grn_number": null,
      "date": null,
      "supplier_name": null,
      "container_number": null,
      "product_name": null,
      "quantity_received": null,
      "unit": null,
      "condition": null,
      "storage_location": null,
      "received_by": null,
      "verified_by": null,
      "remarks": null,
      "confidence": {}
    }`,
    
    "Sales Invoice": `
    Extract key data from this Sales Invoice.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "Sales Invoice",
      "invoice_number": null,
      "date": null,
      "customer_name": null,
      "product_name": null,
      "quantity": null,
      "unit_price": null,
      "total_amount": null,
      "currency": null,
      "payment_status": null,
      "due_date": null,
      "container_number": null,
      "confidence": {}
    }`,

    "Auto-Detect": `
    You are a document analysis expert.
    First identify what type of document this is.
    It could be: Bill of Lading, Commercial Invoice,
    Packing List, Payment Slip, Inspection Report,
    Clearing Document, Investment Contract, GRN,
    or Other.
    Then extract the most critical 10-15 fields from it.
    Return ONLY this exact JSON, no explanation:
    {
      "document_type": "identified type here",
      "extracted_data": {
        // most important 10-15 key-value pairs found
        // use exact field names from document
      },
      "confidence": {
        // field_name: "high/medium/low"
      },
      "summary": "one line description 
                  of what this document is"
    }`
  };

  return prompts[docType] || prompts["Auto-Detect"];
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getExcelData(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
}

export async function handleExcelFile(file: File) {
  const jsonData = await getExcelData(file);

  // Convert to readable text for Gemini
  const textData = jsonData
    .map(row => row.join(' | '))
    .join('\n');

  // Send as text instead of image
  return await extractExcelWithGemini(textData, 'Product List');
}

export async function extractExcelWithGemini(textData: string, docType: string) {
  const apiKey = localStorage.getItem('traces_api_key') || process.env.GEMINI_API_KEY;
  const modelName = localStorage.getItem('traces_ai_model') || 'gemini-3-flash-preview';

  if (!apiKey) {
    throw new Error('No API key found. Please add your Gemini API key in Settings or environment variables.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await generateWithRetry(ai, modelName, [
      {
        parts: [
          {
            text: `Data: ${textData}`
          }
        ]
      }
    ], {
      systemInstruction: `Extract structured data from this spreadsheet content and return as a JSON array of records. Each record should have all columns as fields. Return ONLY JSON, no explanation.`,
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response for Excel data.');
    }

    let cleanJson = text.trim();
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```json\n?|```/g, '').trim();
    }
    
    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Excel JSON Parse Error. Raw text:', text);
      const repaired = repairTruncatedJson(cleanJson);
      try {
        return JSON.parse(repaired);
      } catch (repairError) {
        throw new Error('Failed to parse AI response from Excel data.');
      }
    }
  } catch (error: any) {
    console.error('Gemini Excel Extraction Error:', error);
    throw error;
  }
}
