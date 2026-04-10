const fs = require('fs');
const path = require('path');
const { Resend } = require("resend");
const { buildFullReportData, generateUserReportPDF } = require("./userService")

const resend = new Resend(process.env.RESEND_API_KEY);

const sendUserReport = async (userId, year, month) => {
    const reportData = await buildFullReportData(userId, year, month);
    const pdfBuffer = await generateUserReportPDF(reportData);

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `tastebud-report-${userId}-${year}-${month}-${Date.now()}.pdf`;
    const tempFilePath = path.join(tempDir, fileName);
    console.log("sending")
    try {
        await fs.promises.writeFile(tempFilePath, pdfBuffer)
        const attachment = fs.readFileSync(tempFilePath).toString('base64');
        const response = await resend.emails.send({
            from: "Tastebud <reports@tastebudservice.ca>",
            to: [reportData.user.email],
            subject: "Your Monthly TasteBud Report",

            html: `
        <h2>Your Report is Ready</h2>
        <p>Hi ${reportData.user.firstName || ""},</p>
        <p>Your personalized report is attached.</p>
      `,

            attachments: [
                {
                    content: attachment,
                    filename: `tastebud-report-${userId}-${year}-${month}-${Date.now()}.pdf`,
                }
            ]
        });
        console.log(response)
    } catch (err) {
        console.error("Failed to send report email:", err);
        throw err;
    }finally {
        try {
            await fs.promises.unlink(tempFilePath);
            console.log(`Temporary file deleted: ${tempFilePath}`);
        } catch (cleanupErr) {
            console.error("Failed to delete temporary file:", cleanupErr);
        }
    }
    console.log("sent")
    return true;
};

const sendVerificationEmail = async (user, token) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify?token=${token}`;

    try {
        await resend.emails.send({
            from: "Tastebud <onboarding@tastebudservice.ca>",
            to: [user.email],
            subject: "Verify your email",
            html: `
                <h2>Welcome to TasteBud!</h2>
                <p>Please verify your email by clicking below:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>This link expires in 1 hour.</p>
            `
        });
    } catch (err) {
        console.error("Failed to send verification email:", err);
        throw err;
    }
};

module.exports = {
    sendUserReport,
    sendVerificationEmail,
};