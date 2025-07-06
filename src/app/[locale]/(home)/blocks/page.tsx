import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { categories } from '@/lib/blocks-registry';

export default function BlocksPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 font-bold text-3xl">组件库</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          探索我们精心设计的组件集合，每个组件都经过优化，可直接在您的项目中使用。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const IconComponent = category.icon;

          return (
            <Card key={category.id} className="group transition-shadow hover:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="text-muted-foreground text-sm">{category.count} 个组件</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">{category.description}</CardDescription>
                <Button asChild className="w-full gap-2 transition-all group-hover:gap-3">
                  <Link href={`/blocks/${category.id}`}>
                    查看组件
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
