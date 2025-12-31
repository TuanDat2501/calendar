import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lịch Của Tôi',
    short_name: 'Lịch',
    description: 'Ứng dụng quản lý lịch trình cá nhân',
    start_url: '/',
    display: 'standalone', // QUAN TRỌNG NHẤT: Để ẩn thanh URL
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}