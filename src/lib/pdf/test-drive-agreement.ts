import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

interface TestDrivePDFParams {
  testDrive: {
    id: string;
    scheduledDate: Date | null;
    scheduledTime: string | null;
    duration: number;
    ocrFullName?: string | null;
    ocrLicenseNumber?: string | null;
    ocrEmiratesIdNumber?: string | null;
    signedAt: Date | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color?: string | null;
    vin?: string | null;
    variant?: string | null;
  };
  salesExecutive: {
    name: string;
    email?: string | null;
  };
  signatureData: string;
  termsVersion: string;
  dealershipName?: string;
  dealershipAddress?: string;
}

const TERMS_AND_CONDITIONS = `
TEST DRIVE AGREEMENT

By signing this agreement, I acknowledge and agree to the following terms and conditions:

1. DRIVER REQUIREMENTS
   - I am the holder of a valid driving license appropriate for the vehicle being tested
   - I am at least 21 years of age
   - I am not under the influence of alcohol, drugs, or any medication that may impair my driving ability

2. VEHICLE USE
   - The test drive route will be as directed by the dealership representative
   - I will drive safely and in accordance with all traffic laws and regulations
   - I will not exceed speed limits or drive recklessly
   - I will not allow any other person to drive the vehicle during the test drive

3. DURATION
   - The test drive will last approximately the scheduled duration unless otherwise agreed
   - I will return the vehicle at the agreed time

4. LIABILITY
   - I understand that I am responsible for any traffic violations incurred during the test drive
   - I accept responsibility for any damage to the vehicle caused by my negligence
   - The dealership's insurance may cover certain incidents, subject to their terms and conditions

5. PERSONAL DATA
   - I consent to the dealership collecting and storing my personal information for the purpose of this test drive
   - My information will be processed in accordance with applicable data protection laws

6. ACKNOWLEDGMENT
   - I have inspected the vehicle and confirmed it is in acceptable condition for the test drive
   - I have received instructions on the vehicle's controls and features
   - I understand and accept all terms and conditions stated in this agreement
`;

