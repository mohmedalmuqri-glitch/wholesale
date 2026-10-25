import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ success: false, detail: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await supabase
      .from("notifications")
      .insert({ title, body });

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, detail: `DB insert failed: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("token");

    let pushCount = 0;
    const pushErrors: string[] = [];

    if (tokenError) {
      pushErrors.push(`Token fetch error: ${tokenError.message}`);
    } else if (tokens && tokens.length > 0) {
      const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

      if (fcmServerKey) {
        const fcmUrl = "https://fcm.googleapis.com/fcm/send";
        for (const row of tokens) {
          try {
            const fcmRes = await fetch(fcmUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `key=${fcmServerKey}`,
              },
              body: JSON.stringify({
                to: row.token,
                notification: { title, body },
                data: { title, body },
              }),
            });
            if (fcmRes.ok) {
              pushCount++;
            } else {
              const errText = await fcmRes.text().catch(() => "");
              pushErrors.push(`FCM error: ${errText.slice(0, 100)}`);
            }
          } catch (e) {
            pushErrors.push(`FCM fetch failed: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } else {
        pushErrors.push("FCM_SERVER_KEY not configured; notification saved to database only");
      }
    } else {
      pushErrors.push("No device tokens registered");
    }

    return new Response(
      JSON.stringify({
        success: true,
        saved: true,
        pushCount,
        pushErrors: pushErrors.length > 0 ? pushErrors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        detail: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
