"use client";

import { useState } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Send, CheckCircle2, AlertCircle, X } from "lucide-react";

interface Props {
  user: { displayName: string; email: string; uid: string };
  onClose: () => void;
}

function ModalContent({ user, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha(); // The captcha hook

  const handleSend = async () => {
    if (!executeRecaptcha) return;
    setStatus("sending");

    try {
      // Generate the invisible token
      const token = await executeRecaptcha("request_access");

      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          message: message.trim(),
          captchaToken: token, // Send to server
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="relative p-6 space-y-4 bg-white dark:bg-[#0d0d1a] rounded-2xl">
      {status === "success" ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="font-bold">Request Sent!</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-xl">Done</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Request Access</h3>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <textarea
            className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-white/10 rounded-xl text-sm"
            placeholder="Reason for access..."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {status === "error" && <p className="text-xs text-red-500">{errorMsg}</p>}
          <button 
            onClick={handleSend}
            disabled={status === "sending"}
            className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {status === "sending" ? "Verifying Security..." : <><Send className="w-4 h-4" /> Send Request</>}
          </button>
          <p className="text-[9px] text-center opacity-40">Protected by reCAPTCHA</p>
        </>
      )}
    </div>
  );
}

// Main component wraps the content with the Provider
export default function RequestAccessModal(props: Props) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={props.onClose} />
        <div className="relative w-full max-w-md z-10"><ModalContent {...props} /></div>
      </div>
    </GoogleReCaptchaProvider>
  );
}