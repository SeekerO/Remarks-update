import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { uid, displayName, email, message, captchaToken } = await req.json();

    // 1. Verify reCAPTCHA with Google
    const recaptchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    
    const recaptchaData = await recaptchaRes.json();

    // Google returns a score (0.5 is usually the safe threshold)
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return NextResponse.json({ error: "Security check failed. Bots not allowed." }, { status: 403 });
    }

    // 2. Validation
    if (!uid || !displayName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL || "albertbaisa@gmail.com",
      subject: `[Avexi] Access Request from ${displayName}`,
      html: `<p><strong>User:</strong> ${displayName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}