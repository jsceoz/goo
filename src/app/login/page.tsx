'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd-mobile';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入有效的手机号');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '发送验证码失败');
      }

      toast.success('验证码已发送');
      setCodeSent(true);
      setCountdown(60);

      // 开始倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !verificationCode) {
      toast.error('请输入手机号和验证码');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: verificationCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '验证失败');
      }

      toast.success('登录成功');
      router.push('/');
    } catch (error: any) {
      toast.error(error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-8">登录</h1>
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item label="手机号">
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={setPhone}
                maxLength={11}
              />
              <Button
                color="primary"
                fill="outline"
                disabled={loading || countdown > 0}
                onClick={handleSendCode}
                className='whitespace-nowrap'
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>
          <Form.Item label="验证码">
            <Input
              type="number"
              placeholder="请输入验证码"
              value={verificationCode}
              onChange={setVerificationCode}
              maxLength={6}
            />
          </Form.Item>
          <Button
            block
            type="submit"
            color="primary"
            loading={loading}
            className="mt-4"
          >
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
} 