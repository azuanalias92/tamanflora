import { ContentSection } from '../components/content-section'
import { ChangePasswordForm } from './change-password-form'

export function SettingsChangePassword() {
  return (
    <ContentSection title='Change Password' desc='Update your account password securely.'>
      <ChangePasswordForm />
    </ContentSection>
  )
}