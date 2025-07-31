  'use client';

  import { useState, useEffect } from 'react';
  import { useQuery } from '@tanstack/react-query';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
  import { Skeleton } from '@/components/ui/skeleton';
  import { Badge } from '@/components/ui/badge';
  import { Switch } from '@/components/ui/switch';
  import { Label } from '@/components/ui/label';
  import { ExternalLink } from 'lucide-react';
  import { difyAPI } from '@/lib/dify/api';
  import { DifyApp, validateDifyConfig } from '@/lib/dify/config';
  import { DifyAppModal } from './dify-app-modal';
  import { useI18n } from '@/i18n/routing';

  export function DifyExploreContent() {
    const [installedOnly, setInstalledOnly] = useState(false);
    const [selectedApp, setSelectedApp] = useState<DifyApp | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useI18n();
    const isDifyEnabled = validateDifyConfig();

    const { data: apps, isLoading, error } = useQuery({
      queryKey: ['dify-apps', installedOnly],
      queryFn: async () => {
        const allApps = await difyAPI.getApplications();
        return installedOnly
          ? allApps.filter(app => app.is_installed)
          : allApps;
      },
    });

    const handleAppClick = (app: DifyApp) => {
      setSelectedApp(app);
      setIsModalOpen(true);
    };

    if (!isDifyEnabled) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Dify AI 集成未配置</h3>
            <p className="text-muted-foreground">
              请在Vercel环境变量中设置 <code className="bg-muted px-1 py-0.5 rounded">DIFY_API_KEY</code>，
              或联系系统管理员进行配置。
            </p>
            <p className="text-sm text-muted-foreground">
              确保添加 <code className="bg-muted px-1 py-0.5 rounded">DIFY_BASE_URL=https://api.dify.ai/v1</code> 以获得最佳体验。
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md space-y-4">
            <p className="text-muted-foreground">
              加载Dify应用时出错，请检查网络连接或稍后重试。
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="installed-only"
              checked={installedOnly}
              onCheckedChange={setInstalledOnly}
            />
            <Label htmlFor="installed-only">
              Installed only
            </Label>
          </div>
          <Button variant="outline" asChild>
            <a
              href="https://cloud.dify.ai/explore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Open in Dify
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden transition-all hover:shadow-md">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apps?.map((app) => (
              <Card
                key={app.id}
                className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                onClick={() => handleAppClick(app)}
              >
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 flex items-center
  justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl font-bold mb-2">
                        {app.icon || 'AI'}
                      </div>
                    </div>
                  </div>
                  {app.is_installed && (
                    <Badge className="absolute top-2 right-2">
                      Installed
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{app.model_config?.model?.provider || 'Unknown Provider'}</span>
                      <span>{app.usage_count || 0} uses</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{app.mode}</span>
                      <span className="text-yellow-600">
                        {'⭐️'.repeat(Math.floor(app.rating || 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    {app.is_installed ? 'Use App' : 'Install'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {selectedApp && (
          <DifyAppModal
            app={selectedApp}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    );
  }
