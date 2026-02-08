import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let emailData: {
    user: { email: string; user_metadata?: { full_name?: string } }
    email_data: {
      token: string
      token_hash: string
      redirect_to: string
      email_action_type: string
      site_url: string
    }
  }

  // Verify webhook signature if hook secret is configured
  if (hookSecret) {
    try {
      const wh = new Webhook(hookSecret)
      emailData = wh.verify(payload, headers) as typeof emailData
    } catch (error) {
      console.error('Webhook verification failed:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  } else {
    // For development/testing without webhook secret
    try {
      emailData = JSON.parse(payload)
    } catch (error) {
      console.error('Failed to parse payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  }

  const {
    user,
    email_data: { token_hash, redirect_to, email_action_type, site_url },
  } = emailData

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? site_url

  console.log(`Processing ${email_action_type} email for ${user.email}`)

  // Only handle password recovery emails with custom template
  if (email_action_type === 'recovery') {
    try {
      const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

      const html = await renderAsync(
        React.createElement(PasswordResetEmail, {
          resetLink,
          userName: user.user_metadata?.full_name,
        })
      )

      const { error } = await resend.emails.send({
        from: 'Journal BBA <noreply@resend.dev>', // Replace with your verified domain
        to: [user.email],
        subject: 'Réinitialisez votre mot de passe - Journal BBA',
        html,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log(`Password reset email sent successfully to ${user.email}`)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  }

  // For other email types (signup confirmation, magic link, etc.), 
  // let Supabase handle them with default templates
  console.log(`Email type ${email_action_type} not handled, using default Supabase email`)
  
  return new Response(
    JSON.stringify({ success: true, handled: false }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
})
