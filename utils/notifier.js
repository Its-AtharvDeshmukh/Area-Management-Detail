const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp Web Client with saved session capability
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Display QR code in server logs for initial pairing
client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('📲 SCAN THIS QR CODE WITH WHATSAPP TO ACTIVATE FREE MESSAGING:');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ FREE WhatsApp Automation Service Connected & Ready!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Authentication failed:', msg);
});

// Initialize the client
client.initialize();

/**
 * Sends an automated WhatsApp message to a resident
 */
const sendWelcomeMessage = async (mobileNumber, headName, familyId) => {
    try {
        if (!mobileNumber) return false;

        // Clean digits and format for Indian numbers (+91)
        const cleanNumber = mobileNumber.toString().replace(/\D/g, '');
        const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
        const chatId = `${formattedNumber}@c.us`;

        const messageBody = `*Welcome to Dattaham Nagar Family!* 🏛️\n\nDear *${headName}*,\nYour household registration is successful.\n\n🆔 *Official Family ID:* ${familyId}\n📍 *Location:* Besa Pipla Road, Nagpur\n\nPlease save this message for future civic portal access.`;

        await client.sendMessage(chatId, messageBody);
        console.log(`✅ FREE WhatsApp message successfully delivered to ${formattedNumber}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send WhatsApp message:", error.message);
        return false;
    }
};

