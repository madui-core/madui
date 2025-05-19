import { Button } from "madui/src/components/button"
import { Mail, ArrowRight, Github } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h1 className="mb-4 text-2xl font-bold">Enhanced Button Component</h1>
          <p className="text-muted-foreground">A flexible button component with various styles, sizes, and features.</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-medium">Button Variants</h2>
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="subtle">Subtle</Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Button Sizes</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Icon Buttons</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="icon-sm" aria-label="Email">
                <Mail />
              </Button>
              <Button size="icon" aria-label="Email">
                <Mail />
              </Button>
              <Button size="icon-lg" aria-label="Email">
                <Mail />
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">With Icons</h2>
            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Mail />}>Email</Button>
              <Button rightIcon={<ArrowRight />} iconPosition="right">
                Next
              </Button>
              <Button variant="outline" leftIcon={<Github />}>
                GitHub
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Loading State</h2>
            <div className="flex flex-wrap gap-3">
              <Button isLoading>Loading</Button>
              <Button isLoading loadingText="Submitting...">
                Submit
              </Button>
              <Button variant="outline" isLoading iconPosition="right" loadingText="Saving...">
                Save
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Full Width & Rounded</h2>
            <div className="space-y-3">
              <Button fullWidth>Full Width Button</Button>
              <Button variant="secondary" rounded>
                Rounded Button
              </Button>
              <Button variant="outline" fullWidth rounded>
                Full Width & Rounded
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Disabled State</h2>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled leftIcon={<Mail />}>
                Disabled with Icon
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