export async function generateTestDrivePDF(params: TestDrivePDFParams): Promise<Buffer> {
  const {
    testDrive,
    customer,
    vehicle,
    salesExecutive,
    signatureData,
    termsVersion,
    dealershipName = 'AutoLead Dealership',
    dealershipAddress = 'Dubai, UAE',
  } = params;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add first page
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Helper function to add text
  const addText = (text: string, options: {
    x?: number;
    y?: number;
    size?: number;
    font?: typeof timesRomanFont;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  } = {}) => {
    const {
      x = margin,
      y = yPosition,
      size = 11,
      font = timesRomanFont,
      color = rgb(0, 0, 0),
      maxWidth = width - margin * 2,
    } = options;

    page.drawText(text, { x, y, size, font, color, maxWidth });
    yPosition = y - (size + 4);
    return yPosition;
  };

  const addLine = () => {
    yPosition -= 10;
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    yPosition -= 15;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition < margin + neededSpace) {
      page = pdfDoc.addPage(PageSizes.A4);
      yPosition = height - margin;
    }
  };

  // Header
  addText(dealershipName, { size: 20, font: timesRomanBoldFont });
  addText(dealershipAddress, { size: 10, color: rgb(0.4, 0.4, 0.4) });
  yPosition -= 10;

  // Title
  addText('TEST DRIVE AGREEMENT', { size: 16, font: timesRomanBoldFont, x: margin });
  addText(`Agreement Version: ${termsVersion}`, { size: 9, color: rgb(0.5, 0.5, 0.5) });
  addLine();

  // Customer Information Section
  addText('CUSTOMER INFORMATION', { size: 12, font: timesRomanBoldFont });
  yPosition -= 5;

  const customerName = testDrive.ocrFullName || customer.name;
  addText(`Name: ${customerName}`, { font: helveticaFont });
  addText(`Phone: ${customer.phone}`, { font: helveticaFont });
  if (customer.email) {
    addText(`Email: ${customer.email}`, { font: helveticaFont });
  }
  if (testDrive.ocrLicenseNumber) {
    addText(`License Number: ${testDrive.ocrLicenseNumber}`, { font: helveticaFont });
  }
  if (testDrive.ocrEmiratesIdNumber) {
    addText(`Emirates ID: ${testDrive.ocrEmiratesIdNumber}`, { font: helveticaFont });
  }
  addLine();

  // Vehicle Information Section
  checkPageBreak(100);
  addText('VEHICLE INFORMATION', { size: 12, font: timesRomanBoldFont });
  yPosition -= 5;

  const vehicleFullName = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`;
  addText(`Vehicle: ${vehicleFullName}`, { font: helveticaFont });
  if (vehicle.color) {
    addText(`Color: ${vehicle.color}`, { font: helveticaFont });
  }
  if (vehicle.vin) {
    addText(`VIN: ${vehicle.vin}`, { font: helveticaFont });
  }
  addLine();

  // Appointment Details Section
  checkPageBreak(80);
  addText('APPOINTMENT DETAILS', { size: 12, font: timesRomanBoldFont });
  yPosition -= 5;

  if (testDrive.scheduledDate) {
    const formattedDate = new Date(testDrive.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    addText(`Date: ${formattedDate}`, { font: helveticaFont });
  }
  if (testDrive.scheduledTime) {
    addText(`Time: ${testDrive.scheduledTime}`, { font: helveticaFont });
  }
  addText(`Duration: ${testDrive.duration} minutes`, { font: helveticaFont });
  addText(`Sales Executive: ${salesExecutive.name}`, { font: helveticaFont });
  addLine();

  // Terms and Conditions Section
  checkPageBreak(300);
  addText('TERMS AND CONDITIONS', { size: 12, font: timesRomanBoldFont });
  yPosition -= 10;

  // Split terms into lines and add them
  const termsLines = TERMS_AND_CONDITIONS.trim().split('\n');
  for (const line of termsLines) {
    checkPageBreak(20);
    if (line.trim()) {
      const isBold = line.match(/^\d+\.\s+[A-Z]+/) || line.match(/^TEST DRIVE/);
      addText(line, {
        size: 9,
        font: isBold ? timesRomanBoldFont : timesRomanFont,
      });
    } else {
      yPosition -= 5;
    }
  }

  // Signature Section
  checkPageBreak(150);
  addLine();
  addText('SIGNATURE', { size: 12, font: timesRomanBoldFont });
  yPosition -= 10;

  // Add signature image if available
  if (signatureData && signatureData.startsWith('data:image')) {
    try {
      const base64Data = signatureData.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      let signatureImage;
      if (signatureData.includes('image/png')) {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
      } else {
        signatureImage = await pdfDoc.embedJpg(signatureBytes);
      }

      const sigDims = signatureImage.scale(0.5);
      const maxWidth = 200;
      const maxHeight = 80;
      const scale = Math.min(maxWidth / sigDims.width, maxHeight / sigDims.height, 1);

      page.drawImage(signatureImage, {
        x: margin,
        y: yPosition - sigDims.height * scale,
        width: sigDims.width * scale,
        height: sigDims.height * scale,
      });

      yPosition -= sigDims.height * scale + 10;
    } catch (error) {
      console.error('Failed to embed signature image:', error);
      addText('[Signature on file]', { font: helveticaFont, color: rgb(0.5, 0.5, 0.5) });
    }
  }

  // Signature line
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: margin + 200, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;
  addText('Customer Signature', { size: 9, color: rgb(0.4, 0.4, 0.4) });

  // Signed timestamp
  if (testDrive.signedAt) {
    const signedTimestamp = new Date(testDrive.signedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    addText(`Signed: ${signedTimestamp}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  }

  // Footer
  yPosition = margin;
  addText(
    `Document ID: ${testDrive.id}`,
    { size: 8, color: rgb(0.5, 0.5, 0.5), y: yPosition }
  );
  addText(
    `Generated by AutoLead.ai`,
    { size: 8, color: rgb(0.5, 0.5, 0.5), y: yPosition - 12, x: width - margin - 100 }
  );

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
