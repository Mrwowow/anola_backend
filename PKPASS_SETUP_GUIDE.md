# Apple Wallet Pass (pkpass) Setup Guide

## 🎯 Overview

The Anola HMO system now supports generating membership cards as Apple Wallet passes (.pkpass files). This allows patients to add their HMO membership card directly to their iPhone/Apple Watch Wallet app.

---

## 📱 Features

### What's Included in the Membership Card

**Front of Card:**
- Member name
- Member ID / Membership card number
- Group number (Plan code)
- Effective and expiration dates
- Plan name
- QR code for verification

**Back of Card:**
- Complete member information
- Date of birth
- Plan details (name, type, category)
- Enrollment type (individual/family/corporate)
- Primary care provider
- Customer service contact
- Copayment information
- Coverage details
- Deductible and max out-of-pocket
- Dependents list (for family plans)
- Website link

---

## 🚀 Quick Start (Development)

### Current Implementation

The system is currently configured for **development/testing** without Apple certificates. It returns a JSON representation of the pass data.

### Using the API

**Endpoint:** `GET /api/hmo-enrollments/:id/card?format=pkpass`

**Formats Available:**
- `format=pkpass` - Apple Wallet pass (JSON in development, .pkpass in production)
- `format=pdf` - HTML/PDF membership card
- `format=json` - JSON data with download links (default)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.anolahealth.com/api/hmo-enrollments/ENROLLMENT_ID/card?format=pkpass" \
  -o membership-card.pkpass
