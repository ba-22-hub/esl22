import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
serve(async (req)=>{
  try {
    const { parcelNumber } = await req.json();
    const userid = Deno.env.get("DPD_USERID");
    const password = Deno.env.get("DPD_PASSWORD");
    const customerNumber = Deno.env.get("DPD_CUSTOMER_NUMBER");
    const customerCenter = Deno.env.get("DPD_CUSTOMER_CENTER");
    const soapUrl = Deno.env.get("DPD_SOAP_URL").replace('?WSDL', '');
    const xml = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <trackParcel xmlns="http://pickup-services.com/">
          <UserCredentials>
            <userid>${userid}</userid>
            <password>${password}</password>
          </UserCredentials>
          <customer_number>${customerNumber}</customer_number>
          <customer_center_number>${customerCenter}</customer_center_number>
          <parcelNumber>${parcelNumber}</parcelNumber>
        </trackParcel>
      </soap:Body>
    </soap:Envelope>
    `;
    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://pickup-services.com/trackParcel'
      },
      body: xml
    });
    const text = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    // Exemple : récupérer le statut du colis
    const status = xmlDoc.getElementsByTagName("status")[0]?.textContent;
    const location = xmlDoc.getElementsByTagName("location")[0]?.textContent;
    return new Response(JSON.stringify({
      status,
      location
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: e.message
    }), {
      status: 500
    });
  }
});
