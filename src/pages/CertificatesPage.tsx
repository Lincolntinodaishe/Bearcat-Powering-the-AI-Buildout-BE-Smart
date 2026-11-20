import React from 'react'
import PageHeader from '../components/layout/PageHeader'
import CertificateCard from '../components/certificate/CertificateCard'
import { useEvent } from '../context/EventContext'

export const CertificatesPage: React.FC = () => {
  const { latestCertificate } = useEvent()

  if (!latestCertificate) {
    return <div className="h-64 bg-panel rounded-card animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurement & verification certificates"
        description="Signed Ed25519 counterfactual reduction records for automated utility settlement."
      />

      <CertificateCard certificate={latestCertificate} />
    </div>
  )
}
export default CertificatesPage
