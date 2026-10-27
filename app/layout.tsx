import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cold Start — Cold emails that prove you did your homework",
  description:
    "Paste a founder's site, speak for 15 seconds, and get a specific email, a DM and follow-ups. Track every reply in one place.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><rect width='24' height='24' rx='6' fill='%232563eb'/><path d='M12 4v16m-8-8h16m-5.657-5.657l-11.314 11.314m0-11.314l11.314 11.314' stroke='white' stroke-width='2.2' stroke-linecap='round'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fcfcfd] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
