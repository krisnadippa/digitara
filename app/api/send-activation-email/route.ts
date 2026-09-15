import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      buyerName,
      buyerEmail,
      buyerWhatsapp,
      orderId,
      items,
      totalAmount,
      activationLink,
    } = body;

    if (!buyerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Email pembeli dan item pesanan wajib diisi." },
        { status: 400 }
      );
    }

    const formatRupiah = (num: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(num);
    };

    const hasGemini = items.some(
      (item: { id?: string; name: string }) =>
        (item.id && item.id.includes("gemini")) ||
        item.name.toLowerCase().includes("gemini")
    );

    const emailActivationLink =
      activationLink ||
      `https://lapakdigitara.com/redeem/${orderId || "DIGI-" + Date.now().toString().slice(-6)}`;

    // Generate responsive HTML Email Template with logo12.png and DIGITARA branding
    const emailHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Aktivasi Pesanan #${orderId || "DIGITARA"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f6f8fa;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f6f8fa;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #eaeaea;
    }
    .header {
      padding: 30px 35px 24px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
      background-color: #ffffff;
    }
    .brand-logo {
      max-height: 48px;
      width: auto;
      margin-bottom: 8px;
      display: inline-block;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #0a0a0a;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      color: #888888;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .badge-status {
      display: inline-block;
      background-color: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 16px;
    }
    .content {
      padding: 30px 35px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #111111;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .intro-p {
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 24px;
    }
    .order-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .order-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px dashed #e5e7eb;
      font-size: 14px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 700;
      color: #111827;
    }
    .item-duration {
      font-size: 12px;
      color: #6b7280;
      font-weight: normal;
    }
    .item-price {
      font-weight: 800;
      color: #111827;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      margin-top: 8px;
      border-top: 2px solid #e5e7eb;
      font-size: 16px;
      font-weight: 900;
      color: #111827;
    }
    .cta-box {
      background: linear-gradient(135deg, #0a0a0a 0%, #1f2937 100%);
      border-radius: 16px;
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
      margin: 25px 0;
    }
    .cta-title {
      font-size: 17px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 8px;
      color: #ffffff;
    }
    .cta-desc {
      font-size: 13px;
      color: #d1d5db;
      margin-bottom: 20px;
    }
    .btn-activation {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 800;
      padding: 14px 30px;
      border-radius: 30px;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
      letter-spacing: 0.5px;
    }
    .raw-url {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 16px;
      word-break: break-all;
    }
    .antigravity-callout {
      background-color: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 13px;
      line-height: 1.5;
      color: #713f12;
    }
    .guide-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-top: 25px;
    }
    .guide-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .step-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.7;
      color: #334155;
    }
    .chat-format {
      background-color: #0f172a;
      color: #38bdf8;
      font-family: monospace;
      padding: 14px;
      border-radius: 10px;
      font-size: 12px;
      margin-top: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .thanks-section {
      padding: 24px 0 10px;
      text-align: center;
      border-top: 1px solid #f0f0f0;
      margin-top: 30px;
    }
    .thanks-title {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 6px;
    }
    .thanks-p {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 35px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      border-top: 1px solid #eaeaea;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header with Logo and Brand -->
      <div class="header">
        <img src="cid:digitara_logo" alt="DIGITARA Logo" class="brand-logo" style="max-height: 48px; width: auto; margin-bottom: 8px; display: inline-block;" onerror="this.style.display='none'">
        <h1 class="brand-name">DIGITARA</h1>
        <div class="brand-sub">Solusi Akun AI & Layanan Digital Premium</div>
        <div class="badge-status">✓ Pembayaran Berhasil Terverifikasi</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h2 class="greeting">Halo, ${buyerName || "Pelanggan Setia"}!</h2>
        <p class="intro-p">
          Terima kasih banyak telah berbelanja di <strong>Lapak Digitara</strong>. Pesanan Anda dengan ID <strong>#${orderId || "DIGI-INV"}</strong> telah berhasil kami proses dan link aktivasi sudah siap digunakan.
        </p>

        <!-- Order Summary -->
        <div class="order-box">
          <div class="order-title">Rincian Pembelian</div>
          ${items
            .map(
              (it: { name: string; duration?: string; quantity: number; price: number }) => `
            <div class="item-row">
              <div>
                <span class="item-name">${it.name}</span>
                <span class="item-duration">(${it.duration || "1 Lisensi"}) x${it.quantity}</span>
              </div>
              <span class="item-price">${formatRupiah(it.price * it.quantity)}</span>
            </div>
          `
            )
            .join("")}
          <div class="total-row">
            <span>Total Pembayaran</span>
            <span>${formatRupiah(totalAmount || 0)}</span>
          </div>
        </div>

        ${
          hasGemini
            ? `
        <!-- Anti Gravity Spotlight for Gemini Pro -->
        <div class="antigravity-callout">
          <strong>⚡ Kompatibel Penuh untuk Anti Gravity:</strong><br>
          Akun Google Gemini Pro yang Anda terima ini mendukung penuh integrasi ke <strong>Google Anti Gravity IDE / Coding Agents</strong> dengan kapasitas context window hingga 1-2 Juta token.
        </div>
        `
            : ""
        }

        <!-- Call To Action: Activation Link -->
        <div class="cta-box">
          <h3 class="cta-title">Klaim Link Aktivasi Anda</h3>
          <p class="cta-desc">Klik tombol di bawah ini pada perangkat yang ingin Anda aktifkan:</p>
          <a href="${emailActivationLink}" target="_blank" class="btn-activation">
            AKTIFKAN SEKARANG ➜
          </a>
          <div class="raw-url">
            Atau salin URL berikut di browser Anda:<br>
            <span style="color: #60a5fa;">${emailActivationLink}</span>
          </div>
        </div>

        <!-- Step-by-Step Instructions & Format Chat -->
        <div class="guide-box">
          <h4 class="guide-title">📋 Panduan / Langkah Aktivasi:</h4>
          <ol class="step-list">
            <li>Pastikan Anda sudah login ke akun Google / platform utama Anda di browser.</li>
            <li>Klik tombol atau tautan aktivasi di atas.</li>
            <li>Tekan tombol konfirmasi <strong>"Terima Undangan / Accept Invitation"</strong>.</li>
            <li>Akun Anda otomatis aktif dengan durasi penuh tanpa kendala!</li>
          </ol>

          <div style="margin-top: 16px;">
            <strong style="font-size: 12px; color: #475569; text-transform: uppercase;">Format Catatan Pesanan:</strong>
            <div class="chat-format">Order ID: #${orderId || "DIGI-SUCCESS"}
Produk: ${items.map((i: { name: string; quantity: number }) => `${i.name} (x${i.quantity})`).join(", ")}
Status: LUNAS & AKTIF
Email Penerima: ${buyerEmail}
WhatsApp: ${buyerWhatsapp || "-"}
Link Akses: ${emailActivationLink}</div>
          </div>
        </div>

        <!-- Closing Gratitude -->
        <div class="thanks-section">
          <div class="thanks-title">Terima Kasih Atas Kepercayaan Anda!</div>
          <p class="thanks-p">
            Kepuasan dan kenyamanan Anda adalah prioritas utama kami di Lapak Digitara. Jika ada kendala dalam proses aktivasi atau memerlukan bantuan teknis, tim kami siap membantu Anda 24/7.
          </p>
          <a href="https://wa.me/?text=${encodeURIComponent(
            `Halo Admin Lapak Digitara, saya butuh bantuan aktivasi untuk Order ID #${orderId || "DIGI"}.`
          )}" style="display: inline-block; color: #059669; font-weight: 700; text-decoration: none; font-size: 13px;">
            💬 Hubungi Bantuan WhatsApp Admin &rarr;
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} <strong>DIGITARA</strong>. Hak cipta dilindungi undang-undang.</p>
        <p style="margin: 0;">Penyedia Akun AI & Layanan Digital Premium Terpercaya di Indonesia.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Check if SMTP environment variables are configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"Lapak Digitara" <${smtpUser || "order@lapakdigitara.com"}>`;

    let emailSent = false;
    let transportError = null;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const logoPath = path.join(process.cwd(), "public", "images", "logo12.png");
        const attachments = [];
        if (fs.existsSync(logoPath)) {
          attachments.push({
            filename: "logo12.png",
            path: logoPath,
            cid: "digitara_logo",
          });
        }

        const plainText = `Halo ${buyerName || "Pelanggan Setia"},

