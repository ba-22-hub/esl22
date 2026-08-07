import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
Deno.serve(async (req)=>{
  try {
    const body = await req.json();
    if (body.type === 'admin_alert') {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: [
            {
              email: 'ba220.epicerie@banquealimentaire.org'
            }
          ],
          templateId: body.templateId,
          params: {
            SUSPENDED_FIRSTNAME: body.firstName,
            SUSPENDED_EMAIL: body.email,
            END_RIGHT: body.end_right
          }
        })
      });
      if (!brevoRes.ok) throw new Error(`Brevo error: ${await brevoRes.text()}`);
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200
      });
    }
    const { user_id, email, firstName, templateId } = body;
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [
          {
            email
          }
        ],
        templateId,
        params: {
          FIRSTNAME: firstName
        }
      })
    });
    if (!brevoRes.ok) throw new Error(`Brevo error: ${await brevoRes.text()}`);
    if (templateId === 3) {
      const { error } = await supabase.from('User').update({
        reminder_sent_at: new Date().toISOString()
      }).eq('id', user_id);
      if (error) throw error;
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200
    });
  } catch (err) {
    console.error('notify-end-right error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: String(err)
    }), {
      status: 500
    });
  }
});
