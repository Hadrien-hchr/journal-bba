import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Use admin client to generate the reset link
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://journal-bba.com/auth?view=reset-password',
      },
    })

    if (linkError) {
      console.error('Error generating reset link:', linkError)
      // User not found: don't reveal if the email exists or not
      if (linkError.message?.toLowerCase().includes('user not found')) {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
      return new Response(
        JSON.stringify({ error: `Erreur de génération du lien : ${linkError.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const resetLink = data.properties.action_link

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetLink,
        userName: data.user?.user_metadata?.full_name,
      })
    )

    const { error: sendError } = await resend.emails.send({
      from: 'Journal BBA <contact@journal-bba.com>',
      to: [email],
      subject: 'Réinitialisez votre mot de passe - Journal BBA',
      html,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      // Resend 403: the test domain onboarding@resend.dev only delivers to the account owner
      if (
        sendError.statusCode === 403 ||
        sendError.message?.includes('verify a domain') ||
        sendError.message?.includes('testing emails')
      ) {
        return new Response(
          JSON.stringify({
            error:
              "En mode test Resend, vous devez d'abord ajouter votre domaine sur resend.com/domains pour écrire à tous les étudiants.",
          }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
      return new Response(
        JSON.stringify({ error: `Erreur Resend : ${sendError.message}` }),
        { status: sendError.statusCode ?? 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log(`Password reset email sent to ${email}`)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: `Échec de l'envoi de l'email : ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