Terima kasih telah berbelanja di Lapak Digitara. Pesanan #${orderId || "DIGI-INV"} telah dikonfirmasi dan link lisensi Anda telah siap digunakan.

Rincian Pesanan:
${items.map((i: { name: string; duration?: string; quantity: number }) => `- ${i.name} (${i.duration || "1 Lisensi"}) x${i.quantity}`).join("\n")}
Total: ${formatRupiah(totalAmount || 0)}

Link Aktivasi Anda:
${emailActivationLink}

Langkah Aktivasi:
1. Pastikan Anda sudah login ke akun Google / platform terkait.
2. Buka link aktivasi di atas.
3. Klik tombol Terima Undangan / Konfirmasi.
4. Akun Anda otomatis aktif durasi penuh.

Butuh bantuan teknis? Hubungi WhatsApp Admin kami.

Salam hangat,
Tim Lapak Digitara`;

        await transporter.sendMail({
          from: smtpFrom,
          to: buyerEmail,
          replyTo: smtpUser,
          subject: `Pesanan #${orderId || "DIGI"} Dikonfirmasi - Link Aktivasi Akun Anda`,
          text: plainText,
          html: emailHtml,
          attachments,
          headers: {
            "X-Mailer": "Lapak Digitara Notification Service",
            "X-Entity-Ref-ID": orderId || "DIGI",
          },
        });

        emailSent = true;
      } catch (err: unknown) {
        console.error("Gagal mengirim real SMTP email:", err);
        transportError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      transportError,
      message: emailSent
        ? `Email aktivasi berhasil dikirimkan ke ${buyerEmail}`
        : `Email berhasil diproses (Mode simulasi aktif untuk ${buyerEmail})`,
      orderId,
      activationLink: emailActivationLink,
      previewHtml: emailHtml,
    });
  } catch (error: unknown) {
    console.error("Error in /api/send-activation-email:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}
