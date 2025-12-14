import fetch from "node-fetch";
import {
  ServicePrincipalCredentials,
  PDFServices,
  ExtractPDFParams,
  ExtractElementType
} from "@adobe/pdfservices-node-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileUrl } = req.body || {};
    if (!fileUrl) {
      return res.status(400).json({ error: "Missing fileUrl" });
    }

    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      return res.status(400).json({ error: "Failed to download PDF from fileUrl" });
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    const credentials = new ServicePrincipalCredentials({
      clientId: process.env.ADOBE_CLIENT_ID,
      clientSecret: process.env.ADOBE_CLIENT_SECRET
    });

    const pdfServices = new PDFServices({ credentials });

    const inputAsset = await pdfServices.upload({
      readStream: pdfBuffer,
      mimeType: "application/pdf"
    });

    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT]
    });

    const job = await pdfServices.submit({ inputAsset, params });
    const result = await pdfServices.getJobResult(job);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
