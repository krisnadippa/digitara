import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findPendingOrderByAmount, markOrderAsPaid, updateOrderEmailSent } from "@/lib/orders";
import { sendActivationEmail } from "@/lib/email";

interface MootaMutation {
  mutation_id?: string;
  account_number?: string;
  bank_id?: string;
  date?: string;
  description?: string;
  amount?: number | string;
  type?: string; // "CR" for credit/masuk, "DB" for debit/keluar
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("signature");

    // Optional HMAC Signature Verification
    const secret = process.env.MOOTA_WEBHOOK_SECRET;
    if (secret && signature) {
      const computedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (computedHash !== signature) {
        console.warn("Moota Webhook: Invalid Signature rejected.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Moota may send an array of mutations, or an object with { mutations: [...] }
    let mutations: MootaMutation[] = [];
    if (Array.isArray(parsedBody)) {
      mutations = parsedBody;
    } else if (Array.isArray(parsedBody.mutations)) {
      mutations = parsedBody.mutations;
    } else if (parsedBody.amount) {
      mutations = [parsedBody];
    }

    console.log(`[Moota Webhook] Menerima ${mutations.length} mutasi baru.`);

    const matchedOrders = [];

    for (const mutation of mutations) {
      // Only process credit mutations (CR / Uang Masuk)
      const isCredit =
        mutation.type?.toUpperCase() === "CR" ||
        mutation.type?.toLowerCase() === "credit" ||
        !mutation.type; // Fallback if type not provided

      if (!isCredit) continue;

      const rawAmount = String(mutation.amount).replace(/[^0-9.]/g, "");
      const amount = Math.floor(Number(rawAmount));

      if (!amount || isNaN(amount)) continue;

      console.log(`[Moota Webhook] Memeriksa mutasi masuk: Rp ${amount}`);

      // Match with pending order with this exact amount (including 3-digit unique code)
      const pendingOrder = await findPendingOrderByAmount(amount);

      if (pendingOrder) {
        console.log(
          `[Moota Webhook] COCOK! Order ID #${pendingOrder.orderId} atas nama ${pendingOrder.buyerName} sebesar Rp ${amount}`
        );

        // Mark as PAID
        const paidOrder = await markOrderAsPaid(pendingOrder.orderId);

        if (paidOrder) {
          // Auto push email to buyer
          const emailResult = await sendActivationEmail(paidOrder);
          await updateOrderEmailSent(paidOrder.orderId, emailResult.emailSent);

          matchedOrders.push({
            orderId: paidOrder.orderId,
            buyerEmail: paidOrder.buyerEmail,
            amount: paidOrder.totalAmount,
            emailSent: emailResult.emailSent,
          });

          console.log(
            `[Moota Webhook] Email aktivasi berhasil dikirim ke ${paidOrder.buyerEmail}!`
          );
        }
      }
    }

    return NextResponse.json({
      status: "success",
      processedCount: mutations.length,
      matchedCount: matchedOrders.length,
      matchedOrders,
    });
  } catch (err: unknown) {
    console.error("Error handling Moota Webhook:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
