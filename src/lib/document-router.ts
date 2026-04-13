import { db, storage } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export interface DocumentSaveOptions {
  fileName: string;
  fileSize: number;
  base64Data: string;
  documentType: string;
  extractedData: any;
  linkedRecordId?: string;
}

export async function saveExtractedData(options: DocumentSaveOptions) {
  const { fileName, fileSize, base64Data, documentType, extractedData, linkedRecordId } = options;
  const session = localStorage.getItem('traces_session');
  const savedBy = session ? JSON.parse(session).username : 'system';

  // Normalize extracted data if it comes from Auto-Detect
  const finalData = extractedData.extracted_data || extractedData;

  const docId = `DOC-${Date.now()}`;
  let fileUrl = '';

  try {
    // 1. Upload to Firebase Storage first (to handle large files > 1MB)
    const storageRef = ref(storage, `documents/${docId}_${fileName}`);
    await uploadString(storageRef, base64Data, 'base64');
    fileUrl = await getDownloadURL(storageRef);

    // 2. Prepare document record for Firestore
    const documentRecord = {
      id: docId,
      fileName,
      docType: documentType,
      fileSize,
      uploadDate: new Date().toISOString(),
      uploadedBy: savedBy,
      fileUrl, // Store the Storage URL
      // We still store base64 for small files (< 500KB) for instant preview/offline access
      // but we omit it for large files to stay under 1MB Firestore limit
      base64Data: fileSize < 500000 ? base64Data : null, 
      extractedData: finalData,
      linkedRecordId: linkedRecordId || null,
      linkedModule: getModuleName(documentType) || null,
      createdAt: serverTimestamp()
    };

    // 3. Save to Firestore
    await setDoc(doc(db, 'documents', docId), documentRecord);

    // Save to specific module (legacy/localStorage support if needed, but primarily Firestore now)
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

    // Update extraction counter
    updateExtractionCounter();
  } catch (error) {
    console.error("Error saving document to Firestore:", error);
    throw error;
  }
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
