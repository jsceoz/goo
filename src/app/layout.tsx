import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import 'antd-mobile/es/global';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Goo - 家庭物品管理系统",
  description: "简单高效的家庭物品存储管理工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          id="rum-config"
          strategy="beforeInteractive"
        >
          {`window.__rum = {
            "pid": "gvpoqps6xo@50e3ca88aad9501",
            "endpoint": "https://gvpoqps6xo-default-cn.rum.aliyuncs.com"
          };`}
        </Script>
        <Script
          src="https://gvpoqps6xo-sdk.rum.aliyuncs.com/v2/browser-sdk.js"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
        <Script
          src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vconsole-init"
          strategy="afterInteractive"
        >
          {`
            if (typeof window !== 'undefined') {
              var vConsole = new window.VConsole();
              console.log('vConsole is initialized');
            }
          `}
        </Script>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="application-name" content="商品管理系统" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="商品管理" />
        <meta name="description" content="商品信息采集与管理系统" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        
        {/* Splash Screens */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash/iPhone_14_Pro_Max_landscape.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash/iPhone_14_Pro_landscape.png" />
        {/* 添加更多尺寸的启动屏幕... */}
      </head>
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-100">
          {children}
        </main>
      </body>
    </html>
  );
}
