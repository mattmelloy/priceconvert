import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Configuration for the Gemini model
const generationConfig = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

export async function POST(req: Request) {
  try {
    const { image, currency, region } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not found" },
        { status: 500 }
      );
    }

    if (!image || !currency || !region) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Remove the data URL prefix if present and get base64 data
    const base64Data = image.split(',')[1] || image;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
      // Create a chat session
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      const prompt = `Please analyze this price tag image and provide the following information:

1. Extract the most prominent price shown in the image
2. Determine the local currency used in ${region} and assume this is the correct currency for conversion. do not attempt to determine the location or currency based on the photo.
3. Convert the price to ${currency}
4. Calculate applicable sales tax for ${region}

Tax calculation rules:
- For regions like Australia where GST is included in displayed prices, report $0 additional tax
- For other regions, apply the standard local sales tax rate
- Default to 0% if tax rate cannot be determined

Return only the data in this exact JSON format:
{
  "detected_price": "price shown on tag",
  "original_currency": "local currency code",
  "converted_price": "amount in ${currency}",
  "applicable_tax_rate": "tax rate percentage",
  "applicable_taxes": "tax amount in ${currency}",
  "total_price_local": "original price plus tax in local currency",
  "total_price": "converted price plus tax in ${currency}"
}`;

      // Send message to model
      const result = await chatSession.sendMessage([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        },
        { text: prompt }
      ]);

      const response = result.response.text();
      
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      try {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        // Include prompt in debug info
        return NextResponse.json({
          ...jsonResponse,
          debug: {
            request: {
              currency,
              region,
              prompt
            },
            response: response
          }
        });
      } catch (parseError) {
        console.error("Invalid JSON response from Gemini:", response);
        return NextResponse.json(
          { error: "Failed to parse price information" },
          { status: 500 }
        );
      }
    } catch (genError: any) {
      console.error("Gemini API error:", genError);
      return NextResponse.json(
        { error: genError.message || "Failed to analyze image with Gemini" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("General error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}