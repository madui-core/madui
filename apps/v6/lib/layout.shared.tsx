import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <span className="font-semibold">MadUI</span>
        </div>
      ),
      transparentMode: 'top',
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Components',
        url: '/docs/components/accordion',
      },
      {
        text: 'Registry',
        url: '/registry',
      },
    ],
    githubUrl: 'https://github.com/madui-core/madui',
  };
}
