import nodemailer from 'nodemailer';

// Email configuration - Using port 465 with SSL
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Gamble Bible" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.to}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Template for prize claim received email
export const sendPrizeClaimReceivedEmail = async (
    userEmail: string,
    userName: string,
    prizeDescription: string,
    prizeAmount: number,
    referenceNumber: string
): Promise<boolean> => {
    const subject = '🎉 Prize Claim Received - Gamble Bible';
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #9333ea, #c026d3);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .prize-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #9333ea;
            }
            .reference {
                background: #e0e7ff;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                margin: 10px 0;
            }
            .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #9333ea, #c026d3);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎊 Great News, ${userName}!</h1>
        </div>
        <div class="content">
            <h2>Gamble Bible has received your prize claim request!</h2>
            <p>We're excited to let you know that we've received your payment information and are now verifying your win.</p>
            
            <div class="prize-details">
                <h3>Prize Details:</h3>
                <p><strong>Prize:</strong> ${prizeDescription}</p>
                <p><strong>Amount:</strong> $${prizeAmount.toFixed(2)}</p>
                <div class="reference">
                    <strong>Reference Number:</strong> ${referenceNumber}
                </div>
            </div>

            <h3>What happens next?</h3>
            <ol>
                <li><strong>Verification:</strong> Our team is verifying your win (typically takes 24-48 hours)</li>
                <li><strong>Processing:</strong> Once verified, we'll process your payment</li>
                <li><strong>Confirmation:</strong> You'll receive another email when payment is sent!</li>
            </ol>

            <p>You can track the status of your prize claim anytime by logging into your account.</p>

            <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/prizes" class="button">
                    View My Prizes
                </a>
            </center>

            <p><strong>Need help?</strong> Contact our support team at support@gamblebible.com</p>
        </div>
        <div class="footer">
            <p>This email was sent by Gamble Bible</p>
            <p>Reference: ${referenceNumber}</p>
        </div>
    </body>
    </html>
    `;

    return await sendEmail({ to: userEmail, subject, html });
};

// Template for prize payment confirmation email
export const sendPrizePaymentConfirmationEmail = async (
    userEmail: string,
    userName: string,
    prizeDescription: string,
    prizeAmount: number,
    referenceNumber: string,
    paymentMethod: string,
    accountNumber: string
): Promise<boolean> => {
    const subject = '✅ Prize Payment Sent - Gamble Bible';
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .prize-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
            }
            .payment-info {
                background: #d1fae5;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            .reference {
                background: #e0e7ff;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                margin: 10px 0;
            }
            .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .success-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Sent!</h1>
        </div>
        <div class="content">
            <h2>Congratulations, ${userName}! 🎉</h2>
            <p>Your prize payment has been successfully processed and sent to your account!</p>
            
            <div class="prize-details">
                <h3>Prize Details:</h3>
                <p><strong>Prize:</strong> ${prizeDescription}</p>
                <p><strong>Amount:</strong> $${prizeAmount.toFixed(2)}</p>
                <div class="reference">
                    <strong>Reference Number:</strong> ${referenceNumber}
                </div>
            </div>

            <div class="payment-info">
                <h3>Payment Information:</h3>
                <p><strong>Payment Method:</strong> ${paymentMethod.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Account:</strong> ${accountNumber.replace(/(.{4})/g, '$1 ')}</p>
                <p><strong>Status:</strong> ✅ Paid</p>
            </div>

            <h3>What to expect:</h3>
            <ul>
                <li>Payment typically arrives within 1-3 business days depending on your payment method</li>
                <li>Check your account or wallet for the incoming payment</li>
                <li>If you don't receive payment within 5 business days, please contact support</li>
            </ul>

            <p><strong>Thank you for playing with Gamble Bible!</strong> We hope you enjoy your winnings. Keep an eye out for more prizes and opportunities to win!</p>

            <p><strong>Questions?</strong> Contact our support team at support@gamblebible.com with reference number ${referenceNumber}</p>
        </div>
        <div class="footer">
            <p>This email was sent by Gamble Bible</p>
            <p>Reference: ${referenceNumber}</p>
            <p>Payment Date: ${new Date().toLocaleDateString()}</p>
        </div>
    </body>
    </html>
    `;

    return await sendEmail({ to: userEmail, subject, html });
};