const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "temp.disaster.relief@gmail.com", // Placeholder
        pass: "temp_pass_123" // Placeholder
    }
});

exports.sendAlertEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: '"Disaster Relief System" <alerts@disasterrelief.org>',
            to,
            subject,
            text
        };
        // await transporter.sendMail(mailOptions); // Commented out to prevent errors with placeholder credentials
        console.log(`Email simulate alert to ${to}: ${subject}`);
    } catch (err) {
        console.error("Email error:", err);
    }
};
