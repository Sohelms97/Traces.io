export interface DocumentSaveOptions {
  fileName: string;
  fileSize: number;
  base64Data: string;
  documentType: string;
  extractedData: any;
  linkedRecordId?: string;
}

export function saveExtractedData(options: DocumentSaveOptions) {
  const { fileName, fileSize, base64Data, documentType, extractedData, linkedRecordId } = options;
  const timestamp = new Date().toISOString();
  const session = localStorage.getItem('traces_session');
  const savedBy = session ? JSON.parse(session).username : 'system';

  // Normalize extracted data if it comes from Auto-Detect
  const finalData = extractedData.extracted_data || extractedData;

  const documentRecord = {
    id: `DOC-${Date.now()}`,
    fileName,
    docType: documentType,
    fileSize,
    uploadDate: timestamp,
    uploadedBy: savedBy,
    base64Data,
    extractedData: finalData,
    linkedRecordId,
    linkedModule: getModuleName(documentType)
  };

  // Save to specific module
  switch (documentType) {
    case 'Bill of Lading':
      saveToModule('traces_shipments', finalData, linkedRecordId);
      break;
    case 'Commercial Invoice':
      saveToModule('traces_purchase_orders', finalData, linkedRecordId);
      break;
    case 'Packing List':
      saveToModule('traces_containers', finalData, linkedRecordId);
      break;
    case 'Payment Slip':
      saveToModule('traces_payments', finalData, linkedRecordId);
      break;
    case 'Investment Contract':
      saveToModule('traces_investors', finalData, linkedRecordId);
      break;
    case 'Investor Flow Sheet':
      saveToModule('traces_investment_flow', finalData, linkedRecordId);
      break;
    case 'Clearing Document':
      saveToModule('traces_shipments', finalData, linkedRecordId);
      break;
    case 'Goods Received Note':
    case 'GRN':
      saveToModule('traces_warehouse', finalData, linkedRecordId);
      break;
    case 'Sales Invoice':
    case 'Sales Order':
      saveToModule('traces_sales', finalData, linkedRecordId);
      break;
    default:
      // Just save to document library
      break;
  }

  // Always save to document library
  const docs = JSON.parse(localStorage.getItem('traces_documents') || '[]');
  docs.push(documentRecord);
  localStorage.setItem('traces_documents', JSON.stringify(docs));

  // Update extraction counter
  updateExtractionCounter();
}

function getModuleName(docType: string): string | undefined {
  const mapping: Record<string, string> = {
    'Bill of Lading': 'Shipments',
    'Commercial Invoice': 'Purchase',
    'Packing List': 'Containers',
    'Payment Slip': 'Finance',
    'Investment Contract': 'Investors',
    'Investor Flow Sheet': 'Investors',
    'Clearing Document': 'Shipments',
    'Goods Received Note': 'Warehouse',
    'GRN': 'Warehouse',
    'Sales Invoice': 'Sales',
    'Sales Order': 'Sales'
  };
  return mapping[docType];
}

function saveToModule(key: string, data: any, linkedId?: string) {
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  const newItem = {
    id: linkedId || `REC-${Date.now()}`,
    ...data,
    lastUpdated: new Date().toISOString(),
    source: 'AI Extraction'
  };
  items.push(newItem);
  localStorage.setItem(key, JSON.stringify(items));
}

function updateExtractionCounter() {
  const today = new Date().toISOString().split('T')[0];
  const stats = JSON.parse(localStorage.getItem('traces_extraction_stats') || '{}');
  
  if (!stats[today]) {
    stats[today] = 0;
  }
  stats[today]++;
  
  localStorage.setItem('traces_extraction_stats', JSON.stringify(stats));
}
