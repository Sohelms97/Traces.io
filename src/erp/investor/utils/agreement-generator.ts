import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvestorData {
  id: string;
  fullName: string;
  nationality: string;
  nidNumber: string;
  address: string;
  city: string;
  country: string;
  agreementDate: string;
  agreementId: string;
  products: Array<{
    productName: string;
    tradeCycle: number;
    investment: string;
    profitPerTrade: string;
    totalProfit: string;
    roi: string;
    gpShare: string;
    duration: number;
    durationUnit: string;
  }>;
  totalProfit: string;
  profitPerTrade: string;
  tradeCycle: number;
  currency: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  routingNumber: string;
  commencementDate: string;
  durationMonths: string;
  investorSignature?: string;
  companySignature?: string;
  witness1Name: string;
  witness1NID: string;
  witness1Signature?: string;
  witness2Name?: string;
  witness2NID?: string;
  witness2Signature?: string;
  signDate: string;
}

export function generateAgreementPDF(investorData: InvestorData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page settings
  const margin = 25;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const addSection = (title: string, x: number, yPos: number) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(title, x, yPos);
    doc.setFont('times', 'normal');
    return yPos + 8;
  };

  const checkPageBreak = (currentY: number, needed: number) => {
    if (currentY + needed > 280) {
      doc.addPage();
      return margin;
    }
    return currentY;
  };

  // HEADER — Company letterhead
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('MUTUAL BUSINESS AGREEMENT', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Horizontal line under title
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // OPENING PARAGRAPH
  doc.setFont('times', 'normal');
  doc.setFontSize(11);

  const openingText = `This MUTUAL BUSINESS AGREEMENT (the "Agreement") is made and entered into on this ${investorData.agreementDate} the Christian Era (the "Effective Date") at ${investorData.city}, ${investorData.country} by and between:`;

  const openingLines = doc.splitTextToSize(openingText, contentWidth);
  doc.text(openingLines, margin, y);
  y += openingLines.length * 6 + 8;

  // INVESTOR PARTY BLOCK
  doc.setFont('times', 'bold');
  doc.text(`${investorData.fullName},`, margin, y);
  y += 6;
  doc.setFont('times', 'normal');

  const investorBlock = `a ${investorData.nationality} national, holding NID ${investorData.nidNumber}, residing in ${investorData.address}, referred to as "Investor" (which expression unless excluded by or repugnant to the context will mean and include his successor-in-interest, legal representatives, administrators, assigns) of the OTHER PART.`;

  const investorLines = doc.splitTextToSize(investorBlock, contentWidth);
  doc.text(investorLines, margin, y);
  y += investorLines.length * 6 + 8;

  // AND connector
  doc.setFont('times', 'bold');
  doc.text('AND;', margin, y);
  y += 10;

  // COMPANY PARTY BLOCK
  doc.setFont('times', 'normal');
  const companyBlock = `Farmers Market.Asia, a proprietorship duly incorporated under the laws and regulations of People's Republic of Bangladesh, with License number TRAD/DNCC/020695/2023, having its registered address at House 86, Road 17/A, Banani, Dhaka, Bangladesh duly represented by its Founder, Tariqul Islam Chowdhory (hereinafter referred to as the "Company")`;

  const companyLines = doc.splitTextToSize(companyBlock, contentWidth);
  doc.text(companyLines, margin, y);
  y += companyLines.length * 6 + 8;

  // WHEREAS CLAUSES
  y = checkPageBreak(y, 60);
  doc.setFont('times', 'bold');
  doc.text('WHEREAS:', margin, y);
  y += 8;
  doc.setFont('times', 'normal');

  const whereasA = `A. The Company offers frozen fish and seafood trading, including but not limited to the investment of funds in food, beverage, salted preserved Fish & seafood Trade and yielding adequate returns on Investment on the sums invested.`;
  const aLines = doc.splitTextToSize(whereasA, contentWidth - 10);
  doc.text(aLines, margin + 5, y);
  y += aLines.length * 6 + 5;

  const whereasB = `B. The Investor desires to invest the sum stated in this Agreement in accordance with the terms and conditions stated.`;
  const bLines = doc.splitTextToSize(whereasB, contentWidth - 10);
  doc.text(bLines, margin + 5, y);
  y += bLines.length * 6 + 5;

  const whereasC = `C. The Company and the Investor (hereinafter referred to as "Parties") desire to be bound by the terms and conditions of this Agreement.`;
  const cLines = doc.splitTextToSize(whereasC, contentWidth - 10);
  doc.text(cLines, margin + 5, y);
  y += cLines.length * 6 + 5;

  const whereasD = `D. This Agreement would be executed through the use of electronic signature and such execution is valid and agreed upon by the Parties.`;
  const dLines = doc.splitTextToSize(whereasD, contentWidth - 10);
  doc.text(dLines, margin + 5, y);
  y += dLines.length * 6 + 10;

  // NOW THEREFORE
  doc.setFont('times', 'bold');
  const nowText = 'NOW THEREFORE THIS AGREEMENT WITNESSES AS FOLLOWS:';
  doc.text(nowText, margin, y);
  y += 12;

  // SECTION 1 — DEFINITIONS
  y = addSection('1.0 DEFINITIONS AND INTERPRETATIONS', margin, y);
  const defText = `1.1 In this Agreement, unless the context otherwise requires, the following terms shall have the following meanings: "Project" means the business of trading frozen fish and seafood; "Profit" means the return on investment as specified in this Agreement.`;
  const defLines = doc.splitTextToSize(defText, contentWidth);
  doc.text(defLines, margin, y);
  y += defLines.length * 6 + 8;

  // SECTION 2 — OBLIGATIONS OF THE COMPANY
  y = addSection('2.0 OBLIGATIONS OF THE COMPANY', margin, y);
  const objCompText = `2.1 The Company shall manage the investment for the purpose of the Project. 2.2 The Company shall ensure that the Investor receives the Profit as agreed.`;
  const objCompLines = doc.splitTextToSize(objCompText, contentWidth);
  doc.text(objCompLines, margin, y);
  y += objCompLines.length * 6 + 8;

  // SECTION 3 — OBLIGATIONS OF INVESTOR
  y = checkPageBreak(y, 60);
  y = addSection('3.0 OBLIGATIONS OF THE INVESTOR', margin, y);
  const clause31 = `3.1 The Investor shall provide a sum of money as mentioned below to be invested by the Company for the purpose of facilitating the Project ("Capital").`;
  const c31Lines = doc.splitTextToSize(clause31, contentWidth);
  doc.text(c31Lines, margin, y);
  y += c31Lines.length * 6 + 8;

  // INVESTMENT TABLE (dynamic)
  autoTable(doc, {
    startY: y,
    head: [[
      'Product', 'Cycle', 
      'Investment', 'Profit/Trade',
      'Total Profit', 'ROI', 
      'GP Share', 'Duration'
    ]],
    body: investorData.products.map(p => [
      p.productName,
      `${p.tradeCycle} days`,
      `${p.investment} ${investorData.currency}`,
      `${p.profitPerTrade} ${investorData.currency}`,
      `${p.totalProfit} ${investorData.currency}`,
      `${p.roi}%`,
      `${p.gpShare}%`,
      `${p.duration} ${p.durationUnit}`
    ]),
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [26, 46, 74],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { left: margin, right: margin }
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // SECTION 4 — PAYMENTS
  y = checkPageBreak(y, 60);
  y = addSection('4.0 PAYMENTS', margin, y);
  const paymentText = `4.1.1 (a) A total sum of expected profit ${investorData.totalProfit} ${investorData.currency} ("Profit") expected profit per trade of ${investorData.profitPerTrade} ${investorData.currency} will be paid in every ${investorData.tradeCycle} days from the beginning of trade cycle (the "Cycle") to the Investor's Bank which details is given Below:`;
  
  const payLines = doc.splitTextToSize(paymentText, contentWidth);
  doc.text(payLines, margin, y);
  y += payLines.length * 6 + 8;

  // Bank details box
  doc.setDrawColor(200);
  doc.rect(margin, y, contentWidth, 35);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text('Bank Account Details:', margin + 5, y);
  y += 7;
  doc.setFont('times', 'normal');
  doc.text(`Account Name: ${investorData.bankAccountName}`, margin + 5, y);
  y += 6;
  doc.text(`Account No.: ${investorData.bankAccountNumber}`, margin + 5, y);
  y += 6;
  doc.text(`Bank Name: ${investorData.bankName}`, margin + 5, y);
  y += 6;
  doc.text(`Branch: ${investorData.bankBranch}`, margin + 5, y);
  y += 6;
  doc.text(`Routing #: ${investorData.routingNumber}`, margin + 5, y);
  y += 10;

  // SECTION 5 — DURATION
  y = checkPageBreak(y, 40);
  y = addSection('5.0 DURATION AND COMMENCEMENT', margin, y);
  const durationText = `5.1 This Agreement shall commence on ${investorData.commencementDate}.\n\n5.2 The terms of this Agreement shall be binding on the Parties for a period of ${investorData.durationMonths} months and the capital will be reimbursed in the ${parseInt(investorData.durationMonths) + 1}th month from the Effective Date.`;
  
  const durLines = doc.splitTextToSize(durationText, contentWidth);
  doc.text(durLines, margin, y);
  y += durLines.length * 6 + 8;

  // SECTIONS 6-21 (Simplified for brevity but following structure)
  const otherSections = [
    { title: '6.0 TERMINATION', text: '6.1 Either party may terminate this agreement with 30 days written notice.' },
    { title: '7.0 INVESTMENT RISK', text: '7.1 The Investor acknowledges that all investments carry risks.' },
    { title: '8.0 FORCE MAJEURE', text: '8.1 Neither party shall be liable for failure to perform due to events beyond control.' },
    { title: '9.0 LIMITATIONS ON LIABILITY', text: '9.1 The Company\'s liability is limited to the capital invested.' },
    { title: '10.0 NOTICES', text: '10.1 All notices shall be in writing to the addresses provided.' },
    { title: '11.0 CONFIDENTIALITY', text: '11.1 Parties shall keep all terms of this agreement confidential.' },
    { title: '12.0 NON-COMPETE', text: '12.1 The Investor shall not compete with the Company during the term.' },
    { title: '13.0 GOVERNING LAW', text: '13.1 This agreement is governed by the laws of Bangladesh.' },
    { title: '14.0 ARBITRATION', text: '14.1 Any disputes shall be resolved through arbitration in Dhaka.' },
    { title: '15.0 ENTIRE AGREEMENT', text: '15.1 This document constitutes the entire agreement.' },
    { title: '16.0 FURTHER ACTION', text: '16.1 Parties shall take all actions necessary to fulfill this agreement.' },
    { title: '17.0 AMENDMENT AND MODIFICATION', text: '17.1 Amendments must be in writing and signed by both parties.' },
    { title: '18.0 WAIVER', text: '18.1 Failure to enforce any provision is not a waiver.' },
    { title: '19.0 SEVERABILITY', text: '19.1 If any provision is invalid, the rest remain in effect.' },
    { title: '20.0 GOVERNING LANGUAGE', text: '20.1 The governing language of this agreement is English.' },
    { title: '21.0 GENERAL COVENANTS', text: '21.1 Parties agree to act in good faith.' }
  ];

  otherSections.forEach(sec => {
    y = checkPageBreak(y, 30);
    y = addSection(sec.title, margin, y);
    const lines = doc.splitTextToSize(sec.text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 8;
  });

  // SIGNATURE PAGE (always last page)
  doc.addPage();
  y = margin;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('IN WITNESS WHEREOF, the parties hereto have duly executed this Agreement on the day and year set forth below.', margin, y, { maxWidth: contentWidth });
  y += 20;

  // TWO COLUMN SIGNATURE LAYOUT
  const colWidth = (contentWidth / 2) - 5;
  const col1X = margin;
  const col2X = margin + colWidth + 10;

  // INVESTOR SIGNATURE (left)
  doc.setFontSize(11);
  doc.text('INVESTOR', col1X, y);
  y += 8;

  if (investorData.investorSignature) {
    doc.addImage(investorData.investorSignature, 'PNG', col1X, y, 60, 25);
  } else {
    doc.setLineWidth(0.3);
    doc.line(col1X, y + 20, col1X + 60, y + 20);
  }
  y += 30;

  doc.setFont('times', 'normal');
  doc.text(`Name – ${investorData.fullName}`, col1X, y); y += 6;
  doc.text(`NID – ${investorData.nidNumber}`, col1X, y); y += 6;
  doc.text('Title – Investor', col1X, y); y += 6;
  doc.text(`Date – ${investorData.signDate}`, col1X, y);

  // Reset y for company column
  const sigY = y - 18;

  // COMPANY SIGNATURE (right)
  doc.setFont('times', 'bold');
  doc.text('COMPANY', col2X, sigY - 30);

  if (investorData.companySignature) {
    doc.addImage(investorData.companySignature, 'PNG', col2X, sigY - 22, 60, 25);
  } else {
    doc.line(col2X, sigY - 2, col2X + 60, sigY - 2);
  }

  doc.setFont('times', 'normal');
  doc.text('Name – Tariqul Islam Chowdhory', col2X, sigY); y = sigY + 6;
  doc.text('National ID – 19832691649000023', col2X, y); y += 6;
  doc.text('Title – Founder', col2X, y); y += 6;
  doc.text(`Date – ${investorData.signDate}`, col2X, y);
  y += 20;

  // WITNESSES
  doc.setFont('times', 'bold');
  doc.text('Witnesses:', col1X, y);
  doc.text('Witnesses:', col2X, y);
  y += 10;

  // Witness 1 (left)
  if (investorData.witness1Signature) {
    doc.addImage(investorData.witness1Signature, 'PNG', col1X, y, 50, 20);
  } else {
    doc.line(col1X, y + 15, col1X + 50, y + 15);
  }
  y += 22;
  doc.setFont('times', 'normal');
  doc.text(`Name: ${investorData.witness1Name}`, col1X, y); y += 6;
  doc.text(`National ID: ${investorData.witness1NID}`, col1X, y);

  // Witness 2 (right)
  const wit2Y = y - 6;
  if (investorData.witness2Signature) {
    doc.addImage(investorData.witness2Signature, 'PNG', col2X, wit2Y - 16, 50, 20);
  } else {
    doc.line(col2X, wit2Y - 1, col2X + 50, wit2Y - 1);
  }
  doc.text(`Name: ${investorData.witness2Name || ''}`, col2X, wit2Y); y = wit2Y + 6;
  doc.text(`National ID: ${investorData.witness2NID || ''}`, col2X, y);

  // PAGE NUMBERS
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
    doc.text(`Agreement ID: ${investorData.agreementId} | Generated: ${new Date().toLocaleDateString()}`, margin, 285);
  }

  return doc;
}

export function saveAgreement(investorData: InvestorData) {
  const doc = generateAgreementPDF(investorData);
  const pdfBase64 = doc.output('datauristring');
  
  const agreement = {
    id: investorData.agreementId,
    investorId: investorData.id,
    investorName: investorData.fullName,
    generatedDate: new Date().toISOString(),
    status: 'signed',
    pdfBase64: pdfBase64,
    investorSignature: investorData.investorSignature,
    companySignature: investorData.companySignature,
    witness1Signature: investorData.witness1Signature,
    witness2Signature: investorData.witness2Signature
  };
  
  const agreements = JSON.parse(localStorage.getItem('traces_agreements') || '[]');
  agreements.push(agreement);
  localStorage.setItem('traces_agreements', JSON.stringify(agreements));
  
  return agreement;
}

export function downloadAgreement(agreement: any) {
  if (!agreement || !agreement.pdfBase64) {
    console.error('Agreement data not found');
    return;
  }
  
  const link = document.createElement('a');
  link.href = agreement.pdfBase64;
  link.download = `Agreement_${agreement.investorName || 'Investor'}_${agreement.id}.pdf`;
  link.click();
}