```

**JavaScript Example:**
```javascript
const downloadMembershipCard = async (enrollmentId, format = 'pkpass') => {
  const response = await fetch(
    `https://api.anolahealth.com/api/hmo-enrollments/${enrollmentId}/card?format=${format}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (format === 'pkpass') {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HMO-Membership-Card.pkpass';
    a.click();
  } else if (format === 'pdf') {
    const html = await response.text();
    const newWindow = window.open();
    newWindow.document.write(html);
  } else {
    const data = await response.json();
    console.log('Card data:', data);
  }
};
```

---

## 🔧 Production Setup

To enable **real Apple Wallet passes** in production, follow these steps:

### Step 1: Apple Developer Account

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Sign in to your Apple Developer account

### Step 2: Create Pass Type ID

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/)
2. Click **Identifiers** → **+** (Add button)
3. Select **Pass Type IDs** → Continue
4. Enter:
   - **Description:** Anola Health HMO Membership Card
   - **Identifier:** `pass.com.anolahealth.hmo`
5. Click **Continue** → **Register**

### Step 3: Generate Certificate

1. In the Pass Type IDs section, select your newly created pass type
2. Click **Create Certificate**
3. Follow instructions to create a Certificate Signing Request (CSR):
   ```bash
   # On Mac, open Keychain Access
   # Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
   # User Email: your-email@anolahealth.com
   # Common Name: Anola Health Pass Signing Certificate
   # Save to disk
   ```
4. Upload the CSR file
5. Download the certificate (.cer file)
6. Double-click to install in Keychain Access

### Step 4: Export Certificate and Private Key

1. Open **Keychain Access**
2. Find "Pass Type ID: pass.com.anolahealth.hmo"
3. Expand and select both certificate and private key
4. Right-click → Export 2 items
5. Save as **pass-cert.p12**
6. Set a password (save this securely)

### Step 5: Convert to PEM Format

```bash
# Navigate to project directory
cd /Users/macbookpro/anola_backend

# Create certificates directory
mkdir -p src/certificates

# Extract certificate
openssl pkcs12 -in pass-cert.p12 -clcerts -nokeys -out src/certificates/signerCert.pem -passin pass:YOUR_P12_PASSWORD

# Extract private key
openssl pkcs12 -in pass-cert.p12 -nocerts -out src/certificates/signerKey.pem -passin pass:YOUR_P12_PASSWORD -passout pass:YOUR_KEY_PASSWORD

# Download WWDR Certificate
curl -o src/certificates/wwdr.pem https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
openssl x509 -inform der -in src/certificates/AppleWWDRCAG4.cer -out src/certificates/wwdr.pem
```

### Step 6: Update Environment Variables

Add to `.env`:
```env
# Apple Wallet Pass Configuration
PASS_TYPE_IDENTIFIER=pass.com.anolahealth.hmo
PASS_TEAM_ID=YOUR_TEAM_ID
PASS_CERT_PASSPHRASE=YOUR_KEY_PASSWORD
```

To find your Team ID:
1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. Click on **Membership** in the sidebar
3. Your Team ID is displayed

### Step 7: Update pkpass.service.js

In `src/services/pkpass.service.js`, update the `generateMembershipCard` method to use production certificates:

```javascript
async generateMembershipCard(enrollment, user, plan) {
  try {
    // ... existing QR code generation ...

    const passData = {
      passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER,
      teamIdentifier: process.env.PASS_TEAM_ID,
      // ... rest of pass data ...
    };

    // Use production method instead of development method
    const pass = await this.generateProductionPass(passData, qrCodeBuffer);

    return pass;
  } catch (error) {
    console.error('Error generating pkpass:', error);
    throw new Error('Failed to generate membership card: ' + error.message);
  }
}
```

### Step 8: Test the Pass

1. Generate a membership card:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     "https://api.anolahealth.com/api/hmo-enrollments/ENROLLMENT_ID/card?format=pkpass" \
     -o test-card.pkpass
   ```

2. Test on iOS:
   - Email the .pkpass file to yourself
   - Open on iPhone
   - Tap to add to Wallet
   - Verify all information displays correctly

3. Test scanning:
   - The QR code should encode the enrollment verification data
   - Providers can scan the code to verify membership

---

## 📱 iOS Integration

### Add to Wallet Button

Add a button in your iOS app or web app:

**React Native:**
```jsx
import { Linking } from 'react-native';

const AddToWalletButton = ({ enrollmentId, accessToken }) => {
  const downloadPass = async () => {
    const url = `https://api.anolahealth.com/api/hmo-enrollments/${enrollmentId}/card?format=pkpass`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const blob = await response.blob();
    const fileUrl = URL.createObjectURL(blob);

    // On iOS, this will trigger the "Add to Wallet" flow
    Linking.openURL(fileUrl);
  };

  return (
    <TouchableOpacity onPress={downloadPass}>
      <Image source={require('./add-to-wallet.png')} />
    </TouchableOpacity>
  );
};
```

**Web (Mobile Safari):**
```html
<a href="/api/hmo-enrollments/ENROLLMENT_ID/card?format=pkpass"
   class="add-to-wallet-button">
  <img src="https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/images/AddtoAppleWallet.svg"
       alt="Add to Apple Wallet" />
</a>
```

---

## 🔄 Pass Updates

### Updating a Pass

When enrollment details change (e.g., plan renewal, dependent added), you can update the pass:

1. User's Wallet will automatically check for updates
2. Implement a web service endpoint for pass updates (optional advanced feature)
3. Push notifications can trigger immediate updates

### Web Service Setup (Advanced)

For real-time pass updates, implement these endpoints:

```javascript
// Register device for pass updates
app.post('/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber', async (req, res) => {
  // Store device registration
  // When pass data changes, send push notification to this device
});

// Get updated pass
app.get('/v1/passes/:passTypeId/:serialNumber', async (req, res) => {
  // Return updated .pkpass file
});
```

---

## 🎨 Customization

### Colors

Update in `pkpass.service.js`:

```javascript
backgroundColor: 'rgb(0, 122, 255)',    // Blue background
foregroundColor: 'rgb(255, 255, 255)',  // White text
labelColor: 'rgb(255, 255, 255)',       // White labels
```

### Images

Add custom images to your pass:

1. Create `src/passes/HMO.pass/` directory
2. Add images:
   - `icon.png` (29x29 pixels)
   - `icon@2x.png` (58x58 pixels)
   - `icon@3x.png` (87x87 pixels)
   - `logo.png` (160x50 pixels)
   - `logo@2x.png` (320x100 pixels)
   - `logo@3x.png` (480x150 pixels)
   - `strip.png` (375x123 pixels) - Background image
   - `strip@2x.png` (750x246 pixels)
   - `strip@3x.png` (1125x369 pixels)

### Fields

Customize what information appears on the pass by editing `passData` in `pkpass.service.js`:

```javascript
primaryFields: [
  { key: 'member', label: 'MEMBER NAME', value: userName }
],
secondaryFields: [
  { key: 'memberId', label: 'MEMBER ID', value: cardNumber },
  { key: 'group', label: 'GROUP', value: planCode }
],
auxiliaryFields: [
  { key: 'effectiveDate', label: 'EFFECTIVE', value: startDate },
  { key: 'expiryDate', label: 'EXPIRES', value: endDate }
],
backFields: [
  // Add unlimited fields to the back of the card
]
```

---

## 🔐 Security

### QR Code Data

The QR code encodes:
```json
{
  "enrollmentId": "64a1b2c3...",
  "membershipCardNumber": "HMO-12345",
  "enrollmentNumber": "ENR-67890",
  "userId": "64a1b2c3...",
  "planId": "64a1b2c3..."
}
```

### Verification

Providers can scan the QR code and verify using:

```bash
POST /api/providers/verify-membership
{
  "qrData": "{ encoded QR code data }"
}
```

This endpoint should:
1. Decode QR data
2. Verify enrollment is active
3. Check coverage dates
4. Return patient info and coverage details

---

## 📊 Analytics

Track pass usage:

```javascript
// Track pass downloads
app.get('/api/hmo-enrollments/:id/card', async (req, res) => {
  // Log analytics event
  await Analytics.track({
    event: 'membership_card_downloaded',
    userId: req.user._id,
    enrollmentId: req.params.id,
    format: req.query.format,
    timestamp: new Date()
  });

  // ... rest of code ...
});
```

---

## 🐛 Troubleshooting

### "Unable to Download Pass"

- **Cause:** Invalid pass structure or missing certificates
- **Solution:** Check that all required certificates are in place and passTypeIdentifier matches

### Pass Not Updating

- **Cause:** Device not registered for updates
- **Solution:** Implement web service endpoints for pass updates

### QR Code Not Scanning

- **Cause:** QR code data too large or format incorrect
- **Solution:** Reduce data size, use shorter IDs

### Pass Displays Incorrectly

- **Cause:** Field values too long or images wrong size
- **Solution:** Truncate long text, resize images to exact specifications

---

## 📚 Resources

- [Apple Wallet Developer Guide](https://developer.apple.com/wallet/)
- [Passkit Programming Guide](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/)
- [passkit-generator Documentation](https://github.com/alexandercerutti/passkit-generator)
- [Add to Apple Wallet Guidelines](https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/)

---

## ✅ Checklist

**Development:**
- [x] Install pkpass libraries
- [x] Create pkpass service
- [x] Update download endpoint
- [x] Add QR code generation
- [x] Support multiple formats (pkpass, PDF, JSON)

**Production:**
- [ ] Enroll in Apple Developer Program
- [ ] Create Pass Type ID
- [ ] Generate certificates
- [ ] Convert certificates to PEM
- [ ] Update environment variables
- [ ] Test on real iOS device
- [ ] Implement pass update service (optional)
- [ ] Add analytics tracking
- [ ] Deploy to production

---

## 🎉 Summary

The HMO membership card pkpass feature provides:

✅ **Apple Wallet Integration** - Add cards directly to iPhone Wallet
✅ **QR Code Verification** - Providers can scan to verify membership
✅ **Multiple Formats** - pkpass, PDF, or JSON
✅ **Auto-Updates** - Pass data stays current (with web service)
✅ **Full Customization** - Colors, images, and fields
✅ **Secure** - Signed by Apple certificates

Users can now carry their HMO membership card digitally and access it quickly for appointments!
