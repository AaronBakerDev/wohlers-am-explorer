'use client'

import dynamic from 'next/dynamic'

const MapComponentsClient = dynamic(() => import('./MapComponentsClient'), {
  ssr: false
})

export default function ClientWrapper() {
  return <MapComponentsClient />
}