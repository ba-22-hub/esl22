import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
serve(async (req)=>{
  const origin = req.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, apikey, authorization, x-client-info"
  };
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { pudoId, countryCode = "FR" } = await req.json();
    if (!pudoId) {
      return new Response(JSON.stringify({
        error: "pudoId est requis"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetPudoDetails xmlns="http://MyPudo.pickup-services.com/">
      <carrier>EXA</carrier>
      <key>deecd7bc81b71fcc0e292b53e826c48f</key>
      <pudo_id>${pudoId}</pudo_id>
      <countrycode>${countryCode}</countrycode>
      <date_from></date_from>
    </GetPudoDetails>
  </soap:Body>
</soap:Envelope>`;
    const res = await fetch("http://mypudo.pickup-services.com/mypudo/mypudo.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://MyPudo.pickup-services.com/GetPudoDetails"'
      },
      body: xml
    });
    const text = await res.text();
    const getTagContent = (xml, tag)=>{
      const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, "s"));
      return match ? match[1].trim() : "";
    };
    return new Response(JSON.stringify({
      id: pudoId,
      name: getTagContent(text, "NAME"),
      address1: getTagContent(text, "ADDRESS1"),
      address2: getTagContent(text, "ADDRESS2"),
      city: getTagContent(text, "CITY"),
      zipCode: getTagContent(text, "ZIPCODE")
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
