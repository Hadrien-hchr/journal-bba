import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetLink: string
  userName?: string
}

export const PasswordResetEmail = ({
  resetLink,
  userName,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Réinitialisez votre mot de passe - Journal BBA</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with logo/brand */}
        <Section style={headerSection}>
          <Heading style={logo}>Journal BBA</Heading>
        </Section>

        <Hr style={divider} />

        {/* Main content */}
        <Section style={contentSection}>
          <Heading style={h1}>Réinitialisation de mot de passe</Heading>
          
          <Text style={text}>
            Bonjour{userName ? ` ${userName}` : ''},
          </Text>
          
          <Text style={text}>
            Vous avez demandé à réinitialiser votre mot de passe pour votre compte Journal BBA.
            Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetLink} style={button}>
              Réinitialiser mon mot de passe
            </Link>
          </Section>

          <Text style={textSmall}>
            Ou copiez et collez ce lien dans votre navigateur :
          </Text>
          <Text style={linkText}>
            {resetLink}
          </Text>

          <Hr style={dividerLight} />

          <Text style={textMuted}>
            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
            Ce lien expirera dans 1 heure.
          </Text>
        </Section>

        {/* Footer */}
        <Hr style={divider} />
        <Section style={footerSection}>
          <Text style={footer}>
            © {new Date().getFullYear()} Journal BBA - Votre source d'informations
          </Text>
          <Text style={footerSmall}>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

// Styles
const main = {
  backgroundColor: '#f8f9fa',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '560px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const headerSection = {
  backgroundColor: '#DC2626',
  padding: '24px 32px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  fontFamily: "'Playfair Display', Georgia, serif",
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const dividerLight = {
  borderColor: '#f3f4f6',
  margin: '24px 0',
}

const contentSection = {
  padding: '32px',
}

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const textSmall = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px 0',
}

const textMuted = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const linkText = {
  color: '#DC2626',
  fontSize: '12px',
  lineHeight: '16px',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#DC2626',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const footerSection = {
  padding: '24px 32px',
  backgroundColor: '#f9fafb',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
}
