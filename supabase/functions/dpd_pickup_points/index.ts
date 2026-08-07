import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
serve(async (req)=>{
  const origin = req.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, apikey, authorization, x-client-info"
  };
  // Réponse automatique aux requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { postalCode, countryCode, city, address } = await req.json();
    console.log("Request received:", {
      postalCode,
      countryCode,
      city,
      address
    });
    // Configuration DPD selon la documentation
    const carrier = "EXA";
    const key = "deecd7bc81b71fcc0e292b53e826c48f";
    const soapUrl = "http://mypudo.pickup-services.com/mypudo/mypudo.asmx";
    // Générer un requestID unique
    const requestID = `REQ_${Date.now()}`;
    // Date de prise en charge (aujourd'hui + 1 jour)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateFrom = tomorrow.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    console.log("Calling DPD API at:", soapUrl);
    console.log("Date from:", dateFrom);
    // Construction de la requête SOAP 1.1 selon la documentation DPD
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetPudoList xmlns="http://MyPudo.pickup-services.com/">
      <carrier>${carrier}</carrier>
      <key>${key}</key>
      <address>${address || ""}</address>
      <zipCode>${postalCode}</zipCode>
      <city>${city || ""}</city>
      <countrycode>${countryCode}</countrycode>
      <requestID>${requestID}</requestID>
      <date_from>${dateFrom}</date_from>
      <max_pudo_number></max_pudo_number>
      <max_distance_search></max_distance_search>
      <weight></weight>
      <category></category>
      <holiday_tolerant></holiday_tolerant>
    </GetPudoList>
  </soap:Body>
</soap:Envelope>`;
    const res = await fetch(soapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://MyPudo.pickup-services.com/GetPudoList"'
      },
      body: xml
    });
    console.log("DPD Response status:", res.status);
    const text = await res.text();
    console.log("DPD Response (first 800 chars):", text.substring(0, 800));
    // Vérifier s'il y a des erreurs SOAP
    if (text.includes("<soap:Fault>") || text.includes("<faultstring>")) {
      const faultMatch = text.match(/<faultstring>(.*?)<\/faultstring>/);
      const faultString = faultMatch ? faultMatch[1] : "Erreur SOAP inconnue";
      console.error("SOAP Fault:", faultString);
      throw new Error(`Erreur DPD: ${faultString}`);
    }
    // Extraire le contenu de GetPudoListResult
    const resultMatch = text.match(/<GetPudoListResult>([\s\S]*?)<\/GetPudoListResult>/);
    if (!resultMatch) {
      console.error("No GetPudoListResult found in response");
      throw new Error("Pas de résultat dans la réponse DPD");
    }
    const resultXml = resultMatch[1];
    console.log("Result XML (first 500 chars):", resultXml.substring(0, 500));
    // Extraire la qualité de la réponse
    const qualityMatch = resultXml.match(/<RESPONSE[^>]*quality="(\d+)"[^>]*>/);
    const quality = qualityMatch ? parseInt(qualityMatch[1]) : 0;
    console.log("Response quality:", quality);
    // Vérifier s'il y a des erreurs métier
    const errorMatch = resultXml.match(/<ERROR[^>]*code="([^"]*)"[^>]*>(.*?)<\/ERROR>/);
    if (errorMatch) {
      const errorCode = errorMatch[1];
      const errorMessage = errorMatch[2];
      console.error("DPD Error:", errorCode, errorMessage);
      throw new Error(`Erreur DPD (${errorCode}): ${errorMessage}`);
    }
    // Fonction helper pour extraire le contenu d'une balise
    const getTagContent = (xml, tag)=>{
      const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's'));
      return match ? match[1].trim() : "";
    };
    // Extraire tous les PUDO_ITEM
    const pudoItemsMatch = resultXml.match(/<PUDO_ITEM[^>]*>([\s\S]*?)<\/PUDO_ITEM>/g);
    if (!pudoItemsMatch) {
      console.log("No pickup points found");
      return new Response(JSON.stringify({
        quality: quality,
        requestId: requestID,
        count: 0,
        points: []
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const points = pudoItemsMatch.map((itemXml)=>{
      // Vérifier si le point est actif
      const activeMatch = itemXml.match(/active="(true|false)"/);
      const active = activeMatch ? activeMatch[1] === "true" : true;
      const point = {
        id: getTagContent(itemXml, "PUDO_ID"),
        name: getTagContent(itemXml, "NAME"),
        address1: getTagContent(itemXml, "ADDRESS1"),
        address2: getTagContent(itemXml, "ADDRESS2"),
        address3: getTagContent(itemXml, "ADDRESS3"),
        zipCode: getTagContent(itemXml, "ZIPCODE"),
        city: getTagContent(itemXml, "CITY"),
        distance: getTagContent(itemXml, "DISTANCE"),
        longitude: getTagContent(itemXml, "LONGITUDE"),
        latitude: getTagContent(itemXml, "LATITUDE"),
        localHint: getTagContent(itemXml, "LOCAL_HINT"),
        available: getTagContent(itemXml, "AVAILABLE"),
        active: active
      };
      // Extraire les horaires d'ouverture
      const openingHours = [];
      const hoursMatches = itemXml.match(/<OPENING_HOURS_ITEM>([\s\S]*?)<\/OPENING_HOURS_ITEM>/g);
      if (hoursMatches) {
        hoursMatches.forEach((hourXml)=>{
          openingHours.push({
            dayId: getTagContent(hourXml, "DAY_ID"),
            startTime: getTagContent(hourXml, "START_TM"),
            endTime: getTagContent(hourXml, "END_TM")
          });
        });
      }
      point.openingHours = openingHours;
      // Extraire les périodes de congés
      const holidays = [];
      const holidayMatches = itemXml.match(/<HOLIDAY_ITEM>([\s\S]*?)<\/HOLIDAY_ITEM>/g);
      if (holidayMatches) {
        holidayMatches.forEach((holidayXml)=>{
          const startDate = getTagContent(holidayXml, "START_DTM");
          const endDate = getTagContent(holidayXml, "END_DTM");
          if (startDate || endDate) {
            holidays.push({
              startDate: startDate,
              endDate: endDate
            });
          }
        });
      }
      point.holidays = holidays;
      return point;
    });
    console.log(`Found ${points.length} pickup points`);
    return new Response(JSON.stringify({
      quality: quality,
      requestId: requestID,
      count: points.length,
      points: points
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
