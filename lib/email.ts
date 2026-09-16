import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { Order } from "./orders";

function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendActivationEmail(order: Order): Promise<{
  success: boolean;
  emailSent: boolean;
  message: string;
  previewHtml: string;
}> {
  const safeBuyerName = escapeHtml(order.buyerName) || "Pelanggan Setia";
  const safeOrderId = escapeHtml(order.orderId);
  const safeBuyerEmail = escapeHtml(order.buyerEmail);
  const safeBuyerWhatsapp = escapeHtml(order.buyerWhatsapp);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const hasGemini = order.items.some(
    (item) =>
      (item.id && item.id.includes("gemini")) ||
      item.name.toLowerCase().includes("gemini")
  );

  const emailActivationLink = order.activationLink;

  // Generate responsive HTML Email Template with logo12.png and DIGITARA branding
  const emailHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Aktivasi Pesanan #${safeOrderId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f7f6;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f7f6;
      padding: 40px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
      border: 1px solid #f0f0f0;
    }
    .header {
      padding: 40px 35px 30px;
      text-align: center;
      background: linear-gradient(to bottom, #ffffff, #fcfcfc);
      border-bottom: 1px solid #f0f0f0;
    }
    .brand-logo {
      max-height: 54px;
      width: auto;
      margin-bottom: 12px;
      display: inline-block;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 5px;
      color: #000000;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 12px;
      color: #666666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 6px;
      font-weight: 500;
    }
    .badge-status {
      display: inline-block;
      background-color: #e6f7ec;
      color: #036b45;
      border: 1px solid #b7ecd0;
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 700;
      margin-top: 20px;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 35px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 800;
      color: #000000;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .intro-p {
      font-size: 15px;
      line-height: 1.7;
      color: #4a5568;
      margin-bottom: 28px;
    }
    .order-box {
      background-color: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .order-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #888888;
      margin-bottom: 16px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 15px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 700;
      color: #1a202c;
    }
    .item-duration {
      font-size: 13px;
      color: #718096;
      font-weight: 500;
      margin-left: 4px;
    }
    .item-price {
      font-weight: 800;
      color: #1a202c;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      margin-top: 10px;
      border-top: 2px solid #edf2f7;
      font-size: 18px;
      font-weight: 900;
      color: #000000;
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
        <div class="badge-status">✓ Pembayaran Berhasil Terverifikasi Otomatis</div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h2 class="greeting">Halo, ${safeBuyerName}!</h2>
        <p class="intro-p">
          Terima kasih banyak telah berbelanja di <strong>Lapak Digitara</strong>. Pembayaran Anda telah <strong>berhasil diverifikasi otomatis</strong> dan link aktivasi sudah siap digunakan.
        </p>

        <!-- Order Summary -->
        <div class="order-box">
          <div class="order-title">Rincian Pembelian (Order #${safeOrderId})</div>
          ${order.items
            .map(
              (it) => `
            <div class="item-row">
              <div>
                <span class="item-name">${escapeHtml(it.name)}</span>
                <span class="item-duration">(${escapeHtml(it.duration) || "1 Lisensi"}) x${Number(it.quantity) || 1}</span>
              </div>
              <span class="item-price">${formatRupiah(it.price * it.quantity)}</span>
            </div>
          `
            )
            .join("")}
          <div class="total-row">
            <span>Total Pembayaran</span>
            <span>${formatRupiah(order.totalAmount || 0)}</span>
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
            <div class="chat-format">Order ID: #${safeOrderId}
Produk: ${order.items.map((i) => `${escapeHtml(i.name)} (x${i.quantity})`).join(", ")}
Status: LUNAS & AKTIF (VERIFIKASI OTOMATIS)
Email Penerima: ${safeBuyerEmail}
WhatsApp: ${safeBuyerWhatsapp || "-"}
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
            `Halo Admin Lapak Digitara, saya butuh bantuan aktivasi untuk Order ID #${order.orderId}.`
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

  // SMTP Settings dari Environment Variable
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"Lapak Digitara" <${smtpUser}>` : `"Lapak Digitara" <order@lapakdigitara.com>`);

  let emailSent = false;

  if (!smtpUser || !smtpPass) {
    console.warn("[Email Service] SMTP_USER atau SMTP_PASS belum diset di environment. Email simulasi.");
    return {
      success: true,
      emailSent: false,
      message: `Simulasi email berhasil (SMTP belum dikonfigurasi).`,
      previewHtml: emailHtml,
    };
  }

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

    const logoPath = path.join(process.cwd(), "public", "images", "logo13.png");
    const attachments = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: "logo13.png",
        path: logoPath,
        cid: "digitara_logo",
      });
    }

    const plainText = `Halo ${order.buyerName || "Pelanggan Setia"},

Terima kasih telah berbelanja di Lapak Digitara. Pesanan #${order.orderId} telah dikonfirmasi dan link lisensi Anda telah siap digunakan.

Rincian Pesanan:
${order.items.map((i) => `- ${i.name} (${i.duration}) x${i.quantity}`).join("\n")}
Total: ${formatRupiah(order.totalAmount)}

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
      to: order.buyerEmail,
      replyTo: smtpUser,
      subject: `Pesanan #${order.orderId} Dikonfirmasi - Link Aktivasi Akun Anda`,
      text: plainText,
      html: emailHtml,
      attachments,
      headers: {
        "X-Mailer": "Lapak Digitara Notification Service",
        "X-Entity-Ref-ID": order.orderId,
      },
    });

    emailSent = true;
  } catch (err) {
    console.error("Gagal mengirim email via SMTP:", err);
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? `Email aktivasi berhasil dikirimkan ke ${order.buyerEmail}`
      : `Email gagal dikirimkan ke ${order.buyerEmail}`,
    previewHtml: emailHtml,
  };
}
