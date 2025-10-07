// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { ArrowRight, Code, Palette, Zap, Download, Github } from "lucide-react"

// export default function DocsPage() {
//   return (
//     <div className="flex flex-col gap-8">
//       {/* Hero Section */}
//       <div className="flex flex-col gap-4">
//         <div className="flex items-center gap-2">
//           <Badge variant="secondary" className="text-xs">
//             v1.0.0
//           </Badge>
//           <Badge variant="outline" className="text-xs">
//             Beta
//           </Badge>
//         </div>
//         <h1 className="text-4xl font-bold tracking-tight text-balance">Build your component library with madui</h1>
//         <p className="text-xl text-muted-foreground text-pretty max-w-2xl">
//           This is not a component library. It is how you build your component library.
//         </p>
//         <div className="flex items-center gap-4 pt-2">
//           <Button asChild>
//             <Link href="/docs/installation">
//               Get Started
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Link>
//           </Button>
//           <Button variant="outline" asChild>
//             <Link href="https://github.com/madui/madui">
//               <Github className="mr-2 h-4 w-4" />
//               GitHub
//             </Link>
//           </Button>
//         </div>
//       </div>

//       {/* Description */}
//       <div className="prose prose-gray dark:prose-invert max-w-none">
//         <p className="text-lg leading-relaxed">
//           You know how most traditional component libraries work: you install a package from NPM, import the components,
//           and use them in your app.
//         </p>
//         <p className="text-lg leading-relaxed">
//           This approach works well until you need to customize a component to fit your design system or require one that
//           isn't included in the library. Often, you end up wrapping library components, writing workarounds to override
//           styles, or mixing components from different libraries with incompatible APIs.
//         </p>
//         <p className="text-lg leading-relaxed">
//           This is what madui aims to solve. It is built around the following principles:
//         </p>
//       </div>

//       {/* Principles Grid */}
//       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Code className="h-5 w-5 text-primary" />
//               <CardTitle className="text-lg">Open Code</CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <CardDescription className="text-sm leading-relaxed">
//               The top layer of your component code is open for modification.
//             </CardDescription>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Zap className="h-5 w-5 text-primary" />
//               <CardTitle className="text-lg">Composition</CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <CardDescription className="text-sm leading-relaxed">
//               Every component uses a common, composable interface, making them predictable.
//             </CardDescription>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Download className="h-5 w-5 text-primary" />
//               <CardTitle className="text-lg">Distribution</CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <CardDescription className="text-sm leading-relaxed">
//               A flat-file schema and command-line tool make it easy to distribute components.
//             </CardDescription>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Palette className="h-5 w-5 text-primary" />
//               <CardTitle className="text-lg">Beautiful Defaults</CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <CardDescription className="text-sm leading-relaxed">
//               Carefully chosen default styles, so you get great design out-of-the-box.
//             </CardDescription>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <div className="flex items-center gap-2">
//               <Zap className="h-5 w-5 text-primary" />
//               <CardTitle className="text-lg">AI-Ready</CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <CardDescription className="text-sm leading-relaxed">
//               Open code for LLMs to read, understand, and improve.
//             </CardDescription>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Detailed Sections */}
//       <div className="space-y-8">
//         <section>
//           <h2 className="text-2xl font-semibold tracking-tight mb-4">Open Code</h2>
//           <div className="prose prose-gray dark:prose-invert max-w-none">
//             <p>
//               madui hands you the actual component code. You have full control to customize and extend the components to
//               your needs. This means:
//             </p>
//             <ul>
//               <li>
//                 <strong>Full Transparency:</strong> You see exactly how each component is built.
//               </li>
//               <li>
//                 <strong>Easy Customization:</strong> Modify any part of a component to fit your design and functionality
//                 requirements.
//               </li>
//               <li>
//                 <strong>AI Integration:</strong> Access to the code makes it straightforward for LLMs to read,
//                 understand, and even improve your components.
//               </li>
//             </ul>
//             <p>
//               In a typical library, if you need to change a button's behavior, you have to override styles or wrap the
//               component. With madui, you simply edit the button code directly.
//             </p>
//           </div>
//         </section>

//         <section>
//           <h2 className="text-2xl font-semibold tracking-tight mb-4">Composition</h2>
//           <div className="prose prose-gray dark:prose-invert max-w-none">
//             <p>
//               Every component in madui shares a common, composable interface. If a component does not exist, we bring it
//               in, make it composable, and adjust its style to match and work with the rest of the design system.
//             </p>
//             <p>
//               A shared, composable interface means it's predictable for both your team and LLMs. You are not learning
//               different APIs for every new component. Even for third-party ones.
//             </p>
//           </div>
//         </section>

//         <section>
//           <h2 className="text-2xl font-semibold tracking-tight mb-4">Distribution</h2>
//           <div className="prose prose-gray dark:prose-invert max-w-none">
//             <p>
//               madui is also a code distribution system. It defines a schema for components and a CLI to distribute them.
//             </p>
//             <ul>
//               <li>
//                 <strong>Schema:</strong> A flat-file structure that defines the components, their dependencies, and
//                 properties.
//               </li>
//               <li>
//                 <strong>CLI:</strong> A command-line tool to distribute and install components across projects with
//                 cross-framework support.
//               </li>
//             </ul>
//             <p>
//               You can use the schema to distribute your components to other projects or have AI generate completely new
//               components based on existing schema.
//             </p>
//           </div>
//         </section>

//         <section>
//           <h2 className="text-2xl font-semibold tracking-tight mb-4">Beautiful Defaults</h2>
//           <div className="prose prose-gray dark:prose-invert max-w-none">
//             <p>
//               madui comes with a large collection of components that have carefully chosen default styles. They are
//               designed to look good on their own and to work well together as a consistent system:
//             </p>
//             <ul>
//               <li>
//                 <strong>Good Out-of-the-Box:</strong> Your UI has a clean and minimal look without extra work.
//               </li>
//               <li>
//                 <strong>Unified Design:</strong> Components naturally fit with one another. Each component is built to
//                 match the others, keeping your UI consistent.
//               </li>
//               <li>
//                 <strong>Easily Customizable:</strong> If you want to change something, it's simple to override and
//                 extend the defaults.
//               </li>
//             </ul>
//           </div>
//         </section>

//         <section>
//           <h2 className="text-2xl font-semibold tracking-tight mb-4">AI-Ready</h2>
//           <div className="prose prose-gray dark:prose-invert max-w-none">
//             <p>
//               The design of madui makes it easy for AI tools to work with your code. Its open code and consistent API
//               allow AI models to read, understand, and even generate new components.
//             </p>
//             <p>
//               An AI model can learn how your components work and suggest improvements or even create new components that
//               integrate with your existing design.
//             </p>
//           </div>
//         </section>
//       </div>

//       {/* Next Steps */}
//       <div className="border-t pt-8">
//         <h2 className="text-2xl font-semibold tracking-tight mb-4">Next Steps</h2>
//         <div className="grid gap-4 md:grid-cols-2">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Installation</CardTitle>
//               <CardDescription>Learn how to install madui in your project</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Button asChild variant="outline" className="w-full bg-transparent">
//                 <Link href="/docs/installation">
//                   View Installation Guide
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Link>
//               </Button>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Components</CardTitle>
//               <CardDescription>Browse available components and examples</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Button asChild variant="outline" className="w-full bg-transparent">
//                 <Link href="/docs/components/button">
//                   Browse Components
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Link>
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }