'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Code2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { primaryBluePalette, secondaryPalettes, chartPaletteNotes, typographyScale } from '@/lib/brand-system'

const ComponentShowcase = ({ title, children, code }: { title: string, children: React.ReactNode, code?: string }) => {
  const [showCode, setShowCode] = useState(false)

  const toggleLabel = showCode ? 'View example' : 'View code'
  const toggleIcon = showCode ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={showCode}
              aria-label={`${toggleLabel} for ${title}`}
              onClick={() => setShowCode((prev) => !prev)}
            >
              {toggleIcon}
              {toggleLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showCode && code ? (
          <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            <code>{code}</code>
          </pre>
        ) : (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function UIComponentsPage() {
  const [progress, setProgress] = useState(33)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/components-test" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Component Test
          </Link>
          <Badge variant="secondary" className="bg-accent text-accent-foreground uppercase tracking-[0.18em] mb-3">ASTM Theming Pass</Badge>
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-4">UI Components</h1>
          <p className="text-xl text-muted-foreground">
            Live shadcn/ui primitives restyled with the ASTM International color system, interim typography bridge, and component
            usage notes for the Wohlers AM Explorer.
          </p>
        </div>

        <div className="space-y-8">
          <ComponentShowcase title="Color System">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Primary Blue Scale</p>
                  <div className="mt-3 space-y-2">
                    {primaryBluePalette.map((swatch) => (
                      <div
                        key={swatch.name}
                        className="rounded-md px-4 py-3 flex items-center justify-between text-sm"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <span className={swatch.textOn === 'light' ? 'text-white' : 'text-foreground'}>{swatch.name}</span>
                        <span className={`font-mono text-xs ${swatch.textOn === 'light' ? 'text-white/80' : 'text-foreground/70'}`}>{swatch.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {secondaryPalettes.map((group) => (
                    <div key={group.group}>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">{group.group}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {group.swatches.map((swatch) => (
                          <div
                            key={`${group.group}-${swatch.name}`}
                            className="rounded-md px-4 py-3 flex flex-col gap-1"
                            style={{ backgroundColor: swatch.hex }}
                          >
                            <span className={swatch.textOn === 'light' ? 'text-white text-sm font-medium' : 'text-foreground text-sm font-medium'}>{swatch.name}</span>
                            <span className={`font-mono text-xs ${swatch.textOn === 'light' ? 'text-white/80' : 'text-foreground/70'}`}>{swatch.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Data Visualization Series</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {chartPaletteNotes.map((hex, index) => (
                    <div key={hex} className="flex flex-col items-center gap-1">
                      <div className="h-12 w-16 rounded-md" style={{ backgroundColor: hex }} />
                      <span className="text-xs font-mono text-muted-foreground">Series {index + 1}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/80">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Use Group tints sparingly and keep a single group per chart or feature surface. Pair primary actions with ASTM Blue
              and reserve lighter tints for backgrounds and emphasis panels.
            </p>
          </ComponentShowcase>

          <ComponentShowcase title="Typography Scale">
            <div className="space-y-6">
              {typographyScale.map((item) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">{item.label}</p>
                  <p className={item.className}>{item.sample}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Inter remains our temporary stand-in until the licensed Neue Haas Unica files arrive. Match weight usage above and
              plan to swap the family once assets are cleared.
            </p>
          </ComponentShowcase>

          <ComponentShowcase
            title="Buttons"
            code={`<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`}
          >
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Cards">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description text here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content goes here.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Another Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>This card has no description.</p>
                </CardContent>
              </Card>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Badges">
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Form Components">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Type your message here." />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms and conditions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="airplane-mode" />
                  <Label htmlFor="airplane-mode">Airplane Mode</Label>
                </div>
                <div>
                  <Label>Select Option</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Tabs">
            <Tabs defaultValue="account" className="w-full">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Make changes to your account here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Account settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="password" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Change your password here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Password settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your settings here.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>General settings content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ComponentShowcase>

          <ComponentShowcase title="Table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">John Doe</TableCell>
                  <TableCell>john@example.com</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jane Smith</TableCell>
                  <TableCell>jane@example.com</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ComponentShowcase>

          <ComponentShowcase title="Dialog & Dropdown">
            <div className="flex gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sample Dialog</DialogTitle>
                    <DialogDescription>
                      This is a sample dialog component.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Dialog content goes here.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Continue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Open Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Sheet Title</SheetTitle>
                    <SheetDescription>
                      This is a sample sheet component.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <p>Sheet content goes here.</p>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Progress & Loading">
            <div className="space-y-4">
              <div>
                <Label>Progress Bar</Label>
                <Progress value={progress} className="mt-2" />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                </div>
              </div>
              <div>
                <Label>Skeleton Loading</Label>
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Avatar & Tooltip">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </ComponentShowcase>
        </div>
      </div>
    </div>
  )
}
