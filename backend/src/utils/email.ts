
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'

dotenv.config();

export const generateEmail = async (
    emailTo: string,
    subject: string,
    message: string
  ): Promise<void> => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
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
      text: message,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  };