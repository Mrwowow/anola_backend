const { PKPass } = require('passkit-generator');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate Apple Wallet Pass (.pkpass) for HMO Membership Card
 */
class PKPassService {
  constructor() {
    this.passesDir = path.join(__dirname, '../passes');
    this.certificatesDir = path.join(__dirname, '../certificates');
  }

  /**
   * Generate HMO Membership Card as pkpass
   * @param {Object} enrollment - HMO Enrollment data
   * @param {Object} user - User data
   * @param {Object} plan - HMO Plan data
   * @returns {Buffer} - pkpass file buffer
   */
  async generateMembershipCard(enrollment, user, plan) {
    try {
      // Generate QR code for membership verification
      const qrCodeData = JSON.stringify({
        enrollmentId: enrollment._id.toString(),
        membershipCardNumber: enrollment.membershipCardNumber,
        enrollmentNumber: enrollment.enrollmentNumber,
        userId: user._id.toString(),
        planId: plan._id.toString()
      });

      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 1
      });

      // Prepare pass data
      const passData = {
        // Standard Pass Type Identifier and Team ID (you'll need to replace these)
        passTypeIdentifier: 'pass.com.anolahealth.hmo',
        teamIdentifier: 'YOUR_TEAM_ID',

        // Pass Information
        organizationName: 'Anola Health',
        description: 'HMO Membership Card',

        // Serial number - unique for each pass
        serialNumber: enrollment.membershipCardNumber || enrollment.enrollmentNumber,

        // Visual Appearance
        backgroundColor: 'rgb(0, 122, 255)',
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(255, 255, 255)',

        // Barcode (for membership verification)
        barcodes: [
          {
            message: enrollment.membershipCardNumber || enrollment.enrollmentNumber,
            format: 'PKBarcodeFormatQR',
            messageEncoding: 'iso-8859-1'
          }
        ],

        // Card Fields
        headerFields: [
          {
            key: 'plan',
            label: 'PLAN',
            value: plan.name
          }
        ],

        primaryFields: [
          {
            key: 'member',
            label: 'MEMBER NAME',
            value: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
          }
        ],

        secondaryFields: [
          {
            key: 'memberId',
            label: 'MEMBER ID',
            value: enrollment.membershipCardNumber || enrollment.enrollmentNumber
          },
          {
            key: 'group',
            label: 'GROUP',
            value: plan.planCode
          }
        ],

        auxiliaryFields: [
          {
            key: 'effectiveDate',
            label: 'EFFECTIVE',
            value: new Date(enrollment.coverageStartDate).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            })
          },
          {
            key: 'expiryDate',
            label: 'EXPIRES',
            value: new Date(enrollment.coverageEndDate).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            })
          }
        ],

        backFields: [
          {
            key: 'memberName',
            label: 'Member Name',
            value: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
          },
          {
            key: 'dateOfBirth',
            label: 'Date of Birth',
            value: user.profile?.dateOfBirth
              ? new Date(user.profile.dateOfBirth).toLocaleDateString('en-US')
              : 'N/A'
          },
          {
            key: 'planName',
            label: 'Plan Name',
            value: plan.name
          },
          {
            key: 'planType',
            label: 'Plan Type',
            value: plan.category.toUpperCase()
          },
          {
            key: 'enrollmentType',
            label: 'Enrollment Type',
            value: enrollment.enrollmentType.charAt(0).toUpperCase() + enrollment.enrollmentType.slice(1)
          },
          {
            key: 'providerPhone',
            label: 'Customer Service',
            value: plan.provider?.phone || '1-800-ANOLA-HMO'
          },
          {
            key: 'providerEmail',
            label: 'Email',
            value: plan.provider?.email || 'support@anolahealth.com'
          },
          {
            key: 'primaryCareProvider',
            label: 'Primary Care Provider',
            value: enrollment.primaryCareProvider?.name || 'Not assigned'
          },
          {
            key: 'copaymentInfo',
            label: 'Copayment Information',
            value: this.formatCopaymentInfo(plan)
          },
          {
            key: 'coverageInfo',
            label: 'Coverage',
            value: `${plan.coverage?.outpatientCare?.coveragePercentage || 80}% coverage for most services`
          },
          {
            key: 'deductible',
            label: 'Annual Deductible',
            value: `$${enrollment.limits?.deductible || plan.pricing?.deductible?.individual || 0}`
          },
          {
            key: 'maxOutOfPocket',
            label: 'Max Out of Pocket',
            value: `$${enrollment.limits?.maxOutOfPocket || plan.pricing?.maxOutOfPocket?.individual || 0}`
          },
          {
            key: 'website',
            label: 'Website',
            value: 'www.anolahealth.com',
            attributedValue: '<a href="https://www.anolahealth.com">www.anolahealth.com</a>'
          }
        ]
      };

      // Add dependents if family plan
      if (enrollment.enrollmentType === 'family' && enrollment.dependents?.length > 0) {
        const dependentsList = enrollment.dependents
          .map(dep => `${dep.firstName} ${dep.lastName} (${dep.relationship})`)
          .join(', ');

        passData.backFields.push({
          key: 'dependents',
          label: 'Dependents',
          value: dependentsList
        });
      }

      // Create pass using simple JSON-based approach (no certificates for development)
      // In production, you'll need to provide Apple certificates
      const pass = await this.createPassWithoutCertificates(passData, qrCodeBuffer);

      return pass;
    } catch (error) {
      console.error('Error generating pkpass:', error);
      throw new Error('Failed to generate membership card: ' + error.message);
    }
  }

  /**
   * Create a simplified pass structure for development/testing
   * In production, use passkit-generator with proper Apple certificates
   */
  async createPassWithoutCertificates(passData, qrCodeBuffer) {
    // For development, return a JSON representation
    // In production, you'll need to:
    // 1. Get Apple Developer account
    // 2. Create Pass Type ID
    // 3. Generate certificates
    // 4. Use PKPass with proper certificates

    const passJson = {
      ...passData,
      formatVersion: 1,
      relevantDate: new Date().toISOString(),

      // Development note
      _developmentNote: 'This is a development version. For production, implement with Apple certificates.'
    };

    // Return as JSON buffer for now
    // In production, this will be a signed .pkpass file
    return Buffer.from(JSON.stringify(passJson, null, 2));
  }

  /**
   * Format copayment information
   */
  formatCopaymentInfo(plan) {
    const copayments = [];

    if (plan.coverage?.outpatientCare?.copayment) {
      copayments.push(`Office Visit: $${plan.coverage.outpatientCare.copayment}`);
    }
    if (plan.coverage?.emergencyCare?.copayment) {
      copayments.push(`Emergency: $${plan.coverage.emergencyCare.copayment}`);
    }
    if (plan.coverage?.specialistConsultation?.copayment) {
      copayments.push(`Specialist: $${plan.coverage.specialistConsultation.copayment}`);
    }
    if (plan.coverage?.prescriptionDrugs?.copayment) {
      copayments.push(`Rx: $${plan.coverage.prescriptionDrugs.copayment}`);
    }

    return copayments.length > 0 ? copayments.join(', ') : 'See plan details';
  }

  /**
   * Generate production-ready pkpass with certificates
   * (To be implemented when certificates are available)
   */
  async generateProductionPass(passData, qrCodeBuffer) {
    // This requires:
    // 1. signerCert.pem (from Apple Developer Portal)
    // 2. signerKey.pem (private key)
    // 3. wwdr.pem (Apple WWDR certificate)

    const pass = await PKPass.from({
      model: path.join(this.passesDir, 'HMO.pass'),
      certificates: {
        wwdr: path.join(this.certificatesDir, 'wwdr.pem'),
        signerCert: path.join(this.certificatesDir, 'signerCert.pem'),
        signerKey: path.join(this.certificatesDir, 'signerKey.pem'),
        signerKeyPassphrase: process.env.PASS_CERT_PASSPHRASE
      },
      overrides: passData
    });

    // Add QR code image
    pass.addBuffer('strip.png', qrCodeBuffer);

    return pass.getAsBuffer();
  }

  /**
   * Generate PDF membership card (alternative to pkpass)
   */
  async generatePDFCard(enrollment, user, plan) {
    // This can be implemented using libraries like pdfkit or puppeteer
    // For now, return a simple HTML representation

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HMO Membership Card</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card-header {
      background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .card-body {
      padding: 30px;
    }
    .field {
      margin-bottom: 15px;
    }
    .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-top: 4px;
    }
    .qr-code {
      text-align: center;
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #eee;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1 style="margin: 0; font-size: 24px;">Anola Health HMO</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${plan.name}</p>
    </div>
    <div class="card-body">
      <div class="field">
        <div class="label">Member Name</div>
        <div class="value">${user.profile?.firstName || ''} ${user.profile?.lastName || ''}</div>
      </div>

      <div class="grid">
        <div class="field">
          <div class="label">Member ID</div>
          <div class="value">${enrollment.membershipCardNumber || enrollment.enrollmentNumber}</div>
        </div>
        <div class="field">
          <div class="label">Group</div>
          <div class="value">${plan.planCode}</div>
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <div class="label">Effective Date</div>
          <div class="value">${new Date(enrollment.coverageStartDate).toLocaleDateString()}</div>
        </div>
        <div class="field">
          <div class="label">Expiration Date</div>
          <div class="value">${new Date(enrollment.coverageEndDate).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="field">
        <div class="label">Plan Type</div>
        <div class="value">${plan.category.toUpperCase()} - ${enrollment.enrollmentType.charAt(0).toUpperCase() + enrollment.enrollmentType.slice(1)}</div>
      </div>

      <div class="field">
        <div class="label">Customer Service</div>
        <div class="value">${plan.provider?.phone || '1-800-ANOLA-HMO'}</div>
      </div>

      <div class="qr-code">
        <div class="label">Scan for Verification</div>
        <div style="margin-top: 15px;">
          <canvas id="qrcode"></canvas>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>
    new QRCode(document.getElementById("qrcode"), {
      text: '${enrollment.membershipCardNumber || enrollment.enrollmentNumber}',
      width: 200,
      height: 200
    });
  </script>
</body>
</html>
    `;

    return html;
  }
}

module.exports = new PKPassService();
