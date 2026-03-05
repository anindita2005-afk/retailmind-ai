import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "retailiq-super-secret-key-change-in-production"
);

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER || "development@gmail.com",
            pass: process.env.EMAIL_PASS || "password",
        },
    });

    const mailOptions = {
        from: `"RetailMind AI" <${process.env.EMAIL_USER || "development@gmail.com"}>`,
        to: email,
        subject: "Your OTP for RetailMind AI",
        text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
        html: `<h3>Your Verification Code</h3><p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`,
    };

    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log(`\n\n[DEV MODE] ✉️  OTP for ${email}: ${otp}\n\n`);
        }
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        throw new Error("Could not send OTP email.");
    }
}

export async function signOTPToken(email: string, otp: string) {
    return await new SignJWT({ email, otp })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(SECRET);
}

export async function verifyOTPToken(token: string, userOTP: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        if (payload.otp === userOTP) {
            return payload.email as string;
        }
        return null;
    } catch (error) {
        return null;
    }
}
