import nodemailer from "nodemailer";
import { config } from "../../config/config.js";
import { OtpType } from "@prisma/client";
import { throwFailedToSendEmailError } from "../../errors/authErrors.js";

export const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
}) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: parseInt(config.EMAIL_PORT, 10),
    secure: true,
    auth: {
      user: config.EMAIL_USERNAME,
      pass: config.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const emailOptions = {
    from: config.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) Actually send the email
  try {
    await transporter.sendMail(emailOptions);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${options.email}:`, error);
  }
};

export const getOtpEmailText = ({
  otpType,
  otpCode,
}: {
  otpType: OtpType;
  otpCode: string;
}) => {
  switch (otpType) {
    case OtpType.EMAIL_VERIFICATION:
      return {
        message: `Welcome to Event Planner!\n\nYour verification code is: ${otpCode}\n\nPlease enter this code to verify your email address and complete your account setup.`,
        subject: "Verify Your Event Planner Account",
      };
    case OtpType.PASSWORD_RESET:
      return {
        message:
          `You requested to reset your password.\n\n` +
          `Your password reset code is: ${otpCode}\n\n` +
          `This code will expire in 10 minutes. Please enter this code in the password reset form to create a new password.\n\n` +
          `If you didn't request this password reset, please ignore this email and your password will remain unchanged.`,
        subject: "Reset Your Event Planner Password",
      };
    default:
      throwFailedToSendEmailError();
  }
};
