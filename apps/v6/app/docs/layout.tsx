import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        banner: (
          <div className="rounded-lg bg-linear-to-r from-blue-500/10 to-purple-500/10 p-4 border border-blue-500/20">
            <p className="text-sm font-medium">
              💡 New components added weekly
            </p>
          </div>
        ),
        footer: (
          <div className="text-xs text-muted-foreground p-4">
            <p>Built with ❤️ using MadUI</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
