// ============================================================================
// Phase 7: Auth Config Form Component
// ============================================================================

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthType, AuthConfig } from '../types';
import { Key, User, Lock, Shield } from 'lucide-react';

interface AuthConfigFormProps {
  authType: AuthType;
  authConfig: AuthConfig;
  onChange: (config: AuthConfig) => void;
}

export function AuthConfigForm({ authType, authConfig, onChange }: AuthConfigFormProps) {
  const updateConfig = (key: keyof AuthConfig, value: string) => {
    onChange({ ...authConfig, [key]: value });
  };

  if (authType === 'none') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          인증 설정
        </CardTitle>
        <CardDescription className="text-xs">
          API 접근에 필요한 인증 정보를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authType === 'api_key' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="api_key" className="flex items-center gap-2">
                <Key className="h-3 w-3" />
                API Key *
              </Label>
              <Input
                id="api_key"
                type="password"
                value={authConfig.api_key || ''}
                onChange={(e) => updateConfig('api_key', e.target.value)}
                placeholder="your-api-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="header_name">헤더 이름</Label>
              <Input
                id="header_name"
                value={authConfig.header_name || ''}
                onChange={(e) => updateConfig('header_name', e.target.value)}
                placeholder="X-API-Key (기본값)"
              />
              <p className="text-xs text-muted-foreground">
                API Key를 전송할 HTTP 헤더 이름. 비워두면 X-API-Key 사용.
              </p>
            </div>
          </>
        )}

        {authType === 'bearer' && (
          <div className="space-y-2">
            <Label htmlFor="token" className="flex items-center gap-2">
              <Key className="h-3 w-3" />
              Bearer Token *
            </Label>
            <Input
              id="token"
              type="password"
              value={authConfig.token || ''}
              onChange={(e) => updateConfig('token', e.target.value)}
              placeholder="your-bearer-token"
            />
            <p className="text-xs text-muted-foreground">
              Authorization: Bearer {'{token}'} 형식으로 전송됩니다.
            </p>
          </div>
        )}

        {authType === 'basic' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-3 w-3" />
                사용자 이름 *
              </Label>
              <Input
                id="username"
                value={authConfig.username || ''}
                onChange={(e) => updateConfig('username', e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                비밀번호 *
              </Label>
              <Input
                id="password"
                type="password"
                value={authConfig.password || ''}
                onChange={(e) => updateConfig('password', e.target.value)}
                placeholder="password"
              />
            </div>
          </>
        )}

        {authType === 'oauth2' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                value={authConfig.client_id || ''}
                onChange={(e) => updateConfig('client_id', e.target.value)}
                placeholder="your-client-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret *</Label>
              <Input
                id="client_secret"
                type="password"
                value={authConfig.client_secret || ''}
                onChange={(e) => updateConfig('client_secret', e.target.value)}
                placeholder="your-client-secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token_url">Token URL *</Label>
              <Input
                id="token_url"
                value={authConfig.token_url || ''}
                onChange={(e) => updateConfig('token_url', e.target.value)}
                placeholder="https://api.example.com/oauth/token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token (있는 경우)</Label>
              <Input
                id="access_token"
                type="password"
                value={authConfig.access_token || ''}
                onChange={(e) => updateConfig('access_token', e.target.value)}
                placeholder="이미 발급받은 토큰이 있으면 입력"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthConfigForm;
