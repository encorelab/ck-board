
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'

dotenv.config();

export const generateEmail = async (
    emailTo: string,
    subject: string,
    resetLink: string  // Add the resetLink parameter
  ): Promise<void> => {

    // Create the email body with the reset link as a hyperlink
    const message = `
      <p>Hello from the SCORE Support Team,</p>

      <p>We've received a request to reset your password for your account.</p>

      <p>To reset your password, please click on the following link: <a href="${resetLink}">Reset Password</a></p>

      <p>If you did not request a password reset, you can ignore this email.</p>

      <p>Please note that this link is only valid for 24 hours.</p>

      <p>Thank you,</p>
      <p>The SCORE Support Team</p>

      <p>P.S. Please do not reply to this email as no one monitors this inbox.</p>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: emailTo,
      subject: subject,
      html: message, // Use html instead of text
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  };